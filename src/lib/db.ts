import { promises as fs } from "fs";
import path from "path";

const LOCAL_DB_PATH = path.join(process.cwd(), ".local-db.json");

export type DocType = "md" | "html";

interface Document {
  id: string;
  slug: string;
  title: string;
  content: string;
  type: DocType;
  created_at: string;
  owner_token_hash?: string | null;
  /** Previous body, kept for one-step revert. Local dev only; R2 uses _prev/. */
  prev_content?: string | null;
}

interface LocalDB {
  documents: Document[];
}

/** Metadata returned for the uploader's own document list. */
export interface OwnedDocument {
  slug: string;
  title: string;
  type: DocType;
  created_at: string;
}

// --- Helpers ---

export function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

export function extractHtmlTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1].replace(/<[^>]+>/g, "").trim()) {
    return titleMatch[1].replace(/<[^>]+>/g, "").trim();
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const text = h1Match[1].replace(/<[^>]+>/g, "").trim();
    if (text) return text;
  }
  return "Untitled";
}

// --- Ownership tokens ---

const OWNER_TOKEN_BYTES = 32;

/**
 * Per-document ownership proof, handed to the uploader once. Only its hash is
 * persisted, so this is the only moment the plaintext exists server-side.
 */
export function generateOwnerToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(OWNER_TOKEN_BYTES));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // base64url so the value is safe in headers and URLs
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function hashOwnerToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent, non-short-circuiting comparison for hex digests. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// --- R2 key layout ---

/**
 * Current body lives at `{slug}`; the one-step-back copy at `_prev/{slug}`.
 *
 * The prev copy deliberately does NOT go to `{slug}/prev` — the multi-file HTML
 * feature (ROADMAP P1) plans to store assets at `{slug}/{path}`, where a real
 * file named `prev` would become indistinguishable from our backup.
 */
function prevKey(slug: string): string {
  return `_prev/${slug}`;
}

/**
 * Bodies above this size skip prev-version capture. R2 has no server-side copy,
 * so keeping a backup costs a full read plus a full write on every save; with a
 * 25MB upload ceiling that would mean ~50MB of extra I/O per keystroke-batch.
 */
const PREV_MAX_BYTES = 5 * 1024 * 1024;

// --- Cloudflare D1 ---

// Lazily resolve the Cloudflare binding context. Kept as require() (not a
// top-level import) so local dev / build without the Workers runtime don't blow
// up loading this module.
function getCloudflareContext(): { env: CloudflareEnv } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@opennextjs/cloudflare");
  return mod.getCloudflareContext();
}

function isCloudflare(): boolean {
  try {
    return !!getCloudflareContext()?.env?.DB;
  } catch {
    return false;
  }
}

function getD1(): D1Database {
  return getCloudflareContext().env.DB;
}

function getR2(): R2Bucket {
  return getCloudflareContext().env.CONTENT;
}

// --- Local file-based DB (dev fallback) ---

