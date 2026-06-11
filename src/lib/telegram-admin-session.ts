import type { Category, StockStatus } from "./types";
import type { SiteSettingsField } from "./site-store";

export type AddDraft = {
  title: string;
  category: string;
  categorySlug: string;
  price?: number | null;
};

export type CategoryDraft = {
  name: string;
  description?: string;
};

export type AdminSession =
  | { step: "idle" }
  | { step: "search" }
  | { step: "add_title" }
  | { step: "add_category"; draft: { title: string } }
  | { step: "add_price"; draft: AddDraft }
  | { step: "add_stock"; draft: AddDraft & { price: number | null } }
  | { step: "edit_price"; sku: string }
  | { step: "edit_title"; sku: string }
  | { step: "cat_add_name" }
  | { step: "cat_add_desc"; draft: CategoryDraft }
  | { step: "cat_add_seo"; draft: CategoryDraft }
  | { step: "cat_edit_name"; categorySlug: string }
  | { step: "cat_edit_desc"; categorySlug: string }
  | { step: "cat_edit_seo"; categorySlug: string }
  | { step: "site_edit_field"; field: SiteSettingsField };

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

export type { StockStatus };
