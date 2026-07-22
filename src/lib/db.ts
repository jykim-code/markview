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
}

interface LocalDB {
  documents: Document[];
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
  type: DocType = "md"
): Promise<void> {
  if (isCloudflare()) {
    const db = getD1();
    // Insert metadata first so a slug UNIQUE collision throws before we write
    // the body to R2 (the caller retries with a new slug on collision).
    // The body lives in R2; the D1 content column stays empty for new rows.
    await db
      .prepare(
        "INSERT INTO documents (id, slug, title, content, type) VALUES (?, ?, ?, '', ?)"
      )
      .bind(id, slug, title, type)
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
    const row = await db
      .prepare("SELECT id FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ id: string }>();
    if (!row) return false;
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
    doc.content = content;
    await writeLocalDB(localDB);
    return true;
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
