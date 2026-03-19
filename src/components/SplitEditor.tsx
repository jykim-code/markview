"use client";

import { useState, useCallback } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableOfContents } from "./TableOfContents";
import { ExportButton } from "./ExportButton";

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

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-[66px] items-center justify-between border-b border-navy bg-white px-8">
        <div className="flex items-center gap-4">
          <a href="/" className="transition-opacity hover:opacity-70">
            <img src="/markview_text_icon.svg" alt="Markview" className="h-7" />
          </a>
          {/* Mode toggle */}
          <div className="flex gap-0.5 rounded-full bg-navy/[0.06] p-[3px]">
            {(["view", "edit"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3.5 py-1.5 font-montserrat text-xs font-semibold transition-all ${
                  mode === m
                    ? "bg-white text-navy shadow-sm"
                    : "text-navy/50 hover:text-navy/70"
                }`}
              >
                {m === "view" ? "View" : "Edit"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save button - white style */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-xs font-semibold text-navy transition-all hover:border-navy/30 disabled:opacity-50"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3M7 21v-7h10v7" />
            </svg>
            {saving ? "저장 중..." : saved ? "저장 완료!" : ".md 저장"}
          </button>

          {/* Export */}
          <ExportButton content={content} title={title} />

          {/* Share - navy style (primary CTA) */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full bg-navy px-5 py-2 text-xs font-semibold text-white transition-all hover:opacity-85"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? "복사 완료!" : "공유"}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Editor pane */}
        {mode === "edit" && (
          <div data-print-hide className="flex flex-1 flex-col border-r border-navy/[0.08]">
            <div className="border-b border-navy/[0.06] bg-navy/[0.03] px-5 py-3 text-[10px] font-bold uppercase tracking-[2px] text-navy/50">
              Markdown
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none p-5 text-sm leading-relaxed text-navy outline-none"
              style={{
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                backgroundColor: "#F8F6F1",
              }}
              spellCheck={false}
            />
          </div>
        )}

        {/* View/Preview pane */}
        {(mode === "edit" || mode === "view") && (
          <div className={`flex flex-col overflow-y-auto ${mode === "edit" ? "flex-1" : "flex-1"}`}>
            {mode === "edit" && (
              <div data-print-hide className="border-b border-navy/[0.06] bg-navy/[0.02] px-5 py-3 text-[10px] font-bold uppercase tracking-[2px] text-navy/50">
                Preview
              </div>
            )}
            <div className="flex-1 bg-cream p-8">
              {mode === "view" ? (
                <div className="mx-auto max-w-[900px]">
                  <h1 className="mb-8 text-[32px] font-bold tracking-tight text-navy" style={{ lineHeight: 1.3 }}>
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
