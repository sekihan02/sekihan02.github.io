import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseRobots: MetadataRoute.Robots = {
    rules: {
      userAgent: "*",
      allow: "/"
    }
  };

  if (!siteConfig.isIndexable) {
    return baseRobots;
  }

  return {
    ...baseRobots,
    sitemap: [
      new URL("/sitemap.xml", siteConfig.siteUrl).toString(),
      new URL("/sitemap.txt", siteConfig.siteUrl).toString(),
      new URL("/rss.xml", siteConfig.siteUrl).toString()
    ]
  };
}
