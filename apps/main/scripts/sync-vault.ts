/**
 * sync-vault.ts
 * Reads Obsidian Vault Brand/ folder and produces JSON files
 * matching the exact format of sync-notion.ts output.
 */

import { config as loadEnv } from "dotenv";
import matter from "gray-matter";
import { Marked } from "marked";
import { existsSync } from "fs";
import { readFile, readdir, mkdir, stat, copyFile } from "fs/promises";
import path from "path";
import { withSyncLock } from "./lib/sync-lock.js";
import { writeFileAtomic } from "./lib/write-file-atomic.js";

loadEnv({ path: ".env.local" });

// ─── paths ───────────────────────────────────────────────────────────
// Vault location: OBSIDIAN_VAULT_PATH env var wins; otherwise fall back to
// the default iCloud Obsidian vault path (backward compatible).
const DEFAULT_VAULT_ROOT = path.join(
  process.env.HOME || "/Users/zhaoyixiang",
  "Library/Mobile Documents/iCloud~md~obsidian/Documents/Wilson"
);
const VAULT_ROOT = process.env.OBSIDIAN_VAULT_PATH?.trim() || DEFAULT_VAULT_ROOT;

if (!existsSync(VAULT_ROOT)) {
  console.error(
    [
      `[sync-vault] Obsidian vault not found: ${VAULT_ROOT}`,
      process.env.OBSIDIAN_VAULT_PATH?.trim()
        ? "[sync-vault] OBSIDIAN_VAULT_PATH points to a path that does not exist. Please fix it in .env.local."
        : "[sync-vault] Default iCloud vault path does not exist on this machine. Please set OBSIDIAN_VAULT_PATH (in .env.local or the environment) to your Obsidian vault root.",
    ].join("\n")
  );
  process.exit(1);
}
const VAULT_BASE = path.join(VAULT_ROOT, "Brand");
const VAULT_BLOG = path.join(VAULT_BASE, "Blog");
const VAULT_DAILY = path.join(VAULT_BASE, "Daily");
const VAULT_WEEKLY = path.join(VAULT_BASE, "週報");
const VAULT_CONFIG = path.join(VAULT_BASE, "Config");

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");
const PROJECTS_PATH = path.join(ROOT, "content", "projects.json");
const SITE_CONFIG_PATH = path.join(ROOT, "content", "site", "config.json");
const BLOG_ASSET_DIR = path.join(ROOT, "public", "content", "blog");

// ─── types (match sync-notion output) ────────────────────────────────
type BlogEntry = {
  id: string;
  slug: string;
  title: string;
  type?: string;
  status?: string;
  publishedAt?: string;
  content: string;
  contentHtml?: string;
  description?: string;
  excerpt?: string;
  readingTime?: string;
  tags?: string[];
  image?: string;
  related?: string[];
};



type SiteConfig = Record<string, string>;

// ─── helpers ─────────────────────────────────────────────────────────
function estimateReadingTime(text: string): string {
  const plain = text.replace(/\s+/g, " ").trim();
  const asciiWords = plain.split(/\s+/).filter(Boolean).length;
  const cjkChars =
    plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length || 0;
  const words = asciiWords + cjkChars;
  if (!words) return "";
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min`;
}

function buildExcerpt(text: string): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length > 200 ? `${plain.slice(0, 200)}...` : plain;
}

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function listMdFiles(dir: string): Promise<string[]> {
  if (!(await dirExists(dir))) return [];
  const files = await readdir(dir);
  return files.filter((f) => f.endsWith(".md")).map((f) => path.join(dir, f));
}

/** Strip plain text from markdown (rough) */
function stripMd(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images
    .replace(/!?\[\[([^\]]*)\]\]/g, "") // obsidian embeds
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~`>]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── image handling ──────────────────────────────────────────────────
/**
 * Convert Obsidian image references to web paths and copy files.
 * Supports:
 *  - ![alt](relative-path)
 *  - ![[_attachments/images/file.jpg]]
 *  - ![alt](cover.png)  (relative to _assets/{slug}/)
 */
