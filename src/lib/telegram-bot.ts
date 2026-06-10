import {
  BOT_ADMIN_CONNECTED_TEXT,
  BOT_ALREADY_CONNECTED_TEXT,
  BOT_HELP_TEXT,
} from "./telegram";
import { addTelegramAdmin } from "./telegram-admins";

export interface TelegramUpdateMessage {
  chat: { id: number; username?: string; first_name?: string };
  text?: string;
}

function isStartCommand(text: string): boolean {
  const lower = text.toLowerCase();
  return lower === "/start" || lower === "start" || lower.startsWith("/start ");
}

/** Открытый доступ: любой, кто пишет боту, становится админом уведомлений. */
export async function handleTelegramMessage(
  message: TelegramUpdateMessage,
  send: (chatId: number, text: string) => Promise<void>,
): Promise<void> {
  const chat = message.chat;
  const text = message.text?.trim() ?? "";

  if (isStartCommand(text) || text) {
    const isNew = addTelegramAdmin(chat);
    if (isNew) {
      await send(chat.id, BOT_ADMIN_CONNECTED_TEXT);
      return;
    }
    if (isStartCommand(text)) {
      await send(chat.id, BOT_ALREADY_CONNECTED_TEXT);
      return;
    }
  }

  if (text.startsWith("/help") || text.startsWith("/")) {
    await send(chat.id, BOT_HELP_TEXT);
    return;
  }

  if (!text) {
    const isNew = addTelegramAdmin(chat);
    if (isNew) await send(chat.id, BOT_ADMIN_CONNECTED_TEXT);
  }
}
