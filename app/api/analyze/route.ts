import { NextRequest, NextResponse } from "next/server";

type Action = "summary" | "theses" | "telegram";

const PLACEHOLDERS: Record<Action, string> = {
  summary:
    "Здесь будет краткое описание статьи.\n\nПодключение AI и парсинг статьи — в следующем этапе разработки.",
  theses:
    "• Тезис 1 — будет извлечён из статьи\n• Тезис 2 — будет извлечён из статьи\n• Тезис 3 — будет извлечён из статьи\n\nПодключение AI — в следующем этапе разработки.",
  telegram:
    "📰 Заголовок поста\n\nКраткий анонс статьи на русском языке для Telegram.\n\n🔗 Ссылка на источник\n\n#referent #ai\n\nПодключение AI — в следующем этапе разработки.",
};

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

    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      result: `Источник: ${url}\n\n${PLACEHOLDERS[action]}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось обработать запрос" },
      { status: 500 },
    );
  }
}
