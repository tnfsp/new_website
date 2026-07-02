import { promises as fs } from "fs";
import path from "path";
import {
  aboutPreview,
  defaultSiteCopy,
  linkItems as baseLinkItems,
  placeholderBlogs,
} from "./placeholders";
import { todayInTaipei } from "./date";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const OWL_DIR = path.join(process.cwd(), "content", "owl");
const SITE_CONFIG_PATH = path.join(process.cwd(), "content", "site", "config.json");

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
  image?: string;
  related?: string[];
};



export type MurmurEntry = {
  /** stream.json 的穩定 id — RSS guid 用它，編輯內文才不會產生重複項目 */
  id?: string;
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  tags?: string[];
  contentHtml?: string;
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
    murmurIntro: file?.HomepageStreamIntro || file?.HomepageMurmurIntro || defaultSiteCopy.murmurIntro,
    murmurCTA: file?.HomepageStreamCTA || file?.HomepageMurmurCTA || defaultSiteCopy.murmurCTA,
    aboutName: file?.AboutName || defaultSiteCopy.aboutName,
    aboutIntro: file?.AboutPageIntro || defaultSiteCopy.aboutIntro,
    aboutBody: file?.AboutPageBody || defaultSiteCopy.aboutBody,
    aboutImage: file?.AboutImage || defaultSiteCopy.aboutImage,
    blogTitle: file?.BlogPageTitle || defaultSiteCopy.blogTitle,
    blogIntro: file?.BlogPageIntro || defaultSiteCopy.blogIntro,
    projectsTitle: file?.ProjectsPageTitle || defaultSiteCopy.projectsTitle,
    projectsIntro: file?.ProjectsPageIntro || defaultSiteCopy.projectsIntro,
    linksTitle: file?.LinksPageTitle || defaultSiteCopy.linksTitle,
    linksIntro: file?.LinksPageIntro || defaultSiteCopy.linksIntro,
  };
}

function stripMarkup(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/[#>*`]/g, " ").replace(/\s+/g, " ").trim();
}

function countWordsWithCJK(plain: string) {
  const asciiWords = plain.split(/\s+/).filter(Boolean).length;
  const cjkChars =
    plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)
      ?.length || 0;
  return asciiWords + cjkChars;
}

function inferExcerpt(contentHtml?: string, content?: string, existing?: string) {
  if (existing) return existing;
  const plain = stripMarkup(contentHtml || content);
  if (!plain) return "";
  return plain.slice(0, 180) + (plain.length > 180 ? "..." : "");
}

function firstImageFromEntry(entry: BlogEntry) {
  const source = entry.contentHtml || entry.content;
  if (!source) return undefined;
  const match = source.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];
  const md = source.match(/!\[[^\]]*]\(([^\s)]+)(?:\s+"[^"]*")?\)/);
  return md?.[1];
}

