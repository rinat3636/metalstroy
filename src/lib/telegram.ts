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

async function callTelegram(body: Record<string, unknown>): Promise<void> {
  const data = await telegramApi("sendMessage", body);
  if (!data.ok) {
    throw new Error(data.description ?? "Telegram API error");
  }
}

export async function sendTelegramToChat(
  chatId: string | number,
  text: string,
  options?: { html?: boolean },
): Promise<void> {
  if (!getTelegramToken()) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  await callTelegram({
    chat_id: chatId,
    text,
    ...(options?.html ? { parse_mode: "HTML", disable_web_page_preview: true } : {}),
  });
}

/** Заявки с сайта — всем админам бота (кто нажал /start) */
export async function sendTelegramMessage(text: string): Promise<void> {
  if (!getTelegramToken()) throw new Error("TELEGRAM_BOT_TOKEN не задан");

  const admins = getLeadRecipientChatIds();
  if (admins.length === 0) {
    throw new Error("Админ не подключён: напишите боту /start");
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
  "Вы подключены как администратор.",
  "",
  "Заявки с сайта Профсталь-инвест будут приходить в этот чат.",
  "Доступ открытый — каждый, кто запускает бота, получает те же уведомления.",
  "",
  "Админка каталога на сайте: /admin",
  "/help — справка",
].join("\n");

export const BOT_ALREADY_CONNECTED_TEXT = [
  "Вы уже подключены.",
  "",
  "Заявки с сайта приходят в этот чат.",
  "/help — справка",
].join("\n");

export const BOT_HELP_TEXT = [
  "Профсталь-инвест — бот уведомлений.",
  "",
  "Открытый доступ: нажмите /start или напишите любое сообщение — вы админ.",
  "",
  "Заявки с сайта приходят всем подключённым.",
  "Каталог на сайте: /admin",
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
    "<b>Новая заявка — Профсталь-инвест</b>",
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
