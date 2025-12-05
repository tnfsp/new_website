import { config as loadEnv } from "dotenv";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
  PartialBlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

loadEnv({ path: ".env.local" });

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
};

type ProjectEntry = {
  title: string;
  description?: string;
  href?: string;
  slug?: string;
  type?: string;
  status?: string;
  date?: string;
  image?: string;
};

type SiteConfig = Record<string, string>;

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SITE_CONFIG_PATH = path.join(process.cwd(), "content", "site", "config.json");
const PROJECTS_PATH = path.join(process.cwd(), "content", "projects.json");
const BLOG_ASSET_DIR = path.join(process.cwd(), "public", "content", "blog");
const PROJECT_ASSET_DIR = path.join(process.cwd(), "public", "content", "projects");

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return undefined;
  }
  return value.trim();
}

const NOTION_TOKEN = getEnv("NOTION_TOKEN");
const BLOG_DATABASE_ID = getEnv("NOTION_BLOG_DATABASE_ID");
const SITE_CONFIG_DATABASE_ID = getEnv("NOTION_SITE_CONFIG_DATABASE_ID");
const PROJECTS_DATABASE_ID = getEnv("NOTION_PROJECTS_DATABASE_ID");

if (!NOTION_TOKEN || !BLOG_DATABASE_ID || !SITE_CONFIG_DATABASE_ID) {
  console.warn(
    [
      "[sync-notion] Missing environment variables.",
      "Required: NOTION_TOKEN, NOTION_BLOG_DATABASE_ID, NOTION_SITE_CONFIG_DATABASE_ID.",
      "Skipping sync. Set env vars and re-run `npm run sync:notion`.",
    ].join(" ")
  );
  process.exit(0);
}

const notion = new Client({ auth: NOTION_TOKEN });

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function isFullBlock(
  block: ListBlockChildrenResponse["results"][number]
): block is BlockObjectResponse {
  return "type" in block && block.object === "block";
}

function textFromRichText(richText: RichTextItemResponse[]): string {
  return richText.map((item) => item.plain_text ?? "").join("");
}

function titleFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "title") return "";
  return textFromRichText(property.title);
}

function richTextFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "rich_text") return "";
  return textFromRichText(property.rich_text);
}

function selectFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "select" || !property.select) return "";
  return property.select.name ?? "";
}

function multiSelectFromProperty(property?: PageObjectResponse["properties"][string]) {
  if (!property || property.type !== "multi_select" || !property.multi_select) return [];
  return property.multi_select.map((item) => item.name).filter(Boolean);
}

function dateFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type !== "date" || !property.date) return "";
  return property.date.start ?? "";
}