async function readLocalDB(): Promise<LocalDB> {
  try {
    const data = await fs.readFile(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { documents: [] };
  }
}

async function writeLocalDB(db: LocalDB): Promise<void> {
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// --- Public API ---

export async function insertDocument(
  id: string,
  slug: string,
  title: string,
  content: string,
  type: DocType = "md",
  ownerTokenHash: string | null = null
): Promise<void> {
  if (isCloudflare()) {
    const db = getD1();
    // Insert metadata first so a slug UNIQUE collision throws before we write
    // the body to R2 (the caller retries with a new slug on collision).
    // The body lives in R2; the D1 content column stays empty for new rows.
    await db
      .prepare(
        "INSERT INTO documents (id, slug, title, content, type, owner_token_hash) VALUES (?, ?, ?, '', ?, ?)"
      )
      .bind(id, slug, title, type, ownerTokenHash)
      .run();
    await getR2().put(slug, content);
  } else {
    const localDB = await readLocalDB();
    localDB.documents.push({
      id,
      slug,
      title,
      content,
      type,
      created_at: new Date().toISOString(),
      owner_token_hash: ownerTokenHash,
      prev_content: null,
    });
    await writeLocalDB(localDB);
  }
}

export async function updateDocument(
  slug: string,
  content: string
): Promise<boolean> {
  if (isCloudflare()) {
    const db = getD1();
    // Confirm the document exists, then write the new body to R2. Clear any
    // legacy inline content so R2 becomes the single source of truth.
    //
    // `content` is selected too: rows written before the R2 migration keep
    // their body in D1, and the prev-version copy has to read from there or it
    // would silently back up an empty string.
    const row = await db
      .prepare("SELECT id, content FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ id: string; content: string }>();
    if (!row) return false;

    await capturePrevVersion(slug, row.content);

    await getR2().put(slug, content);
    await db
      .prepare("UPDATE documents SET content = '' WHERE slug = ?")
      .bind(slug)
      .run();
    return true;
  } else {
    const localDB = await readLocalDB();
    const doc = localDB.documents.find((d) => d.slug === slug);
    if (!doc) return false;
    doc.prev_content = doc.content;
    doc.content = content;
    await writeLocalDB(localDB);
    return true;
  }
}

/**
 * Copy the body that is about to be overwritten into the prev slot. Best
 * effort: a failure here must not block the user's save, since losing the
 * backup is strictly better than losing the edit.
 */
async function capturePrevVersion(
  slug: string,
  legacyInlineContent: string
): Promise<void> {
  try {
    const r2 = getR2();
    const existing = await r2.get(slug);
    if (existing) {
      if (existing.size > PREV_MAX_BYTES) return;
      await r2.put(prevKey(slug), await existing.arrayBuffer());
      return;
    }
    // Legacy row: body still in the D1 content column. Such rows predate the
    // 25MB ceiling and sit under D1's ~2MB per-row cap, so no size check.
    if (legacyInlineContent) {
      await r2.put(prevKey(slug), legacyInlineContent);
    }
  } catch {
    // Swallow — see doc comment.
  }
}

/**
 * Fetch only title+type from D1 — no R2 call. Used for SSR metadata/shell
 * so the Worker doesn't serialise large content into the RSC payload.
 */
export async function getDocumentMeta(
  slug: string
): Promise<{ title: string; type: DocType } | null> {
  if (isCloudflare()) {
    const row = await getD1()
      .prepare("SELECT title, type FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ title: string; type: string }>();
    if (!row) return null;
    return { title: row.title, type: (row.type as DocType) || "md" };
  } else {
    const localDB = await readLocalDB();
    const doc = localDB.documents.find((d) => d.slug === slug);
    return doc ? { title: doc.title, type: doc.type || "md" } : null;
  }
}

export async function getDocumentBySlug(
  slug: string
): Promise<{ title: string; content: string; type: DocType } | null> {
  if (isCloudflare()) {
    const db = getD1();
    const row = await db
      .prepare("SELECT title, content, type FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ title: string; content: string; type: string }>();
    if (!row) return null;
    // Body lives in R2; fall back to the D1 content column for legacy rows
    // written before the R2 migration.
    const obj = await getR2().get(slug);
    const content = obj ? await obj.text() : row.content;
    return { title: row.title, content, type: (row.type as DocType) || "md" };
  } else {
    const localDB = await readLocalDB();
    const doc = localDB.documents.find((d) => d.slug === slug);
    return doc
      ? { title: doc.title, content: doc.content, type: doc.type || "md" }
      : null;
  }
}

/**
 * True when the caller's plaintext token matches the stored hash.
 *
 * Rows with a NULL hash (uploaded before ownership existed) never match, so
 * they can't be deleted by anyone. That is the accepted cost of not applying
 * ownership retroactively.
 */
export async function verifyOwnerToken(
  slug: string,
  token: string
): Promise<boolean> {
  const candidate = await hashOwnerToken(token);

  if (isCloudflare()) {
    const row = await getD1()
      .prepare("SELECT owner_token_hash FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ owner_token_hash: string | null }>();
    if (!row?.owner_token_hash) return false;
    return constantTimeEqual(row.owner_token_hash, candidate);
  } else {
    const localDB = await readLocalDB();
    const doc = localDB.documents.find((d) => d.slug === slug);
    if (!doc?.owner_token_hash) return false;
    return constantTimeEqual(doc.owner_token_hash, candidate);
  }
}

export async function deleteDocument(slug: string): Promise<boolean> {
  if (isCloudflare()) {
    const db = getD1();
    const row = await db
      .prepare("SELECT id FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ id: string }>();
    if (!row) return false;
    await getR2().delete([slug, prevKey(slug)]);
    await db.prepare("DELETE FROM documents WHERE slug = ?").bind(slug).run();
    return true;
  } else {
    const localDB = await readLocalDB();
    const before = localDB.documents.length;
    localDB.documents = localDB.documents.filter((d) => d.slug !== slug);
    if (localDB.documents.length === before) return false;
    await writeLocalDB(localDB);
    return true;
  }
}

export async function hasPrevVersion(slug: string): Promise<boolean> {
  if (isCloudflare()) {
    return !!(await getR2().head(prevKey(slug)));
  } else {
    const localDB = await readLocalDB();
    const doc = localDB.documents.find((d) => d.slug === slug);
    return typeof doc?.prev_content === "string";
  }
}

/**
 * Swap the current body with the prev copy and return the restored text.
 *
 * A swap (rather than a one-way restore) means reverting twice lands back where
 * you started, which is the least surprising behaviour with a single backup
 * slot. Returns null when there is nothing to revert to.
 */
export async function revertDocument(slug: string): Promise<string | null> {
  if (isCloudflare()) {
    const db = getD1();
    const row = await db
      .prepare("SELECT id, content FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ id: string; content: string }>();
    if (!row) return null;

    const r2 = getR2();
    const prev = await r2.get(prevKey(slug));
    if (!prev) return null;
    const restored = await prev.text();

    const current = await r2.get(slug);
    const displaced = current ? await current.text() : row.content;

    await r2.put(slug, restored);
    await r2.put(prevKey(slug), displaced);
    await db
      .prepare("UPDATE documents SET content = '' WHERE slug = ?")
      .bind(slug)
      .run();
    return restored;
  } else {
    const localDB = await readLocalDB();
    const doc = localDB.documents.find((d) => d.slug === slug);
    if (!doc || typeof doc.prev_content !== "string") return null;
    const restored = doc.prev_content;
    doc.prev_content = doc.content;
    doc.content = restored;
    await writeLocalDB(localDB);
    return restored;
  }
}

/**
 * Resolve the uploader's local list against the server, returning only entries
 * whose token checks out.
 *
 * Requiring a token per slug is what keeps this from being a slug-existence
 * oracle: slugs are 8 hex chars (32 bits), so an endpoint that confirmed
 * existence from a slug alone would help enumerate other people's documents.
 */
export async function getOwnedDocuments(
  entries: { slug: string; token: string }[]
): Promise<OwnedDocument[]> {
  if (entries.length === 0) return [];

  const wanted = new Map<string, string>();
  for (const { slug, token } of entries) {
    if (typeof slug === "string" && typeof token === "string") {
      wanted.set(slug, token);
    }
  }
  if (wanted.size === 0) return [];

  const slugs = [...wanted.keys()];
  let rows: {
    slug: string;
    title: string;
    type: string;
    created_at: string;
    owner_token_hash: string | null;
  }[];

  if (isCloudflare()) {
    const placeholders = slugs.map(() => "?").join(", ");
    const result = await getD1()
      .prepare(
        `SELECT slug, title, type, created_at, owner_token_hash
         FROM documents WHERE slug IN (${placeholders})`
      )
      .bind(...slugs)
      .all<{
        slug: string;
        title: string;
        type: string;
        created_at: string;
        owner_token_hash: string | null;
      }>();
    rows = result.results ?? [];
  } else {
    const localDB = await readLocalDB();
    rows = localDB.documents
      .filter((d) => wanted.has(d.slug))
      .map((d) => ({
        slug: d.slug,
        title: d.title,
        type: d.type,
        created_at: d.created_at,
        owner_token_hash: d.owner_token_hash ?? null,
      }));
  }

  const owned: OwnedDocument[] = [];
  for (const row of rows) {
    if (!row.owner_token_hash) continue;
    const candidate = await hashOwnerToken(wanted.get(row.slug)!);
    if (!constantTimeEqual(row.owner_token_hash, candidate)) continue;
    owned.push({
      slug: row.slug,
      title: row.title,
      type: (row.type as DocType) || "md",
      created_at: row.created_at,
    });
  }
  return owned;
}