function inferReadingTime(entry: BlogEntry): string | undefined {
  const plain = stripMarkup(entry.contentHtml || entry.content);
  if (plain) {
    const words = countWordsWithCJK(plain);
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min`;
  }
  return entry.readingTime;
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

      // Scheduled publishing: skip entries with publishedAt in the future.
      // 以台北日期為準；slice(0,10) 讓帶時間的 publishedAt 也能正確比較
      const today = todayInTaipei();
      if (parsed.publishedAt && parsed.publishedAt.slice(0, 10) > today) continue;

      entries.push({
        ...parsed,
        // 舊 Notion 資料用中文 type「週報」，統一正規化成 weekly，
        // 讓 /blog?type=weekly 的篩選抓得到全部週報
        type: parsed.type === "週報" ? "weekly" : parsed.type,
        excerpt: inferExcerpt(parsed.contentHtml, parsed.content, parsed.description || parsed.excerpt),
        readingTime: inferReadingTime(parsed),
        image: parsed.image || firstImageFromEntry(parsed),
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

/**
 * OwlEntry extends BlogEntry with an author field for the /owl section.
 */
export type OwlEntry = BlogEntry & {
  author?: string;
};

/**
 * Loads published Owl essays from /content/owl/.
 * Skips files whose slug starts with "_" (internal drafts/placeholders).
 * Skips entries without status "Published".
 */
export async function loadOwlEntries(): Promise<OwlEntry[]> {
  try {
    const files = await fs.readdir(OWL_DIR);
    const entries: OwlEntry[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const parsed = await safeReadJSON<OwlEntry>(path.join(OWL_DIR, file));
      if (!parsed?.slug) continue;
      // Skip internal draft/placeholder files (slug starts with "_")
      if (parsed.slug.startsWith("_")) continue;
      const status = parsed.status || "Draft";
      if (status !== "Published") continue;

      // Scheduled publishing: skip entries with publishedAt in the future（台北日期）
      const today = todayInTaipei();
      if (parsed.publishedAt && parsed.publishedAt.slice(0, 10) > today) continue;

      entries.push({
        ...parsed,
        author: parsed.author || "Owl",
        excerpt: inferExcerpt(parsed.contentHtml, parsed.content, parsed.description || parsed.excerpt),
        readingTime: inferReadingTime(parsed),
        image: parsed.image || firstImageFromEntry(parsed),
      });
    }

    return sortByDateDesc(entries);
  } catch (error) {
    console.warn("[content] Failed to load owl entries:", (error as Error).message);
    return [];
  }
}

/**
 * Loads a single Owl essay by slug (only published, non-placeholder entries).
 */
export async function getOwlEntry(slug: string): Promise<OwlEntry | null> {
  const entries = await loadOwlEntries();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

/**
 * Loads the placeholder Owl essay for layout review.
 * Only for use in development/preview — never in production listings.
 */
export async function getOwlPlaceholder(): Promise<OwlEntry | null> {
  try {
    const parsed = await safeReadJSON<OwlEntry>(path.join(OWL_DIR, "_placeholder.json"));
    if (!parsed?.slug) return null;
    return {
      ...parsed,
      author: parsed.author || "Owl",
      excerpt: inferExcerpt(parsed.contentHtml, parsed.content, parsed.description || parsed.excerpt),
      readingTime: inferReadingTime(parsed),
    };
  } catch {
    return null;
  }
}



/**
 * DrawerCard — one Wilson preference fragment for the "抽屜" feature.
 * Sourced from OWL's de-sensitized public file via scripts/sync-drawer.ts.
 * `reason` is optional: OWL may blank it for privacy, in which case we never
 * fabricate one (see HANDOFF-drawer-from-owl.md §3 紅線).
 */
export type DrawerCard = {
  /** Discriminant — allows the UI to render different layouts per card kind. */
  type?: "preference";
  date: string;
  questionId: string;
  question: string;
  optionA: string;
  optionB: string;
  choice: string; // A | 偏A | 混合 | 偏B | B
  reason?: string;
  /**
   * 站方成稿：把 choice + reason 改寫成 About 口吻的一小段話（揭曉面顯示這個）。
   * 來自 content/drawer-passages.json，由 questionId 對應；sync-drawer 不會覆蓋它。
   * 沒有 passage 的卡，UI 回退成「我選的是…＋ reason」。
   */
  passage?: string;
  tags?: string[];
  category?: string;
  dimension?: string;
};

/**
 * DrawerQACard — an anonymous visitor question answered by Wilson.
 * Sourced from OWL workspace data/drawer-answers.jsonl (answered items only).
 * Only `question` and `answer` text are published; all internal fields are stripped.
 */
export type DrawerQACard = {
  type: "qa";
  question: string;
  answer: string;
};

/** Union of all card types that can appear in the drawer. */
export type AnyDrawerCard = DrawerCard | DrawerQACard;

const DRAWER_PATH = path.join(process.cwd(), "content", "drawer.json");
const DRAWER_PASSAGES_PATH = path.join(process.cwd(), "content", "drawer-passages.json");

/**
 * Loads all drawer cards (chronological order as written by sync-drawer),
 * merging in hand-written passages from content/drawer-passages.json (by questionId).
 * QA cards (type "qa") are passed through as-is.
 * Returns [] if the file is missing — the UI shows an empty state.
 */
export async function loadDrawerCards(): Promise<AnyDrawerCard[]> {
  const cards = await safeReadJSON<AnyDrawerCard[]>(DRAWER_PATH);
  if (!Array.isArray(cards)) return [];
  const passages =
    (await safeReadJSON<Record<string, string>>(DRAWER_PASSAGES_PATH)) || {};
  return cards
    .filter((c): c is AnyDrawerCard => {
      if (!c || typeof c !== "object") return false;
      if ((c as DrawerQACard).type === "qa") {
        return Boolean((c as DrawerQACard).question && (c as DrawerQACard).answer);
      }
      const pref = c as DrawerCard;
      return Boolean(pref?.question && pref?.optionA && pref?.optionB && pref?.choice);
    })
    .map((c) => {
      if ((c as DrawerQACard).type === "qa") return c;
      const pref = c as DrawerCard;
      const passage = passages[pref.questionId]?.trim();
      return passage ? { ...pref, passage } : pref;
    });
}

export async function loadStreamEntries(limit = 50): Promise<MurmurEntry[]> {
  const stripHtml = (value?: string) => {
    if (!value) return "";
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  };
  try {
    const streamPath = path.join(process.cwd(), "content", "stream.json");
    const raw = await fs.readFile(streamPath, "utf-8");
    const items = JSON.parse(raw) as {
      id: string;
      title: string;
      text?: string;
      contentHtml?: string;
      pubDate?: string;
      tags?: string[];
      link?: string;
      linkPreview?: string;
      images?: string[];
    }[];

    return items.slice(0, limit).map((item) => ({
      id: item.id,
      title: item.title,
      link: item.link || "",
      description: item.text || stripHtml(item.contentHtml),
      pubDate: item.pubDate,
      tags: item.tags,
      contentHtml: item.contentHtml,
    }));
  } catch (error) {
    console.warn("[content] Failed to load stream.json:", (error as Error).message);
    return [];
  }
}

// ─── Taste (品味) — entity-backed favorites ──────────────────────────
// NOTE: 預覽階段為手刻 seed 資料。正式版由 OWL 投影 wilson-taste.public.json
//       → sync-taste.ts → content/taste.json（見 DESIGN-taste-entities.md）。
export type TasteEntity = {
  id: string;
  type: "music" | "book" | "movie";
  title: string;
  subtitle?: string;
  year?: number;
  rating?: number; // 內部排序訊號（最愛浮上來），預設不在卡片顯示數字
  tags?: string[];
  why?: string;
  links?: { label: string; url: string }[];
  relatedPosts?: string[];
};

export async function loadTasteEntries(): Promise<TasteEntity[]> {
  try {
    const tastePath = path.join(process.cwd(), "content", "taste.json");
    const raw = await fs.readFile(tastePath, "utf-8");
    const items = JSON.parse(raw) as TasteEntity[];
    return items.filter((e) => e && e.id && e.type && e.title);
  } catch (error) {
    console.warn("[content] Failed to load taste.json:", (error as Error).message);
    return [];
  }
}

const buttondownLink = process.env.NEXT_PUBLIC_BUTTONDOWN_URL;

const linkItems = [
  ...baseLinkItems,
  ...(buttondownLink
    ? [{ label: "📧 Buttondown｜Email 訂閱", href: buttondownLink, external: true }]
    : []),
] as typeof baseLinkItems;

export { aboutPreview, linkItems };
