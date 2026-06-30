const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function getApiKey(): string {
  const apiKey =
    process.env.OPENROUTER_API_KEY ??
    process.env.OPEROUTER_API_KEY ??
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "API-ключ OpenRouter не найден. Добавьте OPENROUTER_API_KEY в .env.local",
    );
  }

  return apiKey;
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Referent",
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const data = (await response.json()) as OpenRouterResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenRouter error (${response.status})`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenRouter вернул пустой ответ");
  }

  return content;
}
