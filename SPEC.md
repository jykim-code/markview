# Markview — 제품 기획서 (SPEC)

> 마크다운을 사람이 읽기 편한 형태로 변환하고, 링크 하나로 공유하는 웹 서비스

## 1. 제품 개요

### 1.1 한 줄 정의

AI가 생성한 마크다운(.md) 파일을 업로드하면, 아름답게 렌더링된 웹 문서로 변환하고 고유 URL로 즉시 공유할 수 있는 서비스.

### 1.2 핵심 가치
- **즉시성**: 설치 없음, 로그인 없음. 업로드 → 변환 → 공유가 10초 내 완료
- **가독성**: raw 마크다운이 아닌, 타이포그래피와 레이아웃이 적용된 깔끔한 문서
- **공유성**: 링크를 받은 누구나 동일한 렌더링 결과를 즉시 열람

### 1.3 타겟 사용자

| 페르소나 | 상황 |
|----------|------|
| AI 활용자 | ChatGPT/Claude가 만든 .md 파일을 팀원에게 공유하고 싶을 때 |
| 개발자 | README나 기술 문서를 비개발자에게 보여줄 때 |
| 기획자/PM | 마크다운 기반 기획서를 깔끔하게 전달할 때 |

## 2. 사용자 플로우

```
[홈페이지] → .md 파일 업로드(클릭 또는 드래그앤드롭)
    ↓
[서버] POST /api/upload → 8자리 slug 생성 → D1 저장
    ↓
[뷰어 페이지] /v/{slug} → 렌더링된 문서 표시
    ↓
[사용자 선택]
  ├─ View 모드: 읽기 전용 (TOC 포함)
  ├─ Edit 모드: 좌측 에디터 + 우측 프리뷰 (Split View)
  ├─ 저장: PUT /api/documents/{slug}
  ├─ 공유: URL 클립보드 복사
  └─ Export: .md / .html / .pdf 다운로드
```

## 3. 기능 명세

### 3.1 파일 업로드

| 항목 | 사양 |
|------|------|
| 허용 포맷 | `.md` 파일만 |
| 최대 크기 | 512KB |
| 입력 방식 | 버튼 클릭 또는 드래그 앤 드롭 |
| 제목 추출 | 마크다운 첫 번째 `# 제목`에서 자동 추출, 없으면 "Untitled" |
| Slug 생성 | UUID 기반 8자리 랜덤 문자열, 충돌 시 최대 3회 재시도 |
| 응답 | `{ slug, title }` 반환 후 `/v/{slug}`로 리다이렉트 |

### 3.2 문서 뷰어 (`/v/{slug}`)

#### View 모드 (기본)
- 렌더링된 마크다운 문서를 전체 화면으로 표시
- 좌측: 본문 (최대 900px) / 우측: 자동 생성 목차(TOC)
- TOC는 h2~h4 헤딩 기준, 앵커 링크로 스크롤 이동
- TOC는 데스크톱(lg 이상)에서만 표시

#### Edit 모드
- Split View: 좌측 마크다운 에디터 + 우측 렌더링 프리뷰
- 모노스페이스 폰트(Fira Code) 에디터
- 실시간 프리뷰 (상태 변경 시 즉시 반영)

#### 모드 전환
- 헤더의 View/Edit 토글 버튼으로 전환
- 상태는 클라이언트 사이드에서 관리

### 3.3 마크다운 렌더링 지원 범위

| 기능 | 구현 방식 |
|------|-----------|
| GFM (테이블, 취소선, 체크리스트 등) | `remark-gfm` |
| 코드 구문 강조 | `rehype-highlight` (highlight.js GitHub 테마) |
| LaTeX 수식 (인라인/블록) | `remark-math` + `rehype-katex` |
| Mermaid 다이어그램 | 클라이언트 사이드 dynamic import, 커스텀 테마 적용 |
| HTML Sanitize | `rehype-sanitize` (KaTeX, Mermaid SVG 허용하는 커스텀 스키마) |
| 이미지 | 마크다운 이미지 문법 지원, 라운드 처리 |
| 인용문(Blockquote) | 좌측 보더 스타일 |

### 3.4 저장

| 항목 | 사양 |
|------|------|
| API | `PUT /api/documents/{slug}` |
| 요청 | `{ content: string }` |
| 동작 | 기존 slug의 content 필드 업데이트 |
| 피드백 | "저장 중..." → "저장 완료!" (2초 후 원래 텍스트로 복귀) |

### 3.5 공유

- "공유" 버튼 클릭 시 `{origin}/v/{slug}` URL을 클립보드에 복사
- Clipboard API 우선 사용, 실패 시 `execCommand('copy')` 폴백
- "복사 완료!" 피드백 2초 표시

