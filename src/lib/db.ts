import { promises as fs } from "fs";
import path from "path";

const LOCAL_DB_PATH = path.join(process.cwd(), ".local-db.json");

interface Document {
  id: string;
  slug: string;
  title: string;
  content: string;
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

// --- Cloudflare D1 ---

function isCloudflare(): boolean {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return !!ctx?.env?.DB;
  } catch {
    return false;
  }
}

function getD1(): D1Database {
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
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
  content: string
): Promise<void> {
  if (isCloudflare()) {
    const db = getD1();
    await db
      .prepare(
        "INSERT INTO documents (id, slug, title, content) VALUES (?, ?, ?, ?)"
      )
      .bind(id, slug, title, content)
      .run();
  } else {
    const localDB = await readLocalDB();
    localDB.documents.push({
      id,
      slug,
      title,
      content,
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
    const result = await db
      .prepare("UPDATE documents SET content = ? WHERE slug = ?")
      .bind(content, slug)
      .run();
    return result.meta.changes > 0;
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
): Promise<{ title: string; content: string } | null> {
  if (isCloudflare()) {
    const db = getD1();
    return await db
      .prepare("SELECT title, content FROM documents WHERE slug = ?")
      .bind(slug)
      .first<{ title: string; content: string }>();
  } else {
    const localDB = await readLocalDB();
    const doc = localDB.documents.find((d) => d.slug === slug);
    return doc ? { title: doc.title, content: doc.content } : null;
  }
}
