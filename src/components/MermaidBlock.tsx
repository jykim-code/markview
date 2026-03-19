"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidBlockProps {
  chart: string;
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#FFF7E6",
            primaryTextColor: "#0A122A",
            primaryBorderColor: "#0A122A",
            lineColor: "#0A122A",
            secondaryColor: "#f0ead6",
            tertiaryColor: "#e8e0cc",
          },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(renderedSvg);
        }
      } catch {
        if (!cancelled) {
          setError("다이어그램을 렌더링할 수 없습니다.");
        }
      }
    }

    renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
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
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
