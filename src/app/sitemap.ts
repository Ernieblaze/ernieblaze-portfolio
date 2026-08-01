import type { MetadataRoute } from "next";

import { getPublishedProjectsSafe } from "@/lib/projects";
import { site } from "@/lib/site";

/**
 * Generated on first request and cached, so a missing database still can't
 * fail the deploy — `getPublishedProjectsSafe` degrades to the homepage alone.
 * Hourly is ample for a file only crawlers read.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjectsSafe();

  return [
    {
      url: site.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projects.map((project) => ({
      url: `${site.url}/work/${project.slug}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
