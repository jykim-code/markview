# Deep Interview Spec: 로컬 .md 파일 더블클릭 → markview 자동 렌더링

## Metadata
- Interview ID: di-markview-local-md
- Rounds: 6
- Final Ambiguity Score: 19.3%
- Type: brownfield
- Generated: 2026-04-07
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 35% | 0.333 |
| Constraint Clarity | 0.70 | 25% | 0.175 |
| Success Criteria | 0.75 | 25% | 0.188 |
| Context Clarity | 0.75 | 15% | 0.113 |
| **Total Clarity** | | | **0.808** |
| **Ambiguity** | | | **19.3%** |

## Goal
Windows 파일 탐색기에서 로컬 .md 파일을 더블클릭하면, Chrome/Edge 브라우저가 열리면서 markview 웹서비스(markview-4hy.pages.dev)에서 풀페이지로 렌더링된 마크다운을 보여준다. PDF를 더블클릭하면 브라우저에서 바로 보이는 것과 동일한 UX.

## 구현 접근 방식
기존 markview 웹앱의 모든 기능(렌더링, TOC, 스플릿 에디터, 편집)을 그대로 활용한다. Chrome 확장 프로그램이 로컬 .md 파일의 file:// URL을 감지하여 내용을 읽고, markview API에 업로드한 후 /v/slug 페이지로 리디렉션한다.

### 사용자 플로우
1. 사용자가 Chrome/Edge를 .md 파일의 기본 앱으로 설정 (1회성 OS 설정)
2. 사용자가 markview 확장 프로그램 설정에서 "파일 URL에 대한 액세스 허용" 활성화 (1회성)
3. 파일 탐색기에서 .md 파일 더블클릭
4. Chrome/Edge가 file:///C:/path/to/file.md 로 열림
5. 확장 프로그램이 file:// URL + .md 확장자 감지
6. 확장 프로그램이 fetch()로 파일 내용 읽기
7. markview API (/api/upload)에 업로드
8. 브라우저 탭을 /v/slug 페이지로 리디렉션
9. 사용자는 markview의 전체 기능 (렌더링, TOC, 편집) 사용 가능

## Constraints
- Chrome + Edge (Chromium 기반) 브라우저만 지원
- Chrome 확장 프로그램(MV3) 기반으로 구현
- 확장 프로그램에 "파일 URL 액세스 허용" 권한 필요 (사용자 수동 설정)
- 로컬 파일 내용이 markview 클라우드(Cloudflare D1)에 업로드됨 (사용자 동의)
- 기존 업로드 제한 유지: .md 확장자만, 최대 512KB

## Non-Goals
- Firefox 등 비-Chromium 브라우저 지원
- 로컬에서만 처리하는 오프라인 렌더링 (클라우드 업로드 없이)
- 네이티브 앱이나 프로토콜 핸들러(markdown://) 구현
- 사이드패널 렌더링 (풀페이지 탭 방식만)

## Acceptance Criteria
- [ ] Windows 탐색기에서 .md 파일 더블클릭 시 Chrome/Edge에서 markview 렌더링 페이지가 열림
- [ ] 렌더링 결과에 GFM, 코드 하이라이트, mermaid, 수식(KaTeX)이 정상 표시됨
- [ ] TOC(목차) 네비게이션이 동작함
- [ ] 스플릿 에디터로 편집 가능
- [ ] file:// URL이 아닌 일반 웹 탐색에는 영향 없음
- [ ] .md/.markdown 확장자만 가로채고 다른 파일은 무시
- [ ] 파일 URL 액세스 권한이 없을 때 안내 메시지 표시

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 편집+저장이 V1에 필수 | 기술적 난이도 (File System Access API 제한) | 기존 markview 웹서비스를 활용하면 편집 기능이 자동으로 포함됨 |
| 확장 프로그램 내에서 렌더링해야 함 | 클라우드 업로드 vs 클라이언트 전용 | 클라우드 업로드 OK → 기존 웹앱 100% 재활용 |
| 로컬 파일 프라이버시 | 파일 내용이 외부로 나감 | 사용자가 허용함 |

## Technical Context

### 기존 코드베이스 활용
- **background.ts**: 이미 다운로드 가로채기 로직 존재 → file:// URL 감지 로직 추가
- **/api/upload**: 기존 업로드 API 그대로 활용
- **MarkdownRenderer.tsx**: 변경 불필요 (기존 렌더링 파이프라인 사용)
- **manifest.json**: file:// URL 접근을 위한 권한은 이미 `<all_urls>` host_permissions에 포함

### 핵심 구현 포인트
1. `extension/src/background.ts`에 `chrome.tabs.onUpdated` 리스너 추가
2. `file://` 스킴 + `.md`/`.markdown` 확장자 매칭
3. `fetch(fileUrl)`로 로컬 파일 내용 읽기
4. markview API에 POST 업로드
5. `chrome.tabs.update(tabId, { url: slugUrl })`로 리디렉션
6. 파일 URL 권한 미설정 시 안내 페이지/메시지 표시

### 수정 대상 파일
- `extension/src/background.ts` — file:// URL 감지 + 업로드 + 리디렉션 로직
- `extension/manifest.json` — 필요 시 권한 추가 확인

## Interview Transcript
<details>
<summary>Full Q&A (6 rounds)</summary>

### Round 1
**Q:** "로컬 md 파일을 열면 바로 markview에서 보인다"에서, 구체적으로 어떤 사용자 동작을 상상하고 계신가요?
**A:** 파일 탐색기에서 .md 더블클릭
**Ambiguity:** 64.5% (Goal: 0.70, Constraints: 0.10, Criteria: 0.10, Context: 0.40)

### Round 2
**Q:** 파일 탐색기에서 .md 더블클릭 시, 브라우저에서 어떻게 보여야 하나요?
**A:** 브라우저 탭 풀페이지 (PDF처럼)
**Ambiguity:** 54% (Goal: 0.85, Constraints: 0.20, Criteria: 0.15, Context: 0.50)

### Round 3
**Q:** 이 기능의 대상 환경은 Chrome 브라우저만으로 한정하나요?
**A:** Chrome + Edge
**Ambiguity:** 46.5% (Goal: 0.85, Constraints: 0.50, Criteria: 0.15, Context: 0.50)

### Round 4
**Q:** 완성된 기능을 보여드릴 때, 어떤 것들이 되어야 '성공'이라고 할 수 있나요?
**A:** 렌더링 + TOC + 편집
**Ambiguity:** 32.8% (Goal: 0.90, Constraints: 0.50, Criteria: 0.60, Context: 0.55)

### Round 5 (Contrarian Mode)
**Q:** 편집+저장이 1차 버전에 필수인가요?
**A:** 브라우저에서 markview 서비스로 보여주면 추가 구현 필요없는 거 아니야?
**Ambiguity:** 33.8% (Goal: 0.85, Constraints: 0.45, Criteria: 0.65, Context: 0.60)

### Round 6
**Q:** 로컬 파일 내용이 클라우드에 업로드되는 것이 괜찮은가요?
**A:** 클라우드 업로드 OK
**Ambiguity:** 19.3% (Goal: 0.95, Constraints: 0.70, Criteria: 0.75, Context: 0.75)

</details>
