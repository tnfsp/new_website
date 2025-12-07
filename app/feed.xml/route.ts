import { loadBlogEntries, loadProjects } from "@/lib/content";
import { buildRssResponse } from "@/lib/rss";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export async function GET() {
  const [entries, projects] = await Promise.all([loadBlogEntries(), loadProjects()]);

  const blogItems = entries.map((entry) => ({
    title: entry.title,
    link: `${SITE_URL}/blog/${entry.slug}`,
    guid: `${SITE_URL}/blog/${entry.slug}`,
    pubDate: entry.publishedAt ? new Date(entry.publishedAt).toUTCString() : undefined,
    description: entry.excerpt,
  }));

  const dailyItems = projects.flatMap((project) => {
    const link = project.slug
      ? `${SITE_URL}/daily/${project.slug}`
      : project.href && project.href.startsWith("http")
        ? project.href
        : undefined;
    if (!link) return [];
    return [
      {
        title: project.title,
        link,
        guid: link,
        pubDate: project.date ? new Date(project.date).toUTCString() : undefined,
        description: project.excerpt || project.description,
      },
    ];
  });

  const items = [...blogItems, ...dailyItems].sort((a, b) => {
    const aDate = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const bDate = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return bDate - aDate;
  });

  return buildRssResponse({
    title: "wilsonchao.com",
    siteUrl: SITE_URL,
    description: "Articles, daily notes, and updates from Yi-Hsiang Chao, MD",
    items,
  });
}
