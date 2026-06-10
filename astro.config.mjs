import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://profstal-invest.ru",
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [react(), sitemap()],
  prefetch: true,
});
