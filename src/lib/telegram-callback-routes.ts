/** Разбор callback_data с защитой от коллизий (ca:/cen: vs c:) */

export function parseCategoryPageCallback(data: string): { slug: string; page: number } | null {
  const match = /^c:([^:]+):(\d+)$/.exec(data);
  if (!match) return null;
  return { slug: match[1], page: Number(match[2]) || 0 };
}

export function parseProductCallback(data: string): string | null {
  if (!data.startsWith("p:")) return null;
  const sku = data.slice(2);
  return sku || null;
}
