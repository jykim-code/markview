# Markview MVP Implementation Plan

## Requirements Summary

Markview는 누구나 로그인 없이 마크다운(.md) 파일을 업로드하면, 보기 좋게 렌더링된 웹 페이지와 짧은 공유 URL을 즉시 받을 수 있는 공개 웹 서비스 (Pastebin-style for Markdown).

**Spec:** `.omc/specs/deep-interview-markview.md` (Ambiguity: 15.5%)

---

## RALPLAN-DR Summary

### Principles (5)
1. **Simplicity First** — MVP는 업로드 → 뷰 → URL 복사 3단계만. 추가 기능 없음.
2. **Beautiful by Default** — 포인트 컬러 #FFF7E6/#0A122A로 미려한 렌더링이 핵심 가치.
3. **Zero Auth** — 인증 없이 누구나 즉시 사용 가능. 진입 장벽 제로.
4. **Edge-Native** — Cloudflare Pages/D1 생태계 100% 활용. 서버는 가볍게, 렌더링은 클라이언트에서.
5. **Rich Rendering** — GFM, 코드 강조, TOC, LaTeX, Mermaid를 모두 지원하여 어떤 마크다운이든 아름답게.

### Decision Drivers (Top 3)
1. **Cloudflare 호환성** — Next.js가 Cloudflare Pages edge runtime에서 정상 동작해야 함
2. **렌더링 품질 & 일관성** — 모든 확장 마크다운이 동일한 클라이언트 렌더링 패스에서 처리
3. **개발 속도** — 최소 파일 수, 최소 복잡도로 MVP 완성

### Viable Options

#### Option A: Next.js + @opennextjs/cloudflare + D1 + Client-side Rendering (Recommended)
- **Approach:** Next.js App Router + `@opennextjs/cloudflare` 어댑터 + D1 SQLite. 서버는 DB CRUD만 담당하고, 마크다운 렌더링은 전부 클라이언트에서 수행.
- **Pros:** Next.js 생태계 활용, 기획안 일치, edge CPU 위험 제거, Mermaid/KaTeX/코드강조 모두 동일 렌더링 패스로 일관성 확보
- **Cons:** 클라이언트 번들 크기 증가 (code splitting으로 완화), SEO 제한 (meta tags로 보완)
- **Risk:** `@opennextjs/cloudflare` 어댑터 안정성

#### Option B: Astro + Cloudflare Pages + D1
- **Approach:** Astro SSR + React islands + D1
- **Pros:** Cloudflare 네이티브 지원 우수, 빌드 빠름
- **Invalidation:** 사용자가 기획안에서 Next.js를 명시적으로 선택함

#### Option C: Hono + Cloudflare Workers + D1
- **Approach:** Hono 서버 + 클라이언트 React SPA
- **Pros:** 가장 가벼움, Workers 네이티브, D1 직접 접근
- **Invalidation:** 사용자가 Next.js를 선택. 단, Architect 리뷰에서 Hono가 서버 로직의 단순함(store text, retrieve text)에 가장 적합하다는 강력한 반론이 제기됨. Next.js 선택은 사용자 선호를 존중한 결정이며, 서버 로직을 최소화(DB CRUD만)하여 어댑터 마찰을 최소화하는 것으로 절충.

**선택: Option A** — 사용자 요구사항(Next.js)에 부합하며, Architect 제안에 따라 서버는 DB CRUD만, 렌더링은 클라이언트로 분리하여 edge 제약 위험을 제거.

---

## Acceptance Criteria

1. [ ] `GET /` — 메인 페이지에 파일 업로드 UI (드래그앤드롭 + 클릭) 표시
2. [ ] `POST /api/upload` — .md 파일 업로드 시 D1에 저장 후 slug 반환 (512KB 제한)
3. [ ] `GET /v/[slug]` — 저장된 마크다운을 클라이언트 사이드로 렌더링하여 표시
4. [ ] GFM (테이블, 체크리스트, 인용) 정상 렌더링
5. [ ] 코드 블록 구문 강조 (최소 10개 언어)
6. [ ] TOC 자동 생성 (h2-h4 기반)
7. [ ] LaTeX 수식 렌더링 (`$inline$`, `$$block$$`)
8. [ ] Mermaid 다이어그램 렌더링
9. [ ] 포인트 컬러 `#FFF7E6`, `#0A122A` 적용된 UI
10. [ ] 공유 URL 복사 버튼 동작
11. [ ] 존재하지 않는 slug 접근 시 404 페이지
12. [ ] Cloudflare Pages에 배포되어 외부 접속 가능
13. [ ] .md 외 파일 업로드 시 에러 메시지 (확장자 기반 검증)
14. [ ] XSS 방지: `rehype-sanitize` 적용, raw HTML 비허용

