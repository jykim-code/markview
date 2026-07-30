"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * One-step revert for the MD and HTML editors.
 *
 * Editing is open to anyone holding the link, so this is the recovery path when
 * a document gets wrecked — see docs/ROADMAP.md §2. Availability is fetched
 * rather than assumed: bodies over the size cap never get a backup, so a saved
 * document does not always have something to revert to.
 */
export function useRevert(slug: string, onRestored: (content: string) => void) {
  const [available, setAvailable] = useState(false);
  const [reverting, setReverting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${slug}/revert`);
      if (!res.ok) return;
      const data = (await res.json()) as { available?: boolean };
      setAvailable(!!data.available);
    } catch {
      // Leave the control hidden rather than offering a revert we can't confirm.
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const revert = useCallback(async () => {
    if (
      !window.confirm(
        "마지막 저장 직전 내용으로 되돌릴까요?\n지금 내용은 되돌리기 슬롯으로 옮겨지므로, 한 번 더 누르면 원래대로 돌아옵니다."
      )
    ) {
      return;
    }
    setReverting(true);
    try {
      const res = await fetch(`/api/documents/${slug}/revert`, {
        method: "POST",
      });
      if (!res.ok) {
        setAvailable(false);
        return;
      }
      const data = (await res.json()) as { content?: string };
      if (typeof data.content === "string") onRestored(data.content);
    } catch {
      // Network failure — nothing changed server-side, so keep the control.
    } finally {
      setReverting(false);
    }
  }, [slug, onRestored]);

  return { available, reverting, revert, refresh };
}
