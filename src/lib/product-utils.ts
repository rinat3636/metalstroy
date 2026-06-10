import type { Product, StockStatus } from "./types";

const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => translitMap[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseSpecs(raw: string): { label: string; value: string }[] {
  if (!raw?.trim()) return [];
  return raw.split(";").map((part) => {
    const [label, ...rest] = part.split(":");
    return { label: (label ?? "").trim(), value: rest.join(":").trim() };
  }).filter((s) => s.label && s.value);
}

export function stockToLabel(stock: StockStatus): string {
  if (stock === "in_stock") return "В наличии";
  if (stock === "on_order") return "Под заказ";
  return "Нет в наличии";
}

export function labelToStock(label: string): StockStatus {
  if (label === "В наличии") return "in_stock";
  if (label === "Под заказ") return "on_order";
  return "out_of_stock";
}

export function nextSku(products: Product[]): string {
  let max = 20000;
  for (const p of products) {
    const match = p.sku.match(/МТЛ-(\d+)/i);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `МТЛ-${max + 1}`;
}

export function buildProductSlug(title: string, sku: string): string {
  const skuPart = slugify(sku.replace(/МТЛ-/i, "mtl-"));
  const base = slugify(title) || "product";
  return `${base}-${skuPart}`;
}

export function imageFilenameFromSku(sku: string, ext: string): string {
  const num = sku.match(/(\d+)/)?.[1] ?? Date.now().toString();
  return `mtl-${num}.${ext.replace(/^\./, "")}`;
}

export interface ProductInput {
  title: string;
  category: string;
  categorySlug: string;
  subcategory?: string;
  price: number | null;
  stock: StockStatus;
  specsRaw: string;
  description: string;
  image?: string;
  sku?: string;
}

export function buildProduct(input: ProductInput, sku: string): Product {
  return {
    sku,
    title: input.title.trim(),
    slug: buildProductSlug(input.title, sku),
    category: input.category,
    categorySlug: input.categorySlug,
    subcategory: input.subcategory?.trim() || undefined,
    price: input.price,
    currency: "RUB",
    stock: input.stock,
    stockLabel: stockToLabel(input.stock),
    specs: parseSpecs(input.specsRaw),
    specsRaw: input.specsRaw.trim(),
    description: input.description.trim(),
    image: input.image,
  };
}

export function productToCatalogRaw(product: Product) {
  return {
    артикул: product.sku,
    название: product.title,
    категория: product.category,
    подкатегория: product.subcategory ?? "",
    цена: product.price ?? 0,
    валюта: "₽",
    наличие: product.stockLabel,
    характеристики: product.specsRaw,
    описание: product.description,
    изображение: product.image ?? "",
  };
}
