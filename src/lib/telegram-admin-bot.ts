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
import { getSession, resetSession, setSession, type AddDraft } from "./telegram-admin-session";
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
} from "./telegram-keyboard";
import type { TelegramSendOptions } from "./telegram";

export type BotReply = { text: string; options?: TelegramSendOptions };

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
    resetSession(chatId);
    return buildProductReply(session.sku) ?? { text: "✅ Название обновлено." };
  }

  return null;
}

function productInput(
  product: Product,
  patch: Partial<{ title: string; price: number | null; stock: StockStatus }>,
) {
  return {
    title: patch.title ?? product.title,
    category: product.category,
    categorySlug: product.categorySlug,
    subcategory: product.subcategory,
    price: patch.price !== undefined ? patch.price : product.price,
    stock: patch.stock ?? product.stock,
    specsRaw: product.specsRaw,
    description: product.description,
    image: product.image,
  };
}

function parsePriceInput(text: string): number | null | undefined {
  const t = text.trim().replace(/\s/g, "");
  if (t === "-" || t === "—") return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function handleCallback(data: string, chatId: number): BotReply | null {
  if (data === "cats") {
    resetSession(chatId);
    return buildCategoriesReply();
  }

  if (data === "cancel") {
    resetSession(chatId);
    return { text: "Отменено." };
  }

  if (data.startsWith("c:")) {
    const [, slug, pageRaw] = data.split(":");
    return buildCategoryReply(slug, Number(pageRaw) || 0);
  }

  if (data.startsWith("p:")) {
    resetSession(chatId);
    return buildProductReply(data.slice(2));
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

  if (data.startsWith("dely:")) {
    const sku = data.slice(5);
    try {
      deleteProduct(sku);
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
    try {
      const product = createProduct({
        title: session.draft.title,
        category: session.draft.category,
        categorySlug: session.draft.categorySlug,
        price: session.draft.price,
        stock,
        specsRaw: "",
        description: "",
      });
      resetSession(chatId);
      return {
        text: [`✅ Добавлен <b>${esc(product.sku)}</b>`, esc(product.title)].join("\n"),
        options: { html: true, replyMarkup: productAdminKeyboard(product) },
      };
    } catch (e) {
      return { text: e instanceof Error ? e.message : "Ошибка" };
    }
  }

  return null;
}

function updateStock(sku: string, stock: StockStatus, chatId: number): BotReply | null {
  const product = getProductBySku(sku);
  if (!product) return { text: "Товар не найден." };

  updateProduct(sku, productInput(product, { stock }));
  resetSession(chatId);
  const updated = getProductBySku(sku)!;
  return {
    text: [`✅ ${esc(stockToLabel(stock))}`, "", formatProductAdmin(updated)].join("\n"),
    options: { html: true, replyMarkup: productAdminKeyboard(updated) },
  };
}
