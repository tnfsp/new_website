import { loadStreamEntries } from "@/lib/content";
import { buildRssResponse } from "@/lib/rss";
import { streamEntryToRssItem } from "@/lib/rss-utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export async function GET() {
  const entries = await loadStreamEntries(200);
  const items = entries.map((entry) => streamEntryToRssItem(entry, SITE_URL));

  return buildRssResponse({
    title: "wilsonchao.com — Stream",
    siteUrl: `${SITE_URL}/stream`,
    description: "日常的腦內碎片——想法、電影、音樂，都在這裡流過。",
    feedPath: "/stream/feed.xml",
    items,
  });
}
