import { defineMiddleware } from "astro:middleware";
import { ensureTelegramBotRunning } from "@/lib/telegram-server";
import { loadCategories } from "@/lib/product-store";
import citiesData from "@/data/cities.json";
import {
  getPrimaryDomain,
  parseSubdomain,
  resolveSubdomainRewrite,
  subdomainUrl,
} from "@/lib/subdomains";

const cities = citiesData as { slug: string }[];

function redirect301(url: string): Response {
  return new Response(null, { status: 301, headers: { Location: url } });
}

export const onRequest = defineMiddleware(async (context, next) => {
  ensureTelegramBotRunning();

  const host = context.request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
  const domain = getPrimaryDomain().toLowerCase();

  if (host === `www.${domain}`) {
    const target = new URL(context.url);
    target.host = domain;
    target.protocol = "https:";
    return redirect301(target.toString());
  }

  const sub = parseSubdomain(context.request.headers.get("host"));
  if (sub) {
    context.locals.subdomain = sub;

    const path = context.url.pathname.replace(/\/$/, "") || "/";
    if (path === "/" || path === "") {
      const target = resolveSubdomainRewrite(sub);
      if (target) {
        return context.rewrite(new URL(target, context.url));
      }
    }

    if (sub.kind === "city" && path.startsWith("/")) {
      const segment = path.slice(1).split("/")[0];
      if (segment && loadCategories().some((c) => c.slug === segment)) {
        return context.rewrite(new URL(`/cities/${sub.slug}/${segment}/`, context.url));
      }
    }

    return next();
  }

  const pathname = context.url.pathname;
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;

  const cityMatch = normalized.match(/^\/cities\/([^/]+)\/$/);
  if (cityMatch && cities.some((c) => c.slug === cityMatch[1])) {
    return redirect301(subdomainUrl(cityMatch[1]));
  }

  const cityCatMatch = normalized.match(/^\/cities\/([^/]+)\/([^/]+)\/$/);
  if (
    cityCatMatch &&
    cities.some((c) => c.slug === cityCatMatch[1]) &&
    loadCategories().some((c) => c.slug === cityCatMatch[2])
  ) {
    return redirect301(subdomainUrl(cityCatMatch[1], `/${cityCatMatch[2]}/`));
  }

  const catMatch = normalized.match(/^\/catalog\/([^/]+)\/$/);
  if (catMatch && loadCategories().some((c) => c.slug === catMatch[1])) {
    return redirect301(subdomainUrl(catMatch[1]));
  }

  return next();
});