async function processImages(
  markdown: string,
  slug: string,
  sourceDir: string,
  assetsSubdir: string, // "blog" or "projects"
  assetRoot: string,
  publicBase: string
): Promise<{ markdown: string; coverImage?: string }> {
  let cover: string | undefined;
  const destDir = path.join(assetRoot, slug);

  // Helper to copy a file and return public path
  async function copyAsset(srcPath: string, filename: string): Promise<string | undefined> {
    try {
      await stat(srcPath);
    } catch {
      return undefined;
    }
    await mkdir(destDir, { recursive: true });
    const dest = path.join(destDir, filename);
    await copyFile(srcPath, dest);
    return `${publicBase}/${slug}/${filename}`;
  }

  // Fallback: recursive search entire Vault for a filename.
  // execFileSync（參數陣列）而不是 execSync（字串插值）——
  // 筆記裡的檔名是不可信輸入，字串插值會讓 $(...)、反引號被 shell 展開。
  async function findInVault(filename: string): Promise<string | undefined> {
    const { execFileSync } = await import("child_process");
    try {
      const result = execFileSync(
        "find",
        [VAULT_ROOT, "-name", filename, "-type", "f"],
        { encoding: "utf-8", timeout: 10000 }
      )
        .split("\n")[0]
        .trim();
      return result || undefined;
    } catch {
      return undefined;
    }
  }

  // Process ![[...]] Obsidian embeds
  const obsidianEmbedRe = /!\[\[([^\]]+)\]\]/g;
  let result = markdown;
  const obsidianMatches = [...markdown.matchAll(obsidianEmbedRe)];
  for (const m of obsidianMatches) {
    const ref = m[1];
    // Try _attachments path relative to vault base
    const filename = path.basename(ref);
    const candidates = [
      // 1. Relative to source file's directory
      path.join(sourceDir, ref),
      path.join(sourceDir, "_attachments", "images", filename),
      // 2. Relative to Brand/ (VAULT_BASE)
      path.join(VAULT_BASE, ref),
      path.join(VAULT_BASE, "_attachments", "images", filename),
      // 3. Relative to Vault root (VAULT_ROOT) — images live here
      path.join(VAULT_ROOT, ref),
      path.join(VAULT_ROOT, "_attachments", "images", filename),
      path.join(VAULT_ROOT, "_attachments", "images", "journal", filename),
      path.join(VAULT_ROOT, "_attachments", "images", "movies", filename),
      // 4. Journal attachments & Inbox (for weekly reports referencing journal images)
      path.join(VAULT_ROOT, "1-Journal", "attachments", filename),
      path.join(VAULT_ROOT, "1-Journal", ref),
      path.join(VAULT_ROOT, "0-Inbox", filename),
      // 5. Vault _attachments root (non-images subfolder)
      path.join(VAULT_ROOT, "_attachments", filename),
    ];
    let publicPath: string | undefined;
    for (const candidate of candidates) {
      publicPath = await copyAsset(candidate, filename);
      if (publicPath) break;
    }
    // Fallback: recursive Vault search
    if (!publicPath) {
      const found = await findInVault(filename);
      if (found) publicPath = await copyAsset(found, filename);
    }
    if (publicPath) {
      console.log(`[sync-vault] Image found: ${filename}`);
      const encodedPath = publicPath.replace(/ /g, "%20");
      result = result.replace(m[0], `![image](${encodedPath})`);
      if (!cover) cover = publicPath;
    } else {
      console.warn(`[sync-vault] Image NOT FOUND (all candidates failed): ${ref}`);
      // Remove broken embed
      result = result.replace(m[0], "");
    }
  }

  // Process ![alt](path) standard markdown images
  const mdImageRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const mdMatches = [...result.matchAll(mdImageRe)];
  for (const m of mdMatches) {
    const alt = m[1];
    const ref = m[2];
    // Already-processed absolute web paths — still track first as cover
    if (ref.startsWith("/content/") || ref.startsWith("http")) {
      if (!cover) cover = ref;
      continue;
    }

    const filename = path.basename(ref);
    // Look in _assets/{slug}/ first, then relative to source dir
    const assetsDir = path.join(sourceDir, "_assets", slug);
    const candidates = [
      path.join(assetsDir, filename),
      path.join(sourceDir, ref),
      path.join(sourceDir, "_assets", ref),
    ];
    let publicPath: string | undefined;
    for (const candidate of candidates) {
      publicPath = await copyAsset(candidate, filename);
      if (publicPath) break;
    }
    // Fallback: recursive Vault search
    if (!publicPath) {
      const found = await findInVault(filename);
      if (found) publicPath = await copyAsset(found, filename);
    }
    if (publicPath) {
      const encodedPath = publicPath.replace(/ /g, "%20");
      result = result.replace(m[0], `![${alt}](${encodedPath})`);
      if (!cover) cover = publicPath;
    }
  }

  return { markdown: result, coverImage: cover };
}

// ─── markdown → HTML renderer (Notion-style) ────────────────────────
const marked = new Marked();

