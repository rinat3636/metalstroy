/**
 * Снять webhook — чтобы работал локальный poll.
 * npm run telegram:webhook:off
 */

import { applyEnvFile } from "./load-env";
import { telegramApi } from "../src/lib/telegram-api";

applyEnvFile();

const result = await telegramApi("deleteWebhook", { drop_pending_updates: false });
if (!result.ok) {
  console.error("Ошибка:", result.description);
  process.exit(1);
}

console.log("Webhook снят. Запустите: npm run telegram:poll");
