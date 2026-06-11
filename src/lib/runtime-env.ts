/** Публичные переменные: runtime (VPS/Docker) + build-time (Astro). */
export function readPublicEnv(name: string): string {
  if (typeof process !== "undefined") {
    const fromProcess = process.env[name]?.trim();
    if (fromProcess) return fromProcess;
  }
  try {
    const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
    return meta.env?.[name]?.trim() ?? "";
  } catch {
    return "";
  }
}
