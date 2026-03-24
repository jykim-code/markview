"use client";

import { useState, useCallback } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableOfContents } from "./TableOfContents";
import { ExportButton } from "./ExportButton";
import { ThemeToggle } from "./ThemeToggle";

type ViewMode = "view" | "edit";

interface SplitEditorProps {
  slug: string;
  title: string;
  initialContent: string;
}

export function SplitEditor({ slug, title, initialContent }: SplitEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<ViewMode>("view");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mdCopied, setMdCopied] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/documents/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [slug, content]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/v/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [slug]);

  const handleCopyMd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const input = document.createElement("textarea");
      input.value = content;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setMdCopied(true);
    setTimeout(() => setMdCopied(false), 2000);
  }, [content]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-[66px] items-center justify-between bg-bg px-8" style={{ borderBottom: '1px solid var(--header-border)' }}>
        <div className="flex items-center gap-4">
          <a href="/" className="transition-opacity hover:opacity-70">
            <img src="/markview_text_icon.svg" alt="Markview" className="h-7 logo-light" />
            <img src="/markview_text_icon_dark.svg" alt="Markview" className="h-7 logo-dark" />
          </a>
          {/* Mode toggle */}
          <div className="flex gap-0.5 rounded-full bg-navy/[0.06] p-[3px]">
            {(["view", "edit"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3.5 py-1.5 font-montserrat text-xs font-semibold transition-all ${
                  mode === m
                    ? "bg-bg text-navy shadow-sm"
                    : "text-navy/50 hover:text-navy/70"
                }`}
              >
                {m === "view" ? "View" : "Edit"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save button - primary (navy) */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-full bg-navy px-5 py-2 text-xs font-semibold text-bg transition-all hover:opacity-85 disabled:opacity-50"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3M7 21v-7h10v7" />
            </svg>
            {saving ? "저장 중..." : saved ? "저장 완료!" : ".md 저장"}
          </button>

          {/* Export */}
          <ExportButton content={content} title={title} />

          {/* Share - secondary (border) */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-navy/15 bg-bg px-4 py-2 text-xs font-semibold text-navy transition-all hover:border-navy/30"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? "복사 완료!" : "공유"}
          </button>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Editor pane */}
        {mode === "edit" && (
          <div data-print-hide className="flex flex-1 flex-col" style={{ borderRight: '1px solid var(--editor-border)' }}>
            <div className="flex items-center justify-between px-5 py-3 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--label-text)', borderBottom: '1px solid var(--label-border)', background: 'var(--label-bg)' }}>
              <span>Markdown</span>
              <button
                onClick={handleCopyMd}
                aria-label="마크다운 복사"
                className="transition-colors hover:text-navy"
                style={{ color: mdCopied ? undefined : 'var(--label-text)' }}
              >
                {mdCopied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                )}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none bg-bg p-5 text-sm leading-relaxed text-navy outline-none transition-colors"
              style={{
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              }}
              spellCheck={false}
            />
          </div>
        )}

        {/* View/Preview pane */}
        {(mode === "edit" || mode === "view") && (
          <div className={`flex flex-col overflow-y-auto ${mode === "edit" ? "flex-1" : "flex-1"}`}>
            {mode === "edit" && (
              <div data-print-hide className="px-5 py-3 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--label-text)', borderBottom: '1px solid var(--label-border)', background: 'var(--label-bg)' }}>
                Preview
              </div>
            )}
            <div className="flex-1 bg-cream p-8">
              {mode === "view" ? (
                <div className="mx-auto max-w-[900px]">
                  <h1 className="mb-8 text-[32px] font-bold tracking-tight text-navy md:text-[40px]" style={{ lineHeight: 1.3 }}>
                    {title}
                  </h1>
                  <div className="flex gap-10">
                    <article className="min-w-0 flex-1">
                      <MarkdownRenderer content={content} />
                    </article>
                    <aside className="hidden w-[180px] shrink-0 lg:block">
                      <div className="sticky top-[100px]">
                        <TableOfContents content={content} />
                      </div>
                    </aside>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={content} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
