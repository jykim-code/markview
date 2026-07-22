"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

type ViewMode = "view" | "edit";

interface EditorHeaderProps {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  /** Scroll-sync toggle state (edit mode only). */
  syncScroll: boolean;
  onToggleSyncScroll: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  /** Save button label, e.g. ".md 저장" / ".html 저장". */
  saveLabel: string;
  /** Export control (differs per doc type — ExportButton vs HtmlExportButton). */
  exportButton: ReactNode;
  onShare: () => void;
  copied: boolean;
}

/**
 * Shared editor top bar for the MD (SplitEditor) and HTML (HtmlEditor) views.
 *
 * On desktop (≥ md) all controls sit inline. On narrow screens the right-hand
 * controls (save / export / share / theme / scroll-sync) collapse into a
 * hamburger dropdown so the header never exceeds the viewport width — the fixed
 * control row used to overflow on mobile, forcing a horizontal scrollbar and a
 * strip of empty page background on the right/bottom.
 */
export function EditorHeader({
  mode,
  setMode,
  syncScroll,
  onToggleSyncScroll,
  onSave,
  saving,
  saved,
  saveLabel,
  exportButton,
  onShare,
  copied,
}: EditorHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const scrollSyncButton = (
    <button
      onClick={onToggleSyncScroll}
      title="코드와 미리보기 스크롤을 함께 움직입니다"
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-montserrat text-xs font-semibold transition-all ${
        syncScroll
          ? "bg-navy text-bg"
          : "bg-navy/[0.06] text-navy/50 hover:text-navy/70"
      }`}
    >
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      스크롤 동기화
    </button>
  );

  const saveButton = (
    <button
      onClick={onSave}
      disabled={saving}
      className="flex items-center gap-1.5 rounded-full bg-navy px-5 py-2 text-xs font-semibold text-bg transition-all hover:opacity-85 disabled:opacity-50"
    >
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3M7 21v-7h10v7" />
      </svg>
      {saving ? "저장 중..." : saved ? "저장 완료!" : saveLabel}
    </button>
  );

  const shareButton = (
    <button
      onClick={onShare}
      className="flex items-center gap-1.5 rounded-full border border-navy/15 bg-bg px-4 py-2 text-xs font-semibold text-navy transition-all hover:border-navy/30"
    >
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? "복사 완료!" : "공유"}
    </button>
  );

  return (
    <header
      className="sticky top-0 z-10 flex h-[66px] shrink-0 items-center justify-between gap-2 bg-bg px-4 md:px-8"
      style={{ borderBottom: "1px solid var(--header-border)" }}
    >
      {/* Left group */}
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-70">
          <img src="/markview_text_icon.svg" alt="Markview" className="h-7 logo-light" />
          <img src="/markview_text_icon_dark.svg" alt="Markview" className="h-7 logo-dark" />
        </Link>
        {/* Mode toggle */}
        <div className="flex shrink-0 gap-0.5 rounded-full bg-navy/[0.06] p-[3px]">
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
        {/* Scroll-sync toggle — desktop, edit mode only */}
        {mode === "edit" && <div className="hidden md:block">{scrollSyncButton}</div>}
      </div>

      {/* Right group — desktop */}
      <div className="hidden items-center gap-2 md:flex">
        {saveButton}
        {exportButton}
        {shareButton}
        <ThemeToggle />
      </div>

      {/* Right group — mobile hamburger */}
      <div ref={menuRef} className="relative flex items-center md:hidden">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="메뉴"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/[0.06]"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-20 flex flex-col items-stretch gap-2 rounded-2xl bg-bg p-3 shadow-[var(--shadow-card)]"
            style={{ border: "1px solid var(--header-border)" }}
            onClick={() => setMenuOpen(false)}
          >
            {mode === "edit" && scrollSyncButton}
            {saveButton}
            {exportButton}
            {shareButton}
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
