import { useEffect } from "react";

// Safe wrapper for chrome.storage.local (falls back to localStorage in non-extension contexts)
const storage = {
  async get(key: string): Promise<string | undefined> {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get([key]);
      return result[key] as string | undefined;
    }
    return localStorage.getItem(key) ?? undefined;
  },
  async set(key: string, value: string): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, value);
    }
  },
};

// The data-theme attribute is the single source of truth: the stylesheet swaps
// both the palette and the toggle's icon off it, so no React state is involved.
function applyTheme(t: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", t);
}

export function ThemeToggle() {
  useEffect(() => {
    // Load saved preference or follow browser
    storage.get("markview-theme").then((saved) => {
      if (saved === "dark" || saved === "light") {
        applyTheme(saved);
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        applyTheme(prefersDark ? "dark" : "light");
      }
    });

    // Listen for browser theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(e: MediaQueryListEvent) {
      storage.get("markview-theme").then((saved) => {
        if (!saved) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    storage.set("markview-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/[0.06]"
    >
      <svg
        className="theme-icon-moon h-[16px] w-[16px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>다크 모드</title>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <svg
        className="theme-icon-sun h-[16px] w-[16px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>라이트 모드</title>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    </button>
  );
}
