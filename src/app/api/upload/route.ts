import { generateSlug, extractTitle, insertDocument } from "@/lib/db";

const MAX_FILE_SIZE = 512 * 1024; // 512KB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    if (!file.name.endsWith(".md")) {
      return Response.json(
        { error: ".md 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "파일 크기는 512KB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const content = await file.text();
    const title = extractTitle(content);

    // Retry slug generation up to 3 times on collision
    let slug = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      slug = generateSlug();
      try {
        const id = crypto.randomUUID();
        await insertDocument(id, slug, title, content);
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

    return Response.json({ slug, title });
  } catch {
    return Response.json(
      { error: "업로드에 실패했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
