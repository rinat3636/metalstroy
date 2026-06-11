import {
  createCategory,
  getCategoryBySlug,
  loadCategories,
  updateCategory,
} from "./product-store";
import {
  loadSiteSettings,
  SITE_FIELD_LABELS,
  updateSiteSettings,
  type SiteSettingsField,
} from "./site-store";
import type { Category } from "./types";
import { getSession, resetSession, setSession } from "./telegram-admin-session";
import {
  BTN_CATEGORIES,
  BTN_COMPANY,
  categoriesManageKeyboard,
  categoryAdminKeyboard,
  companyFieldsKeyboard,
} from "./telegram-keyboard";
import type { TelegramSendOptions } from "./telegram";

export type BotReply = { text: string; options?: TelegramSendOptions };

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildCategoriesManageReply(): BotReply {
  const categories = loadCategories();
  return {
    text: [
      "<b>📁 Категории каталога</b>",
      "",
      ...categories.map((c) => `• ${esc(c.name)} — ${c.count} шт. · <code>${esc(c.slug)}</code>`),
      "",
      "Выберите категорию или добавьте новую:",
    ].join("\n"),
    options: { html: true, replyMarkup: categoriesManageKeyboard(categories) },
  };
}

export function buildCategoryAdminReply(slug: string): BotReply | null {
  const category = getCategoryBySlug(slug);
  if (!category) return null;

  return {
    text: formatCategoryAdmin(category),
    options: { html: true, replyMarkup: categoryAdminKeyboard(slug) },
  };
}

function formatCategoryAdmin(category: Category): string {
  return [
    `<b>📁 ${esc(category.name)}</b>`,
    `<code>${esc(category.slug)}</code> · ${category.count} товаров`,
    "",
    `<b>Описание:</b>`,
    esc(category.description),
    "",
    `<b>SEO-текст:</b>`,
    category.seoText ? esc(category.seoText) : "—",
  ].join("\n");
}

export function buildCompanyReply(): BotReply {
  const s = loadSiteSettings();
  const hasReq = s.inn || s.kpp || s.ogrn;

  return {
    text: [
      "<b>🏢 Контакты и реквизиты</b>",
      "Изменения сохраняются на сайте сразу.",
      "",
      `<b>Телефон:</b> ${esc(s.phone)}`,
      `<b>Email:</b> ${esc(s.email)}`,
      `<b>Адрес:</b> ${esc(s.address)}`,
      `<b>График:</b> ${esc(s.schedule)}`,
      "",
      `<b>${esc(s.legalName)}</b>`,
      hasReq
        ? [
            s.inn && `ИНН: ${esc(s.inn)}`,
            s.kpp && `КПП: ${esc(s.kpp)}`,
            s.ogrn && `ОГРН: ${esc(s.ogrn)}`,
          ]
            .filter(Boolean)
            .join("\n")
        : "Реквизиты не заполнены",
      "",
      "Нажмите поле для редактирования:",
    ].join("\n"),
    options: { html: true, replyMarkup: companyFieldsKeyboard() },
  };
}

export function handleSettingsMenuButton(text: string, chatId: number): BotReply | null {
  switch (text) {
    case BTN_CATEGORIES:
      resetSession(chatId);
      return buildCategoriesManageReply();
    case BTN_COMPANY:
      resetSession(chatId);
      return buildCompanyReply();
    default:
      return null;
  }
}

