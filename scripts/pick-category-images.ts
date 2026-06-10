import products from "../src/data/products.json";
import categories from "../src/data/categories.json";
import type { Product } from "../src/lib/types";

const list = products as Product[];

for (const cat of categories) {
  const freq = new Map<string, number>();
  for (const p of list) {
    if (p.categorySlug !== cat.slug || !p.image) continue;
    freq.set(p.image, (freq.get(p.image) ?? 0) + 1);
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const sample = list.find((p) => p.categorySlug === cat.slug && p.image);
  console.log(`\n${cat.slug} | current: ${(cat as { image?: string }).image ?? "—"}`);
  sorted.slice(0, 5).forEach(([img, n]) => {
    const ex = list.find((p) => p.categorySlug === cat.slug && p.image === img);
    console.log(`  ${n}x ${img} — ${ex?.title.slice(0, 60)}`);
  });
}
