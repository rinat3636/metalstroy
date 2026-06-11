import { accessSync, constants, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface DataPathStatus {
  path: string;
  exists: boolean;
  writable: boolean;
}

function checkPath(relative: string): DataPathStatus {
  const path = join(process.cwd(), relative);
  const exists = existsSync(path);
  const dir = exists ? dirname(path) : dirname(path);
  let writable = false;
  try {
    accessSync(dir, constants.W_OK);
    writable = true;
  } catch {
    writable = false;
  }
  return { path: relative, exists, writable };
}

/** Пути персистентных данных бота и каталога (для /api/telegram/status). */
export function getTelegramDataPaths(): Record<string, DataPathStatus> {
  return {
    admins: checkPath("data/telegram-admins.json"),
    siteSettings: checkPath("data/site-settings.json"),
    catalogRaw: checkPath("data/catalog.json"),
    products: checkPath("src/data/products.json"),
    categories: checkPath("src/data/categories.json"),
    sessions: checkPath("data/telegram-sessions.json"),
    auditLog: checkPath("data/telegram-audit-log.json"),
  };
}