---

## Implementation Steps

### Step 1: 프로젝트 초기화
- `create-next-app` 으로 Next.js App Router 프로젝트 생성 (TypeScript, Tailwind CSS)
- `@opennextjs/cloudflare` 어댑터 설정 (`@cloudflare/next-on-pages`는 deprecated)
- `wrangler.toml` 작성 (D1 바인딩, compatibility_date 설정)
- D1 데이터베이스 스키마 정의 (`migrations/0001_init.sql`)
- 모든 서버 라우트에 `export const runtime = 'edge'` 명시
- **Files:** `package.json`, `next.config.mjs`, `wrangler.toml`, `migrations/0001_init.sql`, `env.d.ts`

### Step 2: D1 스키마 & API 라우트
- D1 스키마:
  ```sql
  CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_documents_created_at ON documents(created_at);
  ```
- `src/app/api/upload/route.ts` — `export const runtime = 'edge'`
  - POST: FormData에서 .md 파일 수신
  - 파일 유효성: 확장자 `.md` 기반 검증 (MIME은 보조 참고, `text/plain`도 허용)
  - 파일 크기 제한: 512KB (D1 row size 제약 고려)
  - slug 생성: `crypto.randomUUID().slice(0, 8)` (nanoid 의존성 제거, edge runtime 내장 API 활용)
  - 타이틀 추출: 마크다운 첫 번째 `# ` 헤딩에서 추출
  - D1에 INSERT 후 slug 반환
  - slug 충돌 시 재생성 (최대 3회 retry)
- `src/lib/db.ts` — `getCloudflareContext()` from `@opennextjs/cloudflare`로 D1 바인딩 접근 추상화
- **Files:** `migrations/0001_init.sql`, `src/app/api/upload/route.ts`, `src/lib/db.ts`

### Step 3: 메인 페이지 (업로드 UI)
- `src/app/page.tsx` — 메인 페이지 (클라이언트 컴포넌트)
- `src/components/UploadZone.tsx` — 드래그앤드롭 업로드 컴포넌트
  - `'use client'` 지시어
  - dragover/drop 이벤트 핸들링
  - 파일 선택 input (accept=".md")
  - 업로드 진행 상태 표시
  - 에러 메시지 표시 (.md 외 파일, 크기 초과)
- 포인트 컬러 적용: 배경 #FFF7E6, 텍스트/액센트 #0A122A
- 업로드 성공 시 `router.push('/v/{slug}')` 로 이동
- **Files:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/UploadZone.tsx`, `src/app/globals.css`

### Step 4: 뷰 페이지 (하이브리드 렌더링)
- **서버 사이드** (`src/app/v/[slug]/page.tsx`):
  - `export const runtime = 'edge'`
  - D1에서 문서 조회 (slug 기반)
  - 문서 미존재 시 `notFound()` 호출
  - 타이틀/설명 기반 `<meta>` 태그 생성 (OG tags 포함 → 링크 프리뷰)
  - 마크다운 원본을 서버 컴포넌트 prop으로 클라이언트 컴포넌트에 전달 (Next.js가 직렬화를 안전하게 처리, `</script>` 포함 콘텐츠에서도 XSS/파싱 문제 없음)
- **클라이언트 사이드** (`src/components/MarkdownRenderer.tsx`):
  - `'use client'` 지시어
  - `react-markdown` + `remark-gfm` (GFM)
  - `rehype-highlight` (코드 구문 강조)
  - `remark-math` + `rehype-katex` (LaTeX)
  - `rehype-sanitize` with **커스텀 스키마**: `defaultSchema`를 기반으로 KaTeX 요소(`span.katex`, `math`, `annotation`, MathML 요소)와 Mermaid SVG 요소를 allowlist에 추가. 플러그인 순서: `remark-math` → `rehype-katex` → `rehype-sanitize(customSchema)` — sanitize는 반드시 KaTeX 변환 후 실행
  - `rehype-raw` 미사용 — raw HTML은 차단하되, KaTeX/Mermaid가 생성한 HTML만 허용
  - 모든 렌더링이 동일 클라이언트 패스에서 수행 → 일관된 렌더링
- **Mermaid** (`src/components/MermaidBlock.tsx`):
  - `'use client'` + `dynamic(() => import(...), { ssr: false })`
  - 문서에 ` ```mermaid ` 블록이 있을 때만 lazy import
- **KaTeX**:
  - KaTeX CSS는 CDN `<link>` 태그로 로드 (정적 임포트 대비 번들 크기 절약)
