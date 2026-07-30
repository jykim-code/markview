/**
 * The uploader's own document list, kept in this browser only.
 *
 * This is the whole answer to "I shared a link and now I can't find it" until
 * accounts arrive (ROADMAP P1). The ownership tokens stored here are also what
 * will let those documents be claimed into an account later — without them the
 * server has no way to tell a real owner from someone guessing slugs.
 *
 * All access goes through this module so localStorage handling doesn't spread
 * across components.
 */

const STORAGE_KEY = "markview:mydocs";

/**
 * Bump when the stored shape changes. Optional expiry (ROADMAP P1) will add
 * fields and move this to 2; unknown versions are discarded rather than guessed
 * at.
 */
const SCHEMA_VERSION = 1;

export interface MyDoc {
  slug: string;
  ownerToken: string;
  title: string;
  type: "md" | "html";
  uploadedAt: string;
}

interface Stored {
  v: number;
  docs: MyDoc[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function readMyDocs(): MyDoc[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.v !== SCHEMA_VERSION || !Array.isArray(parsed.docs)) return [];
    return parsed.docs.filter(
      (d) => typeof d?.slug === "string" && typeof d?.ownerToken === "string"
    );
  } catch {
    // Corrupted or hand-edited storage — treat as empty rather than throwing on
    // every page that reads the list.
    return [];
  }
}

function writeMyDocs(docs: MyDoc[]): void {
  if (!isBrowser()) return;
  try {
    const payload: Stored = { v: SCHEMA_VERSION, docs };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage blocked. The document itself is already saved
    // server-side, so failing to record it locally must not surface as an
    // upload error.
  }
}

export function addMyDoc(doc: {
  slug: string;
  owner_token: string;
  title?: string;
  type?: string;
}): void {
  const entry: MyDoc = {
    slug: doc.slug,
    ownerToken: doc.owner_token,
    title: doc.title || "Untitled",
    type: doc.type === "html" ? "html" : "md",
    uploadedAt: new Date().toISOString(),
  };
  // Newest first, and never store the same slug twice.
  writeMyDocs([entry, ...readMyDocs().filter((d) => d.slug !== entry.slug)]);
}

export function removeMyDoc(slug: string): void {
  writeMyDocs(readMyDocs().filter((d) => d.slug !== slug));
}

export function getOwnerToken(slug: string): string | null {
  return readMyDocs().find((d) => d.slug === slug)?.ownerToken ?? null;
}

/**
 * Drop entries the server no longer recognises (deleted elsewhere, or never
 * really owned) and refresh titles, then return the surviving list in local
 * order. Keeps dead links out of the list.
 *
 * On network failure the local list is returned untouched — showing a possibly
 * stale list beats showing nothing.
 */
export async function syncMyDocs(): Promise<MyDoc[]> {
  const local = readMyDocs();
  if (local.length === 0) return [];

  try {
    const res = await fetch("/api/my-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docs: local.map((d) => ({ slug: d.slug, token: d.ownerToken })),
      }),
    });
    if (!res.ok) return local;

    const data = (await res.json()) as {
      docs?: { slug: string; title: string; type: "md" | "html" }[];
    };
    if (!Array.isArray(data.docs)) return local;

    const alive = new Map(data.docs.map((d) => [d.slug, d]));
    const kept = local
      .filter((d) => alive.has(d.slug))
      .map((d) => ({ ...d, title: alive.get(d.slug)!.title || d.title }));

    writeMyDocs(kept);
    return kept;
  } catch {
    return local;
  }
}
