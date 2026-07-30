"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

/**
 * In-page notifications, styled like the rest of Markview.
 *
 * Replaces browser alert()/confirm() for anything informational — the native
 * dialogs are chrome-coloured, unstyleable, and block the page. Keep messages to
 * a few words; the toast is a confirmation, not an explanation.
 */

type ToastKind = "success" | "error";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, kind: ToastKind) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION_MS);
  }, []);

  const success = useCallback(
    (message: string) => push(message, "success"),
    [push]
  );
  const error = useCallback((message: string) => push(message, "error"), [push]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div
        // aria-live so the message reaches screen readers, which never saw the
        // visual toast; pointer-events-none keeps the stack from eating clicks.
        aria-live="polite"
        // Sits just below the 66px header every page shares, so a toast never
        // covers the logo, mode toggle, or mobile hamburger — the pill takes
        // pointer events, and blocking a control for 2.6s is worse than the
        // brief overlap with the edit-mode notice strip.
        className="pointer-events-none fixed left-1/2 top-[78px] z-[100] flex -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-drop pointer-events-auto flex items-center gap-2.5 rounded-full bg-navy px-5 py-3 text-[13px] font-semibold text-bg shadow-[var(--shadow-card)]"
          >
            {t.kind === "success" ? (
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L2.4 17.1A1.9 1.9 0 004 20h16a1.9 1.9 0 001.6-2.9L13.7 3.9a1.9 1.9 0 00-3.4 0z" />
              </svg>
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Returns a no-op API when rendered outside the provider so a missing provider
 * can never break an action — the work still happens, only the toast is lost.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  return { success: () => {}, error: () => {} };
}
