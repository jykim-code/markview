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
    // Serve Smithery/well-known metadata
    const url = new URL(request.url);
    if (url.pathname === "/.well-known/mcp/server-card.json") {
      return Response.json({
        name: "Markview",
        description: "Publish Markdown or HTML documents and get a shareable rendered link.",
        tools: ["publish_document"],
      });
    }

    // Claude Code omits text/event-stream from Accept, causing the transport to
  // return 406. Patch the header so the transport accepts the request.
    const accept = request.headers.get("Accept") ?? "";
    if (!accept.includes("text/event-stream")) {
      const headers = new Headers(request.headers);
      headers.set("Accept", accept ? `${accept}, text/event-stream` : "application/json, text/event-stream");
      request = new Request(request, { headers });
    }

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    const server = createServer(env);
    await server.connect(transport);
    return transport.handleRequest(request);
  },
};
