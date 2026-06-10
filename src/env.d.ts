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
  readonly TELEGRAM_BOT_TOKEN: string;
  readonly TELEGRAM_PROXY: string;
  readonly TELEGRAM_WEBHOOK_SECRET: string;
  readonly TELEGRAM_MODE: string;
  readonly PUBLIC_SITE_URL: string;
  readonly CRM_WEBHOOK_URL: string;
  readonly ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
