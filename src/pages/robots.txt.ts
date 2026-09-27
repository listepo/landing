// robots.txt with the sitemap location (absolute, under SITE_URL + SITE_BASE).
// Note: on a GitHub Pages project site crawlers read robots.txt from the host root, so this file
// mainly advertises the sitemap; the sitemap is also linked from every page's <head>.
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/?$/, "/")}sitemap-index.xml`, site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
