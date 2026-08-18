# Incident: Worker exceeded resource limits (Error 1102)

- **날짜**: 2026-08-10
- **증상**: `markview-4hy.pages.dev` 전체 불능, Cloudflare Error 1102 "Worker exceeded resource limits"
- **영향**: 모든 문서 페이지(`/v/[slug]`) 접근 불가

---

## 원인

### 트리거
`feat/html-support` 브랜치 머지 — HTML 문서 지원 기능 추가 (`HtmlEditor`, 최대 25MB 업로드)

### 근본 원인 (두 가지 중첩)

#### 1. generateMetadata에서 대용량 HTML 전체에 정규식 실행 (핵심)

`src/app/v/[slug]/page.tsx`의 `generateMetadata`에서 OG description 생성 시:

```ts
// 문제 코드: 최대 25MB 전체 문자열에 정규식 실행
doc.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
```

- HTML 문서는 최대 25MB까지 업로드 가능
- 25MB 문자열 전체에 `/<[^>]+>/g` (전체 탐색) → Worker CPU time limit 초과
- Cloudflare Workers CPU limit: 50ms (기본), 초과 시 Error 1102

#### 2. 같은 요청에서 DB+R2를 이중 호출

`generateMetadata`와 `ViewPage` 함수가 각각 독립적으로 `getDocumentBySlug` 호출:
- `generateMetadata`: D1 query + R2 get
- `ViewPage`: D1 query + R2 get
- 합계: 페이지 로드당 D1 2회 + R2 2회 = 4번 외부 요청

---

## 수정

**파일**: `src/app/v/[slug]/page.tsx`

### Fix 1: 정규식 실행 전 먼저 슬라이스

```ts
// 수정 전
doc.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)

// 수정 후 — 먼저 자르고 정규식 적용
const preview = doc.content.slice(0, 500);
preview.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
```

### Fix 2: React.cache()로 이중 호출 제거

```ts
import { cache } from "react";
import { getDocumentBySlug } from "@/lib/db";

// 같은 요청 내에서 결과 재사용 (D1+R2 호출 4회 → 2회)
const getDoc = cache(getDocumentBySlug);
```

---

## 예방 규칙

### 대용량 콘텐츠 처리

- **Server Component에서 대용량 문자열 정규식 금지** — 반드시 먼저 슬라이스
- 업로드 한도가 큰 경우(1MB+), metadata/preview 생성은 항상 앞부분만 사용

```ts
// 패턴: 먼저 자르고 가공
const preview = content.slice(0, 500);
const description = processForMeta(preview);
```

### 같은 요청 내 중복 DB 호출 방지

- `generateMetadata` + Page 컴포넌트에서 같은 데이터를 쓰면 반드시 `React.cache()` 사용
- `cache()`는 요청 단위로 메모이제이션 — 서버에서만 동작, 클라이언트 무관

```ts
// 패턴: page.tsx 파일 상단
const getData = cache(fetchFromDB);
// generateMetadata, default export 모두 getData 사용
```

### Cloudflare Worker 리소스 한도 인지

| 항목 | 기본 한도 | 비고 |
|------|----------|------|
| CPU time | 10~50ms | Error 1102 발생 |
| 메모리 | 128MB | Error 1102 발생 |
| 서브요청 | 50회 (무료) / 1000회 (유료) | Error 1101 발생 |

대용량 파일을 다루는 API/페이지는 반드시 부분 처리 패턴 적용.

---

## 커밋

`4abbaeb` — fix: prevent Worker CPU overuse on large document pages
