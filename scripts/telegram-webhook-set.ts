/**
 * Включить webhook на продакшене (после деплоя).
 * npm run telegram:webhook:set -- https://ваш-домен.ru
 */

import { applyEnvFile } from "./load-env";
import { telegramApi } from "../src/lib/telegram-api";

applyEnvFile();

const baseUrl = process.argv[2]?.replace(/\/$/, "");
if (!baseUrl) {
  console.log("Использование: npm run telegram:webhook:set -- https://ваш-сайт.ru");
  process.exit(1);
}

const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const webhookUrl = `${baseUrl}/api/telegram/webhook`;

const result = await telegramApi("setWebhook", {
  url: webhookUrl,
  allowed_updates: ["message"],
  ...(secret ? { secret_token: secret } : {}),
});

if (!result.ok) {
  console.error("Ошибка:", result.description);
  process.exit(1);
}

console.log(`Webhook: ${webhookUrl}`);
console.log("Напишите боту /start — он ответит без npm run telegram:poll");
