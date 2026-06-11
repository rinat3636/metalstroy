import { withBase } from "./paths";
import { readPublicEnv } from "./runtime-env";
import { loadSiteSettings } from "./site-store";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import citiesData from "@/data/cities.json";
import featuredSkus from "@/data/featured-products.json";
import type { Product, Category, City } from "./types";

export const products = productsData as Product[];
export const categories = categoriesData as Category[];
export const cities = citiesData as City[];

const STATIC_SITE = {
  name: "Профсталь-инвест",
  tagline: "Металлопрокат и стройматериалы в ДНР",
  addressNote: "Точный адрес склада и схема проезда — после подтверждения заказа",
  metrikaId: readPublicEnv("PUBLIC_YANDEX_METRIKA_ID"),
  telegram: readPublicEnv("PUBLIC_SITE_TELEGRAM") || "https://t.me/proffinvest23_bot",
  whatsapp: readPublicEnv("PUBLIC_SITE_WHATSAPP") || "https://wa.me/79490000000",
  yandexMaps: readPublicEnv("PUBLIC_YANDEX_MAPS_URL"),
  gis2: readPublicEnv("PUBLIC_2GIS_URL"),
  geoLat: readPublicEnv("PUBLIC_SITE_GEO_LAT"),
  geoLng: readPublicEnv("PUBLIC_SITE_GEO_LNG"),
};

/** Актуальные контакты и реквизиты (бот пишет в data/site-settings.json) */
export function loadSite() {
  const settings = loadSiteSettings();
  return { ...STATIC_SITE, ...settings };
}

/** Снимок на момент сборки — предпочитайте loadSite() на SSR-страницах */
export const site = loadSite();

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
