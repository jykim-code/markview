# Deep Interview Spec: Markview Chrome Extension

## Metadata
- Interview ID: chrome-ext-001
- Rounds: 12
- Final Ambiguity Score: 7%
- Type: brownfield
- Generated: 2026-03-31
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 35% | 0.333 |
| Constraint Clarity | 0.92 | 25% | 0.230 |
| Success Criteria | 0.90 | 25% | 0.225 |
| Context Clarity | 0.93 | 15% | 0.140 |
| **Total Clarity** | | | **0.928** |
| **Ambiguity** | | | **0.072** |

## Goal
크롬 익스텐션 사이드 패널에서 마크다운을 붙여넣거나 .md 파일을 열어 Markview 스타일로 렌더링하고, 편집(Edit/View 토글), 공유(서버 업로드 → URL), 내보내기(HTML/PDF)를 페이지 이동 없이 제공한다.

## V1 (MVP) 기능 범위
1. **마크다운 붙여넣기 → 렌더링**: 사이드패널 텍스트 영역에 마크다운 붙여넣기 → Markview 스타일로 즉시 렌더링
2. **.md 파일 열기**: 드래그앤드롭 또는 파일 선택으로 .md 파일 로드 → 렌더링
3. **Edit/View 토글**: 사이드패널 내 탭 전환 방식 편집 모드 (좌우 분할 대신)
4. **공유 URL 생성**: 공유 버튼 → Markview 서버(Cloudflare)에 업로드 → URL 생성 → 클립보드 복사
5. **내보내기**: HTML 파일 다운로드, PDF (브라우저 인쇄)
6. **마크다운 렌더링 스택**: GFM, 코드 구문 강조, KaTeX(수식), Mermaid(다이어그램) — 지연 로드 방식

## V2 (후속) 기능
- 웹페이지 마크다운 자동 감지 → Markview 스타일 렌더링
- 우클릭 컨텍스트 메뉴 → 선택 텍스트 마크다운 변환
- 추가 UX 개선

## Constraints
- **프로젝트 구조**: 기존 markview 레포 내 `/extension` 폴더 (모노레포)
- **코드 전략**: 기존 렌더링 컴포넌트(MarkdownRenderer 등) import 재사용 + 익스텐션 UI/구조 새로 작성
- **초기 화면**: 빈 에디터 + 플레이스홀더 안내 ("마크다운을 붙여넣거나 파일을 드래그하세요")
- **테마**: 기본은 브라우저 테마(prefers-color-scheme) 따르고, 토글로 수동 전환도 가능
- **API 연동**: 기존 POST /api/upload에 CORS 허용 추가 (익스텐션 전용 엔드포인트 불필요)
- **100% 클라이언트 사이드 렌더링** (오프라인 동작, 서버 부하 없음)
- 공유 URL 생성 시에만 Markview 서버(Cloudflare Workers) 연동
- 크롬 사이드 패널 UI (폭 ~400-500px) — 좌우 분할 에디터 불가, Edit/View 탭 토글 방식
- Mermaid, KaTeX는 **지연 로드** — 해당 문법 감지 시에만 동적 로드 (초기 번들 경량화)
- 기존 Markview 렌더링 로직(MarkdownRenderer, MermaidBlock 등) 최대한 재사용
- Markview 웹사이트와 동일한 테마/스타일 유지 (다크/라이트 모드 포함)

## Non-Goals
- V1에서 웹페이지 마크다운 자동 감지 기능
- V1에서 우클릭 컨텍스트 메뉴
- 사용자 계정/로그인 시스템
- 마크다운 문서 히스토리/저장 관리
- 다른 브라우저(Firefox, Safari) 지원

## Acceptance Criteria
- [ ] 크롬 웹스토어에 등록 가능한 Manifest V3 익스텐션 구조
- [ ] 익스텐션 아이콘 클릭 → 사이드 패널 열림
- [ ] 텍스트 영역에 마크다운 붙여넣기 → 즉시 렌더링 (View 탭)
- [ ] .md 파일 드래그앤드롭 또는 파일 선택 → 내용 로드 및 렌더링
- [ ] Edit/View 탭 토글이 정상 동작
- [ ] GFM(테이블, 체크리스트, 취소선) 렌더링 정상
- [ ] 코드 블록 구문 강조 정상
- [ ] KaTeX 수식 렌더링 정상 (지연 로드)
- [ ] Mermaid 다이어그램 렌더링 정상 (지연 로드)
- [ ] 공유 버튼 → Markview 서버 업로드 → URL 생성 → 클립보드 복사
- [ ] HTML 내보내기 → 스타일 포함 standalone HTML 다운로드
- [ ] PDF 내보내기 → 브라우저 인쇄 다이얼로그
- [ ] 다크/라이트 테마 토글 정상
- [ ] 오프라인 상태에서 렌더링 정상 동작 (공유 제외)
- [ ] 사이드패널 ~400-500px 폭에서 UI 깨짐 없음

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 전 기능 MVP 포함 | 기존 웹과 동일하면 차별화 부족 | V1 핵심(편의성) + V2 고급(감지/우클릭) 분리 |
| 서버 연동 필수 | 오프라인 불가, 서버 부하 | 클라이언트 렌더링 기본, 공유 시에만 서버 |
| 사이드패널 편집 불가 | 공간 부족 | Edit/View 탭 토글로 해결 |
| Mermaid/KaTeX 용량 문제 | 익스텐션 무거워짐 | 지연 로드로 초기 번들 경량화 |

