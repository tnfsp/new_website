import { promises as fs } from "fs";
import path from "path";
import {
  aboutPreview,
  defaultSiteCopy,
  featuredProjects,
  linkItems,
  placeholderBlogs,
} from "./placeholders";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SITE_CONFIG_PATH = path.join(process.cwd(), "content", "site", "config.json");
const PROJECTS_PATH = path.join(process.cwd(), "content", "projects.json");

export type SiteCopy = typeof defaultSiteCopy;

export type BlogEntry = {
  id?: string;
  slug: string;
  title: string;
  type?: string;
  status?: string;
  publishedAt?: string;
  content?: string;
  contentHtml?: string;
  description?: string;
  excerpt?: string;
  readingTime?: string;
  tags?: string[];
};

export type Project = {
  title: string;
  description?: string;
  href?: string;
  slug?: string;
  type?: string;
  status?: string;
  date?: string;
  image?: string;
};

export type MurmurEntry = {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
};

async function safeReadJSON<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn(`[content] Unable to read ${filePath}:`, (error as Error).message);
    return null;
  }
}

export async function loadSiteCopy(): Promise<SiteCopy> {
  const file = await safeReadJSON<Record<string, string>>(SITE_CONFIG_PATH);
  return {
    heroTitle: file?.HomepageHeroTitle || defaultSiteCopy.heroTitle,
    heroSubtitle: file?.HomepageHeroSubtitle || defaultSiteCopy.heroSubtitle,
    heroIntro: file?.HomepageIntro || defaultSiteCopy.heroIntro,
    heroCTA: file?.HomepageCTA || defaultSiteCopy.heroCTA,
    footerText: file?.FooterText || defaultSiteCopy.footerText,
    murmurIntro: file?.HomepageMurmurIntro || defaultSiteCopy.murmurIntro,
    murmurCTA: file?.HomepageMurmurCTA || defaultSiteCopy.murmurCTA,
    aboutIntro: file?.AboutPageIntro || defaultSiteCopy.aboutIntro,
    aboutBody: file?.AboutPageBody || defaultSiteCopy.aboutBody,
    aboutImage: file?.AboutImage || defaultSiteCopy.aboutImage,
    blogTitle: file?.BlogPageTitle || defaultSiteCopy.blogTitle,
    blogIntro: file?.BlogPageIntro || defaultSiteCopy.blogIntro,
    projectsTitle: file?.ProjectsPageTitle || defaultSiteCopy.projectsTitle,
    projectsIntro: file?.ProjectsPageIntro || defaultSiteCopy.projectsIntro,
  };
}

function stripMarkup(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/[#>*`]/g, " ").replace(/\s+/g, " ").trim();
}

function inferExcerpt(contentHtml?: string, content?: string, existing?: string) {
  if (existing) return existing;
  const plain = stripMarkup(contentHtml || content);
  if (!plain) return "";
  return plain.slice(0, 180) + (plain.length > 180 ? "..." : "");
}

function inferReadingTime(entry: BlogEntry) {
  if (entry.readingTime) return entry.readingTime;
  const plain = stripMarkup(entry.contentHtml || entry.content);
  if (!plain) return undefined;
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min`;
}

function sortByDateDesc(entries: BlogEntry[]) {
  return [...entries].sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
}

function normalizeHref(href?: string) {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return undefined;
}

function slugFromHref(href?: string) {
  if (!href) return undefined;
  const cleaned = href.replace(/\/+$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  return parts.at(-1);
}

export async function loadBlogEntries(): Promise<BlogEntry[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    const entries: BlogEntry[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const parsed = await safeReadJSON<BlogEntry>(path.join(BLOG_DIR, file));
      if (!parsed?.slug) continue;
      const status = parsed.status || "Published";
      if (status !== "Published") continue;

      entries.push({
        ...parsed,
        excerpt: inferExcerpt(parsed.contentHtml, parsed.content, parsed.description || parsed.excerpt),
        readingTime: inferReadingTime(parsed),
      });
    }

    if (entries.length === 0) {
      console.warn("[content] No blog entries found in content/blog. Using placeholders.");
      return placeholderBlogs;
    }

    return sortByDateDesc(entries);
  } catch (error) {
    console.warn("[content] Failed to load blog entries, using placeholders:", (error as Error).message);
    return placeholderBlogs;
  }
}

export async function getBlogEntry(slug: string): Promise<BlogEntry | null> {
  const entries = await loadBlogEntries();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function loadProjects(): Promise<Project[]> {
  const projects = await safeReadJSON<Project[]>(PROJECTS_PATH);
  if (!projects || projects.length === 0) return featuredProjects as Project[];

  const published = projects.filter(
    (project) => !project.status || project.status.toLowerCase() === "published"
  );

  const sorted = published.sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    return bDate - aDate;
  });

  const cleaned = sorted.map((project) => ({
    ...project,
    href: normalizeHref(project.href),
    slug: project.slug || slugFromHref(normalizeHref(project.href)),
  }));

  return cleaned.length > 0 ? cleaned : published;
}

export async function getProject(slug: string): Promise<Project | null> {
  const projects = await loadProjects();
  return (
    projects.find((project) => project.slug === slug) ??
    projects.find((project) => slugFromHref(project.href) === slug) ??
    null
  );
}

const ENABLE_MURMUR_FEED = true;
const DEFAULT_MURMUR_FEED =
  process.env.MURMUR_FEED_URL || "https://murmur.wilsonchao.com/rss.json";

export async function loadMurmurEntries(limit = 3): Promise<MurmurEntry[]> {
  if (!ENABLE_MURMUR_FEED) return [];
  const stripHtml = (value?: string) => {
    if (!value) return "";
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  };
  try {
    const res = await fetch(DEFAULT_MURMUR_FEED, {
      // murmur feed already has caching headers; respect revalidate to avoid hammering
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      items?: {
        title: string;
        link: string;
        description?: string;
        content_text?: string;
        pubDate?: string;
        pub_date?: string;
        date_published?: string;
        published?: string;
        date?: string;
      }[];
    };
    const items = json.items ?? [];
    return items.slice(0, limit).map((item) => {
      const description =
        item.description || item.content_text || stripHtml(item.content_html) || item.summary;
      return {
        title: item.title,
        link: item.link,
        description,
        pubDate:
          item.pubDate ||
          item.pub_date ||
          item.date_published ||
          item.published ||
          item.date,
      };
    });
  } catch (error) {
    console.warn("[content] Failed to load murmur feed:", (error as Error).message);
    return [];
  }
}

export { aboutPreview, linkItems };
