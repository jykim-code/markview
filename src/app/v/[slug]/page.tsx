import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocumentBySlug } from "@/lib/db";
import { SplitEditor } from "@/components/SplitEditor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);
  if (!doc) return { title: "문서를 찾을 수 없습니다 — Markview" };

  const description = doc.content.slice(0, 200).replace(/[#*`\n]/g, " ").trim();

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
  const doc = await getDocumentBySlug(slug);

  if (!doc) {
    notFound();
  }

  return <SplitEditor slug={slug} title={doc.title} initialContent={doc.content} />;
}
