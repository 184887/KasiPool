import type { MetadataRoute } from "next";
import { getOpenPools, SITE_URL } from "@/lib/site";

// Rebuilt every hour so new deals show up
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/offers", "/catalogue", "/how-it-works", "/help", "/terms", "/privacy"];
  const deals = await getOpenPools();
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...deals.map((d) => ({ url: `${SITE_URL}/offers/${d.id}`, lastModified: d.created_at })),
  ];
}
