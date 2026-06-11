import type { APIRoute } from "astro";
import { loadProducts } from "@/lib/product-store";
import { productCanonicalUrl } from "@/lib/product-seo";

export const prerender = false;

/** Карта товаров для Яндекс/Google — обновляется при добавлении через бота или админку */
export const GET: APIRoute = () => {
  const products = loadProducts();

  const urls = products
    .map(
      (p) => `  <url>
    <loc>${productCanonicalUrl(p)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
