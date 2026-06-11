import overridesData from "@/data/product-seo-overrides.json";
import type { Category, Product } from "./types";
import { productCanonicalUrl } from "./product-url";

export interface ProductFaqItem {
  q: string;
  a: string;
}

export interface ProductSeoOverride {
  title?: string;
  description?: string;
  h1?: string;
  intro?: string;
  faq?: ProductFaqItem[];
}

type OverridesMap = Record<string, ProductSeoOverride>;

const overrides = overridesData as OverridesMap;

function overrideFor(sku: string): ProductSeoOverride | undefined {
  return overrides[sku];
}

/** Канонический URL товара: поддомен категории + slug товара */
export { productCanonicalUrl } from "./product-url";

function formatPriceShort(price: number | null): string {
  if (price == null || !Number.isFinite(price)) return "по запросу";
  return `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;
}

function stockPhrase(stock: Product["stock"]): string {
  if (stock === "in_stock") return "в наличии на складе";
  if (stock === "on_order") return "под заказ";
  return "наличие уточняйте у менеджера";
}

function specsSummary(product: Product, max = 3): string {
  if (product.specs.length > 0) {
    return product.specs
      .slice(0, max)
      .map((s) => `${s.label.toLowerCase()} ${s.value}`)
      .join(", ");
  }
  if (product.specsRaw) return product.specsRaw.slice(0, 80);
  return "";
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function productTitle(product: Product, category: Category): string {
  const custom = overrideFor(product.sku)?.title;
  if (custom) return custom;

  const short = `${product.title} (${product.sku}) — ${category.name} в ДНР`;
  if (short.length <= 68) return short;

  return truncate(`${product.title} — купить в ДНР | ${product.sku}`, 68);
}

export function productMetaDescription(product: Product, category: Category): string {
  const custom = overrideFor(product.sku)?.description;
  if (custom) return truncate(custom, 160);

  const specs = specsSummary(product, 2);
  const price = formatPriceShort(product.price);
  const stock = stockPhrase(product.stock);
  const parts = [
    `${product.title}, арт. ${product.sku}`,
    specs ? specs : category.name,
    `цена ${price}, ${stock}`,
    "доставка по ДНР, заявка онлайн",
  ];
  return truncate(parts.filter(Boolean).join(". ") + ".", 160);
}

export function productH1(product: Product): string {
  return overrideFor(product.sku)?.h1 ?? product.title;
}

export function productSeoIntro(product: Product, category: Category): string[] {
  const custom = overrideFor(product.sku)?.intro;
  if (custom) return [custom];

  const paragraphs: string[] = [];
  if (product.description) {
    const first = product.description.split(/\.\s+/)[0];
    paragraphs.push(first.endsWith(".") ? first : `${first}.`);
  }
  paragraphs.push(
    `${product.title} (артикул ${product.sku}) относится к категории «${category.name}»${product.subcategory ? `, подкатегория «${product.subcategory}»` : ""}. Поставка по Донецку, Макеевке, Горловке и другим городам ДНР — самовывоз со склада или доставка по согласованию.`,
  );
  return paragraphs;
}

export function productDeliveryText(category: Category): string {
  return `Оформите заявку на сайте или позвоните — менеджер подтвердит цену на ${category.name.toLowerCase()}, наличие и срок отгрузки. Работаем с частными заказчиками и организациями, выставляем счёт и закрывающие документы.`;
}

export function productFaq(product: Product, category: Category): ProductFaqItem[] {
  const custom = overrideFor(product.sku)?.faq;
  if (custom?.length) return custom;

  const price = formatPriceShort(product.price);
  return [
    {
      q: `Как заказать ${product.title}?`,
      a: "Добавьте позицию в заявку на этой странице или позвоните — менеджер уточнит количество, цену и сроки. Доставка по ДНР или самовывоз со склада.",
    },
    {
      q: `Какая цена на ${product.sku}?`,
      a: `Ориентировочная цена — ${price}. Итоговая стоимость зависит от объёма, условий доставки и актуального наличия — подтверждается менеджером при оформлении.`,
    },
    {
      q: `${product.title} — есть в наличии?`,
      a: `Сейчас: ${stockPhrase(product.stock)}. Актуальное наличие уточняйте по телефону или через заявку — склад обновляется регулярно.`,
    },
    {
      q: `Доставка ${category.name.toLowerCase()} по ДНР`,
      a: "Доставляем по Донецку, Макеевке, Горловке, Енакиево, Харцызску, Шахтёрску, Торезу, Снежному, Ясиноватой, Мариуполю и другим населённым пунктам. Срок и стоимость — после расчёта заявки.",
    },
  ];
}

export function buildProductSchema(
  product: Product,
  category: Category,
  canonicalUrl: string,
  imageUrl: string,
  site: { name: string; phone: string },
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    mpn: product.sku,
    url: canonicalUrl,
    description: truncate(product.description || product.title, 500),
    image: imageUrl,
    category: category.name,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    manufacturer: {
      "@type": "Organization",
      name: site.name,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "RUB",
      availability:
        product.stock === "in_stock"
          ? "https://schema.org/InStock"
          : product.stock === "on_order"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: site.name },
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (product.price != null && product.price > 0) {
    (schema.offers as Record<string, unknown>).price = product.price;
  }

  if (product.specs.length > 0) {
    schema.additionalProperty = product.specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
    }));
  }

  return schema;
}
