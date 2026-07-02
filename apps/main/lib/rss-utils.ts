/**
 * RSS utility helpers.
 *
 * Kept separate from lib/rss.ts so that feed routes can import only what they need
 * without pulling in Next.js server dependencies into shared utilities.
 * (The imports below are type-only — erased at compile time.)
 */

import type { MurmurEntry } from "./content";
import type { RssItem } from "./rss";

/**
 * Replace root-relative URLs in HTML with absolute URLs.
 *
 * Blog content stores images as root-relative paths (e.g. `/content/blog/slug/image.jpg`)
 * and internal links as root-relative hrefs (e.g. `/blog/some-post`).
 * RSS readers need fully qualified URLs for both to work correctly.
 *
 * Rewrites `<img src>` and `<a href>` values that start with `/` (root-relative).
 * Leaves `http://`, `https://`, `data:`, `mailto:` etc. untouched.
 *
 * @param html    Raw HTML string from contentHtml field
 * @param baseUrl Site origin, e.g. "https://wilsonchao.com" (no trailing slash)
 * @returns       HTML with all root-relative src/href attributes replaced by absolute URLs
 */
export function makeAbsoluteImageUrls(html: string, baseUrl: string): string {
  // Match src="..." / src='...' (on <img>) and href="..." / href='...' (on <a>)
  // where the value starts with /
  return html
    .replace(
      /(<img[^>]*\ssrc=)(["'])(\/[^"']*)\2/gi,
      (_match, prefix, quote, path) => `${prefix}${quote}${baseUrl}${path}${quote}`
    )
    .replace(
      /(<a[^>]*\shref=)(["'])(\/[^"']*)\2/gi,
      (_match, prefix, quote, path) => `${prefix}${quote}${baseUrl}${path}${quote}`
    );
}

/**
 * Convert a stream (murmur) entry into an RSS item.
 *
 * Shared by /stream/feed.xml and the aggregate /feed.xml so titles and guids
 * stay identical between the two feeds.
 *
 * - 標題以 code point 截斷（Array.from），不會把 emoji 的 surrogate pair
 *   切成一半、產生不合法的 XML。
 * - guid 優先用 stream.json 的穩定 `id`——編輯內文不會讓讀者看到重複項目。
 *   沒有 id 的舊項目退回原本的 date+text 推導方案，維持 guid 穩定。
 *
 * @param entry   Stream entry from loadStreamEntries()
 * @param siteUrl Site origin, e.g. "https://wilsonchao.com" (no trailing slash)
 */
export function streamEntryToRssItem(entry: MurmurEntry, siteUrl: string): RssItem {
  const plainText = (entry.description || entry.title || "").replace(/<[^>]*>/g, "");
  const chars = Array.from(plainText);
  const title =
    chars.length > 60 ? chars.slice(0, 57).join("") + "..." : plainText || "Stream";
  const dateSlug = entry.pubDate
    ? new Date(entry.pubDate).toISOString().slice(0, 10)
    : "undated";
  const hash = plainText.slice(0, 40).replace(/\s+/g, "-").toLowerCase();
  const stableId = entry.id
    ? `${siteUrl}/stream/${entry.id}`
    : `${siteUrl}/stream/${dateSlug}-${hash}`;
  return {
    title,
    link: entry.link || `${siteUrl}/stream`,
    guid: entry.link || stableId,
    isPermaLink: !!entry.link,
    pubDate: entry.pubDate ? new Date(entry.pubDate).toUTCString() : undefined,
    description: chars.slice(0, 280).join(""),
    // Stream contentHtml uses only external/absolute URLs — no image absolutization needed
    contentEncoded: entry.contentHtml || undefined,
  };
}
