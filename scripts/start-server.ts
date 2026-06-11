/**
 * Production entry: запуск Telegram-бота до старта HTTP-сервера.
 * npm start / Railway CMD
 */
import { ensureTelegramBotRunning } from "../src/lib/telegram-server";

ensureTelegramBotRunning();

await import("../dist/server/entry.mjs");
