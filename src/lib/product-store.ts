import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { filterProducts } from "./search";
import type { Category, Product } from "./types";
import { buildProduct, buildProductSlug, nextSku, productToCatalogRaw, type ProductInput } from "./product-utils";

import { slugify } from "./product-utils";

const root = process.cwd();
const PRODUCTS_PATH = join(root, "src/data/products.json");
const CATEGORIES_PATH = join(root, "src/data/categories.json");
const CATALOG_RAW_PATH = join(root, "data/catalog.json");

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, content, "utf-8");
  renameSync(tmp, path);
}

/** Единый источник каталога: сайт, поиск, бот, админка */
export function loadProducts(): Product[] {
  return readJson<Product[]>(PRODUCTS_PATH, []);
}

export function loadCategories(): Category[] {
  return readJson<Category[]>(CATEGORIES_PATH, []);
}

export function getProductBySku(sku: string): Product | undefined {
  const normalized = sku.trim().toUpperCase();
  return loadProducts().find((p) => p.sku.toUpperCase() === normalized);
}

export function searchProducts(query: string): Product[] {
  return filterProducts(loadProducts(), query);
}

function saveCategories(categories: Category[]): Category[] {
  const products = loadProducts();
  const counts = new Map<string, number>();
  for (const p of products) {
    counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1);
  }
  const merged = categories.map((cat) => ({
    ...cat,
    count: counts.get(cat.slug) ?? 0,
  }));
  writeJson(CATEGORIES_PATH, merged);
  return merged;
}

function recalcCategories(products: Product[]): Category[] {
  return saveCategories(loadCategories());
}

function syncCatalogRaw(products: Product[]): void {
  mkdirSync(dirname(CATALOG_RAW_PATH), { recursive: true });
  writeJson(CATALOG_RAW_PATH, products.map(productToCatalogRaw));
}

function persist(products: Product[]): Product[] {
  writeJson(PRODUCTS_PATH, products);
  recalcCategories(products);
  syncCatalogRaw(products);
  return products;
}

export function createCategory(input: {
  name: string;
  description?: string;
  seoText?: string;
}): Category {
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Название категории слишком короткое");

  const categories = loadCategories();
  let baseSlug = slugify(name);
  if (!baseSlug) throw new Error("Не удалось создать slug из названия");

  let slug = baseSlug;
  let n = 2;
  while (categories.some((c) => c.slug === slug)) {
    slug = `${baseSlug}-${n++}`;
  }

  const category: Category = {
    name,
    slug,
    count: 0,
    description: input.description?.trim() || `${name} — каталог металлопроката и стройматериалов.`,
    seoText: input.seoText?.trim() || "",
  };

  saveCategories([...categories, category]);
  return category;
}

export function updateCategory(
  slug: string,
  patch: Partial<Pick<Category, "name" | "description" | "seoText">>,
): Category {
  const categories = loadCategories();
  const index = categories.findIndex((c) => c.slug === slug);
  if (index === -1) throw new Error("Категория не найдена");

  const current = categories[index];
  const updated: Category = {
    ...current,
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
    ...(patch.seoText !== undefined ? { seoText: patch.seoText.trim() } : {}),
  };

  if (updated.name.length < 2) throw new Error("Название слишком короткое");

  const nextCategories = [...categories];
  nextCategories[index] = updated;
  saveCategories(nextCategories);

  if (patch.name && patch.name !== current.name) {
    const products = loadProducts();
    const nextProducts = products.map((p) =>
      p.categorySlug === slug ? { ...p, category: updated.name } : p,
    );
    persist(nextProducts);
  }

  return getCategoryBySlug(slug)!;
}

export function createProduct(input: ProductInput): Product {
  const products = loadProducts();
  const sku = nextSku(products);
  const product = buildProduct(input, sku);
  if (products.some((p) => p.sku === product.sku)) {
    throw new Error("Артикул уже существует");
  }
  persist([...products, product]);
  return product;
}

export function updateProduct(sku: string, input: ProductInput): Product {
  const products = loadProducts();
  const index = products.findIndex((p) => p.sku.toUpperCase() === sku.toUpperCase());
  if (index === -1) throw new Error("Товар не найден");

  const existing = products[index];
  const updated = buildProduct(input, existing.sku);
  updated.slug =
    input.title.trim() === existing.title
      ? existing.slug
      : buildProductSlug(input.title, existing.sku);

  const next = [...products];
  next[index] = updated;
  persist(next);
  return updated;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return loadCategories().find((c) => c.slug === slug);
}

export function getProductBySlugs(categorySlug: string, productSlug: string): Product | undefined {
  return loadProducts().find((p) => p.categorySlug === categorySlug && p.slug === productSlug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return loadProducts().filter((p) => p.categorySlug === categorySlug);
}

export function deleteProduct(sku: string): void {
  const products = loadProducts();
  const next = products.filter((p) => p.sku.toUpperCase() !== sku.toUpperCase());
  if (next.length === products.length) throw new Error("Товар не найден");
  persist(next);
}
