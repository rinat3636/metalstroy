import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
const FILE = join(process.cwd(), "data", "telegram-sessions.json");
const TTL_MS = 30 * 60 * 1000;

interface StoredSession {
  session: { step: string; [key: string]: unknown };
  updatedAt: string;
}

type SessionFile = Record<string, StoredSession>;

function readFile(): SessionFile {
  if (!existsSync(FILE)) return {};
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as SessionFile;
  } catch {
    return {};
  }
}

function writeFile(data: SessionFile): void {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
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
