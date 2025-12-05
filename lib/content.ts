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
};

type Project = {
  title: string;
  description?: string;
  href?: string;
  slug?: string;
  type?: string;
  status?: string;
  date?: string;
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

  return sorted.length > 0 ? sorted : published;
}

export { aboutPreview, linkItems };
