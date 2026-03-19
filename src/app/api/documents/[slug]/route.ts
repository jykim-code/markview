import { updateDocument } from "@/lib/db";

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
