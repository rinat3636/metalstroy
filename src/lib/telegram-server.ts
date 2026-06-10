import { getTelegramBotToken } from "./telegram-api";
import { startTelegramPolling } from "./telegram-poll-runner";
import { syncTelegramWebhook } from "./telegram-webhook-sync";

let started = false;

function shouldAutoStartBot(): boolean {
  if (!getTelegramBotToken()) return false;
  if (process.env.TELEGRAM_MODE?.trim().toLowerCase() === "off") return false;

  const onRailway = !!process.env.RAILWAY_ENVIRONMENT;
  const isProd = process.env.NODE_ENV === "production";
  if (onRailway || isProd) return true;

  return process.env.TELEGRAM_POLL_LOCAL === "1";
}

/**
 * Запуск бота на сервере (Railway и т.п.).
 * По умолчанию — long polling (работает сразу после деплоя).
 * TELEGRAM_MODE=webhook — только webhook (нужен публичный URL).
 */
export function ensureTelegramBotRunning(): void {
  if (started || !shouldAutoStartBot()) return;
  started = true;

  const mode = (process.env.TELEGRAM_MODE ?? "poll").trim().toLowerCase();

  if (mode === "webhook") {
    void syncTelegramWebhook().then((ok) => {
      if (!ok) {
        console.warn("[telegram] Webhook не настроен — переключаюсь на poll");
        startTelegramPolling();
      }
    });
    return;
  }

  startTelegramPolling();
}
