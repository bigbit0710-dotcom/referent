"use client";

import { FormEvent, useState } from "react";

type Action = "summary" | "theses" | "telegram" | "translate";

const ACTIONS: { id: Action; label: string; description: string }[] = [
  {
    id: "translate",
    label: "Перевод",
    description: "Полный перевод статьи на русский",
  },
  {
    id: "summary",
    label: "О чем статья?",
    description: "Краткое описание содержания статьи",
  },
  {
    id: "theses",
    label: "Тезисы",
    description: "Ключевые тезисы и выводы",
  },
  {
    id: "telegram",
    label: "Пост для Telegram",
    description: "Готовый пост для публикации",
  },
];

const ACTION_TITLES: Record<Action, string> = {
  translate: "Перевод",
  summary: "О чем статья",
  theses: "Тезисы",
  telegram: "Пост для Telegram",
};

function isValidUrl(value: string) {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    if (/https?:\/\/.*https?:\/\//i.test(trimmed)) {
      return false;
    }

    const host = url.hostname;
    if (!host || host.includes(" ") || host === "whttps") {
      return false;
    }

    if (host !== "localhost" && !host.includes(".")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function readApiResponse(response: Response) {
  const raw = await response.text();

  try {
    return JSON.parse(raw) as {
      parsed?: { date: string | null; title: string; content: string };
      translation?: string;
      error?: string;
    };
  } catch {
    if (raw.trimStart().startsWith("<!DOCTYPE") || raw.trimStart().startsWith("<html")) {
      throw new Error(
        `Сервер вернул HTML вместо JSON (${response.status}). Перезапустите деплой на Vercel или проверьте /api/analyze.`,
      );
    }

    throw new Error("Сервер вернул некорректный ответ");
  }
}

export default function ReferentApp() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [resultMode, setResultMode] = useState<"text" | "json">("json");
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(action: Action) {
    setError("");

    if (!url.trim()) {
      setError("Введите URL англоязычной статьи");
      setResult("");
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError("Укажите корректный URL (например: https://example.com/article). Проверьте, что нет опечаток вроде whttps://");
      setResult("");
      return;
    }

    setActiveAction(action);
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), action }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось обработать статью");
      }

      if (action === "translate") {
        setResultMode("text");
        setResult(data.translation ?? "");
      } else {
        setResultMode("json");
        setResult(JSON.stringify(data.parsed, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      setResult("");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleAction("translate");
  }

  const loadingText =
    activeAction === "translate"
      ? "Парсим статью и переводим…"
      : "Загружаем и парсим статью…";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-sky-400">
          Referent
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Референт с английского
        </h1>
        <p className="mt-3 text-slate-400">
          Программа-референт с английского на базе ИИ.{" "}
          <span className="text-lg font-bold text-white">Я изучаю Next.js!</span>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="article-url"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            URL англоязычной статьи
          </label>
          <input
            id="article-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/article"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={loading}
              onClick={() => void handleAction(action.id)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-left transition hover:border-sky-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="block font-semibold text-white">{action.label}</span>
              <span className="mt-1 block text-sm text-slate-400">
                {action.description}
              </span>
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="mt-8 flex flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Результат</h2>
          {activeAction && (
            <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300">
              {ACTION_TITLES[activeAction]}
            </span>
          )}
        </div>

        <div className="min-h-64 flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          {loading ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
              <p>{loadingText}</p>
            </div>
          ) : result ? (
            resultMode === "json" ? (
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-slate-200 sm:text-base">
                {result}
              </pre>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200 sm:text-base">
                {result}
              </div>
            )
          ) : (
            <p className="text-sm leading-7 text-slate-500">
              Вставьте ссылку на статью и выберите действие. Кнопка «Перевод»
              покажет текст на русском, остальные — JSON с датой, заголовком и
              содержимым.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
