import { useState, useCallback, useRef, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ThemeToggle } from "./ThemeToggle";
import { ExportButton } from "./ExportButton";
import { ShareButton } from "./ShareButton";
import { FileOpenButton } from "./FileOpenButton";

type ViewMode = "edit" | "view";

function extractTitle(content: string): string {
  const match = /^#\s+(.+)$/m.exec(content);
  return match ? match[1].trim() : "Untitled";
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsText(file);
  });
}

export function ExtensionApp() {
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<ViewMode>("view");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const title = extractTitle(content);
  const isEmpty = !content.trim();

  const [downloadHint, setDownloadHint] = useState("");

  // Listen for .md downloads from background script
  useEffect(() => {
    function handleMessage(message: { type: string; content?: string; filename?: string }) {
      if (message.type === "md-file-downloaded" && message.content) {
        setContent(message.content);
        setMode("view");
        setDownloadHint("");
      } else if (message.type === "md-download-hint" && message.filename) {
        setDownloadHint(message.filename);
        setTimeout(() => setDownloadHint(""), 8000);
      }
    }
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, []);

  const handleFileLoad = useCallback((text: string, _filename: string) => {
    setContent(text);
    setMode("view");
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      // 1. File drop (from file system)
      const file = e.dataTransfer.files[0];
      if (file) {
        if (!file.name.endsWith(".md")) return;
        const text = await readFileAsText(file);
        handleFileLoad(text, file.name);
        return;
      }

      // 2. URL drop (from web — link drag)
      const url =
        e.dataTransfer.getData("text/uri-list") ||
        e.dataTransfer.getData("text/plain");
      if (url && url.startsWith("http") && url.endsWith(".md")) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Fetch failed");
          const text = await response.text();
          const filename = url.split("/").pop() || "document.md";
          handleFileLoad(text, filename);
        } catch {
          // URL fetch failed — ignore silently
        }
        return;
      }

      // 3. Text drop (selected markdown text from web)
      const text = e.dataTransfer.getData("text/plain");
      if (text && text.trim()) {
        setContent(text);
        setMode("view");
      }
    },
    [handleFileLoad]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  // Home screen paste handler — paste text → view
  const handleHomePaste = useCallback(async (e: React.ClipboardEvent) => {
    // Check for file paste
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file?.name.endsWith(".md")) {
          e.preventDefault();
          const text = await readFileAsText(file);
          setContent(text);
          setMode("view");
          return;
        }
      }
    }
    // Text paste
    const text = e.clipboardData.getData("text");
    if (text.trim()) {
      e.preventDefault();
      setContent(text);
      setMode("view");
    }
  }, []);

  // Global keydown listener for paste on home screen
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Only capture Ctrl+V on the home (empty + view) screen
      if (isEmpty && mode === "view" && e.key === "v" && (e.ctrlKey || e.metaKey)) {
        // Let the hidden paste target handle it
        const pasteTarget = document.getElementById("paste-target");
        pasteTarget?.focus();
      }
    },
    [isEmpty, mode]
  );

  return (
    <div
      className="flex h-screen flex-col bg-bg text-navy"
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header — show when content exists or in edit mode */}
      {(!isEmpty || mode === "edit") && (
        <header
          className="flex h-[50px] shrink-0 items-center justify-between px-3"
          style={{ borderBottom: "1px solid var(--header-border)" }}
          data-print-hide
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {/* Home button */}
            <button
              onClick={() => {
                setContent("");
                setMode("view");
              }}
              aria-label="홈으로"
              title="홈으로"
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-navy/50 transition-colors hover:bg-navy/[0.06] hover:text-navy"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
              </svg>
            </button>
            <span className="truncate text-sm font-bold tracking-tight">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Tab toggle */}
            <div className="flex gap-0.5 rounded-full bg-navy/[0.06] p-[3px]">
              {(["view", "edit"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  role="button"
                  aria-selected={mode === m}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
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

          <div className="flex items-center gap-0.5">
            <FileOpenButton onFileLoad={handleFileLoad} />
            <ExportButton content={content} title={title} />
            <ShareButton content={content} title={title} />
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* Download hint toast */}
      {downloadHint && (
        <div className="absolute left-3 right-3 top-[54px] z-40 flex items-center gap-2 rounded-lg bg-navy px-3 py-2.5 text-bg shadow-lg">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold">{downloadHint} 다운로드 완료</p>
            <p className="text-[10px] text-bg/70">다운로드된 파일을 여기로 드래그하면 바로 볼 수 있어요</p>
          </div>
          <button onClick={() => setDownloadHint("")} className="shrink-0 text-bg/50 hover:text-bg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-navy/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-navy/30 bg-bg/90 px-10 py-8">
            <svg
              width="32"
              height="32"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-navy/50"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="text-base font-semibold text-navy/70">
              여기에 놓으세요!
            </p>
            <p className="text-xs text-navy/40">.md 파일</p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {isEmpty && mode === "view" ? (
          /* Home screen — matches Markview main service design */
          <div
            className="flex flex-1 flex-col overflow-y-auto"
            onPaste={handleHomePaste}
          >
            {/* Header with logo + theme toggle */}
            <header
              className="flex h-[50px] shrink-0 items-center justify-between px-4"
              style={{ borderBottom: "1px solid var(--header-border)" }}
            >
              <img src="./markview_text_icon.svg" alt="Markview" className="h-5 logo-light" />
              <img src="./markview_text_icon_dark.svg" alt="Markview" className="h-5 logo-dark" />
              <ThemeToggle />
            </header>

            {/* Hero section */}
            <section className="flex flex-1 flex-col items-center justify-center gap-6 bg-cream px-5 py-10 transition-colors">
              <div className="text-center">
                <h1
                  className="font-montserrat text-navy"
                  style={{
                    fontSize: "clamp(24px, 5vw, 32px)",
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: "-1px",
                  }}
                >
                  마크다운을
                  <br />
                  사람이 읽기 편한
                  <br />
                  형태로.
                </h1>
                <p className="mt-4 text-[13px] font-medium leading-[1.8] text-navy/50">
                  마크다운 텍스트를 붙여넣거나
                  <br />
                  .md 파일을 업로드하면
                  <br />
                  바로 예쁘게 볼 수 있습니다.
                </p>
              </div>

              {/* Upload card */}
              <div className="w-full max-w-[360px]">
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-bg p-6 shadow-[var(--shadow-card)]">
                  <FileOpenButton onFileLoad={handleFileLoad} variant="button" />
                  <p className="text-[13px] font-semibold text-navy/50">
                    또는 마크다운 텍스트 붙여넣기
                  </p>
                  <p className="text-[11px] text-navy/35">
                    .md · Ctrl+V · 드래그 앤 드롭
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setMode("edit");
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="text-[12px] font-semibold text-navy/40 underline underline-offset-2 transition-colors hover:text-navy/70"
              >
                직접 입력하기
              </button>
            </section>

            {/* Footer */}
            <footer className="shrink-0 border-t border-navy/[0.06] bg-cream px-5 py-3 text-center">
              <span className="text-[9px] uppercase tracking-[2px] text-navy/35">
                Markview — Markdown + View
              </span>
            </footer>

            {/* Hidden paste target */}
            <textarea
              id="paste-target"
              className="absolute h-0 w-0 opacity-0"
              onPaste={handleHomePaste}
              tabIndex={-1}
            />
          </div>
        ) : mode === "view" ? (
          /* View mode — rendered markdown */
          <div className="flex-1 overflow-y-auto bg-cream p-4">
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          /* Edit mode */
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# 마크다운을 입력하세요..."
            className="flex-1 resize-none bg-bg p-4 text-sm leading-relaxed text-navy outline-none transition-colors"
            style={{
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
