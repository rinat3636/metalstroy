import type { APIRoute } from "astro";
import { readServerEnv } from "@/lib/runtime-env";
import { getTelegramAdminChatIds } from "@/lib/telegram-admins";
import { getTelegramBotToken, telegramApi } from "@/lib/telegram-api";
import { getTelegramDataPaths } from "@/lib/telegram-data-paths";
import { loadCategories, loadProducts } from "@/lib/product-store";
import { getPollHealth } from "@/lib/telegram-poll-runner";
import { getTelegramBotStatus } from "@/lib/telegram-server";

export const prerender = false;

function isStatusAuthorized(request: Request): boolean {
  const token = readServerEnv("TELEGRAM_STATUS_TOKEN");
  if (!token) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("token") === token) return true;
  const auth = request.headers.get("Authorization");
  return auth === `Bearer ${token}`;
}

/** Диагностика бота. GET /api/telegram/status (?token= если задан TELEGRAM_STATUS_TOKEN) */
export const GET: APIRoute = async ({ request }) => {
  if (!isStatusAuthorized(request)) {
    return new Response(JSON.stringify({ error: "Нет доступа" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const status = getTelegramBotStatus();
  const token = getTelegramBotToken();
  const dataPaths = getTelegramDataPaths();

  let botUsername: string | null = null;
  let webhookUrl: string | null = null;
  let webhookLastError: string | null = null;
  let webhookPendingUpdates = 0;
  let apiOk = false;
  let apiError: string | null = null;

  if (token) {
    const me = await telegramApi<{ username?: string }>("getMe", undefined, 15_000);
    apiOk = me.ok;
    apiError = me.ok ? null : me.description ?? "getMe failed";
    botUsername = me.result?.username ?? null;

    const wh = await telegramApi<{
      url?: string;
      last_error_message?: string;
      pending_update_count?: number;
    }>("getWebhookInfo");
    webhookUrl = wh.result?.url || null;
    webhookLastError = wh.result?.last_error_message ?? null;
    webhookPendingUpdates = wh.result?.pending_update_count ?? 0;
  }

  const pollBlockedByWebhook = !!webhookUrl && status.mode === "poll";
  const dataWritable = Object.values(dataPaths).every((p) => p.writable);
  const pollHealth = getPollHealth();

  return new Response(
    JSON.stringify(
      {
        ...status,
        ...pollHealth,
        admins: getTelegramAdminChatIds().length,
        botUsername: botUsername ? `@${botUsername}` : null,
        webhookUrl,
        webhookLastError,
        webhookPendingUpdates,
        apiOk,
        apiError,
        pollBlockedByWebhook,
        catalog: {
          categories: loadCategories().length,
          products: loadProducts().length,
        },
        dataPaths,
        dataWritable,
        hint: !token
          ? "Задайте TELEGRAM_BOT_TOKEN"
          : pollBlockedByWebhook
            ? "Webhook активен — poll не получит сообщения. npm run telegram:webhook:off или удалите webhook"
            : !dataWritable
              ? "Нет записи в data/ или src/data — подключите Railway Volume"
              : !status.started
                ? "Бот не запущен — проверьте TELEGRAM_MODE и логи сервера"
                : status.mode === "webhook" && !webhookUrl
                  ? "Webhook mode, но URL не установлен"
                  : webhookLastError
                    ? `Webhook ошибка: ${webhookLastError}`
                    : "ok",
      },
      null,
      2,
    ),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
