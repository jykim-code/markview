import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

interface Env {
  MARKVIEW_BASE_URL: string;
}

function createServer(env: Env): McpServer {
  const server = new McpServer({
    name: "markview",
    version: "0.1.0",
  });

  server.tool(
    "publish_document",
    "Publish a Markdown or HTML document to Markview and get a shareable link. Returns a public URL that anyone can visit to read the rendered document.",
    {
      content: z.string().describe("Document content as a string (Markdown or HTML)"),
      filename: z
        .string()
        .optional()
        .default("document.md")
        .describe('Filename with extension to determine type. Use .md for Markdown or .html for HTML. Default: "document.md"'),
    },
    async ({ content, filename }) => {
      const name = filename ?? "document.md";
      const isHtml = name.endsWith(".html") || name.endsWith(".htm");
      const mimeType = isHtml ? "text/html" : "text/markdown";

      const formData = new FormData();
      const blob = new Blob([content], { type: mimeType });
      formData.append("file", blob, name);

      let res: Response;
      try {
        res = await fetch(`${env.MARKVIEW_BASE_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Network error: ${err instanceof Error ? err.message : String(err)}` }],
        };
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        return {
          isError: true,
          content: [{ type: "text", text: `Upload failed (HTTP ${res.status}): ${body.error ?? "unknown error"}` }],
        };
      }

      const { slug, title } = (await res.json()) as { slug: string; title: string; type: string; owner_token: string };
      const url = `${env.MARKVIEW_BASE_URL}/v/${slug}`;

      return {
        content: [
          {
            type: "text",
            text: `Published!\n\nTitle: ${title}\nURL: ${url}`,
          },
        ],
      };
    }
  );

  return server;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = url.origin;

    // ── Smithery metadata ────────────────────────────────────────────────────
    if (url.pathname === "/.well-known/mcp/server-card.json") {
      return Response.json({
        name: "Markview",
        description: "Publish Markdown or HTML documents and get a shareable rendered link.",
        tools: ["publish_document"],
      });
    }

    // ── OAuth Authorization Server metadata ──────────────────────────────────
    // Claude Code requires HTTP MCP servers to support OAuth + Dynamic Client
    // Registration (RFC 7591). This is a public server so we rubber-stamp all.
    if (url.pathname === "/.well-known/oauth-authorization-server") {
      return Response.json({
        issuer: origin,
        authorization_endpoint: `${origin}/authorize`,
        token_endpoint: `${origin}/token`,
        registration_endpoint: `${origin}/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["S256"],
      });
    }

    // ── Dynamic Client Registration (RFC 7591) ───────────────────────────────
    if (url.pathname === "/register" && request.method === "POST") {
      const body = await request.json() as { redirect_uris?: string[]; client_name?: string };
      const clientId = crypto.randomUUID();
      const clientSecret = crypto.randomUUID().replace(/-/g, "");
      return Response.json(
        {
          client_id: clientId,
          client_secret: clientSecret,
          client_id_issued_at: Math.floor(Date.now() / 1000),
          client_secret_expires_at: 0,
          redirect_uris: body.redirect_uris ?? [],
          client_name: body.client_name ?? "markview-client",
        },
        { status: 201 }
      );
    }

    // ── OAuth Authorization endpoint ─────────────────────────────────────────
    // Auto-approve: immediately redirect back with a code.
    if (url.pathname === "/authorize" && request.method === "GET") {
      const redirectUri = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state");
      if (!redirectUri) return new Response("Missing redirect_uri", { status: 400 });

      const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const dest = new URL(redirectUri);
      dest.searchParams.set("code", code);
      if (state) dest.searchParams.set("state", state);
      return Response.redirect(dest.toString(), 302);
    }

    // ── OAuth Token endpoint ─────────────────────────────────────────────────
    // Issue a static long-lived token (no real validation — public server).
    if (url.pathname === "/token" && request.method === "POST") {
      return Response.json({
        access_token: "markview-public",
        token_type: "Bearer",
        expires_in: 31536000, // 1 year
      });
    }

    // ── MCP (Streamable HTTP) ────────────────────────────────────────────────
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Ensure Accept header includes both required types.
    const accept = request.headers.get("Accept") ?? "";
    if (!accept.includes("text/event-stream") || !accept.includes("application/json")) {
      const headers = new Headers(request.headers);
      headers.set("Accept", "application/json, text/event-stream");
      request = new Request(request, { headers });
    }

    // sessionIdGenerator: undefined = stateless mode (no session tracking).
    // Per-request session IDs break Claude Code's multi-request handshake.
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const server = createServer(env);
    await server.connect(transport);
    return transport.handleRequest(request);
  },
};
