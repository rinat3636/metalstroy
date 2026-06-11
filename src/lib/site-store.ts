import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";

export interface SiteSettings {
  phone: string;
  email: string;
  address: string;
  schedule: string;
  legalName: string;
  inn: string;
  kpp: string;
  ogrn: string;
}

export type SiteSettingsField = keyof SiteSettings;

const FILE = join(process.cwd(), "data/site-settings.json");

function readEnv(name: string): string {
  try {
    const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
    const fromMeta = meta.env?.[name]?.trim();
    if (fromMeta) return fromMeta;
  } catch {
    /* node scripts */
  }
  return process.env[name]?.trim() ?? "";
}

function envDefaults(): SiteSettings {
  return {
    phone: readEnv("PUBLIC_SITE_PHONE") || "+7 (949) 000-00-00",
    email: readEnv("PUBLIC_SITE_EMAIL") || "sales@ps-invest.ru",
    address: readEnv("PUBLIC_SITE_ADDRESS") || "г. Донецк, ДНР",
    schedule: "Пн–Сб: 8:00–18:00",
    legalName: 'ООО "Профсталь-инвест"',
    inn: readEnv("PUBLIC_SITE_INN"),
    kpp: readEnv("PUBLIC_SITE_KPP"),
    ogrn: readEnv("PUBLIC_SITE_OGRN"),
  };
}

function readFileSettings(): Partial<SiteSettings> {
  if (!existsSync(FILE)) return {};
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as Partial<SiteSettings>;
  } catch {
    return {};
  }
}

function writeSettings(data: SiteSettings): void {
  mkdirSync(dirname(FILE), { recursive: true });
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const tmp = `${FILE}.tmp`;
  writeFileSync(tmp, content, "utf-8");
  renameSync(tmp, FILE);
}

/** Контакты и реквизиты: data/site-settings.json + fallback env */
export function loadSiteSettings(): SiteSettings {
  const defaults = envDefaults();
  const fromFile = readFileSettings();
  return { ...defaults, ...fromFile };
}

export function updateSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
  const current = loadSiteSettings();
  const next: SiteSettings = { ...current };
  for (const key of Object.keys(patch) as SiteSettingsField[]) {
    const value = patch[key];
    if (value !== undefined) next[key] = value.trim();
  }
  writeSettings(next);
  return next;
}

export const SITE_FIELD_LABELS: Record<SiteSettingsField, string> = {
  phone: "Телефон",
  email: "Email",
  address: "Адрес",
  schedule: "График работы",
  legalName: "Юр. название",
  inn: "ИНН",
  kpp: "КПП",
  ogrn: "ОГРН",
};
