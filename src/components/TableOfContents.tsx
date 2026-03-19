"use client";

import { useMemo } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => {
    const items: TocItem[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const match = line.match(/^(#{2,4})\s+(.+)$/);
      if (match) {
        const text = match[2].replace(/[*`\[\]]/g, "").trim();
        items.push({
          id: generateId(text),
          text,
          level: match[1].length,
        });
      }
    }

    return items;
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-20">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy/40">
        목차
      </h2>
      <ul className="space-y-1.5 border-l border-navy/10">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="block border-l-2 border-transparent py-0.5 text-sm text-navy/50 transition-colors hover:border-navy hover:text-navy"
              style={{ paddingLeft: `${(heading.level - 2) * 12 + 12}px` }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
