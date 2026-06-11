import type { APIRoute } from "astro";
import { statSync } from "node:fs";
import { join } from "node:path";
import { absoluteUrl, listAllSitemapUrls, listCityProductSitemapUrls, type SitemapEntry } from "@/lib/seo";
import { loadProducts } from "@/lib/product-store";
import { productCanonicalUrl } from "@/lib/product-seo";

export const prerender = false;

function catalogLastmod(): string {
  try {
    const path = join(process.cwd(), "src/data/products.json");
    return statSync(path).mtime.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function renderUrl(entry: SitemapEntry): string {
  const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${entry.loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
}

/** Полная SEO-карта: канонические URL, поддомены, города×категории, товары */
export const GET: APIRoute = () => {
  const productLastmod = catalogLastmod();
  const entries: SitemapEntry[] = [...listAllSitemapUrls(), ...listCityProductSitemapUrls()];

  for (const product of loadProducts()) {
    entries.push({
      loc: productCanonicalUrl(product),
      priority: "0.8",
      changefreq: "weekly",
      lastmod: productLastmod,
    });
  }

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
