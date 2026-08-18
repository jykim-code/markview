"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { HtmlRenderer } from "./HtmlRenderer";
import { HtmlExportButton } from "./HtmlExportButton";
import { EditorHeader } from "./EditorHeader";
import { useRevert } from "@/lib/useRevert";
import { saveDocument } from "@/lib/saveDocument";
import { useToast } from "./Toast";
import type { CodeController } from "./CodeEditor";

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
  initialContent?: string;
}

export function HtmlEditor({ slug, title, initialContent }: HtmlEditorProps) {
  const [content, setContent] = useState<string>(initialContent ?? "");
  const [preview, setPreview] = useState<string>(initialContent ?? "");
  const [loading, setLoading] = useState(initialContent === undefined);
  const [mode, setMode] = useState<ViewMode>("view");
  const [syncScroll, setSyncScroll] = useState(false);
  const [saving, setSaving] = useState(false);

  const controllerRef = useRef<CodeController | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lockRef = useRef(false);
  const syncScrollRef = useRef(syncScroll);
  syncScrollRef.current = syncScroll;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Fetch content client-side — SSR shell intentionally omits it to stay
  // within Worker CPU limits (avoids serialising large bodies via RSC).
  useEffect(() => {
    if (!loading) return;
    fetch(`/api/documents/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data as { content?: string };
        const c = d.content ?? "";
        setContent(c);
        setPreview(c);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, loading]);

  // Debounce code → live preview so the iframe doesn't reload on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setPreview(content), 400);
    return () => clearTimeout(id);
  }, [content]);

  // Briefly ignore scroll events so a programmatic scroll doesn't echo back.
  const lock = useCallback(() => {
    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
    }, 140);
  }, []);

  // Preview iframe → parent messages (scroll position + text selection).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const m = e.data as { mv?: string; ratio?: number; text?: string };
      if (!m || typeof m.mv !== "string") return;
      if (m.mv === "scroll") {
        if (!syncScrollRef.current || modeRef.current !== "edit" || lockRef.current) return;
        lock();
        controllerRef.current?.scrollToRatio(m.ratio ?? 0);
      } else if (m.mv === "select") {
        if (modeRef.current !== "edit" || !m.text) return;
        controllerRef.current?.selectText(m.text);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [lock]);

  // Code editor scroll → preview iframe.
  const handleCodeScroll = useCallback(
    (ratio: number) => {
      if (!syncScrollRef.current || modeRef.current !== "edit" || lockRef.current) return;
      lock();
      iframeRef.current?.contentWindow?.postMessage({ mv: "scrollTo", ratio }, "*");
    },
    [lock]
  );

  // Code editor selection → scroll the preview iframe to the matching content.
  const handleCodeSelect = useCallback((text: string) => {
    if (modeRef.current !== "edit" || !text) return;
    iframeRef.current?.contentWindow?.postMessage({ mv: "locate", text }, "*");
  }, []);

  // Restoring has to refresh the rendered iframe too, not just the source pane.
  const handleRestored = useCallback((restored: string) => {
    setContent(restored);
    setPreview(restored);
  }, []);

  const toast = useToast();
  const { available: revertAvailable, reverting, revert, refresh: refreshRevert } =
    useRevert(slug, handleRestored);

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
      // Clipboard API needs a secure context and permission; the hidden-input
      // trick keeps copying working without it.
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    toast.success("공유 링크를 복사했습니다");
  }, [slug, toast]);

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
        saveLabel=".html 저장"
        exportButton={<HtmlExportButton content={content} title={title} />}
        onShare={handleShare}
        onRevert={revert}
        revertAvailable={revertAvailable}
        reverting={reverting}
      />

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Editor pane (edit mode only) */}
        {mode === "edit" && (
          <div className="flex flex-1 flex-col" style={{ borderRight: '1px solid var(--editor-border)' }}>
            <div className="flex shrink-0 items-center justify-between px-5 py-3 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'var(--label-text)', borderBottom: '1px solid var(--label-border)', background: 'var(--label-bg)' }}>
              <span>HTML</span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-bg">
              <CodeEditor
                value={content}
                onChange={setContent}
                language="html"
                onReady={(c) => (controllerRef.current = c)}
                onScrollRatio={handleCodeScroll}
                onSelect={handleCodeSelect}
              />
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
          <HtmlRenderer
            html={preview}
            title={title}
            bridge={true}
            iframeRef={iframeRef}
            className="min-h-0 w-full flex-1 border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
