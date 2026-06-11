import {
  BOT_ADMIN_CONNECTED_TEXT,
  BOT_ALREADY_CONNECTED_TEXT,
  BOT_HELP_TEXT,
  answerTelegramCallback,
  editTelegramMessage,
  sendTelegramToChat,
  type TelegramSendOptions,
} from "./telegram";
import { addTelegramAdmin } from "./telegram-admins";
import {
  buildSearchReply,
  handleCallback,
  handleMenuButton,
  handleSessionText,
  type BotReply,
} from "./telegram-admin-bot";
import { getSession, resetSession } from "./telegram-admin-session";
import { BTN_HELP, MENU_BUTTONS, mainMenuKeyboard } from "./telegram-keyboard";

export interface TelegramChat {
  id: number;
  username?: string;
  first_name?: string;
}

export interface TelegramUpdateMessage {
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: { chat: TelegramChat; message_id: number };
}

export interface TelegramUpdate {
  message?: TelegramUpdateMessage;
  callback_query?: TelegramCallbackQuery;
}

function withMenu(options?: TelegramSendOptions): TelegramSendOptions {
  return {
    ...options,
    replyMarkup: options?.replyMarkup ?? mainMenuKeyboard(),
  };
}

async function reply(chatId: number, payload: BotReply | string): Promise<void> {
  const text = typeof payload === "string" ? payload : payload.text;
  const options = typeof payload === "string" ? undefined : payload.options;

  try {
    await sendTelegramToChat(chatId, text, withMenu(options));
  } catch (error) {
    console.error(`[telegram] Ошибка отправки в ${chatId}:`, error instanceof Error ? error.message : error);
    try {
      await sendTelegramToChat(chatId, text.replace(/<[^>]+>/g, ""));
    } catch (retryError) {
      console.error(`[telegram] Повтор без HTML не удался:`, retryError instanceof Error ? retryError.message : retryError);
      throw retryError;
    }
  }
}

function isStartCommand(text: string): boolean {
  const lower = text.toLowerCase();
  return lower === "/start" || lower === "start" || lower.startsWith("/start ");
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }
  const message = update.message;
  if (message?.chat?.id) await handleTelegramMessage(message);
}

async function handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
  const chat = query.message?.chat;
  const messageId = query.message?.message_id;
  const data = query.data?.trim();
  if (!chat?.id || !data) {
    if (query.id) await answerTelegramCallback(query.id);
    return;
  }

  addTelegramAdmin(chat);
  const result = handleCallback(data, chat.id);
  await answerTelegramCallback(query.id);

  if (!result) {
    await reply(chat.id, "Не удалось выполнить действие.");
    return;
  }

  if (messageId && result.options?.replyMarkup && !result.options.replyMarkup.keyboard) {
    try {
      await editTelegramMessage(chat.id, messageId, result.text, result.options);
      return;
    } catch {
      /* отправим новым сообщением */
    }
  }

  await reply(chat.id, result);
}

/** Бот-админка: заявки + каталог. Без TELEGRAM_CHAT_ID. */
export async function handleTelegramMessage(message: TelegramUpdateMessage): Promise<void> {
  const chat = message.chat;
  const text = message.text?.trim() ?? "";

  const isNewAdmin = addTelegramAdmin(chat);

  if (isStartCommand(text) || !text) {
    console.log(`[telegram] /start от chat ${chat.id} (@${chat.username ?? "?"})`);
    await reply(chat.id, isNewAdmin ? BOT_ADMIN_CONNECTED_TEXT : BOT_ALREADY_CONNECTED_TEXT);
    return;
  }

  if (text === BTN_HELP || text === "/help") {
    await reply(chat.id, BOT_HELP_TEXT);
    return;
  }

  const menu = handleMenuButton(text, chat.id);
  if (menu) {
    await reply(chat.id, menu);
    return;
  }

  const sessionReply = handleSessionText(chat.id, text);
  if (sessionReply) {
    await reply(chat.id, sessionReply);
    return;
  }

  if (text.startsWith("/")) {
    await reply(chat.id, BOT_HELP_TEXT);
    return;
  }

  if (!MENU_BUTTONS.has(text) && text.length >= 2) {
    const session = getSession(chat.id);
    if (session.step !== "idle") {
      await reply(
        chat.id,
        "Сейчас ждём другой ввод. Используйте кнопки в чате или нажмите /start для сброса.",
      );
      return;
    }
    await reply(chat.id, buildSearchReply(text));
    return;
  }

  await reply(chat.id, BOT_HELP_TEXT);
}
