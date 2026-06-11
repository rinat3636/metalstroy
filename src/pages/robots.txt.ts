import type { APIRoute } from "astro";
import { yandexSitemapUrls } from "@/lib/yandex-config";

export const prerender = false;

/** robots.txt с актуальным доменом и картами для Яндекса */
export const GET: APIRoute = () => {
  const sitemaps = yandexSitemapUrls();

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "",
    "User-agent: Yandex",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term /",
    "",
    ...sitemaps.map((url) => `Sitemap: ${url}`),
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
