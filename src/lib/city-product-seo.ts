import type { Category, City, Product } from "./types";

function primaryDomain(): string {
  if (typeof process !== "undefined" && process.env.PUBLIC_SITE_DOMAIN?.trim()) {
    return process.env.PUBLIC_SITE_DOMAIN.trim();
  }
  return import.meta.env.PUBLIC_SITE_DOMAIN?.trim() || "ps-invest.ru";
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

export function cityProductTitle(product: Product, city: City, category: Category): string {
  const base = `${product.title} в ${city.name} — ${product.sku}`;
  if (base.length <= 68) return `${base} | купить`;
  return truncate(`${product.title} — ${city.name}, ${category.name}`, 68);
}

export function cityProductDescription(product: Product, city: City, category: Category): string {
  const price = formatPriceShort(product.price);
  return truncate(
    `${product.title} (${product.sku}) в ${city.name}: ${category.name}, цена ${price}. ${city.delivery} Заявка онлайн, самовывоз или доставка по ДНР.`,
    160,
  );
}

export function cityProductH1(product: Product, city: City): string {
  return `${product.title} — ${city.name}`;
}

export function cityProductIntro(product: Product, city: City, category: Category): string[] {
  return [
    `${product.title} (артикул ${product.sku}) — поставка в ${city.name} и по ${city.name === "Донецк" ? "Донецку" : `городу ${city.name}`}. ${city.text}`,
    `${category.name}: ${product.description.split(/\.\s+/)[0]}.`,
    city.delivery,
  ];
}

export interface CityProductFaqItem {
  q: string;
  a: string;
}

export function cityProductFaq(product: Product, city: City, category: Category): CityProductFaqItem[] {
  const price = formatPriceShort(product.price);
  return [
    {
      q: `Как заказать ${product.title} в ${city.name}?`,
      a: "Оставьте заявку на этой странице или позвоните — менеджер подтвердит цену, наличие и срок доставки в ваш город.",
    },
    {
      q: `Сколько стоит ${product.sku} в ${city.name}?`,
      a: `Ориентировочная цена — ${price}. Итог зависит от объёма и условий доставки — уточняется при оформлении.`,
    },
    {
      q: `Доставка ${category.name.toLowerCase()} в ${city.name}`,
      a: city.delivery,
    },
    {
      q: `Есть ${product.title} в наличии?`,
      a: `Статус: ${product.stockLabel.toLowerCase()}. Актуальное наличие на складе уточняйте по телефону или через заявку.`,
    },
  ];
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
