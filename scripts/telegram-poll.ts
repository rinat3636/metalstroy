/**
 * Локальный режим бота: непрерывный long polling (без webhook).
 * npm run telegram:poll
 */

import { applyEnvFile } from "./load-env";
import { handleTelegramMessage } from "../src/lib/telegram-bot";
import { loadTelegramAdmins } from "../src/lib/telegram-admins";
import { getTelegramBotToken, getTelegramProxy, telegramApi } from "../src/lib/telegram-api";

applyEnvFile();

const token = getTelegramBotToken();
if (!token) {
  console.error("Нужен TELEGRAM_BOT_TOKEN в .env");
  process.exit(1);
}

const POLL_TIMEOUT_SEC = 50;

async function sendMessage(chatId: number, text: string): Promise<void> {
  const data = await telegramApi("sendMessage", { chat_id: chatId, text });
  if (!data.ok) throw new Error(data.description ?? "sendMessage failed");
}

async function preparePolling(): Promise<void> {
  while (true) {
    try {
      const me = await telegramApi<{ username?: string }>("getMe", undefined, 30_000);
      if (!me.ok) {
        console.error("Токен неверный:", me.description);
        process.exit(1);
      }

      const wh = await telegramApi<{ url?: string }>("getWebhookInfo");
      if (wh.result?.url) {
        console.log(`Снимаю webhook: ${wh.result.url}`);
        await telegramApi("deleteWebhook", { drop_pending_updates: false });
      }

      const proxy = getTelegramProxy();
      console.log(`Бот @${me.result?.username} слушает сообщения (long polling)`);
      if (proxy) console.log(`Прокси: ${proxy}`);
      console.log(`Админов: ${loadTelegramAdmins().length}. Напишите боту /start`);
      console.log("Ctrl+C — остановка\n");
      return;
    } catch (error) {
      console.error(
        "Нет связи с api.telegram.org. VPN или TELEGRAM_PROXY в .env. Повтор через 5 с...",
        error instanceof Error ? error.message : error,
      );
      await sleep(5000);
    }
  }
}

async function pollLoop(): Promise<never> {
  let offset = 0;

  while (true) {
    try {
      const data = await telegramApi<
        Array<{
          update_id: number;
          message?: { text?: string; chat: { id: number; username?: string; first_name?: string } };
        }>
      >(
        "getUpdates",
        { offset, timeout: POLL_TIMEOUT_SEC, allowed_updates: ["message"] },
        (POLL_TIMEOUT_SEC + 20) * 1000,
      );

      if (!data.ok) {
        console.error("getUpdates:", data.description ?? "unknown error");
        await sleep(5000);
        continue;
      }

      for (const update of data.result ?? []) {
        offset = update.update_id + 1;
        const message = update.message;
        if (!message) continue;

        try {
          await handleTelegramMessage(message, sendMessage);
          console.log(`Ответ → ${message.chat.id} (@${message.chat.username ?? "—"}): ${message.text ?? ""}`);
        } catch (error) {
          console.error(`Ошибка для ${message.chat.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Сеть / Telegram API, повтор через 5 с...", error instanceof Error ? error.message : error);
      await sleep(5000);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await preparePolling();
await pollLoop();
