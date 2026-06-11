import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "./json-file";
const FILE = join(process.cwd(), "data", "telegram-sessions.json");
const TTL_MS = 30 * 60 * 1000;

interface StoredSession {
  session: { step: string; [key: string]: unknown };
  updatedAt: string;
}

type SessionFile = Record<string, StoredSession>;

function readFile(): SessionFile {
  return readJsonFile<SessionFile>(FILE, {});
}

function writeFile(data: SessionFile): void {
  writeJsonFile(FILE, data);
}

function prune(data: SessionFile): SessionFile {
  const now = Date.now();
  const next: SessionFile = {};
  for (const [key, entry] of Object.entries(data)) {
    if (now - new Date(entry.updatedAt).getTime() <= TTL_MS) {
      next[key] = entry;
    }
  }
  return next;
}

export function loadStoredSession(chatId: number): StoredSession["session"] | null {
  const data = prune(readFile());
  const entry = data[String(chatId)];
  if (!entry) return null;
  return entry.session;
}

export function saveStoredSession(chatId: number, session: StoredSession["session"]): void {
  const data = prune(readFile());
  data[String(chatId)] = { session, updatedAt: new Date().toISOString() };
  writeFile(data);
}

export function clearStoredSession(chatId: number): void {
  const data = prune(readFile());
  delete data[String(chatId)];
  writeFile(data);
}

export function getSessionStorePath(): string {
  return "data/telegram-sessions.json";
}
