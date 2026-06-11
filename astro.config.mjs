import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://ps-invest.ru").replace(
  /\/$/,
  "",
);

export default defineConfig({
  site: isGithubPages ? "https://rinat3636.github.io" : siteUrl,
  base: isGithubPages ? "/metalstroy" : "/",
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  prefetch: true,
});
