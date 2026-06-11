/** Путь с учётом base (GitHub Pages: /metalstroy/) */
export function withBase(path: string): string {
  let base = "/";
  try {
    base = import.meta.env?.BASE_URL ?? "/";
  } catch {
    base = "/";
  }
  if (!path || path === "/") return base;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${clean}`;
}
