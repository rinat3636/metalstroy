import citiesData from "@/data/cities.json";
import categoriesData from "@/data/categories.json";
import type { Category, City } from "./types";

const cities = citiesData as City[];
const categories = categoriesData as Category[];

const RESERVED = new Set(["www", "api", "mail", "smtp", "ftp", "admin", "staging", "dev"]);

export type SubdomainKind = "city" | "category";

export interface SubdomainContext {
  kind: SubdomainKind;
  slug: string;
  name: string;
}

export function getPrimaryDomain(): string {
  const fromProcess =
    typeof process !== "undefined" ? process.env.PUBLIC_SITE_DOMAIN?.trim() : undefined;
  if (fromProcess) return fromProcess;
  return import.meta.env.PUBLIC_SITE_DOMAIN?.trim() || "ps-invest.ru";
}

export function getSiteOrigin(): string {
  const fromProcess =
    typeof process !== "undefined" ? process.env.PUBLIC_SITE_URL?.trim() : undefined;
  if (fromProcess) return fromProcess.replace(/\/$/, "");

  const fromMeta = import.meta.env.PUBLIC_SITE_URL?.trim();
  if (fromMeta) return fromMeta.replace(/\/$/, "");

  return `https://${getPrimaryDomain()}`;
}

export function subdomainHost(slug: string): string {
  return `${slug}.${getPrimaryDomain()}`;
}

export function subdomainUrl(slug: string, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `https://${subdomainHost(slug)}${clean === "/" ? "/" : clean}`;
}

export function parseSubdomain(hostHeader: string | null): SubdomainContext | null {
  if (!hostHeader) return null;

  const host = hostHeader.split(":")[0].toLowerCase();
  const domain = getPrimaryDomain().toLowerCase();

  if (host === domain || host === `www.${domain}`) return null;
  if (!host.endsWith(`.${domain}`)) return null;

  const sub = host.slice(0, -(domain.length + 1));
  if (!sub || sub.includes(".") || RESERVED.has(sub)) return null;

  const city = cities.find((c) => c.slug === sub);
  if (city) {
    return { kind: "city", slug: city.slug, name: city.name };
  }

  const category = categories.find((c) => c.slug === sub);
  if (category) {
    return { kind: "category", slug: category.slug, name: category.name };
  }

  return null;
}

export function resolveSubdomainRewrite(sub: SubdomainContext): string | null {
  if (sub.kind === "city") return `/cities/${sub.slug}/`;
  return `/catalog/${sub.slug}/`;
}

export function listCitySubdomains(): SubdomainContext[] {
  return cities.map((c) => ({ kind: "city" as const, slug: c.slug, name: c.name }));
}

export function listCategorySubdomains(): SubdomainContext[] {
  return categories.map((c) => ({ kind: "category" as const, slug: c.slug, name: c.name }));
}

export function listAllSubdomains(): SubdomainContext[] {
  return [...listCitySubdomains(), ...listCategorySubdomains()];
}
