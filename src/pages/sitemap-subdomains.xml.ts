import type { APIRoute } from "astro";
import { listAllSubdomains, subdomainUrl } from "@/lib/subdomains";

export const prerender = false;

/** Карта поддоменов городов и категорий для поисковиков */
export const GET: APIRoute = () => {
  const entries = listAllSubdomains();

  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${subdomainUrl(entry.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${entry.kind === "city" ? "0.85" : "0.8"}</priority>
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
