import { useEffect, useState } from "react";
import type { QuoteItem } from "@/lib/types";
import { clearQuote, readQuote } from "@/lib/quote-store";
import { withBase } from "@/lib/paths";

interface Props {
  defaultCity?: string;
}

export default function LeadForm({ defaultCity = "" }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const items = readQuote();
    if (items.length) {
      const lines = items.map((i: QuoteItem) => `${i.sku} — ${i.title} × ${i.quantity}`);
      setMessage((prev) => (prev ? prev : lines.join("\n")));
    }
    if (defaultCity) setCity(defaultCity);
  }, [defaultCity]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
      const val = params.get(key);
      if (val) utm[key] = val;
    });

    try {
      const res = await fetch(withBase("/api/lead"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          city,
          message,
          items: readQuote(),
          source: window.location.pathname,
          utm,
          company,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка отправки");
      clearQuote();
      setStatus({ type: "ok", text: `Заявка отправлена. Менеджер перезвонит на ${phone}.` });
      setName("");
      setPhone("");
      setMessage("");
      setCompany("");
      window.dispatchEvent(new CustomEvent("analytics-goal", { detail: "lead_submit" }));
    } catch (err) {
      setStatus({
        type: "err",
        text: err instanceof Error ? err.message : "Не удалось отправить заявку",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="request-form" id="request" onSubmit={handleSubmit}>
      <label className="field hp-field" aria-hidden="true">
        <span>Компания</span>
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Имя</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Иван" />
      </label>
      <label className="field">
        <span>Телефон</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="+7 999 000-00-00"
          required
        />
      </label>
      <label className="field">
        <span>Город</span>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Донецк" />
      </label>
      <label className="field wide">
        <span>Что нужно рассчитать</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Например: труба профильная 40х20, 20 штук, доставка в Макеевку"
        />
      </label>
      <button className="btn btn--accent wide" type="submit" disabled={loading}>
        {loading ? "Отправка…" : "Отправить заявку"}
      </button>
      {status && (
        <p className={`form-status form-status--${status.type}`} role="status">
          {status.text}
        </p>
      )}
    </form>
  );
}
