import citiesData from "@/data/cities.json";
import type { Category, City } from "./types";
import { loadCategories, loadProducts } from "./product-store";
import { cityProductUrl, listCityProductPairs } from "./city-product-seo";
import { getPrimaryDomain, getSiteOrigin, subdomainUrl } from "./subdomains";
import { withBase } from "./paths";

const cities = citiesData as City[];

function getCategories(): Category[] {
  return loadCategories();
}

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  const base = withBase(path.startsWith("/") ? path : `/${path}`);
  return `${origin}${base === "/" ? "" : base}`.replace(/([^:]\/)\/+/g, "$1");
}

/** Канонический URL: на поддомене — он же, иначе абсолютный путь */
export function canonicalForPage(options: {
  pathname: string;
  subdomain?: { kind: "city" | "category"; slug: string } | null;
  citySlug?: string;
  categorySlug?: string;
  productSlug?: string;
}): string {
  const { pathname, subdomain, citySlug, categorySlug, productSlug } = options;

  if (productSlug && categorySlug) {
    return subdomainUrl(categorySlug, `/${productSlug}/`);
  }

  if (subdomain?.kind === "city") {
    if (categorySlug) {
      return subdomainUrl(subdomain.slug, `/${categorySlug}/`);
    }
    return subdomainUrl(subdomain.slug);
  }

  if (subdomain?.kind === "category") {
    return subdomainUrl(subdomain.slug);
  }

  if (citySlug && categorySlug) {
    return subdomainUrl(citySlug, `/${categorySlug}/`);
  }

  if (citySlug && (pathname === `/cities/${citySlug}/` || pathname === `/cities/${citySlug}`)) {
    return subdomainUrl(citySlug);
  }

  if (categorySlug && (pathname === `/catalog/${categorySlug}/` || pathname === `/catalog/${categorySlug}`)) {
    return subdomainUrl(categorySlug);
  }

  return absoluteUrl(pathname);
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: item.href.startsWith("http") ? item.href : absoluteUrl(item.href) } : {}),
    })),
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Профсталь-инвест",
    url: origin,
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}${withBase("/catalog/")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildFaqSchema(items: Array<{ q: string; a: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export {
  cityCategoryTitle,
  cityCategoryDescription,
  cityCategoryH1,
  cityCategoryIntro,
  cityCategoryFaq,
} from "./city-category-seo";

export function listCityCategoryPairs(): Array<{ city: City; category: Category }> {
  const pairs: Array<{ city: City; category: Category }> = [];
  const categories = getCategories();
  for (const city of cities) {
    for (const category of categories) {
      pairs.push({ city, category });
    }
  }
  return pairs;
}

export function listStaticSeoPaths(): string[] {
  const paths = ["/", "/catalog/", "/cities/", "/about/", "/contacts/", "/delivery/"];
  for (const city of cities) {
    paths.push(`/cities/${city.slug}/`);
  }
  for (const category of getCategories()) {
    paths.push(`/catalog/${category.slug}/`);
  }
  for (const { city, category } of listCityCategoryPairs()) {
    paths.push(`/cities/${city.slug}/${category.slug}/`);
  }
  for (const { city, product } of listCityProductPairs(cities, loadProducts())) {
    paths.push(`/cities/${city.slug}/${product.categorySlug}/${product.slug}/`);
  }
  return paths;
}

export interface SitemapEntry {
  loc: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

/** Канонические URL: поддомены для city/category/city×category; path — только основной домен */
export function listAllSitemapUrls(): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  const push = (path: string, priority: string, changefreq = "weekly", lastmod?: string) => {
    entries.push({ loc: absoluteUrl(path), priority, changefreq, lastmod });
  };

  push("/", "1.0", "daily");
  push("/catalog/", "0.95", "daily");
  push("/cities/", "0.9");
  push("/contacts/", "0.7");
  push("/about/", "0.6");
  push("/delivery/", "0.6");

  for (const city of cities) {
    entries.push({ loc: subdomainUrl(city.slug), priority: "0.9", changefreq: "weekly" });
  }

  for (const category of getCategories()) {
    entries.push({ loc: subdomainUrl(category.slug), priority: "0.88", changefreq: "weekly" });
  }

  for (const { city, category } of listCityCategoryPairs()) {
    entries.push({
      loc: subdomainUrl(city.slug, `/${category.slug}/`),
      priority: "0.82",
      changefreq: "weekly",
    });
  }

  return entries;
}

/** Город × товар — landing для локального SEO (1950 URL при 10 городах и 195 товарах) */
export function listCityProductSitemapUrls(): SitemapEntry[] {
  const products = loadProducts();
  return listCityProductPairs(cities, products).map(({ city, product }) => ({
    loc: cityProductUrl(city.slug, product),
    priority: "0.78",
    changefreq: "weekly",
  }));
}

export { cities, getCategories as categories, getPrimaryDomain, getSiteOrigin };
