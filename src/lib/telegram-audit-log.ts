import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "./json-file";

const FILE = join(process.cwd(), "data", "telegram-audit-log.json");
const MAX_ENTRIES = 100;

export interface TelegramAuditEntry {
  chatId: number;
  action: string;
  sku?: string;
  timestamp: string;
}

function readEntries(): TelegramAuditEntry[] {
  return readJsonFile<TelegramAuditEntry[]>(FILE, []);
}

function writeEntries(entries: TelegramAuditEntry[]): void {
  writeJsonFile(FILE, entries.slice(-MAX_ENTRIES));
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
