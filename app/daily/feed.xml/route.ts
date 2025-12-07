import { loadProjects } from "@/lib/content";
import { buildRssResponse } from "@/lib/rss";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wilsonchao.com";

export async function GET() {
  const projects = await loadProjects();
  const items = projects.flatMap((project) => {
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

  return buildRssResponse({
    title: "wilsonchao.com daily",
    siteUrl: `${SITE_URL}/daily`,
    description: "Daily notes and cases",
    items,
  });
}
