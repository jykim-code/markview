import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getDocumentMeta } from "@/lib/db";
import { SplitEditor } from "@/components/SplitEditor";
import { HtmlEditor } from "@/components/HtmlEditor";

// D1-only lookup — no R2 call, safe to run in the SSR Worker.
const getMeta = cache(getDocumentMeta);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getMeta(slug);
  if (!doc) return { title: "문서를 찾을 수 없습니다 — Markview" };

  return {
    title: `${doc.title} — Markview`,
    openGraph: {
      title: doc.title,
      type: "article",
    },
  };
}

export default async function ViewPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getMeta(slug);

  if (!doc) {
    notFound();
  }

  // Content is intentionally NOT passed here. The client component fetches it
  // via GET /api/documents/[slug] so the SSR Worker never serialises a
  // potentially large (up to 25MB) body into the RSC payload — the root cause
  // of Error 1102 (Worker CPU time exceeded).
  if (doc.type === "html") {
    return <HtmlEditor slug={slug} title={doc.title} />;
  }

  return <SplitEditor slug={slug} title={doc.title} />;
}
