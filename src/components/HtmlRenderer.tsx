"use client";

import type { Ref } from "react";
import { injectBridge } from "@/lib/editorSync";

interface HtmlRendererProps {
  html: string;
  className?: string;
  title?: string;
  /** Inject the scroll/selection postMessage relay (edit-mode preview only). */
  bridge?: boolean;
  iframeRef?: Ref<HTMLIFrameElement>;
}

/**
 * Renders arbitrary user-uploaded HTML inside a sandboxed iframe so it behaves
 * exactly like opening the file in a browser — scripts, buttons, and in-page
 * navigation all work.
 *
 * Security: `allow-scripts` lets the document run JS, but `allow-same-origin` is
 * intentionally NOT granted. The iframe is therefore treated as an opaque origin
 * and cannot read Markview's cookies/storage or call same-origin APIs, which
 * neutralizes XSS from shared links. `allow-popups-to-escape-sandbox` lets links
 * with target=_blank open normally in a new tab. Top-navigation is not allowed,
 * so the embedded page can't hijack the parent window. When `bridge` is set, a
 * postMessage relay is injected for scroll-sync / selection-linking — it works
 * across the sandbox boundary without weakening the origin isolation above.
 */
export function HtmlRenderer({
  html,
  className,
  title,
  bridge,
  iframeRef,
}: HtmlRendererProps) {
  return (
    <iframe
      ref={iframeRef}
      srcDoc={bridge ? injectBridge(html) : html}
      title={title || "HTML preview"}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals"
      referrerPolicy="no-referrer"
      className={className ?? "h-full w-full border-0 bg-white"}
    />
  );
}
