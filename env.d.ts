interface CloudflareEnv {
  DB: D1Database;
  CONTENT: R2Bucket;
}

declare module "@opennextjs/cloudflare" {
  export function getCloudflareContext(): {
    env: CloudflareEnv;
    ctx: ExecutionContext;
  };
}
