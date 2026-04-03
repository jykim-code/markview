import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Components } from "react-markdown";
import { MermaidBlock } from "./MermaidBlock";

// Custom sanitize schema — allows KaTeX output through sanitizer
// Note: Mermaid SVG is NOT in this schema because it's injected via
// dangerouslySetInnerHTML outside the sanitizer pipeline (sandbox iframe)
const customSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    // KaTeX elements
    "math",
    "semantics",
    "mrow",
    "mi",
    "mo",
    "mn",
    "msup",
    "msub",
    "mfrac",
    "munder",
    "mover",
    "msqrt",
    "mtable",
    "mtr",
    "mtd",
    "mtext",
    "annotation",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] || []), "className", "style"],
    math: ["xmlns"],
    annotation: ["encoding"],
  },
};

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

function getTextContent(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    const el = children as { props: { children?: React.ReactNode } };
    return getTextContent(el.props.children);
  }
  return "";
}

const components: Components = {
  h2({ children }) {
    const text = getTextContent(children);
    const id = generateId(text);
    return (
      <h2 id={id} className="scroll-mt-16">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    const text = getTextContent(children);
    const id = generateId(text);
    return (
      <h3 id={id} className="scroll-mt-16">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    const text = getTextContent(children);
    const id = generateId(text);
    return (
      <h4 id={id} className="scroll-mt-16">
        {children}
      </h4>
    );
  },
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");

    // Mermaid code blocks → render via sandboxed iframe
    if (match && match[1] === "mermaid") {
      return <MermaidBlock chart={String(children).trim()} />;
    }

    // Inline code
    if (!className) {
      return (
        <code className="rounded bg-navy/5 px-1.5 py-0.5 text-sm" {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-navy/[0.03] p-4 text-sm">
        {children}
      </pre>
    );
  },
};

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-navy max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          rehypeHighlight,
          [rehypeSanitize, customSchema],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
