import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required by @opennextjs/cloudflare to package the app for Workers/Pages.
  output: "standalone",
  // A stray lockfile at C:\Users\jykim pulls Next's inferred workspace root up a
  // few levels; pin it to this project so standalone file tracing stays correct.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
