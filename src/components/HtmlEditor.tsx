"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { HtmlRenderer } from "./HtmlRenderer";
import { HtmlExportButton } from "./HtmlExportButton";
import { ThemeToggle } from "./ThemeToggle";

// Load the CodeMirror editor only on the client, and only once Edit mode renders
// it — keeps the bundle off the View/landing path.
const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 p-5 text-sm text-navy/40">에디터 로딩 중…</div>
  ),
});

type ViewMode = "view" | "edit";

interface HtmlEditorProps {
  slug: string;
  title: string;
  initialContent: string;
}

export function HtmlEditor({ slug, title, initialContent }: HtmlEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState(initialContent);
  const [mode, setMode] = useState<ViewMode>("view");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Debounce code → live preview so the iframe doesn't reload on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setPreview(content), 400);
    return () => clearTimeout(id);
  }, [content]);

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
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-[66px] shrink-0 items-center justify-between bg-bg px-8" style={{ borderBottom: '1px solid var(--header-border)' }}>
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
          <span className="hidden rounded-full bg-navy/[0.06] px-2.5 py-1 font-montserrat text-[10px] font-bold uppercase tracking-wider text-navy/50 sm:inline-block">
            HTML
          </span>
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
            {saving ? "저장 중..." : saved ? "저장 완료!" : ".html 저장"}
          </button>

          {/* Export */}
          <HtmlExportButton content={content} title={title} />

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
      <div className="flex min-h-0 flex-1">
        {/* Editor pane (edit mode only) */}
        {mode === "edit" && (
          <div className="flex flex-1 flex-col" style={{ borderRight: '1px solid var(--editor-border)' }}>
            <div className="flex shrink-0 items-center justify-between px-5 py-3 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--label-text)', borderBottom: '1px solid var(--label-border)', background: 'var(--label-bg)' }}>
              <span>HTML</span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-bg">
              <CodeEditor value={content} onChange={setContent} />
            </div>
          </div>
        )}

        {/* Preview pane */}
        <div className="flex min-h-0 flex-1 flex-col">
          {mode === "edit" && (
            <div className="shrink-0 px-5 py-3 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--label-text)', borderBottom: '1px solid var(--label-border)', background: 'var(--label-bg)' }}>
              Preview
            </div>
          )}
          <HtmlRenderer html={preview} title={title} className="min-h-0 w-full flex-1 border-0 bg-white" />
        </div>
      </div>
    </div>
  );
}
