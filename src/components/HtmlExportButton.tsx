"use client";

import { useState, useRef, useEffect } from "react";

interface HtmlExportButtonProps {
  content: string;
  title: string;
}

export function HtmlExportButton({ content, title }: HtmlExportButtonProps) {
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

  function safeName(ext: string) {
    const base = (title || "document").replace(/[\\/:*?"<>|]/g, "_").trim();
    return `${base || "document"}.${ext}`;
  }

  function exportHtml() {
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeName("html");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportPDF() {
    setOpen(false);

    // Print the HTML inside a hidden, sandboxed iframe rather than window.open +
    // document.write. Two problems with the old approach produced blank PDFs:
    //   1. `win.onload = print` clobbered the document's own onload handler, so
    //      JS-rendered content never appeared.
    //   2. AI artifacts commonly hide content with `opacity:0` and reveal it on
    //      scroll (IntersectionObserver), which never fires while printing.
    // Fixes: srcdoc loads the document normally (scripts/onload fire intact); we
    // inject a print-only stylesheet that forces hidden/animated content visible;
    // and an auto-print script that runs after load. The iframe keeps
    // `allow-scripts` WITHOUT `allow-same-origin`, so origin isolation holds and
    // `allow-modals` lets the sandboxed document open the print dialog itself.
    const forceVisible =
      '<style media="print">*,*::before,*::after{opacity:1!important;visibility:visible!important;animation:none!important;transition:none!important;}html,body{height:auto!important;overflow:visible!important;}</style>';
    const autoPrint =
      "<script>(function(){function p(){try{window.focus();window.print();}catch(e){}}" +
      "if(document.readyState==='complete'){setTimeout(p,500);}" +
      "else{window.addEventListener('load',function(){setTimeout(p,500);});}})();<\/script>";

    let html = content;
    html = /<\/head>/i.test(html)
      ? html.replace(/<\/head>/i, forceVisible + "</head>")
      : forceVisible + html;
    html = /<\/body>/i.test(html)
      ? html.replace(/<\/body>/i, autoPrint + "</body>")
      : html + autoPrint;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts allow-modals");
    iframe.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1024px;height:1400px;border:0;";
    iframe.srcdoc = html;
    document.body.appendChild(iframe);

    // Remove the iframe well after the print dialog has had time to open.
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        /* already removed */
      }
    }, 120000);
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-navy/15 bg-bg px-4 py-2 text-xs font-semibold text-navy transition-all hover:border-navy/30"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[180px] rounded-xl border border-navy/10 bg-bg p-1.5 shadow-[var(--shadow-card)]">
          <button
            onClick={exportHtml}
            className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] font-medium text-navy transition-colors hover:bg-navy/[0.04]"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            HTML
            <span className="ml-auto text-[11px] text-navy/50">.html</span>
          </button>
          <button
            onClick={exportPDF}
            className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] font-medium text-navy transition-colors hover:bg-navy/[0.04]"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            PDF
            <span className="ml-auto text-[11px] text-navy/50">인쇄</span>
          </button>
        </div>
      )}
    </div>
  );
}
