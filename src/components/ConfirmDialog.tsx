"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** One short line. Anything longer belongs in the page, not a dialog. */
  description?: string;
  confirmLabel: string;
  /** Red confirm button for actions that can't be undone. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Site-styled replacement for window.confirm().
 *
 * Reserved for actions that genuinely can't be undone — deletion. Reversible
 * actions (revert, which simply swaps back) should just run and report with a
 * toast instead of asking.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="animate-overlay-in fixed inset-0 z-[110] flex items-center justify-center px-6"
      style={{ background: "rgba(10, 18, 42, 0.45)" }}
      onClick={onCancel}
    >
      <div
        // Stop the backdrop's dismiss handler from firing for clicks inside.
        onClick={(e) => e.stopPropagation()}
        className="animate-toast-in w-full max-w-[360px] rounded-3xl bg-bg p-6 shadow-[var(--shadow-card)]"
      >
        <h2 className="font-montserrat text-[17px] font-bold text-navy">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-[13px] leading-relaxed text-navy/50">
            {description}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-full border border-navy/15 bg-bg px-4 py-2.5 text-[13px] font-semibold text-navy transition-all hover:border-navy/30 disabled:opacity-50"
          >
            취소
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded-full px-4 py-2.5 text-[13px] font-bold transition-all hover:opacity-85 disabled:opacity-50 ${
              destructive ? "bg-red-500 text-white" : "bg-navy text-bg"
            }`}
          >
            {busy ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
