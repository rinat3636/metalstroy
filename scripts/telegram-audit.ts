/**
 * Локальный аудит логики бота (без Telegram API).
 * npm run telegram:audit
 */

import { accessSync, constants, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCategoryPageCallback, parseProductCallback } from "../src/lib/telegram-callback-routes";
import { handleCallback, handleMenuButton } from "../src/lib/telegram-admin-bot";
import { getSession, resetSession, setSession } from "../src/lib/telegram-admin-session";
import { getAuditLogPath } from "../src/lib/telegram-audit-log";
import { getSessionStorePath } from "../src/lib/telegram-session-store";
import { MENU_BUTTONS, BTN_HELP } from "../src/lib/telegram-keyboard";
import { productCanonicalUrl } from "../src/lib/product-url";
import { loadCategories, loadProducts } from "../src/lib/product-store";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEST_CHAT = 9_000_001;

let passed = 0;
let failed = 0;

function ok(label: string): void {
  passed++;
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string): void {
  failed++;
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) ok(label);
  else fail(label, detail);
}

function pathWritable(path: string): boolean {
  const dir = existsSync(path) ? dirname(path) : dirname(path);
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

console.log("=== Аудит Telegram-бота (логика) ===\n");

console.log("1. Callback parsers (коллизии ca:/cen: vs c:)");
assert("c:armatura:0", parseCategoryPageCallback("c:armatura:0")?.slug === "armatura");
assert("ca:armatura → null", parseCategoryPageCallback("ca:armatura") === null);
assert("cen:armatura → null", parseCategoryPageCallback("cen:armatura") === null);
assert("catlist → null", parseCategoryPageCallback("catlist") === null);
assert("p:МТЛ-001", parseProductCallback("p:МТЛ-001") === "МТЛ-001");
assert("p: → null", parseProductCallback("p:") === null);

console.log("\n2. Кнопки меню");
for (const btn of MENU_BUTTONS) {
  if (btn === BTN_HELP) {
    ok(`«${btn}» (telegram-bot.ts → BOT_HELP_TEXT)`);
    continue;
  }
  resetSession(TEST_CHAT);
  const reply = handleMenuButton(btn, TEST_CHAT);
  assert(`«${btn}»`, !!reply?.text);
}

console.log("\n3. Inline callbacks (без записи в каталог)");
resetSession(TEST_CHAT);
assert("cats", !!handleCallback("cats", TEST_CHAT)?.text);
assert("catlist", !!handleCallback("catlist", TEST_CHAT)?.text);
assert("catadd", !!handleCallback("catadd", TEST_CHAT)?.text);
assert("cancel", !!handleCallback("cancel", TEST_CHAT)?.text);
assert("company", !!handleCallback("company", TEST_CHAT)?.text);

const firstCat = loadCategories()[0];
if (firstCat) {
  assert(`ca:${firstCat.slug}`, !!handleCallback(`ca:${firstCat.slug}`, TEST_CHAT)?.text);
  assert(`c:${firstCat.slug}:0`, !!handleCallback(`c:${firstCat.slug}:0`, TEST_CHAT)?.text);
} else {
  console.log("  — нет категорий для проверки ca:/c:");
}

const firstProduct = loadProducts()[0];
if (firstProduct) {
  assert(`p:${firstProduct.sku}`, !!handleCallback(`p:${firstProduct.sku}`, TEST_CHAT)?.text);
  resetSession(TEST_CHAT);
  assert(`ed:${firstProduct.sku}`, !!handleCallback(`ed:${firstProduct.sku}`, TEST_CHAT)?.text);
  assert(`es:${firstProduct.sku}`, !!handleCallback(`es:${firstProduct.sku}`, TEST_CHAT)?.text);
  assert(`ei:${firstProduct.sku}`, !!handleCallback(`ei:${firstProduct.sku}`, TEST_CHAT)?.text);
  const url = productCanonicalUrl(firstProduct);
  assert("productCanonicalUrl", url.startsWith("https://") && url.includes(firstProduct.categorySlug));
} else {
  console.log("  — нет товаров для проверки p:");
}

console.log("\n4. Персистентные сессии");
resetSession(TEST_CHAT);
setSession(TEST_CHAT, { step: "search" });
assert("session save/load", getSession(TEST_CHAT).step === "search");
resetSession(TEST_CHAT);
assert("session reset", getSession(TEST_CHAT).step === "idle");

console.log("\n5. Файлы данных");
const paths = [
  ["data/telegram-admins.json", join(root, "data", "telegram-admins.json")],
  ["data/site-settings.json", join(root, "data", "site-settings.json")],
  [getSessionStorePath(), join(root, getSessionStorePath())],
  [getAuditLogPath(), join(root, getAuditLogPath())],
  ["src/data/products.json", join(root, "src/data/products.json")],
  ["src/data/categories.json", join(root, "src/data/categories.json")],
] as const;

for (const [label, path] of paths) {
  const exists = existsSync(path);
  const writable = pathWritable(path);
  if (exists && writable) ok(`${label} (есть, запись OK)`);
  else if (exists && !writable) fail(`${label} (есть, нет записи)`);
  else if (!exists && writable) ok(`${label} (создастся при первом сохранении)`);
  else fail(`${label} (нет и нельзя создать)`);
}

console.log(`\n6. Каталог: ${loadCategories().length} категорий, ${loadProducts().length} товаров`);

console.log(`\n=== Итог: ${passed} OK, ${failed} ошибок ===`);
if (failed > 0) process.exit(1);
