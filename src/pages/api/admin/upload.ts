import type { APIRoute } from "astro";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { isAdminAuthorized, unauthorizedResponse } from "@/lib/admin-auth";
import { imageFilenameFromSku } from "@/lib/product-utils";

export const prerender = false;

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export const POST: APIRoute = async ({ request }) => {
  if (!isAdminAuthorized(request)) return unauthorizedResponse();

  const form = await request.formData();
  const file = form.get("file");
  const sku = String(form.get("sku") ?? "").trim();

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "Файл не передан" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ext = extname(file.name).toLowerCase() || ".jpg";
  if (!ALLOWED.has(ext)) {
    return new Response(JSON.stringify({ error: "Допустимы JPG, PNG, WEBP, GIF" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filename = sku ? imageFilenameFromSku(sku, ext.replace(/^\./, "")) : `upload-${Date.now()}${ext}`;
  const dir = join(process.cwd(), "public/assets/catalog-images");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(dir, filename), buffer);

  return new Response(JSON.stringify({ filename, url: `/assets/catalog-images/${encodeURIComponent(filename)}` }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
