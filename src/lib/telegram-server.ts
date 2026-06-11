import { getTelegramBotToken } from "./telegram-api";
import { startTelegramPolling } from "./telegram-poll-runner";
import { syncTelegramWebhook } from "./telegram-webhook-sync";

let started = false;

export function shouldAutoStartBot(): boolean {
  if (!getTelegramBotToken()) return false;
  if (process.env.TELEGRAM_MODE?.trim().toLowerCase() === "off") return false;
  if (process.env.TELEGRAM_AUTO_START === "0") return false;
  if (process.env.TELEGRAM_POLL_LOCAL === "1") return true;

  if (process.env.RAILWAY_ENVIRONMENT) return true;
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.PORT) return true;

  return false;
}

export function getTelegramBotStatus(): {
  configured: boolean;
  autoStart: boolean;
  started: boolean;
  mode: string;
} {
  const mode = (process.env.TELEGRAM_MODE ?? "poll").trim().toLowerCase();
  return {
    configured: !!getTelegramBotToken(),
    autoStart: shouldAutoStartBot(),
    started,
    mode,
  };
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
  console.log(`[telegram] Старт (mode=${mode}, token=${getTelegramBotToken() ? "ok" : "нет"})`);

  if (mode === "webhook") {
    void syncTelegramWebhook().then((ok) => {
      if (!ok) {
        console.warn("[telegram] Webhook не настроен — переключаюсь на poll");
        startTelegramPolling();
      } else {
        console.log("[telegram] Режим webhook — long polling выключен");
      }
    });
    return;
  }

  startTelegramPolling();
}
