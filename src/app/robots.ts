import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block admin routes under any locale prefix. The wildcard pattern is
        // honored by the major crawlers (Google/Bing) and survives any new
        // locale being added without revisiting this file.
        disallow: [
          "/api/",
          "/admin/",
          "/*/admin/",
          "/my-courses/",
          "/*/my-courses/",
          "/profile/",
          "/*/profile/",
          "/payment/",
          "/*/payment/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
