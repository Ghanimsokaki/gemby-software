import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/#features", "/#detection", "/#faq"],
        // Signed-in areas and the installer itself should never be crawled.
        disallow: ["/dashboard", "/chat", "/signin", "/signup", "/downloads/", "/api/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
