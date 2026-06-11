/**
 * Локальный SEO-аудит (фазы 1–3 из docs/seo-audit-plan.md).
 * npm run seo:audit
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyEnvFile } from "./load-env";
import { loadProducts, loadCategories } from "../src/lib/product-store";
import { cities } from "../src/lib/data";
import { listAllSitemapUrls, listCityProductSitemapUrls } from "../src/lib/seo";
import { productTitle, productMetaDescription } from "../src/lib/product-seo";
import { cityProductTitle, cityProductDescription } from "../src/lib/city-product-seo";
import { getSiteOrigin } from "../src/lib/subdomains";

applyEnvFile();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;
let warned = 0;

function ok(msg: string): void {
  passed++;
  console.log(`  ✓ ${msg}`);
}

function fail(msg: string): void {
  failed++;
  console.error(`  ✗ ${msg}`);
}

function warn(msg: string): void {
  warned++;
  console.log(`  ⚠ ${msg}`);
}

console.log("=== SEO-аудит ps-invest.ru ===\n");

const products = loadProducts();
const categories = loadCategories();
const origin = getSiteOrigin();

console.log("1. Инвентарь URL");
const seoUrls = listAllSitemapUrls().length;
const cityProductUrls = listCityProductSitemapUrls().length;
ok(`Товаров: ${products.length}, категорий: ${categories.length}, городов: ${cities.length}`);
ok(`sitemap-seo (страницы): ${seoUrls}`);
ok(`sitemap-city-products: ${cityProductUrls}`);
ok(`Итого landing: ~${seoUrls + cityProductUrls + products.length}`);

console.log("\n2. Env (VPS / .env)");
const required = ["PUBLIC_SITE_URL", "PUBLIC_SITE_DOMAIN"];
for (const key of required) {
  if (process.env[key]?.trim()) ok(`${key}`);
  else warn(`${key} не задан — canonical/sitemap могут быть неверными`);
}
if (process.env.PUBLIC_YANDEX_METRIKA_ID?.trim()) ok("PUBLIC_YANDEX_METRIKA_ID");
else warn("PUBLIC_YANDEX_METRIKA_ID — Метрика не подключится");
if (process.env.PUBLIC_YANDEX_VERIFICATION?.trim()) ok("PUBLIC_YANDEX_VERIFICATION");
else warn("PUBLIC_YANDEX_VERIFICATION — подтвердите Вебмастер вручную");

console.log("\n3. Товары — качество данных");
const noDesc = products.filter((p) => !p.description?.trim() || p.description.length < 40);
const noImage = products.filter((p) => !p.image);
const placeholder = products.filter((p) => !p.image);
if (noDesc.length === 0) ok("У всех товаров есть описание (≥40 символов)");
else fail(`Без нормального описания: ${noDesc.length} — ${noDesc.slice(0, 3).map((p) => p.sku).join(", ")}`);
if (noImage.length === 0) ok("У всех товаров есть image");
else warn(`Без фото: ${noImage.length}`);

console.log("\n4. Дубли title / description");
const titles = new Map<string, string[]>();
const descs = new Map<string, string[]>();
for (const p of products) {
  const cat = categories.find((c) => c.slug === p.categorySlug);
  if (!cat) continue;
  const t = productTitle(p, cat);
  const d = productMetaDescription(p, cat);
  titles.set(t, [...(titles.get(t) ?? []), p.sku]);
  descs.set(d, [...(descs.get(d) ?? []), p.sku]);
}
const dupTitles = [...titles.entries()].filter(([, skus]) => skus.length > 1);
const dupDescs = [...descs.entries()].filter(([, skus]) => skus.length > 1);
if (dupTitles.length === 0) ok("Нет дублей title у товаров");
else warn(`Дублей title: ${dupTitles.length}`);
if (dupDescs.length === 0) ok("Нет дублей description у товаров");
else warn(`Дублей description: ${dupDescs.length}`);

console.log("\n5. City×product — уникальность title (выборка)");
const sampleCity = cities[0];
const sampleTitles = new Set<string>();
let cityDupes = 0;
for (const p of products.slice(0, 30)) {
  const cat = categories.find((c) => c.slug === p.categorySlug);
  if (!cat) continue;
  const t = cityProductTitle(p, sampleCity, cat);
  if (sampleTitles.has(t)) cityDupes++;
  sampleTitles.add(t);
}
if (cityDupes === 0) ok(`30 товаров в ${sampleCity.name}: уникальные title`);
else warn(`Дублей city-product title в выборке: ${cityDupes}`);

console.log("\n6. Файлы и overrides");
const overridesPath = join(root, "src/data/product-seo-overrides.json");
if (existsSync(overridesPath)) {
  const o = JSON.parse(readFileSync(overridesPath, "utf-8")) as Record<string, unknown>;
  const keys = Object.keys(o).length;
  if (keys >= 8) ok(`product-seo-overrides.json: ${keys} записей`);
  else warn(`product-seo-overrides.json: только ${keys} — запустите npm run seo:seed-overrides`);
} else {
  warn("Нет product-seo-overrides.json");
}

const cityOverrides = join(root, "src/data/city-category-overrides.json");
if (existsSync(cityOverrides)) {
  const n = Object.keys(JSON.parse(readFileSync(cityOverrides, "utf-8"))).length;
  ok(`city-category-overrides: ${n} пар город×категория`);
}

console.log("\n7. Прод-проверки (если сайт доступен)");
const base = process.env.SEO_AUDIT_URL?.trim() || origin;
const paths = ["/robots.txt", "/sitemap-index.xml", "/sitemap-seo.xml", "/"];
let prodOk = true;
for (const path of paths) {
  try {
    const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(12_000) });
    if (res.ok) ok(`${path} → ${res.status}`);
    else {
      fail(`${path} → ${res.status}`);
      prodOk = false;
    }
  } catch {
    warn(`${path} — сайт недоступен (${base}), проверьте на VPS после деплоя`);
    prodOk = false;
    break;
  }
}
if (prodOk) {
  try {
    const r = await fetch(`${base}/cities/donetsk/`, { redirect: "manual" });
    if (r.status === 301 || r.status === 302) {
      const loc = r.headers.get("location") ?? "";
      if (loc.includes("donetsk.")) ok("301 /cities/donetsk/ → поддомен");
      else warn(`Редирект города: ${loc}`);
    } else {
      warn(`/cities/donetsk/ → ${r.status} (ожидался 301 на поддомен)`);
    }
  } catch {
    /* уже предупреждено */
  }
}

console.log(`\n=== Итог: ${passed} OK, ${warned} предупреждений, ${failed} ошибок ===`);
if (failed > 0) process.exit(1);
