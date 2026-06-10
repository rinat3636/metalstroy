import type { APIRoute } from "astro";
import { rankProducts } from "@/lib/search";
import { loadProducts } from "@/lib/product-store";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number(url.searchParams.get("limit") ?? 8);
  const limit = Number.isFinite(limitRaw) ? Math.min(20, Math.max(1, limitRaw)) : 8;

  if (!q) {
    return new Response(JSON.stringify({ query: "", total: 0, items: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const { items, total } = rankProducts(loadProducts(), q, limit);

  return new Response(JSON.stringify({ query: q, total, items }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
