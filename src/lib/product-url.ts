import type { Product } from "./types";

function primaryDomain(): string {
  if (typeof process !== "undefined" && process.env.PUBLIC_SITE_DOMAIN?.trim()) {
    return process.env.PUBLIC_SITE_DOMAIN.trim();
  }
  return import.meta.env.PUBLIC_SITE_DOMAIN?.trim() || "ps-invest.ru";
}

/** Канонический URL товара (без server-only зависимостей — безопасно для client bundle). */
export function productCanonicalUrl(product: Pick<Product, "categorySlug" | "slug">): string {
  const domain = primaryDomain();
  const path = product.slug.startsWith("/") ? product.slug : `/${product.slug}/`;
  return `https://${product.categorySlug}.${domain}${path.endsWith("/") ? path : `${path}/`}`;
}
