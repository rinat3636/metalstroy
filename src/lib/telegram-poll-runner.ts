import { handleTelegramMessage } from "./telegram-bot";
import { sendTelegramToChat } from "./telegram";
import { getTelegramBotToken, telegramApi } from "./telegram-api";

const POLL_TIMEOUT_SEC = 50;
let running = false;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function preparePolling(): Promise<void> {
  const me = await telegramApi<{ username?: string }>("getMe", undefined, 30_000);
  if (!me.ok) {
    throw new Error(me.description ?? "getMe failed");
  }

  const wh = await telegramApi<{ url?: string }>("getWebhookInfo");
  if (wh.result?.url) {
    console.log(`[telegram] Снимаю webhook: ${wh.result.url}`);
    await telegramApi("deleteWebhook", { drop_pending_updates: false });
  }

  console.log(`[telegram] Long polling — @${me.result?.username ?? "bot"}`);
}

async function pollLoop(): Promise<void> {
  let offset = 0;

  while (running) {
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
        console.error("[telegram] getUpdates:", data.description ?? "unknown error");
        await sleep(5000);
        continue;
      }

      for (const update of data.result ?? []) {
        offset = update.update_id + 1;
        const message = update.message;
        if (!message) continue;

        try {
          await handleTelegramMessage(message, (chatId, text) => sendTelegramToChat(chatId, text));
        } catch (error) {
          console.error(`[telegram] Ошибка для ${message.chat.id}:`, error);
        }
      }
    } catch (error) {
      console.error(
        "[telegram] Сеть / API, повтор через 5 с...",
        error instanceof Error ? error.message : error,
      );
      await sleep(5000);
    }
  }
}

/** Фоновый poll на сервере — бот отвечает без ручной настройки webhook. */
export function startTelegramPolling(): void {
  if (running || !getTelegramBotToken()) return;
  running = true;

  void (async () => {
    while (running) {
      try {
        await preparePolling();
        await pollLoop();
        return;
      } catch (error) {
        console.error(
          "[telegram] Нет связи с API, повтор через 10 с...",
          error instanceof Error ? error.message : error,
        );
        await sleep(10_000);
      }
    }
  })();
}
