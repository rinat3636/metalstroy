import type { APIRoute } from "astro";
import { handleTelegramMessage } from "@/lib/telegram-bot";
import { sendTelegramToChat } from "@/lib/telegram";

export const prerender = false;

interface TelegramUpdate {
  message?: {
    chat: { id: number; username?: string; first_name?: string };
    text?: string;
  };
}

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (header !== secret) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const message = update.message;
  if (!message?.chat?.id) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  try {
    await handleTelegramMessage(message, (chatId, text) => sendTelegramToChat(chatId, text));
  } catch (error) {
    console.error("[telegram webhook]", error);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
