import type { APIRoute } from "astro";
import { readServerEnv } from "@/lib/runtime-env";
import { handleTelegramUpdate } from "@/lib/telegram-bot";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const secret = readServerEnv("TELEGRAM_WEBHOOK_SECRET");
  const mode = (process.env.TELEGRAM_MODE ?? "poll").trim().toLowerCase();
  const isProd = process.env.NODE_ENV === "production";

  if (mode === "webhook" && isProd && !secret) {
    return new Response("Webhook secret required", { status: 503 });
  }

  if (secret) {
    const header = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (header !== secret) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let update: Parameters<typeof handleTelegramUpdate>[0];
  try {
    update = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  try {
    await handleTelegramUpdate(update);
  } catch (error) {
    console.error("[telegram webhook]", error);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