### 3.6 Export

| 포맷 | 동작 |
|------|------|
| Markdown (.md) | 현재 content를 Blob으로 다운로드 |
| HTML (.html) | 렌더링된 innerHTML + 독립 실행 가능한 HTML 문서로 다운로드 (폰트, KaTeX, highlight.js CDN 포함) |
| PDF (.pdf) | `window.print()` 호출, `@media print` 스타일 적용 (헤더/사이드바/에디터 숨김, prose 영역만 출력) |

### 3.7 SEO / 메타데이터

- 각 문서 페이지(`/v/{slug}`)에 동적 `<title>`, `<meta description>`, OpenGraph 태그 생성
- 제목: DB 저장된 title 사용
- 설명: content 앞 200자에서 마크다운 문법 제거 후 사용

## 4. 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 — 히어로 섹션 + 업로드 카드 + 지원 기능 태그 |
| `/v/[slug]` | 문서 뷰어/에디터 |
| `/about` | 서비스 소개 및 운영자 정보 |
| `/privacy` | 개인정보처리방침 |
| `/contact` | 연락처 |

## 5. 기술 스택

| 카테고리 | 기술 |
|----------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| UI | React 19, Tailwind CSS 4 |
| 마크다운 | react-markdown, remark-gfm, remark-math, rehype-highlight, rehype-katex, rehype-sanitize |
| 다이어그램 | Mermaid (클라이언트 dynamic import) |
| 데이터베이스 | Cloudflare D1 (SQLite), 로컬 개발 시 JSON 파일 폴백 |
| 배포 | Cloudflare Pages (OpenNext 어댑터) |
| 폰트 | Montserrat (Google Fonts) |
| 수익화 | Google AdSense |

## 6. 데이터 모델

### documents 테이블

| 컬럼 | 타입 | 제약 |
|------|------|------|
| `id` | TEXT | PK (UUID) |
| `slug` | TEXT | NOT NULL, UNIQUE |
| `title` | TEXT | NOT NULL, 기본값 '' |
| `content` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL, 기본값 `datetime('now')` |

인덱스: `slug`, `created_at`

## 7. API 명세

### POST /api/upload

- **입력**: `multipart/form-data` — `file` 필드 (.md 파일)
- **검증**: 확장자 `.md`, 크기 512KB 이하
- **응답 (200)**: `{ slug: string, title: string }`
- **에러**: 400 (유효성 실패), 500 (서버 오류)

### PUT /api/documents/[slug]

- **입력**: `application/json` — `{ content: string }`
- **응답 (200)**: `{ success: true }`
- **에러**: 400 (content 누락), 404 (문서 없음), 500 (서버 오류)

## 8. 디자인 시스템

### 컬러

| 이름 | 값 | 용도 |
|------|-----|------|
| Navy | `#0A122A` | 주요 텍스트, 버튼, 강조 |
| Cream | `#FFF7E6` | 배경 (히어로, 문서 뷰어) |
| White | `#FFFFFF` | 카드, 헤더 배경 |

### 타이포그래피

- 본문: Montserrat (300~800)
- 코드: Fira Code / JetBrains Mono
- 히어로 제목: clamp(32px, 6vw, 52px), weight 800, letter-spacing -1.5px

### 레이아웃

- 헤더: sticky, 66px 높이, 하단 보더
- 최대 콘텐츠 폭: 900px (뷰어), 720px (정적 페이지)
- 카드: 라운드 3xl, 그림자 2xl
- 애니메이션: fade-in (0.8s ease-out), 지연 변형

## 9. 제약 사항 및 현재 한계

| 항목 | 현황 |
|------|------|
| 인증 | 없음 — 누구나 업로드/편집 가능 |
| 문서 삭제 | API 미구현 |
| 문서 목록 | 없음 — slug를 알아야 접근 가능 |
| 파일 크기 | 512KB 제한 |
| 이미지 호스팅 | 미지원 — 외부 URL만 가능 |
| 문서 만료 | 없음 — 영구 보관 |
| 접근 제어 | 없음 — URL을 아는 누구나 열람/편집 |
| 모바일 최적화 | 반응형 대응 (히어로, 헤더), Edit 모드 모바일 UX는 미최적화 |

## 10. 향후 확장 고려 사항

> 현재 구현되지 않았으나 확장 가능한 방향

- 사용자 인증 및 내 문서 목록
- 문서 만료/삭제 기능
- 이미지 업로드 (R2 연동)
- 문서 비밀번호/비공개 설정
- 실시간 협업 편집
- 커스텀 도메인 매핑
- 문서 버전 히스토리
