import { parseArticle } from "@/lib/parse-article";
import { translateArticle } from "@/lib/translate-article";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Action = "summary" | "theses" | "telegram" | "translate";

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

    if (!["summary", "theses", "telegram", "translate"].includes(action)) {
      return NextResponse.json({ error: "Неизвестный тип действия" }, { status: 400 });
    }

    const parsed = await parseArticle(url);

    if (action === "translate") {
      const translation = await translateArticle(parsed);
      return NextResponse.json({ translation });
    }

    return NextResponse.json({ parsed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать запрос";

    console.error("[api/analyze]", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
