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

export async function handleTelegramMessage(
  message: TelegramUpdateMessage,
  send: (chatId: number, text: string) => Promise<void>,
): Promise<void> {
  const chat = message.chat;
  const text = message.text?.trim() ?? "";

  if (text === "/start" || text.toLowerCase() === "start") {
    const isNew = addTelegramAdmin(chat);
    await send(chat.id, isNew ? BOT_ADMIN_CONNECTED_TEXT : BOT_ALREADY_CONNECTED_TEXT);
    return;
  }

  if (text.startsWith("/")) {
    await send(chat.id, BOT_HELP_TEXT);
  }
}