function mdToHtml(md: string): string {
  // marked.parse can return string | Promise<string>; we force sync
  const raw = marked.parse(md, { async: false }) as string;
  // Post-process to match Notion-style output:
  // - Wrap standalone images in <figure>
  const html = raw.replace(
    /<p>\s*<img\s+src="([^"]+)"\s+alt="([^"]*)"\s*\/?>\s*<\/p>/g,
    '<figure><img src="$1" alt="$2" /></figure>'
  );
  return html;
}

// ─── frontmatter helpers ─────────────────────────────────────────────

/**
 * slug 會被拿去 path.join 寫檔（content/blog/<slug>.json、asset 目錄），
 * frontmatter 是不可信輸入：`slug: ../../lib/x` 會寫到 blog 目錄外。
 * 只保留 letter/number/dash/underscore（含中文），其餘替換成 dash。
 */
function safeSlug(fmSlug: unknown, file: string): string {
  const raw = String(fmSlug || path.basename(file, ".md")).trim();
  const cleaned = raw.replace(/[^\p{L}\p{N}_-]/gu, "-").replace(/^-+|-+$/g, "");
  if (cleaned !== raw) {
    console.warn(`[sync-vault] ⚠️  slug "${raw}" 含非法字元，已正規化為 "${cleaned}"（${path.basename(file)}）`);
  }
  return cleaned;
}

/**
 * 日期正規化成台北時區的 YYYY-MM-DD。
 * gray-matter 把 `date: 2026-07-02` 解析成 UTC 午夜的 Date（安全），
 * 但帶時間+時差的日期（如 2026-07-02T00:30+08:00）用 toISOString 切
 * 會變成前一天——所以 Date 物件一律用 Asia/Taipei 格式化。
 */
const TAIPEI_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" });
function normalizeDate(rawDate: unknown): string {
  if (rawDate instanceof Date) return TAIPEI_DATE.format(rawDate);
  return rawDate ? String(rawDate).slice(0, 10) : "";
}

/** YAML `tags: diary` 會解析成 string，統一包成 string[]。 */
function normalizeTags(rawTags: unknown): string[] {
  if (Array.isArray(rawTags)) return rawTags.map(String);
  return rawTags ? [String(rawTags)] : [];
}

