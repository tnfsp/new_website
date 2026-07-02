/**
 * Build search index for Pagefind
 * Generates static HTML from content files for Pagefind to index
 */

import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import { escapeHtml } from "../lib/escape-html.js";

const CONTENT_DIR = path.join(process.cwd(), "content");
const BLOG_DIR = path.join(CONTENT_DIR, "blog");
const PROJECTS_PATH = path.join(CONTENT_DIR, "projects.json");
const SEARCH_DIR = path.join(process.cwd(), ".search-index");
const OUTPUT_DIR = path.join(process.cwd(), "public", "pagefind");

type BlogEntry = {
  slug: string;
  title: string;
  type?: string;
  status?: string;
  publishedAt?: string;
  content?: string;
  contentHtml?: string;
  description?: string;
  excerpt?: string;
};

type DailyEntry = {
  slug: string;
  title: string;
  type?: string;
  status?: string;
  date?: string;
  content?: string;
  contentHtml?: string;
  excerpt?: string;
};

function generateHtml(entry: { title: string; url: string; content: string; type?: string; date?: string }): string {
  // title/type/date 是純文字，插進 HTML 前要 escape（content 本身就是 HTML，維持原樣）
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(entry.title)}</title>
</head>
<body>
  <article data-pagefind-body>
    <h1>${escapeHtml(entry.title)}</h1>
    ${entry.type ? `<p class="type">${escapeHtml(entry.type)}</p>` : ""}
    ${entry.date ? `<p class="date">${escapeHtml(entry.date)}</p>` : ""}
    <div class="content">
      ${entry.content}
    </div>
    <a href="${escapeHtml(entry.url)}" data-pagefind-meta="url[href]"></a>
  </article>
</body>
</html>`;
}

/** 今天的日期（台北時區，YYYY-MM-DD），拿來擋還沒到發布日的排程文章 */
const TODAY_TAIPEI = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(
  new Date()
);

async function loadBlogEntries(): Promise<BlogEntry[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    const entries: BlogEntry[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(BLOG_DIR, file);
      const data = await fs.readFile(filePath, "utf-8");
      const entry = JSON.parse(data) as BlogEntry;

      // 和站台一致的發布慣例：管線寫的是 status: "Published"（不是 "draft"），
      // 非 Published 或發布日還沒到（台北時區）的文章都不能進公開搜尋索引。
      if ((entry.status || "Published") !== "Published") continue;
      if (entry.publishedAt && entry.publishedAt.slice(0, 10) > TODAY_TAIPEI) continue;

      entries.push({
        ...entry,
        slug: entry.slug || file.replace(".json", ""),
      });
    }

    return entries;
  } catch (error) {
    console.warn("Failed to load blog entries:", error);
    return [];
  }
}

async function loadDailyEntries(): Promise<DailyEntry[]> {
  try {
    const data = await fs.readFile(PROJECTS_PATH, "utf-8");
    const entries = JSON.parse(data) as DailyEntry[];
    return entries.filter(entry => entry.status?.toLowerCase() !== "draft");
  } catch (error) {
    console.warn("Failed to load daily entries:", error);
    return [];
  }
}

async function main() {
  console.log("🔍 Building search index...");

  // Clean up previous index
  await fs.rm(SEARCH_DIR, { recursive: true, force: true });
  await fs.mkdir(SEARCH_DIR, { recursive: true });
  await fs.mkdir(path.join(SEARCH_DIR, "blog"), { recursive: true });
  await fs.mkdir(path.join(SEARCH_DIR, "daily"), { recursive: true });

  // Load content
  const blogEntries = await loadBlogEntries();
  const dailyEntries = await loadDailyEntries();

  console.log(`📝 Found ${blogEntries.length} blog entries`);
  console.log(`📝 Found ${dailyEntries.length} daily entries`);

  // Generate HTML for blog entries
  for (const entry of blogEntries) {
    const content = entry.contentHtml || entry.content || entry.excerpt || "";
    const html = generateHtml({
      title: entry.title,
      url: `/blog/${entry.slug}`,
      content: content,
      type: entry.type,
      date: entry.publishedAt,
    });
    await fs.writeFile(path.join(SEARCH_DIR, "blog", `${entry.slug}.html`), html);
  }

  // Generate HTML for daily entries
  for (const entry of dailyEntries) {
    const content = entry.contentHtml || entry.content || entry.excerpt || "";
    const html = generateHtml({
      title: entry.title,
      url: `/daily/${entry.slug}`,
      content: content,
      type: entry.type,
      date: entry.date,
    });
    await fs.writeFile(path.join(SEARCH_DIR, "daily", `${entry.slug}.html`), html);
  }

  // Run Pagefind
  console.log("🔎 Running Pagefind...");
  try {
    execSync(`npx pagefind --site "${SEARCH_DIR}" --output-path "${OUTPUT_DIR}"`, {
      stdio: "inherit",
    });
    console.log("✅ Search index built successfully!");
  } catch (error) {
    console.error("❌ Failed to run Pagefind:", error);
    process.exit(1);
  }

  // Clean up temporary directory
  await fs.rm(SEARCH_DIR, { recursive: true, force: true });
}

// postbuild：這裡失敗必須讓 build 一起失敗，
// 不然壞掉的搜尋索引會以「成功」之姿上 production
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
