import { withBase } from "./paths";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import citiesData from "@/data/cities.json";
import type { Product, Category, City } from "./types";

export const products = productsData as Product[];
export const categories = categoriesData as Category[];
export const cities = citiesData as City[];

export const site = {
  name: "Профсталь-инвест",
  legalName: 'ООО "Профсталь-инвест"',
  tagline: "Металлопрокат и стройматериалы в ДНР",
  phone: import.meta.env.PUBLIC_SITE_PHONE ?? "+79990000000",
  email: import.meta.env.PUBLIC_SITE_EMAIL ?? "sales@profstal-invest.ru",
  address: "ДНР, адрес склада: уточняется",
  schedule: "Пн–Сб: 8:00–18:00",
  inn: "0000000000",
  kpp: "000000000",
  ogrn: "0000000000000",
  metrikaId: import.meta.env.PUBLIC_YANDEX_METRIKA_ID ?? "",
  telegram: "https://t.me/profstal_invest",
  whatsapp: "https://wa.me/79990000000",
};

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
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
