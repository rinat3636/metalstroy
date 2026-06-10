/**
 * Диагностика бота: сеть, токен, webhook, админы.
 * npm run telegram:check
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyEnvFile } from "./load-env";
import { getTelegramBotToken, getTelegramProxy, telegramApi } from "../src/lib/telegram-api";

applyEnvFile();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const adminsPath = join(root, "data", "telegram-admins.json");

console.log("=== Проверка Telegram-бота ===\n");

const token = getTelegramBotToken();
if (!token) {
  console.error("✗ TELEGRAM_BOT_TOKEN не задан в .env");
  process.exit(1);
}
console.log("✓ Токен в .env есть");

const proxy = getTelegramProxy();
if (proxy) {
  console.log(`✓ Прокси: ${proxy}`);
} else {
  console.log("— Прокси не задан (TELEGRAM_PROXY / HTTPS_PROXY)");
}

const me = await telegramApi<{ username?: string; first_name?: string }>("getMe", undefined, 30_000);
if (!me.ok) {
  console.error("\n✗ Нет связи с Telegram API");
  console.error("  Причина:", me.description ?? "таймаут / блокировка сети");
  console.error(`
Что делать:
  1. Включите VPN на этом ПК
  2. Или укажите прокси в .env:
     TELEGRAM_PROXY=socks5://127.0.0.1:1080
     (порт смотрите в вашем VPN-клиенте)
  3. Или запускайте сайт на хостинге за рубежом — там webhook без poll
`);
  process.exit(1);
}

console.log(`✓ API доступен — бот @${me.result?.username}`);

const wh = await telegramApi<{ url?: string; pending_update_count?: number }>("getWebhookInfo");
if (wh.result?.url) {
  console.log(`⚠ Webhook включён: ${wh.result.url}`);
  console.log("  Локально нужен poll ИЛИ снимите webhook: npm run telegram:webhook:off");
} else {
  console.log("✓ Webhook выключен (для локали нужен npm run telegram:poll)");
}

if (existsSync(adminsPath)) {
  const admins = JSON.parse(readFileSync(adminsPath, "utf-8")) as unknown[];
  console.log(`✓ Админов в списке: ${admins.length}`);
} else {
  console.log("— Нет файла telegram-admins.json — напишите боту /start");
}

console.log(`
Дальше:
  npm run telegram:poll   ← держать открытым
  Написать боту /start
`);
