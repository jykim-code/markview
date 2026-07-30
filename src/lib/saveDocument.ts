/**
 * Saving a document body, with the failure cases kept apart.
 *
 * A rejected request and a request that never left the browser call for
 * different things from the reader — one is ours to fix, the other is theirs to
 * retry — so they must not collapse into one "실패했습니다". The messages live
 * here rather than in each editor because the MD and HTML editors would
 * otherwise drift apart.
 */

export type SaveResult = { ok: true } | { ok: false; message: string };

export async function saveDocument(
  slug: string,
  content: string
): Promise<SaveResult> {
  let res: Response;
  try {
    res = await fetch(`/api/documents/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch {
    // The request never reached the server — nothing was saved, and retrying
    // is the reader's move.
    return { ok: false, message: "네트워크 연결을 확인해주세요" };
  }

  if (res.ok) return { ok: true };

  if (res.status === 404) {
    // The document was deleted while this tab had it open. Saying "저장 실패"
    // here would hide the actual reason.
    return { ok: false, message: "문서가 삭제되었거나 찾을 수 없습니다" };
  }

  return { ok: false, message: "저장에 실패했습니다" };
}