function convertBlockToMarkdown(block: BlockObjectResponse): string {
  switch (block.type) {
    case "heading_1":
      return `# ${textFromRichText(block.heading_1.rich_text)}`;
    case "heading_2":
      return `## ${textFromRichText(block.heading_2.rich_text)}`;
    case "heading_3":
      return `### ${textFromRichText(block.heading_3.rich_text)}`;
    case "paragraph":
      return textFromRichText(block.paragraph.rich_text);
    case "bulleted_list_item":
      return `- ${textFromRichText(block.bulleted_list_item.rich_text)}`;
    case "numbered_list_item":
      return `1. ${textFromRichText(block.numbered_list_item.rich_text)}`;
    case "quote":
      return `> ${textFromRichText(block.quote.rich_text)}`;
    case "callout":
      return `> ${textFromRichText(block.callout.rich_text)}`;
    case "divider":
      return "---";
    default:
      return "";
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function convertBlockToHtml(block: BlockObjectResponse): string {
  const toHtml = (rich: RichTextItemResponse[]) => escapeHtml(textFromRichText(rich));

  switch (block.type) {
    case "heading_1":
      return `<h1>${toHtml(block.heading_1.rich_text)}</h1>`;
    case "heading_2":
      return `<h2>${toHtml(block.heading_2.rich_text)}</h2>`;
    case "heading_3":
      return `<h3>${toHtml(block.heading_3.rich_text)}</h3>`;
    case "paragraph":
      return `<p>${toHtml(block.paragraph.rich_text)}</p>`;
    case "bulleted_list_item":
      return `<ul><li>${toHtml(block.bulleted_list_item.rich_text)}</li></ul>`;
    case "numbered_list_item":
      return `<ol><li>${toHtml(block.numbered_list_item.rich_text)}</li></ol>`;
    case "quote":
      return `<blockquote>${toHtml(block.quote.rich_text)}</blockquote>`;
    case "callout":
      return `<blockquote>${toHtml(block.callout.rich_text)}</blockquote>`;
    case "divider":
      return "<hr />";
    default:
      return "";
  }
}

function plainTextFromBlock(block: BlockObjectResponse): string {
  switch (block.type) {
    case "heading_1":
      return textFromRichText(block.heading_1.rich_text);
    case "heading_2":
      return textFromRichText(block.heading_2.rich_text);
    case "heading_3":
      return textFromRichText(block.heading_3.rich_text);
    case "paragraph":
      return textFromRichText(block.paragraph.rich_text);
    case "bulleted_list_item":
      return textFromRichText(block.bulleted_list_item.rich_text);
    case "numbered_list_item":
      return textFromRichText(block.numbered_list_item.rich_text);
    case "quote":
      return textFromRichText(block.quote.rich_text);
    case "callout":
      return textFromRichText(block.callout.rich_text);
    default:
      return "";
  }
}

function safeExtFromUrl(url: string) {
  try {
    const { pathname } = new URL(url);
    const ext = path.extname(pathname);
    if (ext && ext.length <= 5) return ext;
    return ".jpg";
  } catch {
    return ".jpg";
  }
}

async function downloadImageForBlock(
  block: BlockObjectResponse,
  slug: string
): Promise<string | undefined> {
  if (block.type !== "image") return undefined;
  const sourceUrl =
    block.image.type === "file" ? block.image.file?.url : block.image.external?.url;
  if (!sourceUrl) return undefined;

  const assetDir = path.join(BLOG_ASSET_DIR, slug);
  const ext = safeExtFromUrl(sourceUrl);
  const filename = `${block.id}${ext}`;
  const destPath = path.join(assetDir, filename);
  const publicPath = `/content/blog/${slug}/${filename}`;

  try {
    await stat(destPath);
    return publicPath;
  } catch {
    // file not found; proceed to download
  }

  try {
    await mkdir(assetDir, { recursive: true });
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(destPath, buffer);
    return publicPath;
  } catch (error) {
    console.warn(
      `[sync-notion] Failed to download image for ${slug} (${sourceUrl}):`,
      (error as Error).message
    );
    return undefined;
  }
}

async function downloadProjectImage(url: string, slug: string): Promise<string | undefined> {
  const assetDir = path.join(PROJECT_ASSET_DIR, slug);
  const ext = safeExtFromUrl(url);
  const filename = `cover${ext}`;
  const destPath = path.join(assetDir, filename);
  const publicPath = `/content/projects/${slug}/${filename}`;

  try {
    await stat(destPath);
    return publicPath;
  } catch {
    // file not found; proceed to download
  }

  try {
    await mkdir(assetDir, { recursive: true });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destPath, buffer);
    return publicPath;
  } catch (error) {
    console.warn(
      `[sync-notion] Failed to download project image for ${slug} (${url}):`,
      (error as Error).message
    );
    return undefined;
  }
}

async function renderBlocksWithAssets(blocks: BlockObjectResponse[], slug: string) {
  const markdownParts: string[] = [];
  const htmlParts: string[] = [];
  const plainParts: string[] = [];

  for (const block of blocks) {
    if (block.type === "image") {
      const caption = block.image.caption ? textFromRichText(block.image.caption) : "";
      const downloaded = await downloadImageForBlock(block, slug);
      if (downloaded) {
        markdownParts.push(`![${caption || "image"}](${downloaded})`);
        htmlParts.push(
          `<figure><img src="${downloaded}" alt="${escapeHtml(
            caption || "image"
          )}" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`
        );
      }
      if (caption) plainParts.push(caption);
      continue;
    }

    const md = convertBlockToMarkdown(block);
    const html = convertBlockToHtml(block);
    const plain = plainTextFromBlock(block);
    if (md) markdownParts.push(md);
    if (html) htmlParts.push(html);
    if (plain) plainParts.push(plain);
  }

  return {
    markdown: markdownParts.join("\n\n"),
    html: htmlParts.join("\n"),
    plainText: plainParts.join(" "),
  };
}

function estimateReadingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return "";
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} min`;
}

function buildExcerpt(text: string) {
  const plain = text.replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length > 200 ? `${plain.slice(0, 200)}...` : plain;
}

async function fetchAllBlocks(blockId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    response.results.forEach((block: BlockObjectResponse | PartialBlockObjectResponse) => {
      if (isFullBlock(block)) {
        blocks.push(block);
      }
    });
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return blocks;
}

async function fetchBlogEntries(): Promise<BlogEntry[]> {
  const response = await notion.databases.query({
    database_id: BLOG_DATABASE_ID!,
    filter: {
      property: "Status",
      select: { equals: "Published" },
    },
    sorts: [
      {
        property: "PublishedAt",
        direction: "descending",
      },
    ],
  });

  const entries: BlogEntry[] = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const typedPage = page as PageObjectResponse;
    const props = typedPage.properties;
    const title = titleFromProperty(props.Title);
    const rawSlug = richTextFromProperty(props.Slug);
    const slug = normalizeSlug(rawSlug || title || typedPage.id);
    const type = selectFromProperty(props.Type);
    const status = selectFromProperty(props.Status);
    const publishedAt = dateFromProperty(props.PublishedAt);
    const description =
      richTextFromProperty(props.Description ?? props.Summary ?? props.Excerpt) || "";
    const tags = multiSelectFromProperty(props.Tags ?? props.Tag ?? props.Labels ?? props.Label);

    if (!slug) {
      console.warn(`[sync-notion] Skipping page without slug: ${typedPage.id}`);
      continue;
    }

    const blocks = await fetchAllBlocks(typedPage.id);
    const rendered = await renderBlocksWithAssets(blocks, slug);
    const content = rendered.markdown;
    const contentHtml = rendered.html;
    const plainText = rendered.plainText;
    const readingTime = estimateReadingTime(plainText);
    const excerpt = buildExcerpt(plainText);

    entries.push({
      id: typedPage.id,
      slug,
      title,
      type,
      status,
      publishedAt,
      content,
      contentHtml,
      description: description || undefined,
      excerpt: description || excerpt,
      readingTime,
      tags,
    });
  }

  return entries;
}

async function writeBlogEntries(entries: BlogEntry[]) {
  await mkdir(BLOG_DIR, { recursive: true });
  await Promise.all(
    entries.map((entry) =>
      writeFile(
        path.join(BLOG_DIR, `${entry.slug}.json`),
        JSON.stringify(entry, null, 2),
        "utf-8"
      )
    )
  );
}

async function fetchSiteConfig(): Promise<SiteConfig> {
  const response = await notion.databases.query({
    database_id: SITE_CONFIG_DATABASE_ID!,
  });

  const config: SiteConfig = {};

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const typedPage = page as PageObjectResponse;
    const props = typedPage.properties;
    const key = titleFromProperty(props.Key);
    const value = richTextFromProperty(props.Value);
    if (!key) continue;
    config[key] = value;
  }

  return config;
}

async function writeSiteConfig(config: SiteConfig) {
  await mkdir(path.dirname(SITE_CONFIG_PATH), { recursive: true });
  await writeFile(SITE_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function urlFromProperty(property: PageObjectResponse["properties"][string]) {
  if (property.type === "url") return property.url || "";
  return "";
}

function firstFileUrl(property?: PageObjectResponse["properties"][string]) {
  if (!property || property.type !== "files" || !property.files?.length) return "";
  const file = property.files[0];
  if (file.type === "external") return file.external.url;
  if (file.type === "file") return file.file.url;
  return "";
}

async function fetchProjects(): Promise<ProjectEntry[]> {
  if (!PROJECTS_DATABASE_ID) {
    console.warn("[sync-notion] Missing NOTION_PROJECTS_DATABASE_ID. Skipping projects sync.");
    return [];
  }

  const response = await notion.databases.query({
    database_id: PROJECTS_DATABASE_ID,
  });

  const projects: ProjectEntry[] = [];

  for (const page of response.results) {
    if (!("properties" in page)) continue;
    const typedPage = page as PageObjectResponse;
    const props = typedPage.properties;
    const title = titleFromProperty(props.Title);
    const description = richTextFromProperty(props.Description ?? props.Summary ?? props.Body);
    const href =
      richTextFromProperty(props.Link ?? props.URL ?? props.Href) || urlFromProperty(props.Link);
    const slug = normalizeSlug(richTextFromProperty(props.Slug) || title || typedPage.id);
    const type = selectFromProperty(props.Type);
    const status = selectFromProperty(props.Status);
    const date = dateFromProperty(props.Date);
    const coverFromFiles =
      firstFileUrl(props.Image || props.Cover || props.Hero || props.Thumbnail || props.Photo);
    const coverFromPage = typedPage.cover
      ? typedPage.cover.type === "file"
        ? typedPage.cover.file?.url || ""
        : typedPage.cover.external?.url || ""
      : "";
    const coverUrl = coverFromFiles || coverFromPage;
    const image = coverUrl && slug ? await downloadProjectImage(coverUrl, slug) : undefined;

    if (!title) continue;

    projects.push({
      title,
      description,
      href,
      slug,
      type,
      status,
      date,
      image,
    });
  }

  return projects;
}

async function writeProjects(projects: ProjectEntry[]) {
  await mkdir(path.dirname(PROJECTS_PATH), { recursive: true });
  await writeFile(PROJECTS_PATH, JSON.stringify(projects, null, 2), "utf-8");
}

async function main() {
  console.log("[sync-notion] Starting sync...");
  const [blogEntries, siteConfig, projects] = await Promise.all([
    fetchBlogEntries(),
    fetchSiteConfig(),
    fetchProjects(),
  ]);

  await writeBlogEntries(blogEntries);
  await writeSiteConfig(siteConfig);
  if (projects.length > 0) {
    await writeProjects(projects);
  } else {
    console.log("[sync-notion] No projects synced (missing DB or no rows).");
  }

  console.log(
    `[sync-notion] Done. Wrote ${blogEntries.length} blog entries, ${
      projects.length
    } projects, and site config to content/.`
  );
}

main().catch((error) => {
  console.error("[sync-notion] Failed:", error);
  process.exit(1);
});
