import type { MetadataRoute } from "next";

import { getPublishedProjects } from "@/lib/projects";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();

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
