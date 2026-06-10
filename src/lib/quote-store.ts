import type { QuoteItem } from "./types";

const STORAGE_KEY = "profstal-quote";

export function readQuote(): QuoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuoteItem[]) : [];
  } catch {
    return [];
  }
}

export function writeQuote(items: QuoteItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("quote-updated", { detail: items }));
}

export function addToQuote(item: Omit<QuoteItem, "quantity">, qty = 1): QuoteItem[] {
  const items = readQuote();
  const existing = items.find((i) => i.sku === item.sku);
  if (existing) {
    existing.quantity += qty;
  } else {
    items.push({ ...item, quantity: qty });
  }
  writeQuote(items);
  return items;
}

export function removeFromQuote(sku: string): QuoteItem[] {
  const items = readQuote().filter((i) => i.sku !== sku);
  writeQuote(items);
  return items;
}

export function clearQuote(): void {
  writeQuote([]);
}

export function quoteCount(items: QuoteItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
