import featuredSkus from "@/data/featured-products.json";
import {
  getCategoryBySlug,
  getProductBySku,
  loadProducts,
} from "./product-store";
import type { Product } from "./types";

export { loadProducts, loadCategories, getProductBySku, getCategoryBySlug, getProductsByCategory } from "./product-store";

/** Актуальный каталог с диска — бот, поиск и страницы используют одни данные */
export function getFeaturedProducts(): Product[] {
  return (featuredSkus as string[])
    .map((sku) => getProductBySku(sku))
    .filter((p): p is Product => !!p);
}

export function getCategoryCoverImage(slug: string): string | undefined {
  const category = getCategoryBySlug(slug);
  if (!category?.image) return undefined;
  const valid = loadProducts().some(
    (p) => p.categorySlug === slug && p.image === category.image,
  );
  return valid ? category.image : undefined;
}
