import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnvFile(): Record<string, string> {
  const envPath = join(root, ".env");
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

/** Подставляет .env в process.env для скриптов */
export function applyEnvFile(): void {
  for (const [key, value] of Object.entries(loadEnvFile())) {
    if (!process.env[key]) process.env[key] = value;
  }
}
