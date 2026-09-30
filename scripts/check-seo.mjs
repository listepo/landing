#!/usr/bin/env node
// Post-build SEO / a11y check for every built page (run after `astro build`):
//  - <html lang>, a unique <title>, a meta description, theme-color and a favicon;
//  - an absolute canonical under SITE_URL + SITE_BASE that matches the page's own path;
//  - Open Graph (title, description, image, url, type) and a Twitter card;
//  - exactly one <h1> and no skipped heading levels; <main>, <header> and <footer> landmarks;
//  - every <img> has an alt attribute; every <canvas> is aria-hidden or labelled;
//  - every JSON-LD block parses, and each page type carries its expected schema.org types;
//  - robots.txt and the sitemap exist and list every page.
// Exit code 1 on any error. Usage: node scripts/check-seo.mjs [distDir]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dist = path.resolve(root, process.argv[2] ?? "dist");
const site = (process.env.SITE_URL ?? "https://pyrlyn.github.io").replace(/\/$/, "");
const base = (process.env.SITE_BASE ?? "/landing/").replace(/\/?$/, "/");
const errors = [];
const warnings = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const pages = walk(dist).filter((f) => f.endsWith(".html")).sort();
const TAG = (name) => new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, "gi");
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+)))?(?=[\\s/>])`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
};
const metas = (html) => [...html.matchAll(TAG("meta"))].map((m) => m[0]);
const meta = (html, key, val) => metas(html).find((t) => attr(t, key) === val);
const content = (html, key, val) => { const t = meta(html, key, val); return t ? attr(t, "content") : null; };
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const seen = { title: new Map(), description: new Map() };
const expectTypes = (rel) => {
  if (rel === "") return ["Organization", "WebSite"];
  if (/^[^/]+\/$/.test(rel)) return ["SoftwareApplication", "BreadcrumbList"];
  if (/^[^/]+\/docs\//.test(rel)) return ["TechArticle", "BreadcrumbList"];
  return [];
};
const rows = [];
for (const file of pages) {
  const rel = path.relative(dist, file).replace(/index\.html$/, "").split(path.sep).join("/");
  if (rel.startsWith("404")) continue;
  const html = fs.readFileSync(file, "utf8");
  const err = (m) => errors.push(`${base}${rel}: ${m}`);
  const warn = (m) => warnings.push(`${base}${rel}: ${m}`);
  const head = html.split(/<\/head>/i)[0];
  const body = html.slice(head.length);

  if (!/<html\b[^>]*\slang="[a-z]{2}/i.test(html)) err("missing <html lang>");
  const title = strip(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  if (!title) err("missing <title>");
  else if (title.length > 70) warn(`title is ${title.length} chars (> 70): "${title}"`);
  const desc = content(head, "name", "description");
  if (!desc) err("missing meta description");
  else if (desc.length < 50 || desc.length > 170) warn(`description is ${desc.length} chars (want 50–170)`);
  for (const [k, v] of [["title", title], ["description", desc]]) if (v) seen[k].set(v, [...(seen[k].get(v) ?? []), rel]);
  if (!content(head, "name", "theme-color")) err("missing theme-color");
  if (![...head.matchAll(TAG("link"))].some((m) => attr(m[0], "rel") === "icon")) err("missing favicon link");

  const canon = [...head.matchAll(TAG("link"))].map((m) => m[0]).filter((t) => attr(t, "rel") === "canonical").map((t) => attr(t, "href"));
  const want = `${site}${base}${rel}`;
  if (canon.length !== 1) err(`expected 1 canonical, found ${canon.length}`);
  else if (canon[0] !== want) err(`canonical ${canon[0]} ≠ ${want}`);

  for (const p of ["og:title", "og:description", "og:image", "og:url", "og:type", "og:site_name"]) if (!content(head, "property", p)) err(`missing ${p}`);
  const ogImg = content(head, "property", "og:image");
  if (ogImg) {
    if (!ogImg.startsWith(`${site}${base}`)) err(`og:image not absolute under the site: ${ogImg}`);
    else if (!fs.existsSync(path.join(dist, decodeURI(ogImg.slice(`${site}${base}`.length))))) err(`og:image file missing: ${ogImg}`);
  }
  if (content(head, "property", "og:url") !== want) err("og:url ≠ canonical");
  for (const p of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) if (!content(head, "name", p)) err(`missing ${p}`);

  const heads = [...body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ lvl: +m[1], text: strip(m[2]) }));
  const h1 = heads.filter((h) => h.lvl === 1).length;
  if (h1 !== 1) err(`expected exactly one <h1>, found ${h1}`);
  if (heads[0] && heads[0].lvl !== 1) err(`first heading is h${heads[0].lvl} ("${heads[0].text}"), not h1`);
  for (let i = 1; i < heads.length; i++) if (heads[i].lvl > heads[i - 1].lvl + 1) err(`heading skips a level: h${heads[i - 1].lvl} → h${heads[i].lvl} ("${heads[i].text.slice(0, 50)}")`);
  for (const lm of ["main", "header", "footer", "nav"]) if (!new RegExp(`<${lm}\\b`, "i").test(body)) err(`missing <${lm}> landmark`);
  if ((body.match(/<main\b/gi) ?? []).length !== 1) err("expected exactly one <main>");

  for (const m of body.matchAll(TAG("img"))) if (attr(m[0], "alt") === null) err(`<img> without alt: ${attr(m[0], "src")}`);
  for (const m of body.matchAll(TAG("canvas"))) if (attr(m[0], "aria-hidden") !== "true" && !attr(m[0], "aria-label")) err("<canvas> neither aria-hidden nor labelled");
  for (const m of body.matchAll(TAG("svg"))) if (attr(m[0], "aria-hidden") !== "true" && !attr(m[0], "aria-label") && attr(m[0], "role") !== "img") warn("<svg> neither aria-hidden nor labelled");

  const types = [];
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      const nodes = (j["@graph"] ?? [j]).flat();
      if (!String(j["@context"] ?? "").includes("schema.org")) err("JSON-LD without a schema.org @context");
      for (const n of nodes) types.push(...[n["@type"]].flat());
      for (const n of nodes) {
        if (n["@type"] === "BreadcrumbList") n.itemListElement?.forEach((it, i) => { if (it.position !== i + 1 || !it.name || !it.item) err(`BreadcrumbList item ${i + 1} is incomplete`); });
        if ([n["@type"]].flat().includes("SoftwareApplication")) {
          for (const k of ["name", "description", "applicationCategory", "operatingSystem", "softwareVersion", "url"]) if (!n[k]) err(`SoftwareApplication missing ${k}`);
          if (n.aggregateRating || n.review) err("SoftwareApplication carries ratings/reviews (not sourced)");
        }
        if (n["@type"] === "TechArticle") for (const k of ["headline", "description", "url", "isPartOf"]) if (!n[k]) err(`TechArticle missing ${k}`);
      }
    } catch (e) { err(`JSON-LD does not parse: ${e.message}`); }
  }
  for (const t of expectTypes(rel)) if (!types.includes(t)) err(`missing JSON-LD ${t}`);
  rows.push({ page: `${base}${rel}`, h1, title, types: [...new Set(types)].join(",") });
}
for (const k of ["title", "description"]) for (const [v, where] of seen[k]) if (where.length > 1) errors.push(`duplicate ${k} on ${where.map((r) => base + r).join(", ")}: "${v.slice(0, 60)}"`);

const robots = path.join(dist, "robots.txt");
if (!fs.existsSync(robots)) errors.push("robots.txt missing");
else if (!/^Sitemap:\s*https?:\/\//im.test(fs.readFileSync(robots, "utf8"))) errors.push("robots.txt has no Sitemap line");
const maps = walk(dist).filter((f) => /sitemap.*\.xml$/.test(f));
if (!maps.length) errors.push("sitemap missing");
else {
  const locs = new Set(maps.flatMap((f) => [...fs.readFileSync(f, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])));
  for (const r of rows) if (!locs.has(site + r.page)) errors.push(`${r.page}: not in the sitemap`);
}

console.log(`SEO: ${rows.length} pages checked`);
for (const r of rows.filter((r) => !r.page.includes("/docs/") || /\/docs\/$/.test(r.page))) console.log(`  ${r.page.padEnd(22)} h1=${r.h1}  ${r.types.padEnd(44)} ${r.title}`);
console.log(`  … and ${rows.filter((r) => r.page.includes("/docs/") && !/\/docs\/$/.test(r.page)).length} docs pages`);
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(errors.length ? `FAILED: ${errors.length} error(s), ${warnings.length} warning(s)` : `OK (${warnings.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
