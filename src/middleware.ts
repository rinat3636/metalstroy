import { defineMiddleware } from "astro:middleware";
import { ensureTelegramBotRunning } from "@/lib/telegram-server";

export const onRequest = defineMiddleware(async (context, next) => {
  ensureTelegramBotRunning();
  return next();
});
