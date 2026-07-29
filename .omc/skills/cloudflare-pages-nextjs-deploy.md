---
id: cloudflare-pages-nextjs-deploy
name: Cloudflare Pages + OpenNext 배포
description: Next.js App Router를 @opennextjs/cloudflare로 Cloudflare Pages에 배포할 때 필수 설정과 함정 회피 가이드
source: markview 프로젝트 배포 과정에서 발견 (2026-03-19)
triggers:
  - cloudflare pages deploy
  - opennextjs cloudflare
  - next.js cloudflare deploy
  - pages build failed
  - _worker.js
  - _routes.json
  - D1 database binding
  - static files 404
quality: high
---

# Cloudflare Pages + OpenNext 배포

## The Insight

@opennextjs/cloudflare는 **Cloudflare Workers용**으로 설계되었다. Cloudflare Pages에서 사용하려면 빌드 후처리가 필수: `worker.js` → `_worker.js` 리네임, 정적 에셋 경로 재배치, `_routes.json`으로 정적/동적 라우팅 분리. 이 후처리 없이는 정적 파일 404 또는 사이트 전체 불능이 발생한다.

## Why This Matters

- `_worker.js` 없으면: Pages가 Worker를 인식하지 못해 서버 사이드 렌더링 불가
- `_routes.json` 없으면: 모든 요청이 Worker를 거쳐 CSS/JS/이미지가 전부 404
- D1 바인딩 순서 틀리면: 빌드 성공해도 런타임에서 DB 접근 불가
- `database_id` 비어있으면: `Invalid database UUID ()` 에러로 배포 실패

## Recognition Pattern

- Next.js App Router + Cloudflare Pages 배포 시도할 때
- `@opennextjs/cloudflare` 패키지 사용할 때
- 빌드 성공했는데 사이트 접속 안 될 때
- CSS/JS 정적 파일이 404일 때

## The Approach

### 1. 배포 순서 (반드시 이 순서)

```
D1 DB 생성 → Pages 프로젝트 생성 → D1 바인딩 연결 → 배포
```

바인딩은 빌드 전에 설정해야 한다. 배포 후 바인딩하면 재배포 필요.

### 2. 필수 파일 3개

**open-next.config.ts** — 타입 import 하지 말 것 (존재하지 않음)
```ts
const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};
export default config;
```

**wrangler.toml** — `pages_build_output_dir`과 `database_id` 필수
```toml
name = "프로젝트명"
pages_build_output_dir = ".open-next"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "db이름"
database_id = "실제-UUID"
```

**scripts/prepare-pages.mjs** — Pages 호환 후처리 (핵심!)
```js
import { cpSync, writeFileSync, copyFileSync } from "fs";

// worker.js → _worker.js (Pages는 _worker.js만 인식)
copyFileSync(".open-next/worker.js", ".open-next/_worker.js");

// assets/ → output 루트 (Pages CDN이 정적 파일 서빙)
cpSync(".open-next/assets", ".open-next", { recursive: true });

// _routes.json — 정적 파일은 CDN, 나머지는 Worker
const routes = {
  version: 1,
  include: ["/*"],
  exclude: ["/_next/static/*", "/아이콘.svg", "/기타정적파일.png"],
};
writeFileSync(".open-next/_routes.json", JSON.stringify(routes, null, 2));
```

### 3. Dashboard 빌드 설정

| 항목 | 값 |
|------|-----|
| 프레임워크 | Next.js |
| 빌드 명령 | `npm run pages:build` |
| 빌드 출력 디렉터리 | `.open-next` |

package.json:
```json
"pages:build": "npx @opennextjs/cloudflare build && node scripts/prepare-pages.mjs"
```

### 4. _routes.json 규칙

- `include: ["/*"]` — 모든 요청을 Worker로
- `exclude` — CDN에서 직접 서빙할 정적 파일 경로
- **public/ 폴더의 SVG/PNG/ICO도 exclude에 추가해야 함** (안 하면 404)
- `/_next/static/*`는 반드시 exclude (CSS/JS 번들)

### 5. 흔한 함정

| 함정 | 증상 | 해결 |
|------|------|------|
| "배포 다시 시도" 사용 | 이전 설정으로 빌드됨 | 새 커밋 push로 새 빌드 트리거 |
| Production branch 불일치 | 최신 커밋이 빌드 안 됨 | Dashboard에서 `main`/`master` 확인 |
| wrangler CLI SSL 에러 | `self-signed certificate in chain` | `dash.cloudflare.com:443`, `api.cloudflare.com:443` SSL 검사 예외 |

## Example

Markview 프로젝트에서 빌드 실패 → 정적 파일 404 → 사이트 불능까지 겪으며 발견한 전체 과정. 약 10회 배포 시도 끝에 안정화. 핵심은 `prepare-pages.mjs` 후처리 스크립트.