export function handleSettingsSessionText(chatId: number, text: string): BotReply | null {
  const session = getSession(chatId);

  if (session.step === "cat_add_name") {
    if (text.length < 2) return { text: "Название слишком короткое:" };
    setSession(chatId, { step: "cat_add_desc", draft: { name: text } });
    return {
      text: [`<b>Категория:</b> ${esc(text)}`, "", "Введите описание (или «-» чтобы пропустить):"].join("\n"),
      options: { html: true },
    };
  }

  if (session.step === "cat_add_desc") {
    const desc = text === "-" || text === "—" ? undefined : text;
    setSession(chatId, {
      step: "cat_add_seo",
      draft: { name: session.draft.name, description: desc },
    });
    return {
      text: "Введите SEO-текст для страницы категории (или «-» чтобы пропустить):",
    };
  }

  if (session.step === "cat_add_seo") {
    const seoText = text === "-" || text === "—" ? undefined : text;
    try {
      const category = createCategory({
        name: session.draft.name,
        description: session.draft.description,
        seoText,
      });
      resetSession(chatId);
      return {
        text: [
          `✅ Категория <b>${esc(category.name)}</b> создана`,
          `<code>${esc(category.slug)}</code>`,
          "",
          "Поддомен и страница каталога обновятся автоматически.",
        ].join("\n"),
        options: { html: true, replyMarkup: categoryAdminKeyboard(category.slug) },
      };
    } catch (e) {
      return { text: e instanceof Error ? e.message : "Ошибка" };
    }
  }

  if (session.step === "cat_edit_name") {
    if (text.length < 2) return { text: "Название слишком короткое:" };
    try {
      updateCategory(session.categorySlug, { name: text });
      resetSession(chatId);
      return buildCategoryAdminReply(session.categorySlug) ?? { text: "✅ Название обновлено." };
    } catch (e) {
      return { text: e instanceof Error ? e.message : "Ошибка" };
    }
  }

  if (session.step === "cat_edit_desc") {
    try {
      updateCategory(session.categorySlug, { description: text });
      resetSession(chatId);
      return buildCategoryAdminReply(session.categorySlug) ?? { text: "✅ Описание обновлено." };
    } catch (e) {
      return { text: e instanceof Error ? e.message : "Ошибка" };
    }
  }

  if (session.step === "cat_edit_seo") {
    try {
      updateCategory(session.categorySlug, { seoText: text });
      resetSession(chatId);
      return buildCategoryAdminReply(session.categorySlug) ?? { text: "✅ SEO-текст обновлён." };
    } catch (e) {
      return { text: e instanceof Error ? e.message : "Ошибка" };
    }
  }

  if (session.step === "site_edit_field") {
    const value = text === "-" || text === "—" ? "" : text;
    try {
      updateSiteSettings({ [session.field]: value });
      resetSession(chatId);
      return buildCompanyReply();
    } catch (e) {
      return { text: e instanceof Error ? e.message : "Ошибка" };
    }
  }

  return null;
}

export function handleSettingsCallback(data: string, chatId: number): BotReply | null {
  if (data === "catlist") {
    resetSession(chatId);
    return buildCategoriesManageReply();
  }

  if (data === "catadd") {
    setSession(chatId, { step: "cat_add_name" });
    return { text: "<b>➕ Новая категория</b>\n\nВведите название:", options: { html: true } };
  }

  if (data.startsWith("ca:")) {
    resetSession(chatId);
    return buildCategoryAdminReply(data.slice(3));
  }

  if (data.startsWith("cen:")) {
    const slug = data.slice(4);
    if (!getCategoryBySlug(slug)) return { text: "Категория не найдена." };
    setSession(chatId, { step: "cat_edit_name", categorySlug: slug });
    return { text: `Новое название для <code>${esc(slug)}</code>:`, options: { html: true } };
  }

  if (data.startsWith("ced:")) {
    const slug = data.slice(4);
    if (!getCategoryBySlug(slug)) return { text: "Категория не найдена." };
    setSession(chatId, { step: "cat_edit_desc", categorySlug: slug });
    return { text: `Новое описание для <b>${esc(getCategoryBySlug(slug)!.name)}</b>:`, options: { html: true } };
  }

  if (data.startsWith("ces:")) {
    const slug = data.slice(4);
    if (!getCategoryBySlug(slug)) return { text: "Категория не найдена." };
    setSession(chatId, { step: "cat_edit_seo", categorySlug: slug });
    return { text: `Новый SEO-текст для <b>${esc(getCategoryBySlug(slug)!.name)}</b>:`, options: { html: true } };
  }

  if (data === "company") {
    resetSession(chatId);
    return buildCompanyReply();
  }

  if (data.startsWith("sf:")) {
    const field = data.slice(3) as SiteSettingsField;
    if (!(field in SITE_FIELD_LABELS)) return null;
    setSession(chatId, { step: "site_edit_field", field });
    const current = loadSiteSettings()[field];
    return {
      text: [
        `<b>${SITE_FIELD_LABELS[field]}</b>`,
        "",
        `Текущее: ${current ? esc(current) : "—"}`,
        "",
        "Введите новое значение (или «-» чтобы очистить):",
      ].join("\n"),
      options: { html: true },
    };
  }

  return null;
}
