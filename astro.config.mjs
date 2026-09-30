import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages project site. The base path follows the repository name; change the default
// below (or set SITE_BASE at build time) when the repo is renamed. Every internal link and
// asset goes through `u()` in src/lib/site.ts, so nothing else needs to change.
const base = process.env.SITE_BASE ?? "/landing/";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://pyrlyn.github.io",
  base,
  trailingSlash: "ignore",
  output: "static",
  // sitemap-index.xml + sitemap-0.xml under the base; robots.txt (src/pages/robots.txt.ts) points to it.
  integrations: [sitemap()],
  // Tailwind v4 utilities only (no preflight), see src/styles/tailwind.css.
  vite: { plugins: [tailwindcss()] },
});
