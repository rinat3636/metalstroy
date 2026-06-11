import {
  createProduct,
  deleteProduct,
  getCategoryBySlug,
  getProductBySku,
  loadCategories,
  loadProducts,
  updateProduct,
} from "./product-store";
import { rankProducts } from "./search";
import type { Product, StockStatus } from "./types";
import { stockToLabel } from "./product-utils";
import { resetSession, getSession, setSession, type AddDraft, type AdminSession } from "./telegram-admin-session";
import { logTelegramCatalogAction } from "./telegram-audit-log";
import { productCanonicalUrl } from "./product-url";
import {
  BTN_ADD,
  BTN_CATALOG,
  BTN_SEARCH,
  addCategoryKeyboard,
  addStockKeyboard,
  categoriesKeyboard,
  deleteConfirmKeyboard,
  productAdminKeyboard,
  productsKeyboard,
  searchKeyboard,
  skipDescriptionKeyboard,
} from "./telegram-keyboard";
import {
  handleSettingsCallback,
  handleSettingsMenuButton,
  handleSettingsSessionText,
} from "./telegram-settings-admin";
import { parseCategoryPageCallback, parseProductCallback } from "./telegram-callback-routes";
export type { BotReply } from "./telegram-settings-admin";

function needsInlineButtonSession(session: AdminSession): boolean {
  return session.step === "add_category" || session.step === "add_stock";
}

