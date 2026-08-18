"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reader text size, stepped rather than free-form.
 *
 * Mobile feedback (2026-07-30): pinch-zooming a document overflows the viewport
 * and forces sideways scrolling. Reflow-on-zoom is the larger fix (ROADMAP P2);
 * this covers the common case — the text is simply too small to read — without
 * leaving the layout.
 *
 * Steps rather than a slider because a slider needs a drag target the header has
 * no room for, and every intermediate value would have to look deliberate.
 */
const STEPS = [0.9, 1, 1.15, 1.3, 1.5];
const DEFAULT_INDEX = 1;
const DEFAULT_SCALE = STEPS[DEFAULT_INDEX];

/** Shared with the pre-hydration script in layout.tsx — keep both in sync. */
const STORAGE_KEY = "markview-font-scale";
const CSS_VAR = "--reader-font-scale";

/*
 * localStorage is the store; this is the subscription React needs to read it.
 *
 * Going through an external store rather than component state matters here
 * because the header mounts this control twice — once in the desktop row, once
 * inside the mobile dropdown — and two copies of useState would drift apart the
 * moment either was used. `storage` only fires for *other* tabs, so same-tab
 * writes notify listeners directly.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readScale(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    // Ignore anything not on the scale — a stale or hand-edited value would
    // otherwise leave the readout showing a size the buttons can't step from.
    return STEPS.includes(stored) ? stored : DEFAULT_SCALE;
  } catch {
    // Storage blocked (private mode). The size just isn't remembered.
    return DEFAULT_SCALE;
  }
}

/**
 * The server has no storage to read, so it renders the default. The stored size
 * is already on screen by then — layout.tsx sets the CSS variable before paint —
 * and React swaps the readout to the real value right after hydration.
 */
function readDefaultScale(): number {
  return DEFAULT_SCALE;
}

export function FontSizeControl() {
  const scale = useSyncExternalStore(subscribe, readScale, readDefaultScale);
  const index = STEPS.indexOf(scale);

  const apply = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, 0), STEPS.length - 1);
    document.documentElement.style.setProperty(CSS_VAR, String(STEPS[clamped]));
    try {
      localStorage.setItem(STORAGE_KEY, String(STEPS[clamped]));
    } catch {
      // Applies to this session even when it can't be persisted.
    }
    for (const listener of listeners) listener();
  }, []);

  const percent = Math.round(scale * 100);
  const stepButton =
    "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full font-montserrat text-[11px] font-bold text-navy/60 transition-all hover:bg-bg hover:text-navy disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-navy/60";

  return (
    <div
      role="group"
      aria-label="본문 글자 크기"
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-navy/[0.06] p-[3px]"
    >
      <button
        onClick={() => apply(index - 1)}
        disabled={index === 0}
        aria-label="글자 크기 줄이기"
        title="글자 크기 줄이기"
        className={stepButton}
      >
        A−
      </button>
      {/*
        The readout doubles as the reset: once you have stepped away from 100%
        there is otherwise no way back except counting clicks.
      */}
      <button
        onClick={() => apply(DEFAULT_INDEX)}
        aria-label={`글자 크기 ${percent}퍼센트, 눌러서 기본 크기로`}
        title="기본 크기로"
        className="min-w-[38px] rounded-full py-1 font-montserrat text-[11px] font-semibold tabular-nums text-navy/50 transition-colors hover:text-navy"
      >
        {percent}%
      </button>
      <button
        onClick={() => apply(index + 1)}
        disabled={index === STEPS.length - 1}
        aria-label="글자 크기 키우기"
        title="글자 크기 키우기"
        className={stepButton}
      >
        A+
      </button>
    </div>
  );
}
