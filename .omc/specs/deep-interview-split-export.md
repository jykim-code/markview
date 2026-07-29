# Deep Interview Spec: Split View + Export

## Metadata
- Interview ID: markview-split-export
- Rounds: 2
- Final Ambiguity Score: 15%
- Type: brownfield
- Generated: 2026-03-18
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 0.35 | 0.33 |
| Constraint Clarity | 0.80 | 0.25 | 0.20 |
| Success Criteria | 0.80 | 0.25 | 0.20 |
| Context Clarity | 0.80 | 0.15 | 0.12 |
| **Total Clarity** | | | **0.85** |
| **Ambiguity** | | | **15%** |

## Goal
Markview 뷰 페이지에 Split 뷰(마크다운 편집 + 실시간 미리보기)와 Export(MD/HTML/PDF) 기능을 추가한다.

## Features

### Feature 1: Split View (편집 모드)
- 업로드 직후 `/v/{slug}` 페이지에서 Split 뷰 제공
- 좌측: 마크다운 원본 텍스트 에디터 (textarea 또는 코드 에디터)
- 우측: 실시간 렌더링 미리보기 (기존 MarkdownRenderer 재활용)
- 편집 시 우측 미리보기가 실시간으로 업데이트
- **저장 버튼**: 편집한 내용을 DB에 업데이트 (PUT /api/documents/{slug})
- 저장 후 공유 URL에도 변경 내용 반영

### Feature 2: View Mode (공유 뷰어) — 기존 유지
- 공유 URL로 접속한 사용자는 렌더링된 문서만 볼 수 있음
- 편집 불가
- 공유하기 버튼 유지

### Feature 3: Export
- 뷰 페이지 헤더에 Export 드롭다운 버튼 추가
- Markdown (.md): 원본 마크다운 텍스트를 .md 파일로 다운로드
- HTML: 렌더링된 HTML을 스타일 포함하여 .html 파일로 다운로드
- PDF: 렌더링된 문서를 PDF로 다운로드 (html2pdf.js 또는 유사 라이브러리)

## Constraints
- 기존 페이지 구조(`/v/{slug}`)를 유지하면서 Split/View 모드 전환
- Split 뷰는 업로드 직후에만 활성화 (편집자 = 업로드한 사람)
- 공유 URL은 기존처럼 렌더링 전용
- Cloudflare D1 스토리지 활용 (기존 구조)
- 디자인: 확정된 Markview 스타일 가이드 따름 (Montserrat, #FFF7E6/#0A122A)

## Non-Goals
- 실시간 협업 편집 (Google Docs 스타일)
- 버전 관리 / 편집 히스토리
- 마크다운 에디터 툴바 (볼드, 이탤릭 등 버튼)
- 인증 시스템

## Acceptance Criteria
- [ ] 업로드 직후 `/v/{slug}?edit=true` 형태로 Split 뷰 진입
- [ ] Split 뷰 좌측에 마크다운 원본 표시, 편집 가능
- [ ] 좌측 편집 시 우측 미리보기 실시간 업데이트
- [ ] 저장 버튼 클릭 시 DB 업데이트 (PUT API)
- [ ] 공유 URL (`/v/{slug}`) 접속 시 렌더링 전용 (편집 불가)
- [ ] Export: .md 파일 다운로드 동작
- [ ] Export: .html 파일 다운로드 동작 (스타일 포함)
- [ ] Export: .pdf 파일 다운로드 동작
- [ ] 빌드 성공 (next build)

## Technical Context
- 기존 코드: `src/app/v/[slug]/page.tsx` (뷰 페이지), `src/components/MarkdownRenderer.tsx`
- 새로 필요: `PUT /api/documents/[slug]/route.ts` (업데이트 API)
- 새 컴포넌트: `SplitEditor.tsx`, `ExportButton.tsx`
- PDF 생성: `html2pdf.js` 또는 `jspdf` + `html2canvas`

## Interview Transcript
<details>
<summary>Full Q&A (2 rounds)</summary>

### Round 1
**Q:** Split 뷰는 누가 사용하나요? 업로드한 사람만? 공유 URL 접속자도?
**A:** 공유 링크는 렌더링된 문서만 볼 수 있고 편집자는 split 가능
**Ambiguity:** 20.5%

### Round 2
**Q:** 편집 후 DB에 저장 가능해야 하나요?
**A:** 저장 가능
**Ambiguity:** 15%

</details>
