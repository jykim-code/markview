# Markview MCP Server — 개발 계획

> 작성: 2026-08-10 | 상태: 계획 확정

---

## 요구사항 요약

Claude Desktop, Claude Code, 외부 서비스에서 Markdown/HTML 문자열을 Markview에 바로 발행하고 공유 링크를 받는 MCP 서버. Smithery.ai 등록을 통해 외부 개발자도 사용할 수 있게 한다.

| 항목 | 결정 |
|------|------|
| 노출 Tool | `publish_document` 하나 (MVP) |
| Transport | Streamable HTTP (2025 MCP 표준) |
| 배포 위치 | Cloudflare Workers (독립 Worker) |
| 프로젝트 구조 | 레포 내 `mcp/` 폴더 (extension/과 동일 패턴) |
| 등록 | Smithery.ai 호환 |

---

## 수용 기준 (Acceptance Criteria)

- [ ] Claude Desktop에서 MCP URL 설정 후 `publish_document` 도구 호출 가능
- [ ] Markdown 문자열 → `https://markview-4hy.pages.dev/v/{slug}` 반환
- [ ] HTML 문자열 → `https://markview-4hy.pages.dev/v/{slug}` 반환
- [ ] `filename` 파라미터로 md/html 타입 자동 감지 (기본값: `document.md`)
- [ ] Smithery.ai에서 "markview"로 검색 시 노출
- [ ] 응답 시간 p99 < 3초 (Cloudflare Worker cold start 포함)
- [ ] 25MB 초과 시 명확한 오류 메시지 반환

---

## 기술 스택

| 역할 | 패키지 |
|------|--------|
| MCP SDK | `@modelcontextprotocol/sdk` (최신) |
| Runtime | Cloudflare Workers (Streamable HTTP stateless) |
| 배포 | `wrangler` |
| 언어 | TypeScript |

**`McpAgent` 사용 금지** — Cloudflare 공식 deprecated, feature-frozen 상태. `createMcpHandler` 또는 `WebStandardStreamableHTTPServerTransport` 사용.

---

## 구현 단계

### Phase 1: 프로젝트 셋업

**파일 생성:**

```
mcp/
├── package.json
├── wrangler.toml
├── tsconfig.json
└── src/
    └── index.ts
```

**`mcp/package.json`**
```json
{
  "name": "@markview/mcp-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "latest",
    "typescript": "^5",
    "wrangler": "^4"
  }
}
```

**`mcp/wrangler.toml`**
```toml
name = "markview-mcp"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
MARKVIEW_BASE_URL = "https://markview-4hy.pages.dev"
```

### Phase 2: `publish_document` 도구 구현

**`mcp/src/index.ts`**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/web-standard.js";
import { z } from "zod";

const BASE_URL = (env: { MARKVIEW_BASE_URL: string }) => env.MARKVIEW_BASE_URL;

function createServer(env: { MARKVIEW_BASE_URL: string }): McpServer {
  const server = new McpServer({
    name: "markview",
    version: "0.1.0",
  });

  server.tool(
    "publish_document",
    "Publish a Markdown or HTML document to Markview and get a shareable link.",
    {
      content: z.string().describe("Document content (Markdown or HTML string)"),
      filename: z
        .string()
        .optional()
        .default("document.md")
        .describe('Filename with extension to determine type. Use .md or .html (default: "document.md")'),
    },
    async ({ content, filename }) => {
      const formData = new FormData();
      const type = filename?.endsWith(".html") || filename?.endsWith(".htm")
        ? "text/html"
        : "text/markdown";
      const blob = new Blob([content], { type });
      formData.append("file", blob, filename ?? "document.md");

      const res = await fetch(`${BASE_URL(env)}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          isError: true,
          content: [{ type: "text", text: `Upload failed (${res.status}): ${(err as any).error ?? "unknown error"}` }],
        };
      }

      const { slug, title } = (await res.json()) as { slug: string; title: string; type: string };
      const url = `${BASE_URL(env)}/v/${slug}`;

      return {
        content: [
          {
            type: "text",
            text: `Published successfully!\n\n**Title:** ${title}\n**URL:** ${url}`,
          },
        ],
      };
    }
  );

  return server;
}

export default {
  async fetch(request: Request, env: { MARKVIEW_BASE_URL: string }): Promise<Response> {
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    const server = createServer(env);
    await server.connect(transport);
    return transport.handleRequest(request);
  },
};
```

### Phase 3: 루트 package.json 스크립트 추가

```json
"mcp:dev": "cd mcp && npm run dev",
"mcp:deploy": "cd mcp && npm run deploy"
```

### Phase 4: 배포 및 등록

1. `cd mcp && npm install`
2. `npm run mcp:deploy` — Worker URL 확보 (예: `https://markview-mcp.{account}.workers.dev`)
3. Smithery.ai 등록: `smithery.ai/new`에 Worker URL 제출
4. `/.well-known/mcp/server-card.json` 추가 (Smithery 메타데이터 스캔용)

**`mcp/src/well-known.ts`** (선택, Smithery 스캔 보조)
```json
{
  "name": "Markview",
  "description": "Publish Markdown/HTML documents to Markview and get shareable links",
  "tools": ["publish_document"]
}
```

---

## Claude Desktop 연결 설정 (사용자 가이드)

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "markview": {
      "url": "https://markview-mcp.{account}.workers.dev"
    }
  }
}
```

---

## 위험 및 대응

| 위험 | 가능성 | 대응 |
|------|--------|------|
| `/api/upload` CORS — server-to-server fetch는 CORS 무관이라 문제없음 | 낮음 | 확인 후 진행 |
| Worker cold start 지연 | 중간 | Cloudflare Workers 기본 cold start < 5ms, 실용적 문제 없음 |
| Smithery 스캔 실패 | 낮음 | `server-card.json` 추가로 보완 |
| `@modelcontextprotocol/sdk` API 변경 | 중간 | 고정 버전 사용 (`package-lock.json` 커밋) |

---

## 검증 단계

1. `wrangler dev` 로컬 실행 후 `curl -X POST http://localhost:8787` 로 MCP initialize 확인
2. Claude Desktop 설정 후 `publish_document` 실제 호출 — 반환 URL 접속 확인
3. Smithery 등록 후 검색 노출 확인

---

## ADR (Architecture Decision Record)

**결정**: Cloudflare Workers + Streamable HTTP, stateless `createMcpHandler`/`WebStandardStreamableHTTPServerTransport` 패턴

**드라이버**:
1. 서버리스 환경에서 SSE 지속 연결 불가 → Streamable HTTP 필수
2. 이미 Cloudflare 인프라 사용 중 → 동일 플랫폼 유지
3. Smithery 등록을 위한 공개 HTTPS 엔드포인트 필요

**검토한 대안**:
- `McpAgent` → Deprecated, feature-frozen, 사용 금지
- npm stdio 패키지 → 외부 서비스 연동 불가, 기각
- Pages에 통합 → SSE 제약, 배포 복잡성 증가, 기각

**결과**: 독립 Cloudflare Worker로 분리. `extension/`과 동일한 모노레포 내 폴더 패턴.

**후속 작업**: 로그인 도입 후 `owner_token` 반환 추가 → Claude가 발행한 문서를 계정에 귀속 가능
