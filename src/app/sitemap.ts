import type { MetadataRoute } from "next";
import exhibitsData from "@/data/exhibits.json";

const SITE_URL = "https://portfolia-sumit.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    { url: `${SITE_URL}/recruiter`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    ...exhibitsData.exhibits.map((p) => ({
      url: `${SITE_URL}/work/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
