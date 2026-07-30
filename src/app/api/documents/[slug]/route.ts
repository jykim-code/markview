import { updateDocument, verifyOwnerToken, deleteDocument } from "@/lib/db";

/** Header carrying the per-document ownership proof issued at upload time. */
const OWNER_TOKEN_HEADER = "X-Owner-Token";

/**
 * Save a new body.
 *
 * Intentionally unauthenticated: editing is open to anyone holding the link
 * (docs/ROADMAP.md §2). The safety net is the one-step revert, not a lock.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as { content?: string };

    if (!body.content && body.content !== "") {
      return Response.json(
        { error: "content 필드가 필요합니다." },
        { status: 400 }
      );
    }

    const updated = await updateDocument(slug, body.content);

    if (!updated) {
      return Response.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "저장에 실패했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

/**
 * Delete a document. Unlike editing, this requires ownership proof — otherwise
 * anyone who received the link could destroy someone else's document.
 *
 * A missing document and a wrong token both answer 403 on purpose. Splitting
 * them would turn this route into a slug-existence oracle, and slugs are only
 * 8 hex chars (32 bits).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.headers.get(OWNER_TOKEN_HEADER);

    if (!token || !(await verifyOwnerToken(slug, token))) {
      return Response.json(
        { error: "이 문서를 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    const deleted = await deleteDocument(slug);
    if (!deleted) {
      return Response.json(
        { error: "이 문서를 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "삭제에 실패했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
