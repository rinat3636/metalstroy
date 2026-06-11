/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_PHONE: string;
  readonly PUBLIC_SITE_EMAIL: string;
  readonly PUBLIC_SITE_ADDRESS: string;
  readonly PUBLIC_SITE_TELEGRAM: string;
  readonly PUBLIC_SITE_WHATSAPP: string;
  readonly PUBLIC_SITE_INN: string;
  readonly PUBLIC_SITE_KPP: string;
  readonly PUBLIC_SITE_OGRN: string;
  readonly PUBLIC_YANDEX_METRIKA_ID: string;
  readonly PUBLIC_YANDEX_VERIFICATION: string;
  readonly PUBLIC_YANDEX_MAP_IFRAME: string;
  readonly TELEGRAM_BOT_TOKEN: string;
  readonly TELEGRAM_PROXY: string;
  readonly TELEGRAM_WEBHOOK_SECRET: string;
  readonly TELEGRAM_MODE: string;
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_SITE_DOMAIN: string;
  readonly PUBLIC_SITE_GEO_LAT: string;
  readonly PUBLIC_SITE_GEO_LNG: string;
  readonly PUBLIC_YANDEX_MAPS_URL: string;
  readonly PUBLIC_2GIS_URL: string;
  readonly CRM_WEBHOOK_URL: string;
  readonly ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    subdomain?: {
      kind: "city" | "category";
      slug: string;
      name: string;
    };
  }
}
