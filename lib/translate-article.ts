import { chatCompletion } from "@/lib/openrouter";
import type { ParsedArticle } from "@/lib/parse-article";

export async function translateArticle(article: ParsedArticle): Promise<string> {
  const dateLine = article.date ? `Date: ${article.date}\n` : "";

  return chatCompletion([
    {
      role: "system",
      content:
        "You are a professional translator. Translate English articles into natural Russian. Preserve meaning, names, and structure. Return only the translation without comments.",
    },
    {
      role: "user",
      content: `Translate this article to Russian.

Title: ${article.title}
${dateLine}
Content:
${article.content}`,
    },
  ]);
}
