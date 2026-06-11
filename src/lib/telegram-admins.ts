import { existsSync } from "node:fs";
import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "./json-file";

export interface TelegramAdmin {
  chatId: number;
  username?: string;
  firstName?: string;
  addedAt: string;
}

const FILE = join(process.cwd(), "data", "telegram-admins.json");
const LEGACY = join(process.cwd(), "data", "telegram-subscribers.json");

function readList(): TelegramAdmin[] {
  if (existsSync(FILE)) {
    return readJsonFile<TelegramAdmin[]>(FILE, []);
  }
  if (existsSync(LEGACY)) {
    const legacy = readJsonFile<
      Array<{
      chatId: number;
      username?: string;
      firstName?: string;
      subscribedAt?: string;
      }>
    >(LEGACY, []);
    return legacy.map((item) => ({
      chatId: item.chatId,
      username: item.username,
      firstName: item.firstName,
      addedAt: item.subscribedAt ?? new Date().toISOString(),
    }));
  }
  return [];
}

function writeList(list: TelegramAdmin[]): void {
  writeJsonFile(FILE, list);
}

export function loadTelegramAdmins(): TelegramAdmin[] {
  return readList();
}

/** @returns true если админ добавлен впервые */
export function addTelegramAdmin(chat: {
  id: number;
  username?: string;
  first_name?: string;
}): boolean {
  const list = readList();
  if (list.some((a) => a.chatId === chat.id)) return false;
  list.push({
    chatId: chat.id,
    username: chat.username,
    firstName: chat.first_name,
    addedAt: new Date().toISOString(),
  });
  writeList(list);
  return true;
}

export function getTelegramAdminChatIds(): number[] {
  return readList().map((a) => a.chatId);
}
