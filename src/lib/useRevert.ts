"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";

/**
 * One-step revert for the MD and HTML editors.
 *
 * Editing is open to anyone holding the link, so this is the recovery path when
 * a document gets wrecked — see docs/ROADMAP.md §2. Availability is fetched
 * rather than assumed: bodies over the size cap never get a backup, so a saved
 * document does not always have something to revert to.
 *
 * There is deliberately no confirmation step. Reverting swaps the two versions,
 * so pressing it again undoes it — asking first would be friction for an action
 * that can't lose anything.
 */
export function useRevert(slug: string, onRestored: (content: string) => void) {
  const [available, setAvailable] = useState(false);
  const [reverting, setReverting] = useState(false);
  const toast = useToast();

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
    setReverting(true);
    let res: Response;
    try {
      res = await fetch(`/api/documents/${slug}/revert`, { method: "POST" });
    } catch {
      // Never reached the server, so nothing changed — keep the control.
      toast.error("네트워크 연결을 확인해주세요");
      setReverting(false);
      return;
    }

    try {
      if (res.status === 404) {
        // No backup exists (or the document is gone). Hide the control so it
        // doesn't invite a second failure.
        setAvailable(false);
        toast.error("되돌릴 버전이 없습니다");
        return;
      }
      if (!res.ok) {
        toast.error("되돌리기에 실패했습니다");
        return;
      }
      const data = (await res.json()) as { content?: string };
      if (typeof data.content === "string") {
        onRestored(data.content);
        toast.success("직전 내용으로 되돌렸습니다");
      }
    } finally {
      setReverting(false);
    }
  }, [slug, onRestored, toast]);

  return { available, reverting, revert, refresh };
}
