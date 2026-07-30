import { useCallback, useEffect, useState } from "react";

// Broad site access is optional (manifest optional_host_permissions), so the
// download-interception feature stays off until the user turns it on here.
// chrome.permissions.request() only works from a user gesture, which is why this
// lives in the panel UI rather than in the service worker.
const ALL_URLS = { origins: ["<all_urls>"] };

function permissionsApi(): typeof chrome.permissions | undefined {
  if (typeof chrome === "undefined") return undefined;
  return chrome.permissions;
}

export function SiteAccessToggle() {
  const [granted, setGranted] = useState<boolean | null>(null);

  // Every setState here happens after an await, so mounting this does not kick
  // off a synchronous cascading render. The null initial state already means
  // "unknown", so the no-API path just leaves it alone.
  const refresh = useCallback(async () => {
    const api = permissionsApi();
    if (!api) return;
    try {
      setGranted(await api.contains(ALL_URLS));
    } catch {
      // Keep the last known state rather than hiding the control outright.
    }
  }, []);

  useEffect(() => {
    const api = permissionsApi();
    if (!api) return;

    // Read the initial state in a promise callback rather than the effect body,
    // so the update is genuinely deferred, and drop it if we unmount first.
    let cancelled = false;
    api.contains(ALL_URLS).then(
      (v) => {
        if (!cancelled) setGranted(v);
      },
      () => {}
    );

    // Grants can also change from chrome://extensions, not just our toggle.
    api.onAdded?.addListener(refresh);
    api.onRemoved?.addListener(refresh);
    return () => {
      cancelled = true;
      api.onAdded?.removeListener(refresh);
      api.onRemoved?.removeListener(refresh);
    };
  }, [refresh]);

  async function toggle() {
    const api = permissionsApi();
    if (!api) return;
    try {
      if (granted) {
        await api.remove(ALL_URLS);
      } else {
        await api.request(ALL_URLS);
      }
    } catch {
      // User dismissed the prompt, or the API is unavailable — onAdded/onRemoved
      // never fires, so re-read the real state rather than guessing.
    }
    refresh();
  }

  // Not running as an extension (e.g. vite dev server) — nothing to toggle.
  if (granted === null) return null;

  return (
    <div className="w-full max-w-[360px] rounded-2xl bg-bg p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-navy/70">
            .md 다운로드 자동 열기
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-navy/40">
            {granted
              ? "이제 .md 파일을 내려받으면 저장 대신 이 패널에서 바로 렌더링합니다."
              : "모든 사이트 접근 권한이 필요합니다. 허용하지 않아도 파일 열기·붙여넣기는 그대로 동작합니다."}
          </p>
        </div>
        <button
          onClick={toggle}
          role="switch"
          aria-checked={granted}
          aria-label=".md 다운로드 자동 열기"
          className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${
            granted ? "bg-navy" : "bg-navy/20"
          }`}
        >
          <span
            className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-bg transition-all ${
              granted ? "left-[19px]" : "left-[3px]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
