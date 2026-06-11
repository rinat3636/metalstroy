import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const FILE = join(process.cwd(), "data", "telegram-audit-log.json");
const MAX_ENTRIES = 100;

export interface TelegramAuditEntry {
  chatId: number;
  action: string;
  sku?: string;
  timestamp: string;
}

function readEntries(): TelegramAuditEntry[] {
  if (!existsSync(FILE)) return [];
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as TelegramAuditEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: TelegramAuditEntry[]): void {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, `${JSON.stringify(entries.slice(-MAX_ENTRIES), null, 2)}\n`, "utf-8");
}

export function logTelegramCatalogAction(chatId: number, action: string, sku?: string): void {
  const entries = readEntries();
  entries.push({
    chatId,
    action,
    sku,
    timestamp: new Date().toISOString(),
  });
  writeEntries(entries);
}

export function getAuditLogPath(): string {
  return "data/telegram-audit-log.json";
}
