import type { APIRoute } from "astro";
import { handleTelegramUpdate } from "@/lib/telegram-bot";

export const prerender = false;

function readWebhookSecret(): string | undefined {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || import.meta.env.TELEGRAM_WEBHOOK_SECRET?.trim();
}

export const POST: APIRoute = async ({ request }) => {
  const secret = readWebhookSecret();
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
