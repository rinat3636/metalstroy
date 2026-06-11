import type { APIRoute } from "astro";
import { getSiteOrigin } from "@/lib/subdomains";

export const prerender = false;

/** Индекс карт сайта — укажите этот URL в Яндекс.Вебмастер */
export const GET: APIRoute = () => {
  const origin = getSiteOrigin();
  const maps = [
    "sitemap-seo.xml",
    "sitemap-subdomains.xml",
    "sitemap-catalog.xml",
    "sitemap-city-products.xml",
  ];

  const entries = maps
    .map(
      (name) => `  <sitemap>
    <loc>${origin}/${name}</loc>
  </sitemap>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
