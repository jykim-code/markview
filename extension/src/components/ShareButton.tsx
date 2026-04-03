import { useState, useRef } from "react";

interface ShareButtonProps {
  content: string;
  title: string;
}

const MARKVIEW_API = "https://markview-4hy.pages.dev/api/upload";
const MARKVIEW_BASE = "https://markview-4hy.pages.dev/v";

export function ShareButton({ content, title }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState(false);

  // Smart caching: remember last uploaded content and its URL
  const lastUpload = useRef<{ content: string; url: string } | null>(null);

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  async function handleShare() {
    if (!content.trim() || isOffline) return;

    // If content hasn't changed since last share, reuse URL
    if (lastUpload.current && lastUpload.current.content === content) {
      await navigator.clipboard.writeText(lastUpload.current.url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const formData = new FormData();
      const blob = new Blob([content], { type: "text/markdown" });
      formData.append("file", blob, `${title}.md`);

      const response = await fetch(MARKVIEW_API, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const url = `${MARKVIEW_BASE}/${data.slug}`;

      // Cache the upload
      lastUpload.current = { content, url };

      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
    <button
      onClick={handleShare}
      disabled={loading || isOffline || !content.trim()}
      title={isOffline ? "오프라인 상태" : "공유"}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/[0.06] disabled:opacity-40"
    >
      {loading ? (
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
      ) : shared ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : error ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="red"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      )}
    </button>
    {/* Toast notification */}
    {shared && (
      <div className="absolute right-0 top-[calc(100%+6px)] z-30 whitespace-nowrap rounded-lg bg-navy px-3 py-1.5 text-[11px] font-medium text-bg shadow-lg">
        URL이 복사되었습니다. 공유해보세요!
      </div>
    )}
    {error && (
      <div className="absolute right-0 top-[calc(100%+6px)] z-30 whitespace-nowrap rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg">
        공유에 실패했습니다
      </div>
    )}
    </div>
  );
}
