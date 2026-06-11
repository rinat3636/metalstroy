import type { Category, Product, StockStatus } from "./types";
import { productCanonicalUrl } from "./product-url";

export const BTN_CATALOG = "📋 Каталог";
export const BTN_SEARCH = "🔍 Найти товар";
export const BTN_ADD = "➕ Новый товар";
export const BTN_CATEGORIES = "📁 Категории";
export const BTN_COMPANY = "🏢 Контакты";
export const BTN_HELP = "ℹ️ Помощь";

export const MENU_BUTTONS = new Set([
  BTN_CATALOG,
  BTN_SEARCH,
  BTN_ADD,
  BTN_CATEGORIES,
  BTN_COMPANY,
  BTN_HELP,
]);

const PAGE = 8;

export function mainMenuKeyboard(): Record<string, unknown> {
  return {
    keyboard: [
      [{ text: BTN_CATALOG }, { text: BTN_SEARCH }],
      [{ text: BTN_ADD }, { text: BTN_CATEGORIES }],
      [{ text: BTN_COMPANY }],
      [{ text: BTN_HELP }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function categoriesKeyboard(categories: Category[]): Record<string, unknown> {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [{ text: categories[i].name, callback_data: `c:${categories[i].slug}:0` }];
    if (categories[i + 1]) {
      row.push({ text: categories[i + 1].name, callback_data: `c:${categories[i + 1].slug}:0` });
    }
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

export function productsKeyboard(products: Product[], categorySlug: string, page: number): Record<string, unknown> {
  const start = page * PAGE;
  const slice = products.slice(start, start + PAGE);
  const rows = slice.map((p) => [{ text: label(p), callback_data: `p:${p.sku}` }]);

  const nav: Array<{ text: string; callback_data: string }> = [];
  if (page > 0) nav.push({ text: "◀️", callback_data: `c:${categorySlug}:${page - 1}` });
  if (start + PAGE < products.length) nav.push({ text: "▶️", callback_data: `c:${categorySlug}:${page + 1}` });
  if (nav.length) rows.push(nav);

  rows.push([{ text: "📋 Категории", callback_data: "cats" }]);
  rows.push([{ text: "⚙️ Категория", callback_data: `ca:${categorySlug}` }]);
  return { inline_keyboard: rows };
}

export function searchKeyboard(products: Product[]): Record<string, unknown> {
  const rows = products.slice(0, 8).map((p) => [{ text: label(p), callback_data: `p:${p.sku}` }]);
  rows.push([{ text: "📋 Каталог", callback_data: "cats" }]);
  return { inline_keyboard: rows };
}

export function productAdminKeyboard(product: Product): Record<string, unknown> {
  return {
    inline_keyboard: [
      [
        { text: "💰 Цена", callback_data: `ep:${product.sku}` },
        { text: "✏️ Название", callback_data: `et:${product.sku}` },
      ],
      [
        { text: "📝 Описание", callback_data: `ed:${product.sku}` },
        { text: "📐 Характеристики", callback_data: `es:${product.sku}` },
      ],
      [{ text: "🖼 Фото (URL)", callback_data: `ei:${product.sku}` }],
      [
        { text: "✅ В наличии", callback_data: `st:${product.sku}:in_stock` },
        { text: "📦 Под заказ", callback_data: `st:${product.sku}:on_order` },
      ],
      [{ text: "❌ Нет в наличии", callback_data: `st:${product.sku}:out_of_stock` }],
      [{ text: "🔗 На сайте", url: productCanonicalUrl(product) }],
      [{ text: "🗑 Удалить", callback_data: `del:${product.sku}` }],
      [{ text: "📋 Каталог", callback_data: "cats" }],
    ],
  };
}

export function skipDescriptionKeyboard(): Record<string, unknown> {
  return {
    inline_keyboard: [[{ text: "Пропустить", callback_data: "addskip" }]],
  };
}

export function deleteConfirmKeyboard(sku: string): Record<string, unknown> {
  return {
    inline_keyboard: [
      [
        { text: "✅ Да, удалить", callback_data: `dely:${sku}` },
        { text: "Отмена", callback_data: `p:${sku}` },
      ],
    ],
  };
}

export function addCategoryKeyboard(categories: Category[]): Record<string, unknown> {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [{ text: categories[i].name, callback_data: `ac:${categories[i].slug}` }];
    if (categories[i + 1]) {
      row.push({ text: categories[i + 1].name, callback_data: `ac:${categories[i + 1].slug}` });
    }
    rows.push(row);
  }
  rows.push([{ text: "Отмена", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

export function addStockKeyboard(): Record<string, unknown> {
  return {
    inline_keyboard: [
      [
        { text: "✅ В наличии", callback_data: "as:in_stock" },
        { text: "📦 Под заказ", callback_data: "as:on_order" },
      ],
      [{ text: "❌ Нет в наличии", callback_data: "as:out_of_stock" }],
      [{ text: "Отмена", callback_data: "cancel" }],
    ],
  };
}

export function categoriesManageKeyboard(categories: Category[]): Record<string, unknown> {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [{ text: categories[i].name, callback_data: `ca:${categories[i].slug}` }];
    if (categories[i + 1]) {
      row.push({ text: categories[i + 1].name, callback_data: `ca:${categories[i + 1].slug}` });
    }
    rows.push(row);
  }
  rows.push([{ text: "➕ Новая категория", callback_data: "catadd" }]);
  rows.push([{ text: "◀️ В меню", callback_data: "cancel" }]);
  return { inline_keyboard: rows };
}

export function categoryAdminKeyboard(slug: string): Record<string, unknown> {
  return {
    inline_keyboard: [
      [
        { text: "✏️ Название", callback_data: `cen:${slug}` },
        { text: "📝 Описание", callback_data: `ced:${slug}` },
      ],
      [{ text: "🔎 SEO-текст", callback_data: `ces:${slug}` }],
      [
        { text: "📋 Товары", callback_data: `c:${slug}:0` },
        { text: "◀️ Список", callback_data: "catlist" },
      ],
    ],
  };
}

export function companyFieldsKeyboard(): Record<string, unknown> {
  return {
    inline_keyboard: [
      [
        { text: "📞 Телефон", callback_data: "sf:phone" },
        { text: "✉️ Email", callback_data: "sf:email" },
      ],
      [
        { text: "📍 Адрес", callback_data: "sf:address" },
        { text: "🕐 График", callback_data: "sf:schedule" },
      ],
      [{ text: "🏛 Юр. название", callback_data: "sf:legalName" }],
      [
        { text: "ИНН", callback_data: "sf:inn" },
        { text: "КПП", callback_data: "sf:kpp" },
        { text: "ОГРН", callback_data: "sf:ogrn" },
      ],
    ],
  };
}

function label(product: Product): string {
  const head = `${product.sku}`;
  const max = 58;
  if (head.length >= max) return head.slice(0, max);
  const tail = product.title.length <= max - head.length - 2
    ? product.title
    : `${product.title.slice(0, max - head.length - 3)}…`;
  return `${head} · ${tail}`;
}

export { PAGE as PRODUCTS_PAGE_SIZE };
