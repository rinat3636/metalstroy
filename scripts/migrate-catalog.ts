import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => translitMap[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseSpecs(raw: string): { label: string; value: string }[] {
  if (!raw) return [];
  return raw.split(";").map((part) => {
    const [label, ...rest] = part.split(":");
    return {
      label: (label ?? "").trim(),
      value: rest.join(":").trim(),
    };
  }).filter((s) => s.label && s.value);
}

function mapStock(value: string): "in_stock" | "on_order" | "out_of_stock" {
  if (value === "В наличии") return "in_stock";
  if (value === "Под заказ") return "on_order";
  return "out_of_stock";
}

type RawProduct = {
  артикул: string;
  название: string;
  категория: string;
  подкатегория?: string;
  цена: number;
  валюта: string;
  наличие: string;
  характеристики: string;
  описание: string;
  изображение?: string;
};

const categorySeo: Record<string, { description: string; seoText: string }> = {
  "Сортовой прокат": {
    description: "Арматура, уголок, швеллер, балка и другой сортовой металлопрокат в ДНР.",
    seoText: "Сортовой прокат — основа любого строительного объекта. Подберём арматуру, уголок, швеллер и балку по ГОСТ с расчётом партии под ваш объект.",
  },
  "Труба профильная": {
    description: "Профильная труба квадратная и прямоугольная для каркасов, заборов и навесов.",
    seoText: "Профильная труба востребована для каркасных конструкций, заборов, навесов и металлоконструкций. Поможем подобрать сечение и толщину стенки.",
  },
  "Стройматериалы": {
    description: "Строительные материалы для частного и промышленного строительства.",
    seoText: "Комплектуем объекты стройматериалами: от расходных позиций до партий под подряд.",
  },
  "Профнастил": {
    description: "Профнастил для кровли, заборов и облицовки — разные профили и покрытия.",
    seoText: "Профнастил для кровли и ограждений. Подберём профиль, толщину и цвет под задачу.",
  },
  "Крепеж": {
    description: "Метизы и крепёж для монтажа металлоконструкций и стройки.",
    seoText: "Крепёж и метизы для монтажа — болты, гайки, саморезы и расходные позиции.",
  },
  "Сетки и Проволоки": {
    description: "Сетка рабица, сварная, проволока — для заборов и армирования.",
    seoText: "Сетки и проволока для ограждений, вольеров и строительных задач.",
  },
  "Кровельный материал": {
    description: "Материалы для кровли и водосточных систем.",
    seoText: "Кровельные материалы для частных домов и промышленных объектов.",
  },
  "Труба круглая ВГП/ДУ": {
    description: "Водогазопроводные и электросварные трубы круглого сечения.",
    seoText: "Круглые трубы ВГП и ДУ для инженерных и строительных систем.",
  },
  "Листовой прокат": {
    description: "Листовой металл, оцинковка, нержавейка для изготовления и стройки.",
    seoText: "Листовой прокат различной толщины и марок стали.",
  },
  "Заборы": {
    description: "Готовые решения и комплектующие для ограждений.",
    seoText: "Заборы и комплектующие — от сетки до готовых секций.",
  },
  "Сайдинг Металлический": {
    description: "Металлический сайдинг для фасадов и облицовки.",
    seoText: "Металлический сайдинг для долговечной отделки фасадов.",
  },
  "Некондиционный материал": {
    description: "Некондиционный металлопрокат по сниженной цене.",
    seoText: "Некондиционный материал — выгодные позиции при допустимых отклонениях.",
  },
};

const cities = [
  { slug: "donetsk", name: "Донецк", title: "Металлопрокат в Донецке", text: "Арматура, трубы, профнастил, лист и сетка для частных и строительных задач в Донецке.", delivery: "Самовывоз со склада или доставка по Донецку и пригороду по согласованию." },
  { slug: "makeevka", name: "Макеевка", title: "Металл в Макеевке", text: "Подбор металлопроката и стройматериалов с расчётом доставки по Макеевке.", delivery: "Доставка в Макеевку — по согласованному маршруту и объёму партии." },
  { slug: "gorlovka", name: "Горловка", title: "Металлопрокат в Горловке", text: "Каталог труб, арматуры, листа, кровельных материалов и крепежа для Горловки.", delivery: "Отгрузка и доставка по Горловке — уточняем сроки при оформлении заявки." },
  { slug: "enakievo", name: "Енакиево", title: "Металл в Енакиево", text: "Заявки на металлопрокат и строительные позиции для объектов в Енакиево.", delivery: "Поставка в Енакиево — расчёт доставки после подтверждения наличия." },
  { slug: "khartsyzk", name: "Харцызск", title: "Металл в Харцызске", text: "Профильная труба, сетка, уголок, швеллер и лист с расчётом партии.", delivery: "Доставка в Харцызск по согласованию с менеджером." },
  { slug: "shakhtersk", name: "Шахтерск", title: "Металлопрокат в Шахтерске", text: "Быстрый подбор позиций по каталогу и расчёт под объект или частную стройку.", delivery: "Шахтерск — самовывоз или доставка при достаточном объёме заказа." },
  { slug: "torez", name: "Торез", title: "Металл в Торезе", text: "Витрина металлопроката и стройматериалов для объектов и частного строительства.", delivery: "Поставка в Торез — сроки зависят от наличия и маршрута." },
  { slug: "snezhnoe", name: "Снежное", title: "Металлопрокат в Снежном", text: "Позиции для ремонта, забора, навеса, кровли и строительных работ.", delivery: "Доставка в Снежное по заявке с предварительным расчётом." },
  { slug: "yasynuvata", name: "Ясиноватая", title: "Металл в Ясиноватой", text: "Каталог с фильтрами, остатками и заявкой на расчёт для Ясиноватой.", delivery: "Ясиноватая — удобный самовывоз или доставка на объект." },
  { slug: "mariupol", name: "Мариуполь", title: "Металлопрокат в Мариуполе", text: "Поставка металлопроката и стройматериалов для объектов в Мариуполе.", delivery: "Мариуполь — поставка по согласованному графику и маршруту." },
];

const raw = JSON.parse(
  readFileSync(join(root, "data", "catalog.json"), "utf-8"),
) as RawProduct[];

const categorySlugs = new Map<string, string>();
const categoryCounts = new Map<string, number>();

const products = raw.map((item, index) => {
  const categoryName = item.категория || "Другое";
  if (!categorySlugs.has(categoryName)) {
    categorySlugs.set(categoryName, slugify(categoryName));
  }
  categoryCounts.set(categoryName, (categoryCounts.get(categoryName) ?? 0) + 1);

  const baseSlug = slugify(item.название) || `product-${index + 1}`;
  const skuSlug = slugify(item.артикул);

  return {
    sku: item.артикул,
    title: item.название,
    slug: `${baseSlug}-${skuSlug}`,
    category: categoryName,
    categorySlug: categorySlugs.get(categoryName)!,
    subcategory: item.подкатегория || undefined,
    price: Number.isFinite(item.цена) ? item.цена : null,
    currency: "RUB" as const,
    stock: mapStock(item.наличие),
    stockLabel: item.наличие,
    specs: parseSpecs(item.характеристики),
    specsRaw: item.характеристики,
    description: item.описание,
    image: item.изображение || undefined,
  };
});

const categories = [...categorySlugs.entries()]
  .map(([name, slug]) => ({
    name,
    slug,
    count: categoryCounts.get(name) ?? 0,
    description: categorySeo[name]?.description ?? `Категория «${name}» в каталоге Профсталь-инвест.`,
    seoText: categorySeo[name]?.seoText ?? `Металлопрокат и стройматериалы — категория «${name}».`,
  }))
  .sort((a, b) => b.count - a.count);

const dataDir = join(root, "src", "data");
mkdirSync(dataDir, { recursive: true });

writeFileSync(join(dataDir, "products.json"), JSON.stringify(products, null, 2), "utf-8");
writeFileSync(join(dataDir, "categories.json"), JSON.stringify(categories, null, 2), "utf-8");
writeFileSync(join(dataDir, "cities.json"), JSON.stringify(cities, null, 2), "utf-8");

console.log(`Migrated ${products.length} products, ${categories.length} categories, ${cities.length} cities.`);
