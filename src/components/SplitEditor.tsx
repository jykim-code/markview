"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TableOfContents } from "./TableOfContents";
import { ExportButton } from "./ExportButton";
import { EditorHeader } from "./EditorHeader";
import { locateInElement } from "@/lib/editorSync";
import { useRevert } from "@/lib/useRevert";
import { saveDocument } from "@/lib/saveDocument";
import { useToast } from "./Toast";
import type { CodeController } from "./CodeEditor";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 p-5 text-sm text-navy/40">에디터 로딩 중…</div>
  ),
});

type ViewMode = "view" | "edit";

interface SplitEditorProps {
  slug: string;
  title: string;
  initialContent?: string;
}

export function SplitEditor({ slug, title, initialContent }: SplitEditorProps) {
  const [content, setContent] = useState<string>(initialContent ?? "");
  const [loading, setLoading] = useState(initialContent === undefined);
  const [mode, setMode] = useState<ViewMode>("view");
  const [syncScroll, setSyncScroll] = useState(false);
  const [saving, setSaving] = useState(false);

  const controllerRef = useRef<CodeController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const syncScrollRef = useRef(syncScroll);
  syncScrollRef.current = syncScroll;

  useEffect(() => {
    if (!loading) return;
    fetch(`/api/documents/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data as { content?: string };
        setContent(d.content ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, loading]);

  const lock = useCallback(() => {
    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
    }, 140);
  }, []);

  // Code editor scroll → preview div.
  const handleCodeScroll = useCallback(
    (ratio: number) => {
      const el = previewRef.current;
      if (!syncScrollRef.current || !el || lockRef.current) return;
      lock();
      el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
    },
    [lock]
  );

  // Preview div scroll → code editor.
  const handlePreviewScroll = useCallback(() => {
    const el = previewRef.current;
    if (!syncScrollRef.current || !el || lockRef.current) return;
    const max = el.scrollHeight - el.clientHeight;
    lock();
    controllerRef.current?.scrollToRatio(max > 0 ? el.scrollTop / max : 0);
  }, [lock]);

  // Select text in the preview → find and select it in the source.
  const handlePreviewMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    if (text.length > 1) controllerRef.current?.selectText(text);
  }, []);

  // Select text in the code → scroll the preview to the matching content.
  const handleCodeSelect = useCallback(
    (text: string) => {
      const el = previewRef.current;
      if (!el || !text) return;
      lock(); // suppress the resulting preview-scroll from echoing back
      locateInElement(el, text);
    },
    [lock]
  );

  const toast = useToast();
  const { available: revertAvailable, reverting, revert, refresh: refreshRevert } =
    useRevert(slug, setContent);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await saveDocument(slug, content);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("저장했습니다");
      // The save just produced a backup, unless the body exceeded the size cap.
      void refreshRevert();
    } finally {
      setSaving(false);
    }
  }, [slug, content, refreshRevert, toast]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/v/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard API needs a secure context and permission; fall back to the
      // hidden-input trick so copying still works over plain HTTP.
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    toast.success("공유 링크를 복사했습니다");
  }, [slug, toast]);

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
    toast.success("마크다운을 복사했습니다");
  }, [content, toast]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-navy/40">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-x-hidden">
      <EditorHeader
        mode={mode}
        setMode={setMode}
        syncScroll={syncScroll}
        onToggleSyncScroll={() => setSyncScroll((v) => !v)}
        onSave={handleSave}
        saving={saving}
        saveLabel=".md 저장"
        exportButton={<ExportButton content={content} title={title} />}
        onShare={handleShare}
        onRevert={revert}
        revertAvailable={revertAvailable}
        reverting={reverting}
      />

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Editor pane */}
        {mode === "edit" && (
          <div data-print-hide className="flex flex-1 flex-col" style={{ borderRight: '1px solid var(--editor-border)' }}>
            <div className="flex shrink-0 items-center justify-between px-5 py-3 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--label-text)', borderBottom: '1px solid var(--label-border)', background: 'var(--label-bg)' }}>
              <span>Markdown</span>
              <button
                onClick={handleCopyMd}
                aria-label="마크다운 복사"
                className="transition-colors hover:text-navy"
                style={{ color: 'var(--label-text)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-bg">
              <CodeEditor
                value={content}
                onChange={setContent}
                language="markdown"
                onReady={(c) => (controllerRef.current = c)}
                onScrollRatio={handleCodeScroll}
                onSelect={handleCodeSelect}
              />
            </div>
          </div>
        )}

        {/* View/Preview pane */}
        <div
          ref={previewRef}
          onScroll={mode === "edit" ? handlePreviewScroll : undefined}
          onMouseUp={mode === "edit" ? handlePreviewMouseUp : undefined}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          {mode === "edit" && (
            <div data-print-hide className="shrink-0 px-5 py-3 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--label-text)', borderBottom: '1px solid var(--label-border)', background: 'var(--label-bg)' }}>
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
      </div>
    </div>
  );
}
