import { getTelegramBotToken, telegramApi } from "./telegram-api";

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function resolvePublicSiteUrl(): string | null {
  const explicit =
    readEnv("PUBLIC_SITE_URL") ||
    readEnv("SITE_URL") ||
    readEnv("RAILWAY_STATIC_URL");
  if (explicit) return explicit.replace(/\/$/, "");

  const railwayDomain = readEnv("RAILWAY_PUBLIC_DOMAIN");
  if (railwayDomain) return `https://${railwayDomain}`;

  return null;
}

export async function syncTelegramWebhook(): Promise<boolean> {
  if (!getTelegramBotToken()) return false;

  const baseUrl = resolvePublicSiteUrl();
  if (!baseUrl) {
    console.warn("[telegram] Webhook: задайте PUBLIC_SITE_URL или RAILWAY_PUBLIC_DOMAIN");
    return false;
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  const secret = readEnv("TELEGRAM_WEBHOOK_SECRET");

  const result = await telegramApi("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"],
    ...(secret ? { secret_token: secret } : {}),
  });

  if (!result.ok) {
    console.error("[telegram] Webhook:", result.description ?? "setWebhook failed");
    return false;
  }

  console.log(`[telegram] Webhook: ${webhookUrl}`);
  return true;
}
