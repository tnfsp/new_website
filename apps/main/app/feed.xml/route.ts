import { loadBlogEntries, loadStreamEntries } from "@/lib/content";
import { buildRssResponse, type RssItem } from "@/lib/rss";
import { makeAbsoluteImageUrls, streamEntryToRssItem } from "@/lib/rss-utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

/**
 * 「All」聚合 feed — blog（長文）＋ stream（碎片）合流，依發佈時間新到舊。
 * guid 與各自的子 feed（/blog/feed.xml、/stream/feed.xml）完全一致，
 * 同時訂閱不會出現重複項目被當成新文章。
 */
export async function GET() {
  const [blogEntries, streamEntries] = await Promise.all([
    loadBlogEntries(),
    loadStreamEntries(200),
  ]);

  // Exclude index/map-of-content entries (type=moc) from the feed
  const publishable = blogEntries.filter((e) => e.type !== "moc");

  const dated: { ts: number; item: RssItem }[] = [
    ...publishable.map((entry) => ({
      ts: entry.publishedAt ? new Date(entry.publishedAt).getTime() || 0 : 0,
      item: {
        title: entry.title,
        link: `${SITE_URL}/blog/${entry.slug}`,
        guid: `${SITE_URL}/blog/${entry.slug}`,
        pubDate: entry.publishedAt ? new Date(entry.publishedAt).toUTCString() : undefined,
        description: entry.excerpt,
        contentEncoded: entry.contentHtml
          ? makeAbsoluteImageUrls(entry.contentHtml, SITE_URL)
          : undefined,
      },
    })),
    ...streamEntries.map((entry) => ({
      ts: entry.pubDate ? new Date(entry.pubDate).getTime() || 0 : 0,
      item: streamEntryToRssItem(entry, SITE_URL),
    })),
  ];

  const items = dated.sort((a, b) => b.ts - a.ts).map((d) => d.item);

  return buildRssResponse({
    title: "wilsonchao.com",
    siteUrl: SITE_URL,
    description: "Articles, journal entries, and updates from Yi-Hsiang Chao, MD",
    feedPath: "/feed.xml",
    items,
  });
}
