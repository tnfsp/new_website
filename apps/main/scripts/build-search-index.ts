/**
 * Build search index for Pagefind
 * Generates static HTML from content files for Pagefind to index
 */

import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";

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
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>${entry.title}</title>
</head>
<body>
  <article data-pagefind-body>
    <h1>${entry.title}</h1>
    ${entry.type ? `<p class="type">${entry.type}</p>` : ""}
    ${entry.date ? `<p class="date">${entry.date}</p>` : ""}
    <div class="content">
      ${entry.content}
    </div>
    <a href="${entry.url}" data-pagefind-meta="url[href]"></a>
  </article>
</body>
</html>`;
}

async function loadBlogEntries(): Promise<BlogEntry[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    const entries: BlogEntry[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(BLOG_DIR, file);
      const data = await fs.readFile(filePath, "utf-8");
      const entry = JSON.parse(data) as BlogEntry;

      // Skip drafts
      if (entry.status === "draft") continue;

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
