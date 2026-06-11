/**
 * Диагностика бота: сеть, токен, webhook, админы.
 * npm run telegram:check
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyEnvFile } from "./load-env";
import { getTelegramBotToken, getTelegramProxy, telegramApi } from "../src/lib/telegram-api";
import { shouldAutoStartBot } from "../src/lib/telegram-server";

applyEnvFile();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const adminsPath = join(root, "data", "telegram-admins.json");

console.log("=== Проверка Telegram-бота ===\n");

const token = getTelegramBotToken();
if (!token) {
  console.error("✗ TELEGRAM_BOT_TOKEN не задан в .env / Railway Variables");
  process.exit(1);
}
console.log("✓ Токен есть");

const mode = (process.env.TELEGRAM_MODE ?? "poll").trim().toLowerCase();
console.log(`— TELEGRAM_MODE=${mode}`);
console.log(`— Автостарт на сервере: ${shouldAutoStartBot() ? "да" : "нет"}`);

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
  1. Включите VPN на этом ПК (ДНР/РФ часто блокируют api.telegram.org)
  2. Или укажите прокси в .env:
     TELEGRAM_PROXY=socks5://127.0.0.1:1080
  3. На Railway/хостинге — бот стартует сам (npm start), VPN не нужен
`);
  process.exit(1);
}

console.log(`✓ API доступен — бот @${me.result?.username}`);

const wh = await telegramApi<{
  url?: string;
  pending_update_count?: number;
  last_error_message?: string;
}>("getWebhookInfo");

if (wh.result?.url) {
  console.log(`\n⚠ Webhook АКТИВЕН: ${wh.result.url}`);
  if (wh.result.pending_update_count) {
    console.log(`  Ожидают доставки: ${wh.result.pending_update_count}`);
  }
  if (wh.result.last_error_message) {
    console.log(`  ✗ Ошибка webhook: ${wh.result.last_error_message}`);
  }
  if (mode === "poll") {
    console.log(`
  ПРОБЛЕМА: webhook блокирует long polling!
  Telegram шлёт сообщения на webhook, а не в getUpdates.
  Решение: npm run telegram:webhook:off
  Или на сервере перезапустите — poll снимет webhook при старте.`);
  } else {
    console.log("  Режим webhook — poll не нужен, но URL должен быть доступен из интернета.");
  }
} else {
  console.log("\n✓ Webhook выключен");
  if (mode === "webhook") {
    console.log("  ⚠ TELEGRAM_MODE=webhook, но webhook не установлен — проверьте PUBLIC_SITE_URL");
  } else {
    console.log("  На сервере: npm start (poll стартует сам)");
    console.log("  Локально: npm run telegram:poll в отдельном окне");
  }
}

if (existsSync(adminsPath)) {
  const admins = JSON.parse(readFileSync(adminsPath, "utf-8")) as unknown[];
  console.log(`\n✓ Админов в списке: ${admins.length}`);
} else {
  console.log("\n— Нет telegram-admins.json — напишите боту /start");
}

console.log(`
Диагностика на проде: GET /api/telegram/status

Локально:
  npm run telegram:poll   ← держать открытым
  Написать боту /start
`);
