import { hasPrevVersion, revertDocument } from "@/lib/db";

/**
 * Whether a one-step-back copy exists, so the editor can decide to show the
 * revert control. Kept off the page's server render: `/v/[slug]` already calls
 * getDocumentBySlug twice per request, and this only matters once the editor is
 * interactive.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    return Response.json({ available: await hasPrevVersion(slug) });
  } catch {
    return Response.json({ available: false });
  }
}

/**
 * Restore the previous body.
 *
 * Open to anyone holding the link, matching the edit policy — if edits are open
 * but recovery is locked, whoever notices a wrecked document can't fix it.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const restored = await revertDocument(slug);

    if (restored === null) {
      return Response.json(
        { error: "되돌릴 이전 버전이 없습니다." },
        { status: 404 }
      );
    }

    return Response.json({ content: restored });
  } catch {
    return Response.json(
      { error: "되돌리기에 실패했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