- `src/components/TableOfContents.tsx` — 클라이언트에서 렌더링된 DOM의 h2-h4 파싱
- `src/components/ShareButton.tsx` — `navigator.clipboard.writeText()` 로 URL 복사
- **Files:** `src/app/v/[slug]/page.tsx`, `src/components/MarkdownRenderer.tsx`, `src/components/MermaidBlock.tsx`, `src/components/TableOfContents.tsx`, `src/components/ShareButton.tsx`

### Step 5: 디자인 시스템 & 스타일링
- Tailwind CSS 기반
- CSS 변수: `--color-cream: #FFF7E6`, `--color-navy: #0A122A`
- 타이포그래피: 시스템 폰트 스택 + Pretendard CDN 폴백
- `@tailwindcss/typography` 로 마크다운 prose 스타일링 (포인트 컬러 커스터마이징)
- KaTeX CSS: CDN link (lazy) 또는 정적 임포트
- highlight.js 테마: 포인트 컬러와 조화로운 테마 선택
- **Files:** `src/app/globals.css`, `tailwind.config.ts`

### Step 6: 404 & 에러 페이지
- `src/app/v/[slug]/not-found.tsx` — "문서를 찾을 수 없습니다" 안내 + 메인으로 돌아가기
- `src/app/not-found.tsx` — 글로벌 404
- 포인트 컬러 적용
- **Files:** `src/app/v/[slug]/not-found.tsx`, `src/app/not-found.tsx`

### Step 7: Cloudflare Pages 배포 설정
- `wrangler.toml`: D1 바인딩, compatibility_date, `@opennextjs/cloudflare` 설정
- `package.json` scripts: `"build": "next build"`, `"deploy": "wrangler pages deploy"`
- D1 마이그레이션: `wrangler d1 execute markview-db --file=migrations/0001_init.sql`
- GitHub 연동: Cloudflare Dashboard에서 repo 연결, 빌드 커맨드 설정
- **Files:** `wrangler.toml`, `package.json`

---

## File Tree (예상)

```
markview/
├── migrations/
│   └── 0001_init.sql
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── upload/
│   │   │       └── route.ts          # export const runtime = 'edge'
│   │   ├── v/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx           # export const runtime = 'edge'
│   │   │       └── not-found.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── MarkdownRenderer.tsx       # 'use client' — 전체 마크다운 렌더링
│   │   ├── MermaidBlock.tsx           # 'use client' — lazy loaded
│   │   ├── ShareButton.tsx            # 'use client'
│   │   ├── TableOfContents.tsx        # 'use client'
│   │   └── UploadZone.tsx             # 'use client'
│   └── lib/
│       └── db.ts                      # getCloudflareContext() D1 접근
├── env.d.ts                           # Cloudflare bindings 타입
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── wrangler.toml
```

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `@opennextjs/cloudflare` 어댑터 호환성 | High | Medium | edge runtime 명시, Node.js API 완전 회피, 서버 로직 최소화 (DB CRUD만) |
| D1 바인딩 접근 | High | Low | `getCloudflareContext()`로 추상화, `env.d.ts`에 타입 정의 |
| 클라이언트 번들 크기 (mermaid ~2MB, katex ~1MB) | Medium | High | Mermaid/KaTeX를 dynamic import + 콘텐츠 감지 기반 lazy loading |
| 공개 업로드 남용 (스팸) | Medium | Medium | 파일 크기 512KB 제한, `created_at` INDEX로 향후 cleanup 쿼리 지원 |
| XSS via 업로드된 마크다운 | High | Medium | `rehype-sanitize` 적용, `rehype-raw` 미사용으로 raw HTML 차단 |
| slug 충돌 | Low | Low | UNIQUE 제약 + 최대 3회 재생성 retry |
| D1 row size 초과 | Medium | Low | 업로드 512KB 제한으로 row size 1MB 제한 내 유지 |

---

## Verification Steps

1. 로컬에서 `wrangler pages dev` 로 개발 서버 실행 후 전체 플로우 테스트
2. .md 파일 업로드 → slug 반환 확인
3. `/v/{slug}` 접근 → 렌더링 확인:
   - GFM: 테이블, 체크리스트, 인용
   - 코드 블록: 최소 JS, Python, SQL 구문 강조
   - TOC: h2-h4 기반 목차 자동 생성
   - LaTeX: `$E=mc^2$` 인라인, `$$\sum_{i=1}^n$$` 블록
   - Mermaid: flowchart, sequence diagram
