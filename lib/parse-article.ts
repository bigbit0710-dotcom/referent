import * as cheerio from "cheerio";

export type ParsedArticle = {
  date: string | null;
  title: string;
  content: string;
};

const MAX_HTML_BYTES = 600_000;
const MAX_CONTENT_CHARS = 12_000;
const FETCH_TIMEOUT_MS = 10_000;

const BLOCKED_HOSTS = ["amazon.com", "amazon.co.uk", "amazon.de"];

const CONTENT_SELECTORS = [
  "article",
  '[role="article"]',
  ".post",
  ".content",
  ".entry-content",
  ".article-content",
  ".post-content",
  ".article-body",
  ".story-body",
  "main",
];

const DATE_META_SELECTORS = [
  'meta[property="article:published_time"]',
  'meta[name="article:published_time"]',
  'meta[property="og:published_time"]',
  'meta[name="pubdate"]',
  'meta[name="date"]',
  'meta[name="DC.date.issued"]',
  'meta[itemprop="datePublished"]',
];

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncateContent(text: string): string {
  if (text.length <= MAX_CONTENT_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_CONTENT_CHARS)}… [обрезано, всего ${text.length} символов]`;
}

function assertAllowedUrl(url: string) {
  const hostname = new URL(url).hostname.replace(/^www\./, "");

  if (BLOCKED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    throw new Error(
      "Amazon и подобные магазины блокируют автоматическую загрузку. Используйте ссылку на статью или блог.",
    );
  }
}

function assertNotBlockedPage(html: string) {
  const blockedMarkers = [
    "Attention Required",
    "cf-browser-verification",
    "Enable JavaScript and cookies",
    "Access denied",
    "Request blocked",
  ];

  if (blockedMarkers.some((marker) => html.includes(marker))) {
    throw new Error(
      "Сайт заблокировал загрузку с сервера Vercel. Попробуйте другую ссылку или запустите приложение локально (pnpm dev).",
    );
  }
}

function extractDate($: cheerio.CheerioAPI): string | null {
  for (const selector of DATE_META_SELECTORS) {
    const value = $(selector).first().attr("content");
    if (value) {
      return normalizeText(value);
    }
  }

  const timeValue = $("time[datetime]").first().attr("datetime");
  if (timeValue) {
    return normalizeText(timeValue);
  }

  const classDate = $(
    ".date, .published, .post-date, .entry-date, [class*='publish'], [class*='date']",
  )
    .first()
    .text();

  if (classDate) {
    return normalizeText(classDate);
  }

  return null;
}

function extractTitle($: cheerio.CheerioAPI): string {
  const candidates = [
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="twitter:title"]').attr("content"),
    $("article h1").first().text(),
    $("h1").first().text(),
    $("title").first().text(),
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return normalizeText(candidate);
    }
  }

  return "";
}

function extractContentWithCheerio($: cheerio.CheerioAPI): string {
  for (const selector of CONTENT_SELECTORS) {
    const element = $(selector).first().clone();

    if (!element.length) {
      continue;
    }

    element.find("script, style, nav, footer, aside, .comments, .sidebar").remove();
    const text = normalizeText(element.text());

    if (text.length > 100) {
      return text;
    }
  }

  return "";
}

async function extractWithReadability(html: string): Promise<{ title: string; content: string }> {
  try {
    const [{ parseHTML }, { Readability }] = await Promise.all([
      import("linkedom"),
      import("@mozilla/readability"),
    ]);

    const { document } = parseHTML(html);
    const readable = new Readability(document).parse();

    return {
      title: readable?.title ? normalizeText(readable.title) : "",
      content: readable?.textContent ? normalizeText(readable.textContent) : "",
    };
  } catch {
    return { title: "", content: "" };
  }
}

export async function parseArticle(url: string): Promise<ParsedArticle> {
  assertAllowedUrl(url);

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Не удалось открыть ссылку. Проверьте URL — он должен начинаться с https:// и не содержать опечаток.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить страницу (${response.status}). Сайт может блокировать серверы Vercel.`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("По ссылке нет HTML-страницы. Укажите URL статьи или блога.");
  }

  let html = await response.text();
  assertNotBlockedPage(html);

  if (html.length > MAX_HTML_BYTES) {
    html = html.slice(0, MAX_HTML_BYTES);
  }

  const $ = cheerio.load(html);
  const date = extractDate($);
  const readable = await extractWithReadability(html);

  const title = readable.title || extractTitle($);
  let content = readable.content || extractContentWithCheerio($);

  if (!title && !content) {
    throw new Error("Не удалось извлечь заголовок и содержимое статьи");
  }

  return {
    date,
    title: title || "Без заголовка",
    content: truncateContent(content || "Содержимое не найдено"),
  };
}