function sessionPrompt(session: AdminSession): BotReply | null {
  if (needsInlineButtonSession(session)) {
    return {
      text: "Выберите кнопку в сообщении выше или нажмите «Отмена».",
    };
  }
  return null;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatPrice(price: number | null): string {
  if (!Number.isFinite(price)) return "по запросу";
  return `${new Intl.NumberFormat("ru-RU").format(price!)} ₽`;
}

export function formatProductAdmin(product: Product): string {
  return [
    `<b>${esc(product.sku)}</b>`,
    esc(product.title),
    "",
    `<b>Категория:</b> ${esc(product.category)}`,
    `<b>Цена:</b> ${esc(formatPrice(product.price))}`,
    `<b>Наличие:</b> ${esc(product.stockLabel)}`,
    product.specsRaw ? `\n<b>Характеристики:</b>\n${esc(product.specsRaw)}` : "",
    product.description ? `\n${esc(product.description.slice(0, 300))}${product.description.length > 300 ? "…" : ""}` : "",
    product.image ? `\n<b>Фото:</b> ${esc(product.image)}` : "",
    `\n<b>Сайт:</b> ${esc(productCanonicalUrl(product))}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildCategoriesReply(): BotReply {
  const categories = loadCategories();
  return {
    text: [
      "<b>📋 Каталог</b>",
      "",
      ...categories.map((c) => `• ${esc(c.name)} — ${c.count} шт.`),
      "",
      "Выберите категорию:",
    ].join("\n"),
    options: { html: true, replyMarkup: categoriesKeyboard(categories) },
  };
}

export function buildCategoryReply(slug: string, page: number): BotReply | null {
  const category = getCategoryBySlug(slug);
  if (!category) return null;

  const products = loadProducts().filter((p) => p.categorySlug === slug);
  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(products.length / pageSize));

  return {
    text: [
      `<b>${esc(category.name)}</b>`,
      `${products.length} товаров · стр. ${page + 1}/${pages}`,
      "",
      "Выберите товар:",
    ].join("\n"),
    options: { html: true, replyMarkup: productsKeyboard(products, slug, page) },
  };
}

export function buildProductReply(sku: string): BotReply | null {
  const product = getProductBySku(sku);
  if (!product) return null;
  return {
    text: formatProductAdmin(product),
    options: { html: true, replyMarkup: productAdminKeyboard(product) },
  };
}

export function buildSearchPrompt(): BotReply {
  return {
    text: ["<b>🔍 Поиск</b>", "", "Введите артикул (МТЛ-…) или название:"].join("\n"),
    options: { html: true },
  };
}

export function buildSearchReply(query: string): BotReply {
  const { items, total } = rankProducts(loadProducts(), query, 8);
  if (!items.length) {
    return {
      text: `По запросу «${esc(query)}» ничего не найдено.`,
      options: { html: true, replyMarkup: categoriesKeyboard(loadCategories()) },
    };
  }

  const products = items
    .map((h) => getProductBySku(h.sku))
    .filter((p): p is Product => !!p);

  return {
    text: [`<b>Найдено:</b> ${total}`, "", "Выберите товар:"].join("\n"),
    options: { html: true, replyMarkup: searchKeyboard(products) },
  };
}

export function buildAddStartReply(): BotReply {
  return {
    text: ["<b>➕ Новый товар</b>", "", "Введите название:"].join("\n"),
    options: { html: true },
  };
}

export function buildAddCategoryReply(title: string): BotReply {
  return {
    text: [`<b>Название:</b> ${esc(title)}`, "", "Выберите категорию:"].join("\n"),
    options: { html: true, replyMarkup: addCategoryKeyboard(loadCategories()) },
  };
}

export function buildAddPriceReply(draft: AddDraft): BotReply {
  return {
    text: [
      `<b>Название:</b> ${esc(draft.title)}`,
      `<b>Категория:</b> ${esc(draft.category)}`,
      "",
      "Введите цену (число) или «-» если по запросу:",
    ].join("\n"),
    options: { html: true },
  };
}

export function buildAddStockReply(draft: AddDraft & { price: number | null }): BotReply {
  return {
    text: [
      `<b>Название:</b> ${esc(draft.title)}`,
      `<b>Цена:</b> ${esc(formatPrice(draft.price))}`,
      "",
      "Выберите наличие:",
    ].join("\n"),
    options: { html: true, replyMarkup: addStockKeyboard() },
  };
}

export function handleMenuButton(text: string, chatId: number): BotReply | null {
  const settings = handleSettingsMenuButton(text, chatId);
  if (settings) return settings;

  switch (text) {
    case BTN_CATALOG:
      resetSession(chatId);
      return buildCategoriesReply();
    case BTN_SEARCH:
      setSession(chatId, { step: "search" });
      return buildSearchPrompt();
    case BTN_ADD:
      setSession(chatId, { step: "add_title" });
      return buildAddStartReply();
    default:
      return null;
  }
}

export function handleSessionText(chatId: number, text: string): BotReply | null {
  const session = getSession(chatId);

  const settingsReply = handleSettingsSessionText(chatId, text);
  if (settingsReply) return settingsReply;

  const buttonPrompt = sessionPrompt(session);
  if (buttonPrompt) return buttonPrompt;

  if (session.step === "search") {
    resetSession(chatId);
    return buildSearchReply(text);
  }

  if (session.step === "add_title") {
    if (text.length < 2) return { text: "Название слишком короткое:" };
    setSession(chatId, { step: "add_category", draft: { title: text } });
    return buildAddCategoryReply(text);
  }

  if (session.step === "add_price") {
    const price = parsePriceInput(text);
    if (price === undefined) return { text: "Введите число или «-»:" };
    const draft = { ...session.draft, price };
    setSession(chatId, { step: "add_stock", draft });
    return buildAddStockReply(draft);
  }

  if (session.step === "edit_price") {
    const price = parsePriceInput(text);
    if (price === undefined) return { text: "Введите число или «-»:" };
    const product = getProductBySku(session.sku);
    if (!product) {
      resetSession(chatId);
      return { text: "Товар не найден." };
    }
    updateProduct(session.sku, productInput(product, { price }));
    logTelegramCatalogAction(chatId, "edit_price", session.sku);
    resetSession(chatId);
    return buildProductReply(session.sku) ?? { text: "✅ Цена обновлена." };
  }

  if (session.step === "edit_title") {
    if (text.length < 2) return { text: "Название слишком короткое:" };
    const product = getProductBySku(session.sku);
    if (!product) {
      resetSession(chatId);
      return { text: "Товар не найден." };
    }
    updateProduct(session.sku, productInput(product, { title: text }));
    logTelegramCatalogAction(chatId, "edit_title", session.sku);
    resetSession(chatId);
    return buildProductReply(session.sku) ?? { text: "✅ Название обновлено." };
  }

  if (session.step === "edit_description") {
    const product = getProductBySku(session.sku);
    if (!product) {
      resetSession(chatId);
      return { text: "Товар не найден." };
    }
    updateProduct(session.sku, productInput(product, { description: text }));
    logTelegramCatalogAction(chatId, "edit_description", session.sku);
    resetSession(chatId);
    return buildProductReply(session.sku) ?? { text: "✅ Описание обновлено." };
  }

  if (session.step === "edit_specs") {
    const product = getProductBySku(session.sku);
    if (!product) {
      resetSession(chatId);
      return { text: "Товар не найден." };
    }
    updateProduct(session.sku, productInput(product, { specsRaw: text }));
    logTelegramCatalogAction(chatId, "edit_specs", session.sku);
    resetSession(chatId);
    return buildProductReply(session.sku) ?? { text: "✅ Характеристики обновлены." };
  }

  if (session.step === "edit_image") {
    const product = getProductBySku(session.sku);
    if (!product) {
      resetSession(chatId);
      return { text: "Товар не найден." };
    }
    const image = text === "-" || text === "—" ? "" : text;
    updateProduct(session.sku, productInput(product, { image }));
    logTelegramCatalogAction(chatId, "edit_image", session.sku);
    resetSession(chatId);
    return buildProductReply(session.sku) ?? { text: "✅ Фото обновлено." };
  }

  if (session.step === "add_description") {
    return finishNewProduct(chatId, session.draft, text);
  }

  return null;
}

function productInput(
  product: Product,
  patch: Partial<{
    title: string;
    price: number | null;
    stock: StockStatus;
    description: string;
    specsRaw: string;
    image: string;
  }>,
) {
  return {
    title: patch.title ?? product.title,
    category: product.category,
    categorySlug: product.categorySlug,
    subcategory: product.subcategory,
    price: patch.price !== undefined ? patch.price : product.price,
    stock: patch.stock ?? product.stock,
    specsRaw: patch.specsRaw ?? product.specsRaw,
    description: patch.description ?? product.description,
    image: patch.image !== undefined ? patch.image : product.image,
  };
}

function finishNewProduct(
  chatId: number,
  draft: AddDraft & { price: number | null; stock: StockStatus },
  description: string,
): BotReply {
  try {
    const product = createProduct({
      title: draft.title,
      category: draft.category,
      categorySlug: draft.categorySlug,
      price: draft.price,
      stock: draft.stock,
      specsRaw: "",
      description: description.trim(),
    });
    logTelegramCatalogAction(chatId, "create_product", product.sku);
    resetSession(chatId);
    const url = productCanonicalUrl(product);
    return {
      text: [
        `✅ Добавлен <b>${esc(product.sku)}</b>`,
        esc(product.title),
        "",
        "Товар сразу в каталоге и в поиске на сайте.",
        `<a href="${esc(url)}">Открыть на сайте</a>`,
      ].join("\n"),
      options: { html: true, replyMarkup: productAdminKeyboard(product) },
    };
  } catch (e) {
    return { text: e instanceof Error ? e.message : "Ошибка" };
  }
}

function parsePriceInput(text: string): number | null | undefined {
  const t = text.trim().replace(/\s/g, "");
  if (t === "-" || t === "—") return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function handleCallback(data: string, chatId: number): BotReply | null {
  const settings = handleSettingsCallback(data, chatId);
  if (settings) return settings;

  if (data === "cats") {
    resetSession(chatId);
    return buildCategoriesReply();
  }

  if (data === "cancel") {
    resetSession(chatId);
    return { text: "Отменено." };
  }

  const categoryPage = parseCategoryPageCallback(data);
  if (categoryPage) {
    return buildCategoryReply(categoryPage.slug, categoryPage.page);
  }

  const productSku = parseProductCallback(data);
  if (productSku) {
    resetSession(chatId);
    return buildProductReply(productSku);
  }

  if (data.startsWith("del:")) {
    const sku = data.slice(4);
    const product = getProductBySku(sku);
    if (!product) return { text: "Товар не найден." };
    return {
      text: `Удалить <b>${esc(product.sku)}</b>?\n${esc(product.title)}`,
      options: { html: true, replyMarkup: deleteConfirmKeyboard(sku) },
    };
  }

  if (data === "addskip") {
    const session = getSession(chatId);
    if (session.step !== "add_description") {
      return { text: "Сессия сброшена. ➕ Новый товар" };
    }
    return finishNewProduct(chatId, session.draft, "");
  }

  if (data.startsWith("dely:")) {
    const sku = data.slice(5);
    try {
      deleteProduct(sku);
      logTelegramCatalogAction(chatId, "delete_product", sku);
      resetSession(chatId);
      return {
        text: `🗑 ${esc(sku)} удалён.`,
        options: { html: true, replyMarkup: categoriesKeyboard(loadCategories()) },
      };
    } catch (e) {
      return { text: e instanceof Error ? e.message : "Ошибка" };
    }
  }

  if (data.startsWith("ep:")) {
    const sku = data.slice(3);
    if (!getProductBySku(sku)) return { text: "Товар не найден." };
    setSession(chatId, { step: "edit_price", sku });
    return { text: `Новая цена для <b>${esc(sku)}</b> (число или «-»):`, options: { html: true } };
  }

  if (data.startsWith("et:")) {
    const sku = data.slice(3);
    if (!getProductBySku(sku)) return { text: "Товар не найден." };
    setSession(chatId, { step: "edit_title", sku });
    return { text: `Новое название для <b>${esc(sku)}</b>:`, options: { html: true } };
  }

  if (data.startsWith("ed:")) {
    const sku = data.slice(3);
    if (!getProductBySku(sku)) return { text: "Товар не найден." };
    setSession(chatId, { step: "edit_description", sku });
    return { text: `Новое описание для <b>${esc(sku)}</b>:`, options: { html: true } };
  }

  if (data.startsWith("es:")) {
    const sku = data.slice(3);
    if (!getProductBySku(sku)) return { text: "Товар не найден." };
    setSession(chatId, { step: "edit_specs", sku });
    return {
      text: `Характеристики для <b>${esc(sku)}</b> (текст, например «Длина: 6 м; Сталь: Ст3»):`,
      options: { html: true },
    };
  }

  if (data.startsWith("ei:")) {
    const sku = data.slice(3);
    if (!getProductBySku(sku)) return { text: "Товар не найден." };
    setSession(chatId, { step: "edit_image", sku });
    return {
      text: `URL фото для <b>${esc(sku)}</b> (или «-» чтобы убрать):`,
      options: { html: true },
    };
  }

  if (data.startsWith("st:")) {
    const [, sku, stock] = data.split(":");
    return updateStock(sku, stock as StockStatus, chatId);
  }

  if (data.startsWith("ac:")) {
    const slug = data.slice(3);
    const category = getCategoryBySlug(slug);
    const session = getSession(chatId);
    if (!category || session.step !== "add_category") {
      return { text: "Нажмите ➕ Новый товар и начните заново." };
    }
    const draft: AddDraft = {
      title: session.draft.title,
      category: category.name,
      categorySlug: category.slug,
    };
    setSession(chatId, { step: "add_price", draft });
    return buildAddPriceReply(draft);
  }

  if (data.startsWith("as:")) {
    const stock = data.slice(3) as StockStatus;
    const session = getSession(chatId);
    if (session.step !== "add_stock") {
      return { text: "Сессия сброшена. ➕ Новый товар" };
    }
    setSession(chatId, {
      step: "add_description",
      draft: { ...session.draft, stock },
    });
    return {
      text: [
        `<b>Наличие:</b> ${esc(stockToLabel(stock))}`,
        "",
        "Введите описание товара или нажмите «Пропустить»:",
      ].join("\n"),
      options: { html: true, replyMarkup: skipDescriptionKeyboard() },
    };
  }

  return null;
}

function updateStock(sku: string, stock: StockStatus, chatId: number): BotReply | null {
  const product = getProductBySku(sku);
  if (!product) return { text: "Товар не найден." };

  updateProduct(sku, productInput(product, { stock }));
  logTelegramCatalogAction(chatId, "edit_stock", sku);
  resetSession(chatId);
  const updated = getProductBySku(sku)!;
  return {
    text: [`✅ ${esc(stockToLabel(stock))}`, "", formatProductAdmin(updated)].join("\n"),
    options: { html: true, replyMarkup: productAdminKeyboard(updated) },
  };
}
