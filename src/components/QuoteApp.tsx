import { useCallback, useEffect, useState } from "react";
import { withBase } from "@/lib/paths";
import type { QuoteItem } from "@/lib/types";
import {
  addToQuote,
  clearQuote,
  quoteCount,
  readQuote,
  removeFromQuote,
} from "@/lib/quote-store";

export default function QuoteApp() {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    const next = readQuote();
    setItems(next);
    const countEl = document.getElementById("headerQuoteCount");
    const count = quoteCount(next);
    if (countEl) {
      countEl.textContent = String(count);
      countEl.hidden = count === 0;
    }
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    const onOpen = () => setOpen(true);
    window.addEventListener("quote-updated", onUpdate);
    window.addEventListener("open-quote", onOpen);
    document.getElementById("openQuoteBtn")?.addEventListener("click", onOpen);
    return () => {
      window.removeEventListener("quote-updated", onUpdate);
      window.removeEventListener("open-quote", onOpen);
    };
  }, [refresh]);

  useEffect(() => {
    (window as unknown as { addToQuote: typeof addToQuote }).addToQuote = (
      item: Omit<QuoteItem, "quantity">,
      qty?: number,
    ) => {
      addToQuote(item, qty);
      window.dispatchEvent(new CustomEvent("analytics-goal", { detail: "add_to_quote" }));
    };
  }, []);

  if (!open) return null;

  return (
    <>
      <div className="quote-drawer-backdrop" onClick={() => setOpen(false)} role="presentation" />
      <aside className="quote-drawer" aria-label="Список заявки">
        <div className="quote-drawer__header">
          <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Список заявки</h2>
          <button className="btn btn--ghost btn--sm" type="button" onClick={() => setOpen(false)}>
            Закрыть
          </button>
        </div>
        <div className="quote-drawer__body">
          {items.length === 0 ? (
            <p style={{ color: "var(--color-ink-muted)", fontSize: "0.875rem" }}>
              Добавьте позиции из каталога — менеджер подготовит расчёт.
            </p>
          ) : (
            items.map((item) => (
              <div className="quote-item" key={item.sku}>
                <div style={{ flex: 1 }}>
                  <div className="quote-item__sku">{item.sku}</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-ink-muted)" }}>
                    Кол-во: {item.quantity}
                  </div>
                </div>
                <button
                  className="btn btn--ghost btn--sm"
                  type="button"
                  onClick={() => removeFromQuote(item.sku)}
                >
                  Удалить
                </button>
              </div>
            ))
          )}
        </div>
        <div className="quote-drawer__footer">
          {items.length > 0 && (
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              style={{ marginBottom: "0.75rem", width: "100%" }}
              onClick={() => clearQuote()}
            >
              Очистить список
            </button>
          )}
          <a className="btn btn--accent" href={withBase("/contacts/#request")} style={{ width: "100%" }}>
            Отправить на расчёт
          </a>
        </div>
      </aside>
    </>
  );
}
