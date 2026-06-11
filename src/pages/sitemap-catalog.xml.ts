import type { APIRoute } from "astro";
import { getSiteOrigin } from "@/lib/subdomains";
import { loadProducts } from "@/lib/product-store";

export const prerender = false;

/** Карта товаров для Яндекс/Google — обновляется при добавлении через бота или админку */
export const GET: APIRoute = () => {
  const base = getSiteOrigin();
  const products = loadProducts();

  const urls = products
    .map(
      (p) => `  <url>
    <loc>${base}/catalog/${p.categorySlug}/${p.slug}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
