import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "./server.js";

interface Env {
  MARKVIEW_BASE_URL: string;
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
