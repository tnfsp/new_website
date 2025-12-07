import { loadBlogEntries } from "@/lib/content";
import { buildRssResponse } from "@/lib/rss";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export async function GET() {
  const entries = await loadBlogEntries();
  return buildRssResponse({
    title: "wilsonchao.com blog",
    siteUrl: SITE_URL,
    description: "Articles and notes from Yi-Hsiang Chao, MD",
    items: entries.map((entry) => ({
      title: entry.title,
      link: `${SITE_URL}/blog/${entry.slug}`,
      guid: `${SITE_URL}/blog/${entry.slug}`,
      pubDate: entry.publishedAt ? new Date(entry.publishedAt).toUTCString() : undefined,
      description: entry.excerpt,
    })),
  });
}
