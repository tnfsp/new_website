import type { MetadataRoute } from "next";
import { loadBlogEntries, loadOwlEntries } from "@/lib/content";
import { BASE_URL } from "@/lib/constants";

// 跟排程發布對齊：sitemap 也要定期重算，不然新文章要等 deploy 才進 sitemap
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogEntries, owlEntries] = await Promise.all([
    loadBlogEntries(),
    loadOwlEntries(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/clinic`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stream`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/now`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/owl`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/links`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/taste`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/owl/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/feed`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = blogEntries.map((entry) => ({
    url: `${BASE_URL}/blog/${entry.slug}`,
    lastModified: entry.publishedAt ? new Date(entry.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const owlPages: MetadataRoute.Sitemap = owlEntries.map((entry) => ({
    url: `${BASE_URL}/owl/${entry.slug}`,
    lastModified: entry.publishedAt ? new Date(entry.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...owlPages];
}
