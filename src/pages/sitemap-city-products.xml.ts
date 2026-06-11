import type { APIRoute } from "astro";
import { statSync } from "node:fs";
import { join } from "node:path";
import { listCityProductSitemapUrls } from "@/lib/seo";

export const prerender = false;

function catalogLastmod(): string {
  try {
    const path = join(process.cwd(), "src/data/products.json");
    return statSync(path).mtime.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/** Карта landing-страниц «город × товар» для локального SEO */
export const GET: APIRoute = () => {
  const lastmod = catalogLastmod();
  const entries = listCityProductSitemapUrls().map((e) => ({ ...e, lastmod }));

  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
