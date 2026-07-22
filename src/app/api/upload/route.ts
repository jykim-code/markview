import {
  generateSlug,
  extractTitle,
  extractHtmlTitle,
  insertDocument,
  type DocType,
} from "@/lib/db";

// Body content is stored in R2, so we're bounded by the Workers request body
// limit (~100MB on the free plan) and practical browser rendering, not D1's
// ~2MB per-row cap. 25MB is the generous ceiling for both MD and HTML.
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const corsHeaders = {
  // TODO: Before Chrome Web Store publish, restrict to chrome-extension://<EXTENSION_ID>
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    const isMd = file.name.endsWith(".md");
    const isHtml = file.name.endsWith(".html") || file.name.endsWith(".htm");

    if (!isMd && !isHtml) {
      return Response.json(
        { error: ".md 또는 .html 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    const type: DocType = isHtml ? "html" : "md";

    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: "파일 크기는 25MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const content = await file.text();
    const title = isHtml ? extractHtmlTitle(content) : extractTitle(content);

    // Retry slug generation up to 3 times on collision
    let slug = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      slug = generateSlug();
      try {
        const id = crypto.randomUUID();
        await insertDocument(id, slug, title, content, type);
        break;
      } catch (err: unknown) {
        if (
          attempt === 2 ||
          !(err instanceof Error) ||
          !err.message.includes("UNIQUE")
        ) {
          throw err;
        }
      }
    }

    return Response.json({ slug, title, type }, { headers: corsHeaders });
  } catch {
    return Response.json(
      { error: "업로드에 실패했습니다. 다시 시도해주세요." },
      { status: 500, headers: corsHeaders }
    );
  }
}
