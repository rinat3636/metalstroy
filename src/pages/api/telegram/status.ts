import type { APIRoute } from "astro";
import { getTelegramAdminChatIds } from "@/lib/telegram-admins";
import { getTelegramBotToken, telegramApi } from "@/lib/telegram-api";
import { getTelegramBotStatus } from "@/lib/telegram-server";

export const prerender = false;

/** Диагностика бота (без секретов). GET /api/telegram/status */
export const GET: APIRoute = async () => {
  const status = getTelegramBotStatus();
  const token = getTelegramBotToken();

  let botUsername: string | null = null;
  let webhookUrl: string | null = null;
  let apiOk = false;
  let apiError: string | null = null;

  if (token) {
    const me = await telegramApi<{ username?: string }>("getMe", undefined, 15_000);
    apiOk = me.ok;
    apiError = me.ok ? null : me.description ?? "getMe failed";
    botUsername = me.result?.username ?? null;

    const wh = await telegramApi<{ url?: string }>("getWebhookInfo");
    webhookUrl = wh.result?.url || null;
  }

  const pollBlockedByWebhook = !!webhookUrl && status.mode === "poll";

  return new Response(
    JSON.stringify(
      {
        ...status,
        admins: getTelegramAdminChatIds().length,
        botUsername: botUsername ? `@${botUsername}` : null,
        webhookUrl,
        apiOk,
        apiError,
        pollBlockedByWebhook,
        hint: !token
          ? "Задайте TELEGRAM_BOT_TOKEN"
          : pollBlockedByWebhook
            ? "Webhook активен — poll не получит сообщения. npm run telegram:webhook:off или удалите webhook"
            : !status.started
              ? "Бот не запущен — проверьте TELEGRAM_MODE и логи сервера"
              : status.mode === "webhook" && !webhookUrl
                ? "Webhook mode, но URL не установлен"
                : "ok",
      },
      null,
      2,
    ),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