// ─── Blog sync ───────────────────────────────────────────────────────
async function syncBlog(): Promise<BlogEntry[]> {
  const files = await listMdFiles(VAULT_BLOG);
  const entries: BlogEntry[] = [];

  for (const file of files) {
    const raw = await readFile(file, "utf-8");
    const { data: fm, content: body } = matter(raw);

    if (fm.published === false) continue;

    // Warn if description missing (controls excerpt length on list page)
    if (!fm.description) {
      console.warn(`[sync-vault] ⚠️  Blog "${path.basename(file)}" missing frontmatter 'description' — excerpt will be auto-generated (may be too long)`);
    }

    const slug = safeSlug(fm.slug, file);
    const title = fm.title || path.basename(file, ".md");

    // Strip leading H1 if it matches frontmatter title (avoid duplicate)
    let cleanBody = body;
    const h1Match = cleanBody.match(/^\s*#\s+(.+)\n?/);
    if (h1Match) {
      const h1Text = h1Match[1].trim().replace(/\*{1,2}/g, "");
      if (h1Text === title.trim()) {
        cleanBody = cleanBody.replace(/^\s*#\s+.+\n?/, "");
      }
    }

    const { markdown: processedMd, coverImage } = await processImages(
      cleanBody,
      slug,
      VAULT_BLOG,
      "blog",
      BLOG_ASSET_DIR,
      "/content/blog"
    );

    const contentHtml = mdToHtml(processedMd);
    const plainText = stripMd(processedMd);
    const readingTime = estimateReadingTime(plainText);
    const description = fm.description || "";
    const excerpt = description || buildExcerpt(plainText);

    // Handle cover from frontmatter or first image in body
    let image: string | undefined;
    if (fm.cover) {
      const coverFilename = fm.cover;
      const candidates = [
        path.join(VAULT_BLOG, "_assets", slug, coverFilename),
        path.join(VAULT_BLOG, coverFilename),
        path.join(VAULT_BASE, "_attachments", "images", coverFilename),
        // Check pre-existing covers directory
        path.join(BLOG_ASSET_DIR, "covers", coverFilename),
      ];
      for (const candidate of candidates) {
        try {
          await stat(candidate);
          // If already in covers/ dir, use that path directly (no copy needed)
          if (candidate.includes(path.join("covers", coverFilename))) {
            image = `/content/blog/covers/${coverFilename}`;
          } else {
            const destDir = path.join(BLOG_ASSET_DIR, slug);
            await mkdir(destDir, { recursive: true });
            const dest = path.join(destDir, `cover${path.extname(coverFilename)}`);
            await copyFile(candidate, dest);
            image = `/content/blog/${slug}/cover${path.extname(coverFilename)}`;
          }
          break;
        } catch {
          // try next
        }
      }
    }
    if (!image && coverImage) {
      image = coverImage;
    }

    entries.push({
      id: fm.id || slug,
      slug,
      title,
      type: fm.type || "",
      status: "Published",
      publishedAt: normalizeDate(fm.date),
      content: processedMd.trim(),
      contentHtml,
      description: description || undefined,
      excerpt,
      readingTime,
      tags: normalizeTags(fm.tags),
      ...(image ? { image } : {}),
      ...(fm.related?.length ? { related: fm.related } : {}),
    });
  }

  // Sort by date descending
  entries.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return entries;
}

// ─── Daily / 週報 sync ──────────────────────────────────────────────
async function syncProjects(): Promise<BlogEntry[]> {
  const dailyFiles = await listMdFiles(VAULT_DAILY);
  const weeklyFiles = await listMdFiles(VAULT_WEEKLY);
  const entries: BlogEntry[] = [];

  for (const file of [...dailyFiles, ...weeklyFiles]) {
    const raw = await readFile(file, "utf-8");
    const { data: fm, content: body } = matter(raw);

    if (fm.published === false) continue;

    const isWeekly = file.startsWith(VAULT_WEEKLY);
    const slug = safeSlug(fm.slug, file);
    const title = fm.title || path.basename(file, ".md");
    const type = fm.type || (isWeekly ? "weekly" : "life");
    const sourceDir = isWeekly ? VAULT_WEEKLY : VAULT_DAILY;
    const dateStr = normalizeDate(fm.date);

    // Strip leading H1 if it matches frontmatter title (avoid duplicate)
    let cleanBody = body;
    const h1Match = cleanBody.match(/^\s*#\s+(.+)\n?/);
    if (h1Match) {
      const h1Text = h1Match[1].trim().replace(/\*{1,2}/g, "");
      if (h1Text === title.trim()) {
        cleanBody = cleanBody.replace(/^\s*#\s+.+\n?/, "");
      }
    }

    const { markdown: processedMd, coverImage } = await processImages(
      cleanBody,
      slug,
      sourceDir,
      "blog",
      BLOG_ASSET_DIR,
      "/content/blog"
    );

    // Handle cover from frontmatter or first image
    let image: string | undefined;
    if (fm.cover) {
      const coverFilename = fm.cover;
      const assetsDir = path.join(sourceDir, "_assets", slug);
      const candidates = [
        path.join(assetsDir, coverFilename),
        path.join(sourceDir, coverFilename),
        path.join(BLOG_ASSET_DIR, "covers", coverFilename),
      ];
      for (const candidate of candidates) {
        try {
          await stat(candidate);
          if (candidate.includes("/covers/")) {
            image = `/content/blog/covers/${coverFilename}`;
          } else {
            const destDir = path.join(BLOG_ASSET_DIR, slug);
            await mkdir(destDir, { recursive: true });
            const dest = path.join(destDir, `cover${path.extname(coverFilename)}`);
            await copyFile(candidate, dest);
            image = `/content/blog/${slug}/cover${path.extname(coverFilename)}`;
          }
          break;
        } catch {
          // try next
        }
      }
    }
    if (!image && coverImage) {
      image = coverImage;
    }

    const contentHtml = mdToHtml(processedMd);
    const plainText = stripMd(processedMd);
    const readingTime = estimateReadingTime(plainText);
    const description = fm.description || "";
    const excerpt = description || buildExcerpt(plainText);

    entries.push({
      id: fm.id || slug,
      slug,
      title,
      type,
      status: "Published",
      publishedAt: dateStr,
      content: processedMd.trim(),
      contentHtml,
      description: description || undefined,
      excerpt,
      readingTime,
      tags: normalizeTags(fm.tags),
      ...(image ? { image } : {}),
    });
  }

  // Sort by date descending
  entries.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return entries;
}

// ─── Config sync ─────────────────────────────────────────────────────
const CONFIG_MAP: Record<string, Record<string, string>> = {
  "Home.md": {
    title: "HomepageHeroTitle",
    subtitle: "HomepageHeroSubtitle",
    cta: "HomepageCTA",
    intro: "HomepageIntro",
    murmur_intro: "HomepageMurmurIntro",
    murmur_cta: "HomepageMurmurCTA",
  },
  "About.md": {
    name: "AboutName",
    intro: "AboutPageIntro",
    // body → AboutPageBody (special: markdown body)
  },
  "Links.md": {
    title: "LinksPageTitle",
    intro: "LinksPageIntro",
  },
  "Footer.md": {
    text: "FooterText",
  },
  "Blog.md": {
    title: "BlogPageTitle",
    intro: "BlogPageIntro",
  },
  "Daily.md": {
    title: "ProjectsPageTitle",
    intro: "ProjectsPageIntro",
  },
};

async function syncConfig(): Promise<SiteConfig> {
  // Start with existing config to preserve values not yet in vault
  let existing: SiteConfig = {};
  try {
    const raw = await readFile(SITE_CONFIG_PATH, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    // no existing config
  }

  const config: SiteConfig = { ...existing };

  if (!(await dirExists(VAULT_CONFIG))) {
    console.log("[sync-vault] Config dir not found, keeping existing config.json");
    return config;
  }

  const files = await readdir(VAULT_CONFIG);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const raw = await readFile(path.join(VAULT_CONFIG, file), "utf-8");
    const { data: fm, content: body } = matter(raw);
    const mapping = CONFIG_MAP[file];
    if (!mapping) {
      console.warn(`[sync-vault] No config mapping for ${file}, skipping`);
      continue;
    }

    // Map frontmatter keys
    for (const [fmKey, configKey] of Object.entries(mapping)) {
      if (fm[fmKey] !== undefined) {
        config[configKey] = String(fm[fmKey]);
      }
    }

    // Special: About.md body → AboutPageBody
    if (file === "About.md" && body.trim()) {
      config["AboutPageBody"] = body.trim();
    }
  }

  return config;
}

// ─── write helpers ───────────────────────────────────────────────────
async function writeBlogEntries(entries: BlogEntry[]) {
  await mkdir(BLOG_DIR, { recursive: true });
  const seen = new Map<string, string>();
  for (const entry of entries) {
    // Blog/、Daily/、週報/ 之間同名檔案會靜默互吃（last write wins）——至少要吼一聲
    const prev = seen.get(entry.slug);
    if (prev) {
      console.warn(
        `[sync-vault] ⚠️  slug 衝突："${entry.slug}"（${prev} vs ${entry.title}）——後者會蓋掉前者`
      );
    }
    seen.set(entry.slug, entry.title);
    await writeFileAtomic(
      path.join(BLOG_DIR, `${entry.slug}.json`),
      JSON.stringify(entry, null, 2)
    );
  }
}

async function writeProjectsCompat() {
  // 只在檔案不存在時補一個空的 []（backward compat）——
  // 不要每次 sync 都覆蓋，萬一其他來源寫了內容會被清空
  if (existsSync(PROJECTS_PATH)) return;
  await mkdir(path.dirname(PROJECTS_PATH), { recursive: true });
  await writeFileAtomic(PROJECTS_PATH, JSON.stringify([], null, 2));
}

async function writeSiteConfig(config: SiteConfig) {
  await mkdir(path.dirname(SITE_CONFIG_PATH), { recursive: true });
  await writeFileAtomic(SITE_CONFIG_PATH, JSON.stringify(config, null, 2));
}

// ─── main ────────────────────────────────────────────────────────────
async function main() {
  console.log("[sync-vault] Starting sync...");
  console.log(`[sync-vault] Vault: ${VAULT_BASE}`);

  const [blogEntries, projects, siteConfig] = await Promise.all([
    syncBlog(),
    syncProjects(),
    syncConfig(),
  ]);

  // Write all blog entries (blog posts + daily + weekly) to content/blog/
  const allEntries = [...blogEntries, ...projects];
  if (allEntries.length > 0) {
    await writeBlogEntries(allEntries);
  } else {
    console.log("[sync-vault] No entries from vault (keeping existing).");
  }

  // Write empty projects.json for backward compatibility
  await writeProjectsCompat();

  await writeSiteConfig(siteConfig);

  console.log(
    `[sync-vault] Done. Blog: ${blogEntries.length}, Daily+Weekly: ${projects.length}, Total: ${allEntries.length}, Config: updated.`
  );
}

withSyncLock("sync-vault", main).catch((error) => {
  console.error("[sync-vault] Failed:", error);
  process.exit(1);
});
