import { readPublicEnv } from "./runtime-env";
import { getSiteOrigin } from "./subdomains";

export interface YandexConfig {
  metrikaId: string;
  verification: string;
  googleVerification: string;
  mapsUrl: string;
  mapIframeSrc: string;
  webmasterHost: string;
}

export function getYandexConfig(): YandexConfig {
  return {
    metrikaId: readPublicEnv("PUBLIC_YANDEX_METRIKA_ID"),
    verification: readPublicEnv("PUBLIC_YANDEX_VERIFICATION"),
    googleVerification: readPublicEnv("PUBLIC_GOOGLE_SITE_VERIFICATION"),
    mapsUrl: readPublicEnv("PUBLIC_YANDEX_MAPS_URL"),
    mapIframeSrc: readPublicEnv("PUBLIC_YANDEX_MAP_IFRAME"),
    webmasterHost: readPublicEnv("PUBLIC_SITE_DOMAIN") || "ps-invest.ru",
  };
}

export function yandexSitemapUrls(): string[] {
  const origin = getSiteOrigin();
  return [
    `${origin}/sitemap-index.xml`,
    `${origin}/sitemap-seo.xml`,
    `${origin}/sitemap-catalog.xml`,
    `${origin}/sitemap-city-products.xml`,
    `${origin}/sitemap-subdomains.xml`,
  ];
}
