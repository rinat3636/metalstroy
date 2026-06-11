import type { Product } from "./types";
import { readPublicEnv } from "./runtime-env";

function primaryDomain(): string {
  return readPublicEnv("PUBLIC_SITE_DOMAIN") || "ps-invest.ru";
}

/** Канонический URL товара (без server-only зависимостей — безопасно для client bundle). */
export function productCanonicalUrl(product: Pick<Product, "categorySlug" | "slug">): string {
  const domain = primaryDomain();
  const path = product.slug.startsWith("/") ? product.slug : `/${product.slug}/`;
  return `https://${product.categorySlug}.${domain}${path.endsWith("/") ? path : `${path}/`}`;
}
