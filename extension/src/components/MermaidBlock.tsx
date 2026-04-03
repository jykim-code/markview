import { useEffect, useRef, useState } from "react";

interface MermaidBlockProps {
  chart: string;
}

const SANDBOX_TIMEOUT = 5000;

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function handleMessage(event: MessageEvent) {
      // Validate origin — only accept messages from our sandbox
      if (cancelled) return;

      const data = event.data;
      if (data?.type === "svg") {
        setSvg(data.svg);
        setError("");
      } else if (data?.type === "error") {
        setError(data.message || "다이어그램을 렌더링할 수 없습니다.");
      }
    }

    window.addEventListener("message", handleMessage);

    // Send render request to sandbox iframe
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      const theme =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light";

      // Wait for iframe to be ready, then send
      const sendMessage = () => {
        iframe.contentWindow?.postMessage(
          { type: "render", code: chart, theme },
          "*"
        );
      };

      if (iframe.contentDocument?.readyState === "complete") {
        sendMessage();
      } else {
        iframe.addEventListener("load", sendMessage, { once: true });
      }

      // Timeout fallback
      timeoutId = setTimeout(() => {
        if (!cancelled && !svg && !error) {
          setError("다이어그램 렌더링 시간이 초과되었습니다.");
        }
      }, SANDBOX_TIMEOUT);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-navy/[0.03] p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
      </div>
    );
  }

  return (
    <>
      <iframe
        ref={iframeRef}
        src="/src/mermaid-sandbox.html"
        className="hidden"
        sandbox="allow-scripts"
        title="Mermaid Renderer"
      />
      <div
        className="my-4 flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
}
