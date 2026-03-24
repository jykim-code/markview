import Image from "next/image";
import { UploadZone } from "@/components/UploadZone";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 flex h-[66px] items-center justify-between bg-bg px-8 transition-colors duration-300" style={{ borderBottom: '1px solid var(--header-border)' }}>
        <a href="/">
          <Image src="/markview_text_icon.svg" alt="Markview" width={200} height={56} priority className="h-7 w-auto logo-light" />
          <Image src="/markview_text_icon_dark.svg" alt="Markview" width={200} height={56} priority className="h-7 w-auto logo-dark" />
        </a>
        <nav className="flex items-center gap-4 md:gap-6">
          <a href="/" className="text-xs font-semibold uppercase tracking-wider text-navy">Home</a>
          <a href="/about" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">About</a>
          <a href="/privacy" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">Privacy</a>
          <a href="/contact" className="text-xs font-semibold uppercase tracking-wider text-navy/50 hover:text-navy">Contact</a>
          <ThemeToggle />
        </nav>
      </header>

      {/* Hero Section - cream bg, responsive */}
      <section className="flex min-h-[calc(100vh-66px)] flex-col items-center justify-center gap-8 overflow-hidden bg-cream px-6 py-12 transition-colors duration-300 md:flex-row md:gap-12 md:px-16 md:py-16">
        {/* Left: Big text */}
        <div className="max-w-[480px] flex-1 animate-fade-in text-center md:text-left">
          <h1
            className="font-montserrat text-navy"
            style={{
              fontSize: "clamp(32px, 6vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
            }}
          >
            마크다운을
            <br />
            사람이 읽기 편한
            <br />
            형태로.
          </h1>
          <p className="mt-6 text-base font-medium leading-[1.8] text-navy/50">
            AI가 만든 마크다운 파일을 업로드하면,
            <br />
            누구나 읽기 편한 웹 문서로 변환하고
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
            "GFM",
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
          AI가 만든 마크다운을 사람이 읽기 편한 형태로 아름답게 렌더링합니다.
          <br />
          코드 블록, 수식, 다이어그램까지 — 실시간 편집, Export, URL 공유까지 한 곳에서.
        </p>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-4 border-t border-navy/[0.06] px-6 py-6 md:flex-row md:justify-between md:px-16">
        <div className="flex gap-5">
          <a href="/about" className="text-[11px] font-semibold text-navy/35 hover:text-navy">About</a>
          <a href="/privacy" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Privacy</a>
          <a href="/contact" className="text-[11px] font-semibold text-navy/35 hover:text-navy">Contact</a>
        </div>
        <span className="text-[10px] uppercase tracking-[3px] text-navy/50">
          Markview — Markdown + View
        </span>
      </footer>
    </main>
  );
}
