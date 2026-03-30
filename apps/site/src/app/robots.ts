import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: [
      new URL("/sitemap.xml", siteConfig.siteUrl).toString(),
      new URL("/sitemap.txt", siteConfig.siteUrl).toString(),
      new URL("/rss.xml", siteConfig.siteUrl).toString()
    ]
  };
}
