import { defineConfig } from "astro/config";

// GitHub Pages project site. The base path follows the repository name; change the default
// below (or set SITE_BASE at build time) when the repo is renamed. Every internal link and
// asset goes through `u()` in src/lib/site.ts, so nothing else needs to change.
const base = process.env.SITE_BASE ?? "/landing/";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://listepo.github.io",
  base,
  trailingSlash: "ignore",
  output: "static",
});
