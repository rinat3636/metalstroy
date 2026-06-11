import type { StockStatus } from "./types";

export type AddDraft = {
  title: string;
  category: string;
  categorySlug: string;
  price?: number | null;
};

export type AdminSession =
  | { step: "idle" }
  | { step: "search" }
  | { step: "add_title" }
  | { step: "add_category"; draft: { title: string } }
  | { step: "add_price"; draft: AddDraft }
  | { step: "add_stock"; draft: AddDraft & { price: number | null } }
  | { step: "edit_price"; sku: string }
  | { step: "edit_title"; sku: string };

const sessions = new Map<number, AdminSession>();

export function getSession(chatId: number): AdminSession {
  return sessions.get(chatId) ?? { step: "idle" };
}

export function setSession(chatId: number, session: AdminSession): void {
  sessions.set(chatId, session);
}

export function resetSession(chatId: number): void {
  sessions.set(chatId, { step: "idle" });
}
