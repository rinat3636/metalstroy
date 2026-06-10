import type { APIRoute } from "astro";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/admin-auth";
import { createProduct, getProductBySku, loadProducts, searchProducts } from "@/lib/product-store";
import type { StockStatus } from "@/lib/types";

export const prerender = false;

function parseBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? "").trim(),
    categorySlug: String(body.categorySlug ?? "").trim(),
    subcategory: String(body.subcategory ?? "").trim() || undefined,
    price: body.price === "" || body.price == null ? null : Number(body.price),
    stock: (body.stock as StockStatus) ?? "on_order",
    specsRaw: String(body.specsRaw ?? "").trim(),
    description: String(body.description ?? "").trim(),
    image: String(body.image ?? "").trim() || undefined,
  };
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  const sku = url.searchParams.get("sku");
  const q = url.searchParams.get("q") ?? "";

  if (sku) {
    const product = getProductBySku(sku);
    if (!product) {
      return new Response(JSON.stringify({ error: "Товар не найден" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ product }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const products = q ? searchProducts(q) : loadProducts();
  return new Response(JSON.stringify({ products, total: products.length }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const input = parseBody(body);
    if (!input.title || !input.category || !input.categorySlug) {
      return new Response(JSON.stringify({ error: "Заполните название и категорию" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const product = createProduct(input);
    return new Response(JSON.stringify({ product }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ошибка создания" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
};
