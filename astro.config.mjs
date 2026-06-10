import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";

const isGithubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  site: isGithubPages ? "https://rinat3636.github.io" : "https://profstal-invest.ru",
  base: isGithubPages ? "/metalstroy" : "/",
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [react(), sitemap()],
  prefetch: true,
});
