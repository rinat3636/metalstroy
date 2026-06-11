import overridesData from "@/data/product-seo-overrides.json";
import type { Category, City, Product } from "./types";
import type { ProductSeoOverride } from "./product-seo";
import { readPublicEnv } from "./runtime-env";

type OverridesMap = Record<string, ProductSeoOverride>;

const overrides = overridesData as OverridesMap;

function primaryDomain(): string {
  return readPublicEnv("PUBLIC_SITE_DOMAIN") || "ps-invest.ru";
}

function cityOverride(sku: string, citySlug: string): ProductSeoOverride | undefined {
  return overrides[`${sku}:${citySlug}`] ?? overrides[sku];
}

function hashPair(a: string, b: string): number {
  let h = 0;
  const s = `${a}:${b}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Канонический URL: город + категория + товар на поддомене города */
export function cityProductUrl(citySlug: string, product: Pick<Product, "categorySlug" | "slug">): string {
  const domain = primaryDomain();
  return `https://${citySlug}.${domain}/${product.categorySlug}/${product.slug}/`;
}

function formatPriceShort(price: number | null): string {
  if (price == null || !Number.isFinite(price)) return "по запросу";
  return `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function specsLine(product: Product): string {
  if (product.specs.length > 0) {
    return product.specs
      .slice(0, 2)
      .map((s) => `${s.label} ${s.value}`)
      .join(", ");
  }
  return product.specsRaw?.slice(0, 70) ?? "";
}

export function cityProductTitle(product: Product, city: City, category: Category): string {
  const custom = cityOverride(product.sku, city.slug)?.title;
  if (custom) return custom;

  const base = `Купить ${product.title} в ${city.name} — ${product.sku}`;
  if (base.length <= 68) return base;
  return truncate(`${product.title} в ${city.name} | ${category.name}`, 68);
}

export function cityProductDescription(product: Product, city: City, category: Category): string {
  const custom = cityOverride(product.sku, city.slug)?.description;
  if (custom) return truncate(custom, 160);

  const price = formatPriceShort(product.price);
  const specs = specsLine(product);
  return truncate(
    `${product.sku}: ${product.title} в ${city.name}. ${category.name}${specs ? `, ${specs}` : ""}. Цена ${price}. ${city.delivery}`,
    160,
  );
}

export function cityProductH1(product: Product, city: City): string {
  return cityOverride(product.sku, city.slug)?.h1 ?? `${product.title} — доставка в ${city.name}`;
}

export function cityProductIntro(product: Product, city: City, category: Category): string[] {
  const custom = cityOverride(product.sku, city.slug)?.intro;
  if (custom) return [custom];

  const h = hashPair(product.sku, city.slug);
  const highlight = city.highlights?.[h % (city.highlights?.length ?? 1)] ?? city.text;
  const specs = specsLine(product);
  const inCity = city.name === "Донецк" ? "Донецке" : city.name;

  return [
    `«${product.title}» (артикул ${product.sku}) — поставка в ${inCity} и прилегающие районы ДНР. ${highlight}`,
    `Категория «${category.name}»${product.subcategory ? `, раздел «${product.subcategory}»` : ""}${specs ? `. Параметры: ${specs}` : ""}. ${product.description.split(/\.\s+/)[0]}.`,
    `${city.delivery} Самовывоз со склада или доставка грузом — согласуем при оформлении заявки.`,
  ];
}

export interface CityProductFaqItem {
  q: string;
  a: string;
}

export function cityProductFaq(product: Product, city: City, category: Category): CityProductFaqItem[] {
  const custom = cityOverride(product.sku, city.slug)?.faq;
  if (custom?.length) return custom;

  const price = formatPriceShort(product.price);
  const h = hashPair(product.sku, city.slug);
  const highlight = city.highlights?.[h % (city.highlights?.length ?? 1)];

  const items: CityProductFaqItem[] = [
    {
      q: `Как заказать ${product.title} в ${city.name}?`,
      a: "Оставьте заявку на этой странице или позвоните — менеджер подтвердит цену, наличие и срок доставки в ваш город.",
    },
    {
      q: `Сколько стоит ${product.sku} с доставкой в ${city.name}?`,
      a: `Ориентир — ${price} за позицию. Итог зависит от объёма, маршрута и актуального наличия.`,
    },
    {
      q: `Доставка «${category.name}» в ${city.name}`,
      a: city.delivery,
    },
    {
      q: `Наличие ${product.sku} на складе`,
      a: `Сейчас: ${product.stockLabel.toLowerCase()}. Уточняйте актуальный остаток по телефону или в заявке.`,
    },
  ];

  if (highlight) {
    items.push({
      q: `Зачем ${city.name} выбирают эту позицию?`,
      a: highlight,
    });
  }

  return items;
}

export function listCityProductPairs(
  cities: City[],
  products: Product[],
): Array<{ city: City; product: Product; categorySlug: string }> {
  const pairs: Array<{ city: City; product: Product; categorySlug: string }> = [];
  for (const city of cities) {
    for (const product of products) {
      pairs.push({ city, product, categorySlug: product.categorySlug });
    }
  }
  return pairs;
}
