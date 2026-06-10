import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyEnvFile } from "./load-env";
import { getTelegramBotToken, telegramApi } from "../src/lib/telegram-api";

applyEnvFile();

const adminsPath = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "telegram-admins.json");

if (!getTelegramBotToken()) {
  console.error("Нужен TELEGRAM_BOT_TOKEN в .env");
  process.exit(1);
}

let admins: { chatId: number }[] = [];
if (existsSync(adminsPath)) {
  admins = JSON.parse(readFileSync(adminsPath, "utf-8"));
}

if (admins.length === 0) {
  console.error("Нет админов. Запустите npm run telegram:poll и напишите боту /start");
  process.exit(1);
}

const text = [
  "<b>Тест — Профсталь-инвест</b>",
  "",
  "Заявки с сайта будут приходить админам бота.",
  `🕐 ${new Date().toLocaleString("ru-RU")}`,
].join("\n");

for (const admin of admins) {
  const data = await telegramApi("sendMessage", {
    chat_id: admin.chatId,
    text,
    parse_mode: "HTML",
  });
  if (!data.ok) {
    console.error(`Ошибка для ${admin.chatId}:`, data.description);
    console.error("Запустите npm run telegram:check");
    process.exit(1);
  }
}

console.log(`Тест отправлен ${admins.length} админ(ам) ✓`);