## Technical Context
### 기존 코드베이스에서 재사용 가능한 부분
- `src/components/MarkdownRenderer.tsx` — 마크다운 렌더링 핵심 로직
- `src/components/MermaidBlock.tsx` — Mermaid 다이어그램 렌더링
- `src/components/TableOfContents.tsx` — TOC 생성
- `src/components/ExportButton.tsx` — 내보내기 로직
- `src/components/ThemeToggle.tsx` — 다크/라이트 모드
- `src/app/globals.css` — Markview 스타일 (prose, 테마 변수)

### 익스텐션 기술 스택
- Chrome Extension Manifest V3
- Side Panel API (`chrome.sidePanel`)
- React (기존 컴포넌트 재사용)
- 동일 마크다운 플러그인 스택 (react-markdown, remark-gfm, remark-math, rehype-highlight, rehype-katex, rehype-sanitize)
- Mermaid — 동적 import
- 번들러: Vite 또는 Webpack (익스텐션 빌드용)

### API 연동
- `POST /api/upload` — 공유 URL 생성 시 기존 Markview 서버에 업로드

## Ontology (Key Entities)
| Entity | Fields | Relationships |
|--------|--------|---------------|
| SidePanel | mode(edit/view), content, theme | renders → RenderedOutput |
| MarkdownInput | text, source(paste/file) | feeds → SidePanel |
| RenderedOutput | html, toc | displayed in → SidePanel |
| SharedDocument | slug, url | created via → Markview API |
| ExportedFile | format(html/pdf), content | generated from → RenderedOutput |

## Interview Transcript
<details>
<summary>Full Q&A (7 rounds)</summary>

### Round 1
**Q:** 크롬 익스텐션에서 사용자가 수행하는 핵심 동작은 무엇인가요?
**A:** 웹사이트 이동 없이 현재 보고있는 페이지에서 크롬 익스텐션을 통해 md 텍스트를 복사 붙여넣기하면 우리 서비스를 통해 보여지고, 파일도 넣으면 우리 서비스를 통해서 보여지도록. 확장 프로그램은 오른쪽 패널에 뜨면 될 듯. 이것 포함해서 더 좋은 아이디어 있어?
**Ambiguity:** 66% (Goal: 0.60, Constraints: 0.20, Criteria: 0.10, Context: 0.40)

### Round 2
**Q:** 익스텐션 사이드 패널에서 마크다운을 렌더링한 후, 사용자가 그 결과로 무엇을 할 수 있어야 하나요?
**A:** 수정이 가능한 것까지 하려면 사이드패널 사이즈가 감당가능할까?
**Ambiguity:** 55% (Goal: 0.65, Constraints: 0.30, Criteria: 0.35, Context: 0.40)

### Round 3
**Q:** 마크다운 렌더링을 익스텐션 내부에서 직접 처리할까요, 서버에 업로드할까요?
**A:** 클라이언트 전용 (추천)
**Ambiguity:** 44% (Goal: 0.75, Constraints: 0.55, Criteria: 0.35, Context: 0.50)

### Round 4
**Q:** 1차 버전(MVP)에서 반드시 되어야 하는 기능을 골라주세요.
**A:** 전부 포함
**Ambiguity:** 32% (Goal: 0.85, Constraints: 0.55, Criteria: 0.65, Context: 0.55)

### Round 5 (Contrarian Mode)
**Q:** 기존 Markview 웹사이트와 차별화되는 핵심 가치는?
**A:** 편의성 + 추가 기능 모두
**Ambiguity:** 29% (Goal: 0.90, Constraints: 0.55, Criteria: 0.70, Context: 0.55)

### Round 6
**Q:** Mermaid, KaTeX 등 무거운 의존성을 익스텐션에서 어떻게 처리할까요?
**A:** 전부 지원하면 좋겠는데 익스텐션 용량이 크면 문제가 되는거야? → 지연 로드로 해결
**Ambiguity:** 24% (Goal: 0.92, Constraints: 0.70, Criteria: 0.70, Context: 0.65)

### Round 7 (Simplifier Mode)
**Q:** 우클릭/자동감지를 MVP에 포함할까요, 2차로 미룰까요?
**A:** 핵심 먼저, 추가는 2차 (추천)
**Ambiguity:** 16% (Goal: 0.92, Constraints: 0.80, Criteria: 0.85, Context: 0.70)

### Round 8
**Q:** 크롬 익스텐션의 코드를 기존 markview 레포 안에 함께 둘까요, 별도 레포로 분리할까요?
**A:** 모노레포 (/extension 폴더)
**Ambiguity:** 14% (Goal: 0.92, Constraints: 0.82, Criteria: 0.85, Context: 0.82)

### Round 9
**Q:** 사이드패널을 처음 열었을 때 초기 화면은?
**A:** 빈 에디터 + 안내
**Ambiguity:** 11% (Goal: 0.93, Constraints: 0.85, Criteria: 0.88, Context: 0.85)

### Round 10
**Q:** 익스텐션의 테마(다크/라이트 모드)는 어떻게 동작해야 할까요?
**A:** 둘 다 지원 (브라우저 테마 자동 반영 + 토글 수동 전환)
**Ambiguity:** 10% (Goal: 0.93, Constraints: 0.87, Criteria: 0.90, Context: 0.87)

### Round 11
**Q:** 공유 버튼 호출 시 API CORS 처리 방식은?
**A:** 기존 API에 CORS 추가 (추천)
**Ambiguity:** 9% (Goal: 0.93, Constraints: 0.90, Criteria: 0.90, Context: 0.90)

### Round 12
**Q:** 코드를 기존 컴포넌트 재사용 vs iframe 임베드 vs 완전 새로 작성?
**A:** 컴포넌트 재사용 (기존 렌더링 코드 import + 익스텐션 UI 새로 작성)
**Ambiguity:** 7% (Goal: 0.95, Constraints: 0.92, Criteria: 0.90, Context: 0.93)

</details>
