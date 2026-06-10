/**
 * Проверка токена бота.
 * npm run telegram:setup -- <BOT_TOKEN>
 */

import { telegramApi } from "../src/lib/telegram-api";

const token = process.argv[2];

if (!token) {
  console.log(`
Использование:
  npm run telegram:setup -- <BOT_TOKEN>

Дальше:
  1. TELEGRAM_BOT_TOKEN в .env
  2. npm run telegram:check
  3. npm run telegram:poll
  4. /start в боте
`);
  process.exit(1);
}

process.env.TELEGRAM_BOT_TOKEN = token;

const me = await telegramApi<{ username?: string }>("getMe", undefined, 30_000);

if (!me.ok) {
  console.error("Ошибка:", me.description ?? "нет связи с Telegram API (VPN / TELEGRAM_PROXY)");
  process.exit(1);
}

console.log(`Бот: @${me.result?.username}`);
console.log(`
Добавьте в .env:
TELEGRAM_BOT_TOKEN=${token}

Если API недоступен с ПК — добавьте прокси:
TELEGRAM_PROXY=socks5://127.0.0.1:1080
`);
