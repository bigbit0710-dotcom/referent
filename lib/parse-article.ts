import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

export type ParsedArticle = {
  date: string | null;
  title: string;
  content: string;
};

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

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить страницу (${response.status})`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const { document } = dom.window;
  const $ = cheerio.load(html);

  const date = extractDate($);
  const readability = new Readability(document);
  const readable = readability.parse();

  const title = readable?.title
    ? normalizeText(readable.title)
    : extractTitle($);

  let content = readable?.textContent
    ? normalizeText(readable.textContent)
    : "";

  if (!content || content.length < 100) {
    content = extractContentWithCheerio($);
  }

  if (!title && !content) {
    throw new Error("Не удалось извлечь заголовок и содержимое статьи");
  }

  return {
    date,
    title: title || "Без заголовка",
    content: content || "Содержимое не найдено",
  };
}
