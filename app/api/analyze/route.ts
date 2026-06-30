import { parseArticle } from "@/lib/parse-article";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

type Action = "summary" | "theses" | "telegram";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string; action?: Action };
    const { url, action } = body;

    if (!url || !action) {
      return NextResponse.json(
        { error: "Укажите URL и тип действия" },
        { status: 400 },
      );
    }

    if (!["summary", "theses", "telegram"].includes(action)) {
      return NextResponse.json({ error: "Неизвестный тип действия" }, { status: 400 });
    }

    const parsed = await parseArticle(url);

    return NextResponse.json({ parsed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать запрос";

    console.error("[api/analyze]", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
