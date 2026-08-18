import { UploadZone } from "@/components/UploadZone";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <SiteHeader active="home" />

      {/* Hero Section - cream bg, responsive */}
      <section className="flex min-h-[calc(100vh-66px)] flex-col items-center justify-center gap-8 overflow-hidden bg-cream px-6 py-12 transition-colors duration-300 md:flex-row md:gap-12 md:px-16 md:py-16">
        {/* Left: Big text */}
        <div className="max-w-[480px] flex-1 animate-fade-in text-center md:text-left">
          <h1
            className="text-navy"
            style={{
              fontSize: "clamp(32px, 6vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              // Korean wraps per-character by default, which can split a word
              // like 형태로 across lines; keep-all wraps at word boundaries.
              wordBreak: "keep-all",
              // Montserrat is deliberately skipped here. It has no Hangul, so
              // in this Korean headline only the Latin letters ("AI") would
              // take its wide geometric ExtraBold while the rest falls back to
              // the system Korean font. Going straight to the system stack
              // keeps every glyph in one visual family.
              fontFamily:
                'system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
            }}
          >
            AI가 생성한 파일을 사람이 읽기 편한 형태로.
          </h1>
          <p className="mt-6 text-base font-medium leading-[1.8] text-navy/50">
            AI가 만든 마크다운·HTML 파일을 업로드하면,
            <br />
            누구나 읽기 편한 웹 문서로 보여주고
            <br />
            링크 하나로 바로 공유할 수 있습니다.
          </p>
        </div>

        {/* Right: Upload card */}
        <div className="w-full max-w-[440px] flex-1 animate-fade-in-delay">
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-bg p-8 text-center shadow-[var(--shadow-card)] md:p-12">
            <UploadZone />
          </div>
        </div>
      </section>

      {/* What We Support Section */}
      <section className="border-b border-navy/[0.06] px-6 py-12 md:px-16 md:py-20">
        <div className="mb-10 text-[11px] font-bold uppercase tracking-[3px] text-navy/40">
          What We Support
        </div>
        <div className="mb-12 flex flex-wrap gap-2">
          {[
            "Markdown (GFM)",
            "Interactive HTML",
            "Syntax Highlighting",
            "Table of Contents",
            "LaTeX Math",
            "Mermaid Diagrams",
            "Checklist",
            "Image",
            "Blockquote",
            "Live Editor",
            "Export (MD / HTML / PDF)",
            "URL Share",
            "My Docs",
            "One-step Revert",
            "Text Size (A− / A+)",
            "Dark Mode",
          ].map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full border border-navy/15 px-5 py-2 text-[13px] font-medium text-navy"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="max-w-[600px] text-[15px] leading-relaxed text-navy/50">
          AI가 만든 마크다운과 HTML을 사람이 읽기 편한 형태로 렌더링합니다.
          <br />
          코드 블록, 수식, 다이어그램은 물론 실시간 편집, Export, URL 공유까지 한 곳에서 해결됩니다.
          <br />
          내 문서 목록, 되돌리기, 글자 크기 조절로 읽고 관리하기도 편합니다.
        </p>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-4 border-t border-navy/[0.06] px-6 py-6 md:flex-row md:justify-between md:px-16">
        <div className="flex gap-5">
          <Link href="/about" className="text-[11px] font-semibold text-navy/35 hover:text-navy">About</Link>
          <Link href="/privacy" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Privacy</Link>
          <Link href="/contact" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Contact</Link>
        </div>
        <span className="text-[10px] uppercase tracking-[3px] text-navy/50">
          Markview — Markdown + View
        </span>
      </footer>
    </main>
  );
}
