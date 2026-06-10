import { useEffect, useMemo, useState } from "react";
import SearchCombobox from "@/components/SearchCombobox";
import { filterProducts } from "@/lib/search";
import { withBase } from "@/lib/paths";
import type { Product } from "@/lib/types";

interface Props {
  products?: Product[];
  initialCategory?: string;
}

const STOCK_LABELS: Record<Product["stock"], string> = {
  in_stock: "В наличии",
  on_order: "Под заказ",
  out_of_stock: "Нет в наличии",
};

function stockBadgeClass(stock: Product["stock"]): string {
  if (stock === "in_stock") return "badge badge--ok";
  if (stock === "on_order") return "badge badge--warn";
  return "badge badge--no";
}

function formatPrice(price: number | null): string {
  if (!Number.isFinite(price)) return "по запросу";
  return `от ${new Intl.NumberFormat("ru-RU").format(price!)} ₽`;
}

function imageUrl(image?: string): string {
  if (!image) return withBase("/assets/placeholder-product.svg");
  return withBase(`/assets/catalog-images/${encodeURIComponent(image)}`);
}

export default function CatalogBrowser({ products: initialProducts = [], initialCategory = "all" }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [stock, setStock] = useState("all");
  const [visible, setVisible] = useState(16);

  useEffect(() => {
    if (initialProducts.length > 0) return;
    fetch(withBase("/api/products"), { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.products)) setProducts(data.products);
      })
      .catch(() => {});
  }, [initialProducts.length]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
      setVisible(16);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const trimmed = query.trim();
    if (trimmed) url.searchParams.set("q", trimmed);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [query]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [products]);

  const filtered = useMemo(() => {
    const scoped = products.filter((p) => {
      const matchCat =
        category === "all" ||
        p.category === category ||
        p.categorySlug === category;
      const matchStock = stock === "all" || p.stock === stock;
      return matchCat && matchStock;
    });
    return query.trim() ? filterProducts(scoped, query) : scoped;
  }, [products, query, category, stock]);

  const shown = filtered.slice(0, visible);

  return (
    <>
      <div className="catalog-tools">
        <SearchCombobox
          variant="field"
          mode="filter"
          placeholder="Например: труба 40х20, арматура, профнастил"
          initialQuery={query}
          onQueryChange={(value) => {
            setQuery(value);
            setVisible(16);
          }}
        />
        <label className="field">
          <span>Категория</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setVisible(16);
            }}
          >
            <option value="all">Все категории</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Наличие</span>
          <select
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              setVisible(16);
            }}
          >
            <option value="all">Все товары</option>
            <option value="in_stock">В наличии</option>
            <option value="on_order">Под заказ</option>
            <option value="out_of_stock">Нет в наличии</option>
          </select>
        </label>
      </div>

      <div className="chip-row">
        <button
          type="button"
          className={`chip ${category === "all" ? "is-active" : ""}`}
          onClick={() => {
            setCategory("all");
            setVisible(16);
          }}
        >
          Все
        </button>
        {categories.slice(0, 8).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`chip ${category === cat ? "is-active" : ""}`}
            onClick={() => {
              setCategory(cat);
              setVisible(16);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="catalog-summary">
        Найдено: {filtered.length}. Показано: {shown.length}.
      </p>

      <div className="product-grid">
        {shown.map((product) => (
          <article className="product-card" key={product.sku}>
            <a href={withBase(`/catalog/${product.categorySlug}/${product.slug}/`)} className="product-card__media">
              <img src={imageUrl(product.image)} alt={product.title} loading="lazy" />
            </a>
            <div className="product-card__body">
              <div className="product-card__meta">
                <span className="badge product-card__sku">{product.sku}</span>
                <span className={stockBadgeClass(product.stock)}>{STOCK_LABELS[product.stock]}</span>
              </div>
              <p className="product-card__category">
                {product.category}
                {product.subcategory ? ` / ${product.subcategory}` : ""}
              </p>
              <h3>
                <a href={withBase(`/catalog/${product.categorySlug}/${product.slug}/`)}>{product.title}</a>
              </h3>
              <p className="product-card__specs">{product.specsRaw || "Характеристики уточняются"}</p>
            </div>
            <div className="product-card__footer">
              <div>
                <div className="product-card__price">{formatPrice(product.price)}</div>
                <small>уточняется менеджером</small>
              </div>
              <button
                className="btn btn--steel btn--sm"
                type="button"
                onClick={() => {
                  (window as unknown as { addToQuote?: (item: { sku: string; title: string }) => void }).addToQuote?.({
                    sku: product.sku,
                    title: product.title,
                  });
                }}
              >
                В заявку
              </button>
            </div>
          </article>
        ))}
      </div>

      {visible < filtered.length && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button className="btn btn--steel" type="button" onClick={() => setVisible((v) => v + 16)}>
            Показать ещё
          </button>
        </div>
      )}
    </>
  );
}
