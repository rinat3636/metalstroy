import type { APIRoute } from "astro";
import { listAllSitemapUrls, type SitemapEntry } from "@/lib/seo";

export const prerender = false;

function renderUrl(entry: SitemapEntry): string {
  const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${entry.loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

/** Основная SEO-карта: статика, поддомены, город×категория (товары — в отдельных sitemap) */
export const GET: APIRoute = () => {
  const entries: SitemapEntry[] = [...listAllSitemapUrls()];

  const seen = new Set<string>();
  const unique = entries.filter((e) => {
    if (seen.has(e.loc)) return false;
    seen.add(e.loc);
    return true;
  });

  const urls = unique.map(renderUrl).join("\n");

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
