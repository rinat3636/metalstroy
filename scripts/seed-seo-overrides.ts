/**
 * Генерирует SEO-overrides для ходовых SKU (featured + popularSkus).
 * npm run seo:seed-overrides
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import citiesData from "../src/data/cities.json";
import featuredSkus from "../src/data/featured-products.json";
import { loadProducts, loadCategories } from "../src/lib/product-store";
import type { City, Product } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cities = citiesData as City[];

function uniqueSkus(): string[] {
  const set = new Set<string>(featuredSkus as string[]);
  for (const city of cities) {
    for (const sku of city.popularSkus ?? []) set.add(sku);
  }
  return [...set];
}

function buildOverride(product: Product, categoryName: string) {
  const specs = product.specsRaw || product.specs.map((s) => `${s.label}: ${s.value}`).join("; ");
  return {
    title: `${product.title} — купить в ДНР | ${product.sku}`,
    description: `${product.title}, арт. ${product.sku}. ${categoryName}${specs ? `. ${specs.slice(0, 60)}` : ""}. Доставка по ДНР, расчёт онлайн.`,
    intro: `${product.title} (${product.sku}) — поставка со склада Профсталь-инвест по Донецку, Макеевке и всей ДНР. ${product.description.split(/\.\s+/)[0]}.`,
  };
}

const products = loadProducts();
const categories = loadCategories();
const overrides: Record<string, ReturnType<typeof buildOverride>> = {};

for (const sku of uniqueSkus()) {
  const product = products.find((p) => p.sku === sku);
  if (!product) continue;
  const cat = categories.find((c) => c.slug === product.categorySlug);
  overrides[sku] = buildOverride(product, cat?.name ?? product.category);
}

const path = join(root, "src/data/product-seo-overrides.json");
writeFileSync(path, `${JSON.stringify(overrides, null, 2)}\n`, "utf-8");
console.log(`✓ Записано ${Object.keys(overrides).length} overrides → ${path}`);
