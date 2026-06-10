import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Category, Product } from "./types";
import { buildProduct, buildProductSlug, nextSku, productToCatalogRaw, type ProductInput } from "./product-utils";

const root = process.cwd();
const PRODUCTS_PATH = join(root, "src/data/products.json");
const CATEGORIES_PATH = join(root, "src/data/categories.json");
const CATALOG_RAW_PATH = join(root, "data/catalog.json");

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

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
  const q = query.trim().toLowerCase();
  if (!q) return loadProducts();
  return loadProducts().filter((p) => {
    const haystack = `${p.sku} ${p.title} ${p.category} ${p.subcategory ?? ""} ${p.specsRaw}`.toLowerCase();
    return haystack.includes(q) || p.sku.toLowerCase() === q;
  });
}

function recalcCategories(products: Product[]): Category[] {
  const categories = loadCategories();
  const counts = new Map<string, number>();
  for (const p of products) {
    counts.set(p.categorySlug, (counts.get(p.categorySlug) ?? 0) + 1);
  }
  return categories.map((cat) => ({
    ...cat,
    count: counts.get(cat.slug) ?? 0,
  }));
}

function syncCatalogRaw(products: Product[]): void {
  writeJson(CATALOG_RAW_PATH, products.map(productToCatalogRaw));
}

function persist(products: Product[]): Product[] {
  writeJson(PRODUCTS_PATH, products);
  writeJson(CATEGORIES_PATH, recalcCategories(products));
  syncCatalogRaw(products);
  return products;
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

export function deleteProduct(sku: string): void {
  const products = loadProducts();
  const next = products.filter((p) => p.sku.toUpperCase() !== sku.toUpperCase());
  if (next.length === products.length) throw new Error("Товар не найден");
  persist(next);
}
