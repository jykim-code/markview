# Markview 브라우저 확장 프로그램 개발 산출물 (Chrome + Edge)

> 문서 버전: 1.1  
> 작성일: 2026-04-06  
> 프로젝트명: Markview - Markdown Viewer (Chrome / Edge Extension)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [요구사항 정의서](#2-요구사항-정의서)
3. [기능 명세서](#3-기능-명세서)
4. [아키텍처 설계서](#4-아키텍처-설계서)
5. [화면 설계서](#5-화면-설계서)
6. [컴포넌트 명세서](#6-컴포넌트-명세서)
7. [API 연동 명세서](#7-api-연동-명세서)
8. [데이터 흐름 설계서](#8-데이터-흐름-설계서)
9. [기술 스택 및 의존성](#9-기술-스택-및-의존성)
10. [빌드 및 배포 가이드](#10-빌드-및-배포-가이드)
11. [테스트 명세서](#11-테스트-명세서)
12. [보안 및 권한 명세서](#12-보안-및-권한-명세서)
13. [제약 사항 및 향후 계획](#13-제약-사항-및-향후-계획)

---

## 1. 프로젝트 개요

### 1.1 제품 정의

**Markview 브라우저 확장 프로그램**은 Chrome과 Edge 브라우저에서 마크다운(.md) 파일 다운로드를 자동으로 가로채어, 사이드 패널에서 아름답게 렌더링하여 보여주는 확장 프로그램이다. 동일한 Chromium 기반 코드베이스(Manifest V3)로 두 브라우저를 동시에 지원한다.

### 1.2 개발 배경

- AI 도구(ChatGPT, Claude 등)가 생성하는 마크다운 파일을 다운로드 없이 즉시 열람할 수 있는 환경 필요
- 기존 Markview 웹 서비스의 UX를 브라우저 사이드 패널로 확장하여 접근성 향상
- 별도의 에디터나 뷰어 설치 없이 브라우저 내에서 마크다운 렌더링 제공

### 1.3 핵심 가치

| 가치 | 설명 |
|------|------|
| **자동 인터셉트** | .md 파일 다운로드 시 자동으로 감지하여 사이드 패널에서 렌더링 |
| **즉시성** | 파일 저장 없이 브라우저 내에서 바로 렌더링 확인 |
| **웹 공유 연동** | Markview 웹 서비스로 즉시 업로드하여 공유 URL 생성 |
| **다양한 입력** | 파일 열기, 드래그 앤 드롭, 텍스트 붙여넣기, URL 드롭 지원 |

### 1.4 대상 사용자

| 페르소나 | 시나리오 |
|----------|----------|
| AI 활용자 | ChatGPT/Claude에서 .md 파일 다운로드 시 Chrome 또는 Edge 사이드 패널에서 자동 열람 |
| 개발자 | GitHub 등에서 .md 파일 다운로드 시 바로 렌더링 확인 |
| 일반 사용자 | 이메일이나 메시지로 받은 .md 파일을 Chrome/Edge 브라우저에서 즉시 확인 |

---

## 2. 요구사항 정의서

### 2.1 기능 요구사항 (Functional Requirements)

| ID | 구분 | 요구사항 | 우선순위 | 구현 상태 |
|----|------|----------|----------|-----------|
| FR-01 | 다운로드 인터셉트 | .md/.markdown 파일 다운로드 시 자동으로 가로채어 사이드 패널에서 렌더링 | P0 | ✅ 완료 |
| FR-02 | 사이드 패널 렌더링 | 마크다운을 GFM, 코드 하이라이팅, 수식, 다이어그램을 포함하여 렌더링 | P0 | ✅ 완료 |
| FR-03 | 파일 열기 | 로컬 .md 파일을 선택하여 열기 | P0 | ✅ 완료 |
| FR-04 | 드래그 앤 드롭 | .md 파일, URL, 텍스트를 드래그 앤 드롭으로 입력 | P1 | ✅ 완료 |
| FR-05 | 텍스트 붙여넣기 | Ctrl+V로 마크다운 텍스트를 붙여넣어 렌더링 | P1 | ✅ 완료 |
| FR-06 | View/Edit 모드 | 읽기 전용 View 모드와 편집 가능한 Edit 모드 전환 | P1 | ✅ 완료 |
| FR-07 | Export | Markdown(.md), HTML(.html), PDF 형식으로 내보내기 | P1 | ✅ 완료 |
| FR-08 | 웹 공유 | Markview 웹 서비스로 업로드 후 공유 URL 클립보드 복사 | P1 | ✅ 완료 |
| FR-09 | 다크/라이트 모드 | 테마 전환 및 localStorage 저장 | P2 | ✅ 완료 |
| FR-10 | 홈 화면 | 빈 상태에서 파일 업로드 안내 UI 표시 | P2 | ✅ 완료 |

### 2.2 비기능 요구사항 (Non-Functional Requirements)

| ID | 구분 | 요구사항 | 구현 상태 |
|----|------|----------|-----------|
| NFR-01 | 성능 | 사이드 패널 로딩 후 500ms 이내 렌더링 시작 | ✅ |
| NFR-02 | 호환성 | Chrome Manifest V3 규격 준수 | ✅ |
| NFR-03 | 보안 | rehype-sanitize를 통한 XSS 방지 | ✅ |
| NFR-04 | UX | 인터셉트 실패 시 사용자에게 대안 안내 토스트 표시 | ✅ |
| NFR-05 | 안정성 | 중복 다운로드 처리 방지 (handledDownloads Set) | ✅ |
| NFR-06 | 메모리 | 처리 완료된 다운로드 ID 30초 후 자동 정리 | ✅ |

---

## 3. 기능 명세서

### 3.1 다운로드 인터셉트

| 항목 | 사양 |
|------|------|
| 감지 대상 | URL 경로가 `.md` 또는 `.markdown`으로 끝나는 파일, MIME 타입이 `text/markdown` 또는 `text/x-markdown`인 파일 |
| 감지 시점 | `chrome.downloads.onCreated` (1차), `chrome.downloads.onChanged` (2차 폴백 — 파일명 확정 시) |
| 인터셉트 동작 | 다운로드 취소(`cancel`) → 다운로드 기록 삭제(`erase`) → 사이드 패널 열기 → 콘텐츠 fetch |
| 콘텐츠 획득 | 1순위: 활성 탭 컨텍스트에서 `fetch` (인증 쿠키 포함) → 2순위: `finalUrl`로 재시도 → 3순위: 백그라운드에서 직접 `fetch` |
| 중복 방지 | `handledDownloads` Set으로 이미 처리된 다운로드 ID 추적, 30초 후 자동 정리 |
| 실패 처리 | 콘텐츠 획득 실패 시 `md-download-hint` 메시지로 사용자에게 대안 안내 |

### 3.2 마크다운 렌더링

| 기능 | 구현 방식 | 설명 |
|------|-----------|------|
| GFM | `remark-gfm` | 테이블, 취소선, 체크리스트, 자동 링크 |
| 코드 구문 강조 | `rehype-highlight` (highlight.js) | GitHub 테마 기반 구문 강조 |
| LaTeX 수식 | `remark-math` + `rehype-katex` | 인라인(`$...$`) 및 블록(`$$...$$`) 수식 |
| Mermaid 다이어그램 | 클라이언트 사이드 렌더링 | `mermaid` 코드 블록 자동 감지, 다크모드 테마 적용 |
| HTML 새니타이징 | `rehype-sanitize` | 커스텀 스키마 (KaTeX, Mermaid SVG 허용) |
| 이미지 | 마크다운 이미지 문법 | 라운드 처리 적용 |
| 인용문 | Blockquote | 좌측 보더 스타일 |

### 3.3 파일 입력 방식

| 입력 방식 | 동작 | 제약 |
|-----------|------|------|
| 자동 인터셉트 | .md 다운로드 시 자동으로 사이드 패널에 렌더링 | 인증 필요 사이트는 탭 컨텍스트 fetch 사용 |
| 파일 열기 버튼 | `<input type="file" accept=".md">` 파일 선택 다이얼로그 | `.md` 파일만 허용 |
| 드래그 앤 드롭 (파일) | FileReader API로 텍스트 읽기 | `.md` 확장자 체크 |
| 드래그 앤 드롭 (URL) | `text/uri-list` 또는 `text/plain`에서 URL 추출 후 fetch | `.md`로 끝나는 HTTP URL만 |
| 드래그 앤 드롭 (텍스트) | `text/plain` 데이터를 마크다운으로 직접 렌더링 | 빈 텍스트 무시 |
| 클립보드 붙여넣기 | `Ctrl+V` — 파일 또는 텍스트 붙여넣기 | 홈 화면에서만 동작 |
| 직접 입력 | Edit 모드 전환 후 textarea에 직접 작성 | — |

### 3.4 Export 기능

| 형식 | 동작 |
|------|------|
| Markdown (.md) | 현재 content를 Blob으로 변환하여 다운로드 |
| HTML (.html) | 렌더링된 innerHTML을 독립 실행 가능한 HTML 문서로 포장 (폰트, KaTeX, highlight.js CDN 포함) |
| PDF (.pdf) | `window.print()` 호출, `@media print` CSS로 헤더/사이드바 숨김 처리 |

### 3.5 웹 공유

| 항목 | 사양 |
|------|------|
| 업로드 대상 | `https://markview-4hy.pages.dev/api/upload` |
| 요청 형식 | `multipart/form-data` — `file` 필드에 Blob 첨부 |
| 응답 처리 | `{ slug }` 수신 → `https://markview-4hy.pages.dev/v/{slug}` URL 생성 |
| 클립보드 복사 | `navigator.clipboard.writeText()` |
| 캐싱 | `useRef`로 마지막 업로드 content/URL 캐싱, 동일 content 재공유 시 재업로드 없이 URL 재사용 |
| 오프라인 | `navigator.onLine` 체크, 오프라인 시 버튼 비활성화 |
| 피드백 | 성공: "URL이 복사되었습니다. 공유해보세요!" (2초), 실패: "공유에 실패했습니다" (3초) |

### 3.6 다크/라이트 모드

| 항목 | 사양 |
|------|------|
| 구현 방식 | `data-theme` 속성 기반 CSS 변수 전환 |
| 저장 | `localStorage`에 테마 저장 |
| 초기값 | OS `prefers-color-scheme` 설정 자동 감지 |
| 적용 범위 | 전체 배경/텍스트, 헤더, 로고(SVG 분리), 코드 블록, Mermaid 다이어그램, 카드/그림자 |

---

## 4. 아키텍처 설계서

### 4.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────┐
│               Chrome / Edge Browser                      │
│                                                         │
│  ┌──────────────┐     chrome.runtime      ┌───────────┐ │
│  │  Background   │ ◄───────────────────► │ Side Panel │ │
│  │  Service      │     .sendMessage()     │  (React)   │ │
│  │  Worker       │                        │            │ │
│  │              │                        │ ExtensionApp│ │
│  │ - downloads  │                        │ ├─Renderer  │ │
│  │   .onCreated │                        │ ├─Export    │ │
│  │ - downloads  │                        │ ├─Share     │ │
│  │   .onChanged │                        │ ├─FileOpen  │ │
│  │ - scripting  │                        │ └─Theme     │ │
│  │   .execute   │                        │            │ │
│  └──────┬───────┘                        └──────┬─────┘ │
│         │                                       │       │
│         │ chrome.scripting                       │ fetch │
│         │ .executeScript()                       │       │
│         ▼                                       ▼       │
│  ┌──────────────┐                ┌─────────────────────┐│
│  │  Active Tab   │                │  Markview Web API    ││
│  │ (fetch with   │                │  markview-4hy.       ││
│  │  auth cookies)│                │  pages.dev/api/upload││
│  └──────────────┘                └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 4.2 모듈 구조

```
extension/
├── manifest.json              # Chrome Extension Manifest V3
├── sidepanel.html             # 사이드 패널 HTML 엔트리 포인트
├── package.json               # 의존성 및 빌드 스크립트
├── vite.config.ts             # Vite 빌드 설정
├── tsconfig.json              # TypeScript 설정
├── src/
│   ├── background.ts          # 서비스 워커 (다운로드 인터셉트)
│   ├── main.tsx               # React 앱 엔트리 포인트
│   ├── mermaid-sandbox.html   # Mermaid 렌더링 격리 컨텍스트
│   ├── components/
│   │   ├── ExtensionApp.tsx   # 메인 UI 컴포넌트
│   │   ├── MarkdownRenderer.tsx  # 마크다운 렌더링 엔진
│   │   ├── MermaidBlock.tsx   # Mermaid 다이어그램 렌더링
│   │   ├── ExportButton.tsx   # 내보내기 (MD/HTML/PDF)
│   │   ├── ShareButton.tsx    # 웹 공유 (업로드 + URL 복사)
│   │   ├── FileOpenButton.tsx # 파일 열기 다이얼로그
│   │   └── ThemeToggle.tsx    # 다크/라이트 모드 전환
│   ├── lib/                   # 유틸리티 함수
│   └── styles/
│       └── globals.css        # 글로벌 스타일 (Tailwind + 커스텀)
├── public/                    # 아이콘, 로고 등 정적 에셋
└── dist/                      # 빌드 결과물
```

### 4.3 주요 설계 결정

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| UI 프레임워크 | React 19 + Vite | 웹 앱과 컴포넌트 공유, 빠른 빌드 |
| 사이드 패널 | `chrome.sidePanel` API | MV3 권장 방식, 별도 탭 불필요, Chrome/Edge 공통 지원 |
| 콘텐츠 획득 | `chrome.scripting.executeScript` | 인증 쿠키를 포함한 fetch 가능 |
| 크로스 브라우저 | 단일 Chromium 코드베이스 | Chrome과 Edge 모두 Chromium 기반으로 동일 MV3 API 지원, 별도 분기 불필요 |
| 다이어그램 격리 | `sandbox` 페이지 | Mermaid의 DOM 조작을 격리하여 보안 강화 |
| 빌드 후처리 | `crossorigin`/`type="module"` 제거 | MV3 CSP 규격 준수 |

---

## 5. 화면 설계서

### 5.1 화면 목록

| 화면 | 조건 | 설명 |
|------|------|------|
| 홈 화면 | `content` 비어있음 + View 모드 | 히어로 섹션, 파일 열기 버튼, 붙여넣기/드래그 안내 |
| 로딩 화면 | `loading === true` | 스피너 + "렌더링 준비 중..." 메시지 |
| View 모드 | `content` 있음 + View 모드 | 렌더링된 마크다운 문서 표시 |
| Edit 모드 | Edit 모드 | 모노스페이스 에디터 (textarea) |

### 5.2 홈 화면

```
┌─────────────────────────┐
│ [Logo]         [Theme]  │  ← 헤더 (50px)
├─────────────────────────┤
│                         │
│      마크다운을           │  ← 히어로 타이틀
│    사람이 읽기 편한       │     clamp(24px, 5vw, 32px)
│        형태로.           │     weight: 800
│                         │
│   텍스트를 붙여넣거나     │  ← 서브 텍스트
│   .md 파일을 업로드하세요.│
│                         │
│  ┌───────────────────┐  │
│  │                   │  │  ← 업로드 카드
│  │  [.md 파일 열기]   │  │     bg-bg, 라운드 2xl, 그림자
│  │                   │  │
│  │ 또는 마크다운 텍스트│  │
│  │    붙여넣기        │  │
│  │                   │  │
│  │ .md · Ctrl+V ·    │  │
│  │ 드래그 앤 드롭     │  │
│  └───────────────────┘  │
│                         │
│     직접 입력하기        │  ← Edit 모드 전환 링크
│                         │
├─────────────────────────┤
│  MARKVIEW — Markdown    │  ← 푸터
│       + View            │
└─────────────────────────┘
```

### 5.3 View 모드 (콘텐츠 있음)

```
┌─────────────────────────┐
│ [Home] Title  [V][E]    │  ← 헤더 (50px)
│         [File][Ex][Sh][T]│     View/Edit 토글 (pill)
├─────────────────────────┤
│                         │
│  # 문서 제목             │  ← 렌더링된 마크다운
│                         │     bg-cream, padding 16px
│  본문 내용...            │
│                         │
│  ```code block```       │  ← 구문 강조 적용
│                         │
│  | 테이블 | 지원 |       │  ← GFM 테이블
│                         │
│  $$ LaTeX $$            │  ← KaTeX 렌더링
│                         │
│  ```mermaid             │  ← Mermaid 다이어그램
│  graph TD               │
│  ```                    │
│                         │
└─────────────────────────┘
```

### 5.4 Edit 모드

```
┌─────────────────────────┐
│ [Home] Title  [V][E]    │  ← 헤더
│         [File][Ex][Sh][T]│
├─────────────────────────┤
│                         │
│ # 마크다운을 입력하세요...│  ← textarea
│                         │     font: Fira Code / JetBrains Mono
│ (마크다운 원본 편집)     │     resize: none
│                         │     flex-1, 전체 영역 사용
│                         │
└─────────────────────────┘
```

### 5.5 드래그 오버레이

```
┌─────────────────────────┐
│         (blur)          │  ← backdrop-blur-sm
│  ┌───────────────────┐  │     bg-navy/10
│  │   [folder icon]   │  │
│  │                   │  │  ← 중앙 안내 카드
│  │  여기에 놓으세요!   │  │     border: dashed navy/30
│  │     .md 파일       │  │     bg-bg/90
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

### 5.6 헤더 컴포넌트 상세

```
┌──────────────────────────────────────────┐
│ [🏠] 문서 제목...  [View][Edit]  [📁][⬇][🔗][🌙] │
│  30px  truncate    pill toggle   각 30x30px         │
└──────────────────────────────────────────┘

[🏠] Home 버튼 — content 초기화, View 모드로 복귀
[View][Edit] — 라운드 pill 토글, 활성 탭에 bg-bg + shadow
[📁] FileOpenButton — 파일 선택 다이얼로그
[⬇] ExportButton — MD/HTML/PDF 드롭다운
[🔗] ShareButton — 웹 업로드 후 URL 복사
[🌙] ThemeToggle — 다크/라이트 전환
```

---

## 6. 컴포넌트 명세서

### 6.1 컴포넌트 계층 구조

```
main.tsx
└── ExtensionApp
    ├── ThemeToggle
    ├── FileOpenButton
    ├── ExportButton
    ├── ShareButton
    └── MarkdownRenderer
        └── MermaidBlock
```

### 6.2 컴포넌트 상세

#### ExtensionApp (`ExtensionApp.tsx`)

| 항목 | 내용 |
|------|------|
| 역할 | 메인 애플리케이션 컨테이너, 전체 상태 관리 |
| 상태 | `content: string`, `mode: ViewMode`, `isDragging: boolean`, `downloadHint: string`, `loading: boolean` |
| 이벤트 | `onDrop`, `onDragEnter`, `onDragOver`, `onDragLeave`, `onPaste`, `onKeyDown` |
| 메시지 수신 | `chrome.runtime.onMessage` — `md-loading`, `md-file-downloaded`, `md-download-hint` |
| 조건부 렌더링 | `loading` → 로딩 화면, `isEmpty && view` → 홈 화면, `view` → 렌더링, `edit` → 에디터 |

#### MarkdownRenderer (`MarkdownRenderer.tsx`)

| 항목 | 내용 |
|------|------|
| 역할 | react-markdown 기반 마크다운 렌더링 |
| Props | `content: string` |
| 플러그인 | `remark-gfm`, `remark-math`, `rehype-highlight`, `rehype-katex`, `rehype-sanitize` |
| 커스텀 컴포넌트 | `code` (Mermaid 블록 감지), `h2`~`h4` (앵커 ID), `inline code` 스타일링 |

#### MermaidBlock (`MermaidBlock.tsx`)

| 항목 | 내용 |
|------|------|
| 역할 | Mermaid 다이어그램을 SVG로 렌더링 |
| Props | `chart: string` |
| 특징 | 클라이언트 사이드 dynamic import, 다크모드 테마 자동 적용, sandbox 격리 |

#### ExportButton (`ExportButton.tsx`)

| 항목 | 내용 |
|------|------|
| 역할 | 마크다운/HTML/PDF 내보내기 드롭다운 |
| Props | `content: string`, `title: string` |
| 동작 | MD → Blob 다운로드, HTML → 독립 문서 생성, PDF → `window.print()` |

#### ShareButton (`ShareButton.tsx`)

| 항목 | 내용 |
|------|------|
| 역할 | Markview 웹 서비스로 업로드 후 공유 URL 복사 |
| Props | `content: string`, `title: string` |
| 상태 | `loading`, `shared`, `error` |
| 캐싱 | `useRef`로 마지막 업로드 content/URL 저장, 동일 content 재공유 시 재업로드 생략 |
| 오프라인 | `navigator.onLine` 체크, 비활성화 처리 |

#### FileOpenButton (`FileOpenButton.tsx`)

| 항목 | 내용 |
|------|------|
| 역할 | 로컬 .md 파일 선택 다이얼로그 |
| Props | `onFileLoad: (content, filename) => void`, `variant: "icon" \| "button"` |
| 동작 | `<input type="file" accept=".md">` 트리거, FileReader로 텍스트 읽기 |
| variant | `icon` — 30x30 아이콘 버튼 (헤더용), `button` — 풀 버튼 (홈 화면용) |

#### ThemeToggle (`ThemeToggle.tsx`)

| 항목 | 내용 |
|------|------|
| 역할 | 다크/라이트 모드 전환 토글 |
| 저장 | `localStorage` |
| 아이콘 | 해(라이트) / 달(다크) SVG |

---

## 7. API 연동 명세서

### 7.1 외부 API

#### POST /api/upload (Markview 웹 서비스)

- **URL**: `https://markview-4hy.pages.dev/api/upload`
- **용도**: ShareButton에서 마크다운 콘텐츠를 웹 서비스에 업로드
- **Method**: POST
- **Content-Type**: `multipart/form-data`
- **Request Body**:

| 필드 | 타입 | 설명 |
|------|------|------|
| `file` | File (Blob) | 마크다운 콘텐츠, MIME `text/markdown`, 파일명 `{title}.md` |

- **Response (200)**:

```json
{
  "slug": "a1b2c3d4",
  "title": "문서 제목"
}
```

- **생성되는 URL**: `https://markview-4hy.pages.dev/v/{slug}`
- **에러**: 400 (유효성 실패), 500 (서버 오류)

### 7.2 Chrome Extension API 사용

| API | 용도 |
|-----|------|
| `chrome.sidePanel.setPanelBehavior` | 액션 아이콘 클릭 시 사이드 패널 열기 설정 |
| `chrome.sidePanel.open` | 다운로드 인터셉트 시 사이드 패널 강제 열기 |
| `chrome.downloads.onCreated` | 다운로드 생성 이벤트 감지 (1차 인터셉트) |
| `chrome.downloads.onChanged` | 다운로드 상태 변경 감지 (2차 폴백 — 파일명 기반) |
| `chrome.downloads.cancel` | .md 다운로드 취소 |
| `chrome.downloads.erase` | 다운로드 기록 삭제 |
| `chrome.downloads.search` | 다운로드 ID로 아이템 조회 |
| `chrome.scripting.executeScript` | 활성 탭 컨텍스트에서 fetch 실행 (인증 쿠키 포함) |
| `chrome.tabs.query` | 활성 탭 조회 |
| `chrome.runtime.sendMessage` | 백그라운드 → 사이드 패널 메시지 전송 |
| `chrome.runtime.onMessage` | 사이드 패널에서 메시지 수신 |

---

## 8. 데이터 흐름 설계서

### 8.1 다운로드 인터셉트 플로우

```
[사용자] .md 파일 다운로드 클릭
    │
    ▼
[chrome.downloads.onCreated] ── URL/MIME 체크 ── 비.md → 통과 (일반 다운로드)
    │ .md 감지
    ▼
[isMdDownload()] 판별
    │ true
    ▼
[interceptMdDownload()]
    ├── handledDownloads.has(id)? → return (중복 방지)
    ├── handledDownloads.add(id)
    ├── setTimeout(delete, 30s) (메모리 정리)
    ├── chrome.downloads.cancel(id)
    ├── chrome.downloads.erase({ id })
    │
    ▼
[chrome.tabs.query] → 활성 탭 ID 획득
    │
    ▼
[chrome.sidePanel.open] → 사이드 패널 열기
    │ 400ms 대기
    ▼
[sendMessage("md-loading")] → 로딩 상태 표시
    │
    ▼
[fetchViaTab(tabId, url)] ← chrome.scripting.executeScript
    │                         (탭 컨텍스트 fetch, 인증 쿠키 포함)
    │
    ├── 성공 → content 획득
    │         │
    │         ▼
    │   [sendMessage("md-file-downloaded", content)]
    │         │
    │         ▼
    │   [ExtensionApp] → setContent → View 모드로 렌더링
    │
    ├── 실패 → finalUrl로 재시도
    │         │
    │         ├── 성공 → 위와 동일
    │         │
    │         └── 실패 → 백그라운드 fetch 시도
    │                   │
    │                   ├── 성공 → 위와 동일
    │                   │
    │                   └── 실패 → [sendMessage("md-download-hint")]
    │                               → 토스트 안내 (8초 표시)
    │
    └── [onChanged 폴백]
        filename 확정 시 .md 확인 → interceptMdDownload() 재호출
```

### 8.2 파일 입력 플로우 (드래그 앤 드롭)

```
[사용자] 파일/URL/텍스트 드래그
    │
    ▼
[onDragEnter] → isDragging = true → 오버레이 표시
    │
    ▼
[onDrop]
    ├── e.dataTransfer.files[0] 존재?
    │   ├── Yes → .md 확인 → readFileAsText → handleFileLoad
    │   └── No ↓
    │
    ├── URL 존재? (text/uri-list 또는 text/plain)
    │   ├── http + .md → fetch(url) → handleFileLoad
    │   └── No ↓
    │
    └── text/plain 존재?
        └── Yes → setContent(text) → View 모드
```

### 8.3 웹 공유 플로우

```
[사용자] 공유 버튼 클릭
    │
    ▼
[handleShare()]
    ├── content 비어있음 or 오프라인? → return
    │
    ├── lastUpload.current?.content === content?
    │   └── Yes → clipboard.writeText(cached URL) → "복사 완료!" 토스트
    │
    └── No (새 콘텐츠)
        │
        ▼
    [FormData 생성] → Blob(content, "text/markdown")
        │
        ▼
    [fetch POST markview-4hy.pages.dev/api/upload]
        │
        ├── 성공 → { slug } → URL 생성 → 캐시 저장 → clipboard 복사 → "복사 완료!"
        │
        └── 실패 → "공유에 실패했습니다" 토스트 (3초)
```

### 8.4 메시지 프로토콜 (Background ↔ Side Panel)

| 메시지 타입 | 방향 | 페이로드 | 설명 |
|-------------|------|----------|------|
| `md-loading` | Background → Panel | — | 콘텐츠 fetch 시작, 로딩 UI 표시 |
| `md-file-downloaded` | Background → Panel | `{ content: string }` | 마크다운 콘텐츠 전달, 렌더링 시작 |
| `md-download-hint` | Background → Panel | — | fetch 실패, 수동 파일 열기 안내 |

---

## 9. 기술 스택 및 의존성

### 9.1 기술 스택

| 카테고리 | 기술 | 버전 |
|----------|------|------|
| Extension 규격 | Chromium Manifest V3 (Chrome + Edge) | 3 |
| UI 프레임워크 | React | 19.0.0 |
| 빌드 도구 | Vite | 6.0.0 |
| 언어 | TypeScript | 5.7.0 |
| 스타일링 | Tailwind CSS | 4.0.0 |
| 마크다운 파서 | react-markdown | 10.1.0 |
| 테스트 | Vitest + Testing Library | 3.0.0 |

### 9.2 의존성 목록

#### 런타임 의존성 (dependencies)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `react` | ^19.0.0 | UI 프레임워크 |
| `react-dom` | ^19.0.0 | React DOM 렌더링 |
| `react-markdown` | ^10.1.0 | 마크다운 → React 컴포넌트 변환 |
| `remark-gfm` | ^4.0.1 | GFM 문법 지원 |
| `remark-math` | ^6.0.0 | 수식 파싱 |
| `rehype-highlight` | ^7.0.2 | 코드 구문 강조 |
| `rehype-katex` | ^7.0.1 | LaTeX 수식 렌더링 |
| `rehype-sanitize` | ^6.0.0 | HTML 새니타이징 |
| `highlight.js` | ^11.11.1 | 구문 강조 엔진 |
| `katex` | ^0.16.22 | LaTeX 렌더링 엔진 |
| `mermaid` | ^11.13.0 | 다이어그램 렌더링 |

#### 개발 의존성 (devDependencies)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `vite` | ^6.0.0 | 빌드 도구 |
| `@vitejs/plugin-react` | ^4.4.1 | React Vite 플러그인 |
| `typescript` | ^5.7.0 | TypeScript 컴파일러 |
| `@types/chrome` | ^0.1.38 | Chrome API 타입 정의 |
| `@types/react` | ^19.0.0 | React 타입 정의 |
| `@types/react-dom` | ^19.0.0 | React DOM 타입 정의 |
| `tailwindcss` | ^4.0.0 | CSS 프레임워크 |
| `@tailwindcss/vite` | ^4.0.0 | Tailwind Vite 플러그인 |
| `vitest` | ^3.0.0 | 테스트 프레임워크 |
| `@testing-library/react` | ^16.0.0 | React 컴포넌트 테스트 |
| `@testing-library/jest-dom` | ^6.0.0 | DOM 매처 |
| `jsdom` | ^25.0.0 | DOM 시뮬레이션 |

---

## 10. 빌드 및 배포 가이드

### 10.1 개발 환경 설정

```bash
# 프로젝트 루트에서 extension 디렉토리로 이동
cd extension

# 의존성 설치
npm install

# 개발 서버 실행 (핫 리로드)
npm run dev
```

### 10.2 빌드

```bash
# 프로덕션 빌드
npm run build
```

**빌드 파이프라인**:

1. `tsc` — TypeScript 타입 체크
2. `vite build` — 번들링 및 최적화
3. `cp manifest.json dist/` — 매니페스트 복사
4. 후처리 스크립트 — `crossorigin` 속성 제거, `type="module"` → `defer` 변환 (MV3 CSP 준수)

**빌드 결과물** (`dist/`):

```
dist/
├── manifest.json
├── sidepanel.html
├── background.js
├── src/
│   └── mermaid-sandbox.html
├── assets/
│   ├── *.js (번들)
│   └── *.css (스타일)
└── (아이콘, 로고 등 정적 에셋)
```

### 10.3 브라우저 로드 (개발용)

**Chrome:**
1. `chrome://extensions` 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `extension/dist` 폴더 선택

**Edge:**
1. `edge://extensions` 접속
2. "개발자 모드" 활성화
3. "압축 풀린 항목 로드" 클릭
4. 동일한 `extension/dist` 폴더 선택

> 동일한 빌드 결과물(`dist/`)을 Chrome과 Edge에서 각각 로드할 수 있습니다.

### 10.4 스토어 배포

**Chrome Web Store:**
1. `dist/` 폴더를 zip으로 압축
2. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 접속
3. 새 항목 추가 → zip 업로드
4. 스토어 등록 정보 작성 (설명, 스크린샷, 카테고리)
5. 심사 제출

**Microsoft Edge Add-ons:**
1. 동일한 zip 파일 사용 (별도 빌드 불필요)
2. [Edge Add-ons Developer Dashboard](https://partner.microsoft.com/dashboard/microsoftedge) 접속
3. 새 확장 추가 → zip 업로드
4. 스토어 등록 정보 작성
5. 심사 제출

### 10.5 테스트 실행

```bash
# 단위 테스트 실행
npm run test

# 감시 모드
npm run test:watch
```

---

## 11. 테스트 명세서

### 11.1 테스트 환경

| 항목 | 설정 |
|------|------|
| 프레임워크 | Vitest 3.0 |
| DOM 환경 | jsdom 25.0 |
| 컴포넌트 테스트 | @testing-library/react 16.0 |
| 매처 | @testing-library/jest-dom 6.0 |

### 11.2 테스트 파일 목록

| 파일 | 대상 컴포넌트 | 테스트 범위 |
|------|--------------|------------|
| `__tests__/ExtensionApp.test.tsx` | ExtensionApp | 홈 화면 렌더링, 모드 전환, 파일 로드, 드래그 앤 드롭 |
| `__tests__/FileOpenButton.test.tsx` | FileOpenButton | 파일 선택 트리거, FileReader 콜백, variant 렌더링 |
| `__tests__/ThemeToggle.test.tsx` | ThemeToggle | 테마 전환, localStorage 저장, 초기 상태 |
| `__tests__/setup.ts` | — | 테스트 환경 초기화, Chrome API 모킹 |

### 11.3 테스트 시나리오

#### ExtensionApp

| TC-ID | 시나리오 | 검증 항목 |
|-------|----------|-----------|
| TC-01 | 빈 상태 홈 화면 렌더링 | 히어로 텍스트, 파일 열기 버튼, 안내 문구 표시 |
| TC-02 | 파일 로드 후 View 모드 전환 | content 설정, View 모드 자동 전환 |
| TC-03 | View ↔ Edit 모드 전환 | 토글 버튼 클릭 시 모드 변경, 해당 UI 표시 |
| TC-04 | .md 파일 드래그 앤 드롭 | 파일 읽기, content 설정, View 모드 전환 |
| TC-05 | URL 드래그 앤 드롭 | .md URL fetch, content 설정 |
| TC-06 | 텍스트 붙여넣기 | Ctrl+V 텍스트 입력, content 설정 |
| TC-07 | 다운로드 인터셉트 메시지 수신 | `md-file-downloaded` → content 표시 |
| TC-08 | 인터셉트 실패 힌트 표시 | `md-download-hint` → 토스트 표시 |

#### FileOpenButton

| TC-ID | 시나리오 | 검증 항목 |
|-------|----------|-----------|
| TC-09 | icon variant 렌더링 | 아이콘 버튼 표시 |
| TC-10 | button variant 렌더링 | ".md 파일 열기" 텍스트 버튼 표시 |
| TC-11 | 파일 선택 | onFileLoad 콜백 호출, content/filename 전달 |

#### ThemeToggle

| TC-ID | 시나리오 | 검증 항목 |
|-------|----------|-----------|
| TC-12 | 초기 테마 감지 | OS 설정 또는 localStorage 값 적용 |
| TC-13 | 테마 전환 | 클릭 시 data-theme 속성 변경 |
| TC-14 | localStorage 저장 | 전환된 테마 값 저장 확인 |

---

## 12. 보안 및 권한 명세서

### 12.1 요청 권한

| 권한 | 용도 | 필수 여부 |
|------|------|-----------|
| `sidePanel` | 사이드 패널 UI 표시 | 필수 |
| `storage` | 테마 설정 등 로컬 저장 | 필수 |
| `downloads` | .md 파일 다운로드 감지 및 인터셉트 | 필수 |
| `scripting` | 활성 탭에서 스크립트 실행 (인증 포함 fetch) | 필수 |
| `activeTab` | 현재 활성 탭 정보 접근 | 필수 |

### 12.2 호스트 권한

| 패턴 | 용도 |
|------|------|
| `https://markview-4hy.pages.dev/*` | 웹 공유 API 호출 |
| `<all_urls>` | 모든 URL에서 .md 다운로드 인터셉트 (scripting 실행) |

### 12.3 보안 조치

| 항목 | 조치 |
|------|------|
| XSS 방지 | `rehype-sanitize` 커스텀 스키마 — 위험한 HTML 태그/속성 제거, KaTeX/Mermaid SVG만 허용 |
| CSP 준수 | 빌드 후처리로 `crossorigin` 제거, `type="module"` → `defer` 변환 |
| Mermaid 격리 | `sandbox` 페이지에서 Mermaid 렌더링 수행, DOM 조작 격리 |
| 인증 데이터 | `chrome.scripting.executeScript`로 탭 컨텍스트 fetch — 인증 쿠키 자체 저장 안 함 |
| 메모리 관리 | `handledDownloads` Set의 항목을 30초 후 자동 삭제하여 메모리 누수 방지 |

---

## 13. 제약 사항 및 향후 계획

### 13.1 현재 제약 사항

| 항목 | 현황 |
|------|------|
| 브라우저 지원 | Chrome 114+ 및 Edge 114+ (Chromium 기반 Side Panel API 지원 브라우저) |
| 파일 크기 | 웹 공유 시 512KB 제한 (Markview 웹 서비스 제약) |
| 오프라인 | 렌더링은 가능하나 웹 공유 불가 |
| 이미지 | 외부 URL 이미지만 표시 가능, 로컬 이미지 미지원 |
| Edit 모드 | Split View 없이 단일 textarea (웹 앱과 차이) |
| TOC | 사이드 패널 크기 제약으로 목차(TOC) 사이드바 미제공 |
| 인터셉트 | 인증이 필요한 사이트에서 fetch 실패 가능성 존재 |

### 13.2 향후 개선 계획

| 우선순위 | 항목 | 설명 |
|----------|------|------|
| P1 | Split View 편집 | Edit 모드에서 에디터 + 실시간 프리뷰 분할 |
| P1 | Chrome Web Store / Edge Add-ons 정식 출시 | 양 스토어 등록 및 배포 자동화 |
| P2 | Firefox 지원 | WebExtension API 기반 비-Chromium 브라우저 지원 |
| P2 | 오프라인 공유 | Service Worker 캐싱으로 오프라인 렌더링 강화 |
| P3 | 문서 히스토리 | 최근 열람한 문서 목록 로컬 저장 |
| P3 | 커스텀 테마 | 사용자 정의 렌더링 테마 선택 |

---

## 부록 A. 파일 목록 및 코드 라인 수

| 파일 | 역할 | 비고 |
|------|------|------|
| `manifest.json` | 확장 프로그램 매니페스트 | MV3 |
| `package.json` | 의존성 및 스크립트 | |
| `vite.config.ts` | Vite 빌드 설정 | |
| `tsconfig.json` | TypeScript 설정 | |
| `sidepanel.html` | 사이드 패널 HTML | |
| `src/background.ts` | 서비스 워커 | 117줄 |
| `src/main.tsx` | React 엔트리 포인트 | |
| `src/components/ExtensionApp.tsx` | 메인 UI 컴포넌트 | 404줄 |
| `src/components/MarkdownRenderer.tsx` | 마크다운 렌더링 | |
| `src/components/MermaidBlock.tsx` | Mermaid 다이어그램 | |
| `src/components/ExportButton.tsx` | Export 기능 | |
| `src/components/ShareButton.tsx` | 웹 공유 | 131줄 |
| `src/components/FileOpenButton.tsx` | 파일 열기 | 71줄 |
| `src/components/ThemeToggle.tsx` | 테마 전환 | |
| `src/mermaid-sandbox.html` | Mermaid 격리 컨텍스트 | |
| `src/styles/globals.css` | 글로벌 스타일 | |
| `src/__tests__/ExtensionApp.test.tsx` | ExtensionApp 테스트 | |
| `src/__tests__/FileOpenButton.test.tsx` | FileOpenButton 테스트 | |
| `src/__tests__/ThemeToggle.test.tsx` | ThemeToggle 테스트 | |
| `src/__tests__/setup.ts` | 테스트 환경 설정 | |

---

## 부록 B. 용어 정의

| 용어 | 설명 |
|------|------|
| MV3 | Chrome Extension Manifest Version 3 |
| Side Panel | Chrome 114+에서 지원하는 브라우저 우측 패널 UI |
| Service Worker | MV3의 백그라운드 실행 환경 (기존 background page 대체) |
| GFM | GitHub Flavored Markdown |
| KaTeX | JavaScript 기반 LaTeX 수식 렌더링 라이브러리 |
| Mermaid | 텍스트 기반 다이어그램 렌더링 라이브러리 |
| Slug | URL에 사용되는 8자리 고유 식별자 |
| CSP | Content Security Policy |
| FOUC | Flash of Unstyled Content |
