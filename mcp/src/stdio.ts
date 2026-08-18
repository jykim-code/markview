#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const MARKVIEW_BASE_URL =
  process.env.MARKVIEW_BASE_URL ?? "https://markview-4hy.pages.dev";

const server = createServer({ MARKVIEW_BASE_URL });
const transport = new StdioServerTransport();

await server.connect(transport);
