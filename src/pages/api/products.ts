import type { APIRoute } from "astro";
import { loadCategories, loadProducts, searchProducts } from "@/lib/product-store";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get("q") ?? "";
  const products = q ? searchProducts(q) : loadProducts();
  const categories = loadCategories();

  return new Response(JSON.stringify({ products, categories, total: products.length }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