4. URL 복사 버튼 클릭 → 클립보드 확인
5. 존재하지 않는 slug → 404 페이지 확인
6. .txt 파일 업로드 시도 → 에러 메시지 확인
7. 512KB 초과 파일 업로드 시도 → 에러 메시지 확인
8. XSS 테스트: `<script>alert(1)</script>` 포함 마크다운 업로드 → 스크립트 미실행 확인
9. OG meta tags 확인: 공유 URL을 SNS 등에 붙여넣기 시 프리뷰 표시
10. Cloudflare Pages 배포 후 외부 URL 접속 확인

---

## Dependencies (npm packages)

```json
{
  "dependencies": {
    "react-markdown": "^9.x",
    "remark-gfm": "^4.x",
    "remark-math": "^6.x",
    "rehype-highlight": "^7.x",
    "rehype-katex": "^7.x",
    "rehype-sanitize": "^6.x",
    "mermaid": "^11.x"
  },
  "devDependencies": {
    "@opennextjs/cloudflare": "latest",
    "wrangler": "^3.x",
    "@tailwindcss/typography": "^0.5.x"
  }
}
```

---

## ADR (Architecture Decision Record)

### Decision
Next.js App Router + `@opennextjs/cloudflare` + D1 SQLite + 클라이언트 사이드 마크다운 렌더링으로 Markview MVP를 구현한다.

### Drivers
1. 사용자가 Next.js + Cloudflare Pages 배포를 명시적으로 선택
2. Edge runtime CPU 제약으로 서버 사이드 마크다운 렌더링은 위험
3. 모든 확장 마크다운(Mermaid, KaTeX 포함)을 동일 클라이언트 렌더링 패스에서 처리하여 일관성 확보
4. D1은 Cloudflare 네이티브 SQLite로 별도 DB 서비스 불필요

### Alternatives Considered
- **SSR 마크다운 렌더링:** Edge CPU 10ms 제한(무료)/30-50ms(유료)에서 복잡한 문서 처리 실패 가능. Mermaid는 SSR 불가하여 렌더링 불일치 발생.
- **Astro + D1:** Cloudflare 호환 우수하나 기획안의 Next.js 요구사항 불부합
- **Hono + Workers:** 서버 로직의 단순함(store/retrieve text)에 가장 적합하나, 사용자의 Next.js 선호 존중. Architect 리뷰에서 가장 강력한 대안으로 평가됨.

### Why Chosen
기획안의 기술 스택 요구사항 충족 + 하이브리드 접근(서버=DB CRUD, 클라이언트=렌더링)으로 edge 제약 우회 + React 마크다운 렌더링 라이브러리 성숙도.

### Consequences
- `@opennextjs/cloudflare` 어댑터 의존 (Cloudflare 특화)
- 클라이언트 번들 크기 증가 (Mermaid/KaTeX lazy loading으로 완화)
- 문서 콘텐츠 SEO 제한 (meta tags로 타이틀/설명만 제공)
- Edge runtime 제약으로 모든 라우트에 `export const runtime = 'edge'` 필수

### Follow-ups
- MVP 이후: rate limiting, 문서 만료/cleanup 정책, 이미지 업로드(R2), 관리자 기능 추가 검토
- Bundle 최적화: Mermaid/KaTeX 사용 빈도 모니터링 후 별도 CDN 로딩 검토

---

## Changelog (Architect Review)
- `@cloudflare/next-on-pages` → `@opennextjs/cloudflare` 전환 (deprecated 어댑터 교체)
- SSR 렌더링 → 하이브리드(서버 DB CRUD + 클라이언트 렌더링) 전환 (edge CPU 제약)
- `nanoid` → `crypto.randomUUID().slice(0,8)` (의존성 제거, edge 내장 API)
- MIME 검증 → 확장자 기반 검증으로 변경 (MIME 불신뢰)
- D1 스키마에 `UNIQUE(slug)`, `INDEX(created_at)` 추가
- 파일 크기 제한 1MB → 512KB (D1 row size 제약)
- `rehype-sanitize` 추가 (XSS 방지)
- Mermaid/KaTeX lazy loading 구체화 (콘텐츠 감지 기반)
- `getRequestContext()` → `getCloudflareContext()` 변경
- slug 충돌 시 retry 로직 추가
- OG meta tags, XSS 테스트를 검증 단계에 추가

### Critic Review (Iteration 1 → ACCEPT-WITH-RESERVATIONS)
- `rehype-sanitize` 커스텀 스키마 명시: KaTeX/Mermaid 요소 allowlist + 플러그인 순서 지정
- `<script type="application/json">` 데이터 전달 → 서버 컴포넌트 prop 전달로 변경 (XSS/파싱 안전)
- Edge CPU 제한 수치 수정: 50ms(무료) → 10ms(무료)/30-50ms(유료)
- KaTeX CSS 로드 전략 확정: CDN `<link>` 태그
