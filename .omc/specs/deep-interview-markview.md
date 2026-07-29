# Deep Interview Spec: Markview

## Metadata
- Interview ID: markview-001
- Rounds: 6
- Final Ambiguity Score: 15.5%
- Type: greenfield
- Generated: 2026-03-18
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.95 | 0.40 | 0.380 |
| Constraint Clarity | 0.75 | 0.30 | 0.225 |
| Success Criteria | 0.80 | 0.30 | 0.240 |
| **Total Clarity** | | | **0.845** |
| **Ambiguity** | | | **15.5%** |

## Goal
누구나 로그인 없이 마크다운(.md) 파일을 업로드하면, 보기 좋게 렌더링된 웹 페이지와 짧은 공유 URL을 즉시 받을 수 있는 공개 웹 서비스.

## Constraints
- Cloudflare Pages로 GitHub 연동 배포
- 서버 저장 방식 (짧은 URL 제공, Cloudflare D1/KV 활용)
- 인증 없음 — 누구나 업로드 가능 (Pastebin 스타일)
- 포인트 컬러: #FFF7E6 (크림), #0A122A (네이비)
- 확장 마크다운 렌더링: GFM + Syntax Highlighting + TOC + LaTeX + Mermaid

## Non-Goals
- 관리자 로그인 / 대시보드
- 폴더, 태그, 검색, 필터
- 문서 비밀번호 잠금
- 이미지 자동 S3 업로드
- 단축 URL / QR 코드 별도 기능
- 외부 콘텐츠 크래퍼 (YouTube, LinkedIn, Threads)
- 배치 업로드 / API 업로드
- 다크/라이트 모드 전환

## Acceptance Criteria
- [ ] MD 파일 업로드 시 렌더링된 페이지와 공유 URL이 생성된다
- [ ] 공유 URL로 누구나 렌더링된 문서를 열람할 수 있다
- [ ] GFM, 코드 구문 강조, TOC, LaTeX 수식, Mermaid 다이어그램이 렌더링된다
- [ ] 포인트 컬러 #FFF7E6, #0A122A가 적용된 미려한 디자인
- [ ] Cloudflare Pages에 실제 배포되어 외부 접속 가능

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 저장소가 필요하다 | URL 인코딩으로 서버리스 가능하지 않은가? | 사용자가 짧은 URL을 선호하여 서버 저장 확정 |
| 관리자 인증이 필요하다 | MVP에서 로그인이 꼭 필요한가? | 누구나 업로드 가능한 공개 서비스로 결정 |
| 기획서의 P1 기능 전체가 MVP | 정말 전부 필요한가? | 업로드 → 뷰 → URL 복사만으로 축소 |

## Technical Context
- Framework: Next.js (Cloudflare Pages 호환)
- Deploy: GitHub → Cloudflare Pages 자동 배포
- Storage: Cloudflare D1 (SQLite) 또는 KV
- Rendering: react-markdown / unified 계열 + remark-gfm, rehype-highlight, remark-math, mermaid

## Ontology (Key Entities)
| Entity | Fields | Relationships |
|--------|--------|---------------|
| Document | id, slug, content, title, created_at | 1:1 URL |
| SharedURL | slug, document_id | 1:1 Document |

## Interview Transcript
<details>
<summary>Full Q&A (6 rounds)</summary>

### Round 1
**Q:** Markview MVP에서 사용자의 핵심 플로우는?
**A:** 업로드 → 뷰 → URL 복사만
**Ambiguity:** 57% (Goal: 0.7, Constraints: 0.3, Criteria: 0.2)

### Round 2
**Q:** 누구나 업로드 가능한 공개 서비스인가, 관리자만 업로드하는 구조인가?
**A:** 누구나 업로드 가능
**Ambiguity:** 48% (Goal: 0.85, Constraints: 0.35, Criteria: 0.25)

### Round 3
**Q:** 기술 스택은?
**A:** GitHub 연결된 소스코드를 Cloudflare에서 바로 배포
**Ambiguity:** 39% (Goal: 0.85, Constraints: 0.6, Criteria: 0.3)

### Round 4 (Contrarian Mode)
**Q:** 저장 없이 URL 인코딩 방식 vs 서버 저장?
**A:** 서버 저장 (짧은 URL)
**Ambiguity:** 33% (Goal: 0.9, Constraints: 0.7, Criteria: 0.35)

### Round 5
**Q:** MVP 완료 기준은?
**A:** 기능 동작 + 디자인 품질 + 실제 배포 (3가지 모두)
**Ambiguity:** 20% (Goal: 0.95, Constraints: 0.7, Criteria: 0.7)

### Round 6
**Q:** 마크다운 렌더링 범위는?
**A:** 확장 마크다운 (GFM + 코드강조 + TOC + LaTeX + Mermaid)
**Ambiguity:** 15.5% (Goal: 0.95, Constraints: 0.75, Criteria: 0.8)

</details>
