import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SearchHit } from "@/lib/search";
import { withBase } from "@/lib/paths";

type SearchMode = "navigate" | "filter";

interface Props {
  variant?: "header" | "field";
  mode?: SearchMode;
  name?: string;
  placeholder?: string;
  initialQuery?: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  onQueryChange?: (query: string) => void;
}

function formatPrice(price: number | null): string {
  if (!Number.isFinite(price)) return "по запросу";
  return `от ${new Intl.NumberFormat("ru-RU").format(price!)} ₽`;
}

function imageUrl(image?: string): string {
  if (!image) return withBase("/assets/placeholder-product.svg");
  return withBase(`/assets/catalog-images/${encodeURIComponent(image)}`);
}

function productUrl(hit: SearchHit): string {
  return withBase(`/catalog/${hit.categorySlug}/${hit.slug}/`);
}

function catalogUrl(query: string): string {
  const path = withBase("/catalog/");
  if (!query.trim()) return path;
  return `${path}?q=${encodeURIComponent(query.trim())}`;
}

function minQueryLength(): number {
  return 1;
}

export default function SearchCombobox({
  variant = "header",
  mode = "navigate",
  name = "q",
  placeholder = "Поиск: труба, арматура, профнастил…",
  initialQuery = "",
  mobileOpen = false,
  onMobileOpenChange,
  onQueryChange,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const [items, setItems] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const showList = open && query.trim().length >= minQueryLength();

  const updateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      onQueryChange?.(value);
      setActiveIndex(-1);
    },
    [onQueryChange],
  );

  useEffect(() => {
    if (!showList) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const q = query.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${withBase("/api/search")}?q=${encodeURIComponent(q)}&limit=8`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { items: SearchHit[]; total: number };
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setItems([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, showList]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    onMobileOpenChange?.(false);
  }, [onMobileOpenChange]);

  const goToCatalog = useCallback(
    (value: string) => {
      if (mode === "filter") {
        updateQuery(value);
        close();
        return;
      }
      window.location.href = catalogUrl(value);
    },
    [close, mode, updateQuery],
  );

  const goToProduct = useCallback(
    (hit: SearchHit) => {
      window.location.href = productUrl(hit);
    },
    [],
  );

  const optionCount = items.length + (total > 0 ? 1 : 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < items.length) {
      goToProduct(items[activeIndex]);
      return;
    }
    if (activeIndex === items.length && total > 0) {
      goToCatalog(query);
      return;
    }
    goToCatalog(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList && e.key === "ArrowDown" && query.trim()) {
      setOpen(true);
      return;
    }

    if (!showList) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(optionCount, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex < items.length) goToProduct(items[activeIndex]);
      else goToCatalog(query);
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [close]);

  const formClass = [
    "search-combobox",
    variant === "header" ? "header-search" : "field-search",
    variant === "header" && mobileOpen ? "is-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form
      ref={rootRef}
      className={formClass}
      role="search"
      action={mode === "navigate" ? withBase("/catalog/") : undefined}
      method={mode === "navigate" ? "get" : undefined}
      onSubmit={handleSubmit}
    >
      {variant === "field" && <span>Поиск</span>}
      <div className="search-combobox__control">
        <input
          ref={inputRef}
          type="search"
          name={mode === "navigate" ? name : undefined}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
          }
          onChange={(e) => {
            updateQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= minQueryLength()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button className="header-search__submit" type="submit" aria-label="Найти в каталоге">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </div>

      {showList && (
        <div className="search-suggestions" id={listId} role="listbox" aria-label="Подсказки поиска">
          {loading && <p className="search-suggestions__status">Ищем…</p>}
          {!loading && items.length === 0 && (
            <p className="search-suggestions__status">Ничего не найдено. Попробуйте другой запрос.</p>
          )}
          {!loading &&
            items.map((item, index) => (
              <button
                key={item.sku}
                type="button"
                id={`${listId}-opt-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                className={`search-suggestion${activeIndex === index ? " is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToProduct(item)}
              >
                <img
                  className="search-suggestion__thumb"
                  src={imageUrl(item.image)}
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <span className="search-suggestion__body">
                  <span className="search-suggestion__title">{item.title}</span>
                  <span className="search-suggestion__meta">
                    {item.sku} · {item.category}
                  </span>
                </span>
                <span className="search-suggestion__price">{formatPrice(item.price)}</span>
              </button>
            ))}
          {!loading && total > 0 && (
            <button
              type="button"
              id={`${listId}-opt-${items.length}`}
              role="option"
              aria-selected={activeIndex === items.length}
              className={`search-suggestion search-suggestion--all${
                activeIndex === items.length ? " is-active" : ""
              }`}
              onMouseEnter={() => setActiveIndex(items.length)}
              onClick={() => goToCatalog(query)}
            >
              {mode === "filter"
                ? `Показать все результаты (${total})`
                : `Все результаты в каталоге (${total})`}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
