import { MetadataRoute } from "next";
import { getMarkers } from "@/data/markers";
import { getRoutes } from "@/data/routes";
import { getStories } from "@/data/stories";
import { getBusinesses } from "@/data/businesses";
import { getBlogPosts } from "@/data/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://trail.thecotswoldsway.com";
  const [markers, routes, stories, businesses, blogPosts] = await Promise.all([
    getMarkers(),
    getRoutes().catch(() => []),
    getStories().catch(() => []),
    getBusinesses().catch(() => []),
    getBlogPosts().catch(() => []),
  ]);

  const markerPages = markers.map((m) => ({
    url: `${baseUrl}/m/${m.shortCode}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const routePages = routes.map((r) => ({
    url: `${baseUrl}/routes/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const storyPages = stories
    .filter((s) => !s.isHidden)
    .map((s) => ({
      url: `${baseUrl}/story/${s.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const bizPages = businesses.map((b) => ({
    url: `${baseUrl}/biz/${b.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const blogPages = blogPosts
    .filter((p) => p.isPublished)
    .map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/trail`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/routes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...markerPages,
    ...routePages,
    ...storyPages,
    ...bizPages,
    ...blogPages,
  ];
}
