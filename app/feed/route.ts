import { NextResponse } from "next/server";
import { loadBlogEntries } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRss(items: Awaited<ReturnType<typeof loadBlogEntries>>) {
  const rendered = items
    .map((item) => {
      const link = `${SITE_URL}/blog/${item.slug}`;
      return `
<item>
  <title>${escapeXml(item.title)}</title>
  <link>${escapeXml(link)}</link>
  <guid>${escapeXml(link)}</guid>
  ${item.publishedAt ? `<pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>` : ""}
  ${item.excerpt ? `<description>${escapeXml(item.excerpt)}</description>` : ""}
</item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>wilsonchao.com blog</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Articles and notes from Yi-Hsiang Chao, MD</description>
    ${rendered}
  </channel>
</rss>`;
}

export async function GET() {
  const entries = await loadBlogEntries();
  const xml = buildRss(entries);
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
    },
  });
}
