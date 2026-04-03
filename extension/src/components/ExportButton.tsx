import { useState, useRef, useEffect } from "react";

interface ExportButtonProps {
  content: string;
  title: string;
}

export function ExportButton({ content, title }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportMarkdown() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    downloadFile(blob, `${title}.md`);
  }

  function exportHTML() {
    const previewEl = document.querySelector(".prose");
    const htmlContent = previewEl?.innerHTML || content;
    // Inline CSS — no external CDN dependencies for offline support
    const fullHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body { font-family: 'Montserrat', system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #0A122A; line-height: 1.75; }
h1,h2,h3,h4,h5,h6 { font-weight: 700; line-height: 1.3; }
h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #0A122A1A; }
h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
p { margin-top: 0.75rem; margin-bottom: 0.75rem; }
a { color: #0A122A; text-decoration: underline; }
pre { background: #0A122A08; border: 1px solid #0A122A0D; border-radius: 0.75rem; padding: 1rem; overflow-x: auto; }
code { font-size: 0.875rem; font-family: 'Fira Code', monospace; }
table { width: 100%; border-collapse: collapse; }
th { background: #0A122A08; border: 1px solid #0A122A1A; padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; }
td { border: 1px solid #0A122A1A; padding: 0.5rem 0.75rem; }
blockquote { border-left: 3px solid #0A122A33; padding-left: 1rem; color: #0A122A99; font-style: italic; }
ul { list-style-type: disc; padding-left: 1.5rem; }
ol { list-style-type: decimal; padding-left: 1.5rem; }
li { margin-top: 0.25rem; margin-bottom: 0.25rem; }
hr { border-color: #0A122A1A; margin-top: 2rem; margin-bottom: 2rem; }
img { border-radius: 0.5rem; max-width: 100%; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
    downloadFile(blob, `${title}.html`);
  }

  function exportPDF() {
    setOpen(false);
    window.print();
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/[0.06]"
        aria-label="Export"
        title="내보내기"
      >
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[140px] rounded-xl border border-navy/10 bg-bg p-1 shadow-[var(--shadow-card)]">
          <button
            onClick={exportMarkdown}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-navy transition-colors hover:bg-navy/[0.04]"
          >
            Markdown
            <span className="ml-auto text-[10px] text-navy/50">.md</span>
          </button>
          <button
            onClick={exportHTML}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-navy transition-colors hover:bg-navy/[0.04]"
          >
            HTML
            <span className="ml-auto text-[10px] text-navy/50">.html</span>
          </button>
          <button
            onClick={exportPDF}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-navy transition-colors hover:bg-navy/[0.04]"
          >
            PDF
            <span className="ml-auto text-[10px] text-navy/50">.pdf</span>
          </button>
        </div>
      )}
    </div>
  );
}
