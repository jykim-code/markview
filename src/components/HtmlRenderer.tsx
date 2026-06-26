"use client";

interface HtmlRendererProps {
  html: string;
  className?: string;
  title?: string;
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
 * so the embedded page can't hijack the parent window.
 */
export function HtmlRenderer({ html, className, title }: HtmlRendererProps) {
  return (
    <iframe
      srcDoc={html}
      title={title || "HTML preview"}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals"
      referrerPolicy="no-referrer"
      className={className ?? "h-full w-full border-0 bg-white"}
    />
  );
}
