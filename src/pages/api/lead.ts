import type { APIRoute } from "astro";
import type { LeadPayload } from "@/lib/types";
import {
  formatLeadTelegramMessage,
  getBotPublicLabel,
  isTelegramConfiguredForLeads,
  sendLeadTelegramMessage,
} from "@/lib/telegram";

export const prerender = false;

const rateLimit = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.reset) {
    rateLimit.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

async function sendCrm(payload: LeadPayload): Promise<void> {
  const webhook = import.meta.env.CRM_WEBHOOK_URL?.trim();
  if (!webhook) return;
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`CRM webhook error: ${response.status}`);
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Слишком много запросов. Попробуйте позже." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: LeadPayload & { company?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Некорректный запрос" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.company?.trim()) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!body.phone || !isValidPhone(body.phone)) {
    return new Response(JSON.stringify({ error: "Укажите корректный телефон" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isTelegramConfiguredForLeads()) {
    return new Response(
      JSON.stringify({
        error: `Telegram не подключён. Админу нужно нажать /start в боте ${getBotPublicLabel()}.`,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    await sendLeadTelegramMessage(body);
    await sendCrm(body).catch(() => {
      /* CRM опционален — не блокируем заявку */
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось отправить заявку";
    console.error("[lead]", message);
    return new Response(JSON.stringify({ error: "Не удалось отправить заявку. Позвоните нам напрямую." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
