import { withBase } from "./paths";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import citiesData from "@/data/cities.json";
import featuredSkus from "@/data/featured-products.json";
import type { Product, Category, City } from "./types";

export const products = productsData as Product[];
export const categories = categoriesData as Category[];
export const cities = citiesData as City[];

export const site = {
  name: "Профсталь-инвест",
  legalName: 'ООО "Профсталь-инвест"',
  tagline: "Металлопрокат и стройматериалы в ДНР",
  phone: import.meta.env.PUBLIC_SITE_PHONE ?? "+7 (949) 000-00-00",
  email: import.meta.env.PUBLIC_SITE_EMAIL ?? "sales@profstal-invest.ru",
  address: import.meta.env.PUBLIC_SITE_ADDRESS ?? "г. Донецк, ДНР",
  addressNote: "Точный адрес склада и схема проезда — после подтверждения заказа",
  schedule: "Пн–Сб: 8:00–18:00",
  metrikaId: import.meta.env.PUBLIC_YANDEX_METRIKA_ID ?? "",
  telegram: import.meta.env.PUBLIC_SITE_TELEGRAM ?? "https://t.me/proffinvest23_bot",
  whatsapp: import.meta.env.PUBLIC_SITE_WHATSAPP ?? "https://wa.me/79490000000",
  inn: import.meta.env.PUBLIC_SITE_INN ?? "",
  kpp: import.meta.env.PUBLIC_SITE_KPP ?? "",
  ogrn: import.meta.env.PUBLIC_SITE_OGRN ?? "",
};

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}

/** Ходовые позиции для главной */
export function getFeaturedProducts(): Product[] {
  return (featuredSkus as string[])
    .map((sku) => getProductBySku(sku))
    .filter((p): p is Product => !!p);
}

/** Похожие товары из той же категории */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.categorySlug === product.categorySlug && p.sku !== product.sku)
    .slice(0, limit);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Обложка категории — только фото из товаров этой категории */
export function getCategoryCoverImage(slug: string): string | undefined {
  const category = getCategoryBySlug(slug);
  if (!category?.image) return undefined;
  const valid = products.some((p) => p.categorySlug === slug && p.image === category.image);
  return valid ? category.image : undefined;
}

export function getCityBySlug(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}

export function formatPrice(price: number | null): string {
  if (!Number.isFinite(price)) return "по запросу";
  return `от ${new Intl.NumberFormat("ru-RU").format(price!)} ₽`;
}

export function stockLabel(stock: Product["stock"]): string {
  if (stock === "in_stock") return "В наличии";
  if (stock === "on_order") return "Под заказ";
  return "Нет в наличии";
}

export function productImageUrl(image?: string): string {
  if (!image) return withBase("/assets/placeholder-product.svg");
  return withBase(`/assets/catalog-images/${encodeURIComponent(image)}`);
}
