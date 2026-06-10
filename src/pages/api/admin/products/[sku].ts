import type { APIRoute } from "astro";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/admin-auth";
import { deleteProduct, getProductBySku, updateProduct } from "@/lib/product-store";
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

export const GET: APIRoute = async ({ request, params }) => {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  const product = getProductBySku(params.sku ?? "");
  if (!product) {
    return new Response(JSON.stringify({ error: "Товар не найден" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ product }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request, params }) => {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const input = parseBody(body);
    const product = updateProduct(params.sku ?? "", input);
    return new Response(JSON.stringify({ product }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ошибка обновления" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  try {
    deleteProduct(params.sku ?? "");
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ошибка удаления" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
};
