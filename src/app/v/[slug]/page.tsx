import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getDocumentBySlug } from "@/lib/db";
import { SplitEditor } from "@/components/SplitEditor";
import { HtmlEditor } from "@/components/HtmlEditor";

// Deduplicate DB+R2 calls within the same request (generateMetadata + page).
const getDoc = cache(getDocumentBySlug);

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDoc(slug);
  if (!doc) return { title: "문서를 찾을 수 없습니다 — Markview" };

  // Slice first to avoid running regex over potentially large (up to 25MB) documents.
  const preview = doc.content.slice(0, 500);
  const description =
    doc.type === "html"
      ? preview.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
      : preview.replace(/[#*`\n]/g, " ").trim().slice(0, 200);

  return {
    title: `${doc.title} — Markview`,
    description,
    openGraph: {
      title: doc.title,
      description,
      type: "article",
    },
  };
}

export default async function ViewPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDoc(slug);

  if (!doc) {
    notFound();
  }

  if (doc.type === "html") {
    return <HtmlEditor slug={slug} title={doc.title} initialContent={doc.content} />;
  }

  return <SplitEditor slug={slug} title={doc.title} initialContent={doc.content} />;
}
