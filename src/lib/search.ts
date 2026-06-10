import type { Product } from "./types";

export interface SearchHit {
  sku: string;
  title: string;
  category: string;
  categorySlug: string;
  slug: string;
  image?: string;
  price: number | null;
  score: number;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е").trim();
}

function tokens(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

function scoreProduct(product: Product, query: string, toks: string[]): number {
  const nq = normalize(query);
  if (!nq) return 0;

  const sku = normalize(product.sku);
  const title = normalize(product.title);
  const category = normalize(product.category);
  const subcategory = normalize(product.subcategory ?? "");
  const specs = normalize(product.specsRaw);

  let score = 0;

  if (sku === nq) score = Math.max(score, 100);
  if (sku.startsWith(nq)) score = Math.max(score, 92);
  if (sku.includes(nq)) score = Math.max(score, 76);

  if (title === nq) score = Math.max(score, 88);
  if (title.startsWith(nq)) score = Math.max(score, 82);
  if (title.includes(nq)) score = Math.max(score, 64);

  if (toks.length > 1) {
    const allTokensMatch = toks.every(
      (t) => title.includes(t) || category.includes(t) || subcategory.includes(t) || specs.includes(t),
    );
    if (allTokensMatch) score = Math.max(score, 58);
  }

  for (const token of toks) {
    if (title.includes(token)) score += 14;
    if (category.includes(token) || subcategory.includes(token)) score += 9;
    if (specs.includes(token)) score += 5;
    if (sku.includes(token)) score += 11;
  }

  return score;
}

export function rankProducts(
  products: Product[],
  query: string,
  limit = 8,
): { items: SearchHit[]; total: number } {
  const q = query.trim();
  if (!q) return { items: [], total: 0 };

  const toks = tokens(q);
  const ranked = products
    .map((product) => ({ product, score: scoreProduct(product, q, toks) }))
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.product.title.localeCompare(b.product.title, "ru"),
    );

  return {
    total: ranked.length,
    items: ranked.slice(0, limit).map(({ product, score }) => ({
      sku: product.sku,
      title: product.title,
      category: product.category,
      categorySlug: product.categorySlug,
      slug: product.slug,
      image: product.image,
      price: product.price,
      score,
    })),
  };
}

export function filterProducts(products: Product[], query: string): Product[] {
  const q = query.trim();
  if (!q) return products;

  const toks = tokens(q);
  return products
    .map((product) => ({ product, score: scoreProduct(product, q, toks) }))
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.product.title.localeCompare(b.product.title, "ru"),
    )
    .map((row) => row.product);
}
