import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? "http://localhost:4321";
const ADMIN = process.env.ADMIN_PASSWORD ?? "profstal2024";

function loadEnv(): Record<string, string> {
  const envPath = join(__dirname, "..", ".env");
  if (!existsSync(envPath)) return {};
  const vars: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv();
const results: { name: string; ok: boolean; detail?: string }[] = [];

function check(name: string, ok: boolean, detail = "") {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "OK" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  auth = false,
): Promise<{ status: number; data: Record<string, unknown> }> {
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = `Bearer ${ADMIN}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }
  return { status: res.status, data };
}

async function main() {
  for (const path of ["/", "/catalog/", "/admin/", "/contacts/", "/cities/donetsk/"]) {
    const res = await fetch(`${BASE}${path}`);
    check(`GET ${path}`, res.status === 200, String(res.status));
  }

  const productRes = await fetch(`${BASE}/catalog/sortovoy-prokat/stalnaya-armatura-6-mm-mtl-20118/`);
  const productHtml = await productRes.text();
  check("GET product page SSR", productRes.status === 200 && productHtml.includes("МТЛ-20118"));

  const catalog = await request("GET", "/api/products");
  const total = catalog.data.total as number;
  check("GET /api/products", catalog.status === 200 && total >= 195, `total=${total}`);

  const noAuth = await request("GET", "/api/admin/products");
  check("Admin without auth -> 401", noAuth.status === 401);

  const search = await request("GET", "/api/admin/products?q=" + encodeURIComponent("МТЛ-20118"), undefined, true);
  const found = (search.data.products as unknown[])?.length ?? 0;
  check("Admin search by SKU", search.status === 200 && found >= 1, `found=${found}`);

  const one = await request("GET", "/api/admin/products?sku=" + encodeURIComponent("МТЛ-20118"), undefined, true);
  const product = one.data.product as { sku?: string } | undefined;
  check("Admin get by SKU", one.status === 200 && product?.sku === "МТЛ-20118");

  const payload = {
    title: "Тестовый товар автотест",
    category: "Крепеж",
    categorySlug: "krepezh",
    subcategory: "",
    price: 100,
    stock: "on_order",
    specsRaw: "Тест: 1 шт",
    description: "Автотест — удалить",
  };

  const created = await request("POST", "/api/admin/products", payload, true);
  const sku = (created.data.product as { sku?: string } | undefined)?.sku;
  check("Create product", created.status === 201 && !!sku?.startsWith("МТЛ-"), sku ?? JSON.stringify(created.data));

  if (sku) {
    const updated = await request("PUT", `/api/admin/products/${encodeURIComponent(sku)}`, {
      ...payload,
      title: "Тестовый товар изменён",
    }, true);
    const updatedTitle = (updated.data.product as { title?: string } | undefined)?.title ?? "";
    check("Update product", updated.status === 200 && updatedTitle.includes("изменён"));

    const afterCreate = await request("GET", "/api/products");
    const skus = ((afterCreate.data.products as { sku: string }[]) ?? []).map((p) => p.sku);
    check("Product visible in catalog API", skus.includes(sku));

    const deleted = await request("DELETE", `/api/admin/products/${encodeURIComponent(sku)}`, undefined, true);
    check("Delete product", deleted.status === 200 && deleted.data.ok === true);
  }

  const lead = await request("POST", "/api/lead", {
    phone: "+79991234567",
    name: "Тест",
    city: "Донецк",
    message: "smoke test",
    items: [],
  });
  const hasToken = !!env.TELEGRAM_BOT_TOKEN;
  const adminsPath = join(__dirname, "..", "data", "telegram-admins.json");
  const hasAdmins = existsSync(adminsPath) && (JSON.parse(readFileSync(adminsPath, "utf-8")) as unknown[]).length > 0;
  const hasTelegram = hasToken && hasAdmins;
  if (hasTelegram) {
    check("Lead API -> Telegram", lead.status === 200, `status=${lead.status}`);
  } else if (hasToken) {
    check("Lead API (админ: /start в боте)", lead.status === 503, `status=${lead.status}`);
  } else {
    check("Lead API (нет TELEGRAM_BOT_TOKEN)", lead.status === 503, `status=${lead.status}`);
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\nИтого: ${passed}/${results.length} пройдено`);
  if (!hasTelegram && hasToken) {
    console.log("\nПримечание: напишите боту /start и выполните npm run telegram:poll");
  }
  if (passed < results.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
