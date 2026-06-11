import { getTelegramBotToken, telegramApi } from "./telegram-api";
import { getTelegramAdminChatIds } from "./telegram-admins";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getTelegramToken(): string | null {
  return getTelegramBotToken();
}

export function getLeadRecipientChatIds(): number[] {
  return getTelegramAdminChatIds();
}

export function isTelegramConfiguredForLeads(): boolean {
  return !!getTelegramToken() && getLeadRecipientChatIds().length > 0;
}

export type TelegramSendOptions = {
  html?: boolean;
  replyMarkup?: Record<string, unknown>;
};

async function callTelegram(body: Record<string, unknown>): Promise<void> {
  const data = await telegramApi("sendMessage", body);
  if (!data.ok) {
    throw new Error(data.description ?? "Telegram API error");
  }
}

export async function sendTelegramToChat(
  chatId: string | number,
  text: string,
  options?: TelegramSendOptions,
): Promise<void> {
  if (!getTelegramToken()) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  await callTelegram({
    chat_id: chatId,
    text,
    ...(options?.html ? { parse_mode: "HTML", disable_web_page_preview: true } : {}),
    ...(options?.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
  });
}

export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  options?: TelegramSendOptions,
): Promise<void> {
  if (!getTelegramToken()) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const data = await telegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    ...(options?.html ? { parse_mode: "HTML", disable_web_page_preview: true } : {}),
    ...(options?.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
  });
  if (!data.ok) {
    throw new Error(data.description ?? "editMessageText error");
  }
}

export async function answerTelegramCallback(callbackQueryId: string, text?: string): Promise<void> {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

/** Заявки с сайта — всем, кто нажал /start в боте */
export async function sendTelegramMessage(text: string): Promise<void> {
  if (!getTelegramToken()) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const admins = getLeadRecipientChatIds();
  if (admins.length === 0) {
    throw new Error("Никто не подключён: напишите боту /start");
  }

  const errors: string[] = [];
  for (const chatId of admins) {
    try {
      await sendTelegramToChat(chatId, text, { html: true });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (errors.length === admins.length) {
    throw new Error(errors[0] ?? "Не удалось отправить в Telegram");
  }
}

export const BOT_ADMIN_CONNECTED_TEXT = [
  "Админка подключена.",
  "",
  "• Заявки с сайта — сюда",
  "• 📋 Каталог — товары",
  "• ➕ Новый товар — добавить",
  "• 📁 Категории — добавить / редактировать",
  "• 🏢 Контакты — телефон и реквизиты",
  "• 🔍 Найти — поиск",
].join("\n");

export const BOT_ALREADY_CONNECTED_TEXT = "Вы подключены. Заявки и каталог — кнопками ниже.";

export const BOT_HELP_TEXT = [
  "Бот-админка Профсталь-инвест.",
  "",
  "Заявки с сайта приходят автоматически.",
  "",
  "📋 Каталог — товары: цена, название, наличие",
  "➕ Новый товар — добавление",
  "📁 Категории — новая категория, название, описание, SEO",
  "🏢 Контакты — телефон, email, адрес, ИНН/КПП/ОГРН",
  "🔍 Найти — поиск по артикулу или названию",
].join("\n");

export function formatLeadTelegramMessage(payload: {
  name?: string;
  phone: string;
  city?: string;
  source?: string;
  message?: string;
  items?: { sku: string; title: string; quantity: number }[];
  utm?: Record<string, string>;
}): string {
  const itemsText =
    payload.items && payload.items.length > 0
      ? payload.items
          .map((i) => `• ${escapeHtml(i.sku)} — ${escapeHtml(i.title)} × ${i.quantity}`)
          .join("\n")
      : "—";

  const utmText = payload.utm
    ? Object.entries(payload.utm)
        .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
        .join("\n")
    : "";

  return [
    "<b>🆕 Новая заявка</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(payload.name || "—")}`,
    `<b>Телефон:</b> ${escapeHtml(payload.phone)}`,
    `<b>Город:</b> ${escapeHtml(payload.city || "—")}`,
    `<b>Страница:</b> ${escapeHtml(payload.source || "—")}`,
    "",
    "<b>Позиции:</b>",
    itemsText,
    "",
    "<b>Комментарий:</b>",
    escapeHtml(payload.message || "—"),
    utmText ? `\n<b>UTM:</b>\n${utmText}` : "",
    "",
    `🕐 ${escapeHtml(new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }))}`,
  ].join("\n");
}
