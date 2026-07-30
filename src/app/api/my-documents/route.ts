import { getOwnedDocuments } from "@/lib/db";

/**
 * Upper bound on entries per request. The browser list is expected to hold tens
 * of documents, not thousands; the cap keeps one request from turning into a
 * large fan-out of hash comparisons.
 */
const MAX_ENTRIES = 200;

/**
 * Resolve the browser's local document list against the server.
 *
 * Lives outside `/api/documents/*` so it can't be confused with a slug route.
 * Each entry must carry its ownership token — see getOwnedDocuments for why
 * accepting bare slugs would leak which slugs exist.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      docs?: { slug?: unknown; token?: unknown }[];
    };

    if (!Array.isArray(body.docs)) {
      return Response.json(
        { error: "docs 배열이 필요합니다" },
        { status: 400 }
      );
    }

    const entries = body.docs
      .slice(0, MAX_ENTRIES)
      .filter(
        (d): d is { slug: string; token: string } =>
          typeof d?.slug === "string" && typeof d?.token === "string"
      );

    return Response.json({ docs: await getOwnedDocuments(entries) });
  } catch {
    return Response.json(
      { error: "문서 목록을 불러오지 못했습니다" },
      { status: 500 }
    );
  }
}
