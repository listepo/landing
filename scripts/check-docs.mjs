#!/usr/bin/env node
// Post-build check for the docs pages (run after `astro build`):
//  1. coverage — every synced file in content/docs/<product>/ has a page in dist/ or an explicit
//     exclusion in src/data/docs-nav.json; every site-authored page exists;
//  2. headings — every doc page has one <h1>, and every ## / ### heading of the source Markdown
//     is rendered with a unique id;
//  3. links — every internal href/src in every built page stays under the site base and resolves
//     to a built file, and every #fragment exists on its target page.
// Exit code 1 on any error. Usage: node scripts/check-docs.mjs [distDir]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dist = path.resolve(root, process.argv[2] ?? "dist");
const base = (process.env.SITE_BASE ?? "/landing/").replace(/\/?$/, "/");
const nav = JSON.parse(fs.readFileSync(path.join(root, "src/data/docs-nav.json"), "utf8"));
const errors = [];
const warnings = [];

const slugOf = (f) => f.replace(/\.md$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isExcluded = (f, ex = {}) =>
  Object.entries(ex).find(([p]) => (p.endsWith("/") ? f.startsWith(p) : p.endsWith(".md") ? f === p : f.startsWith(p)))?.[1] ?? null;
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])) : []);
const read = (f) => fs.readFileSync(f, "utf8");
/** Markdown lines outside fenced code blocks (CommonMark rules: a closing fence has no info string). */
function outsideFences(md) {
  const out = [];
  let open = null;
  for (const line of md.split("\n")) {
    const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (open) {
      if (m && m[1][0] === open[0] && m[1].length >= open.length && !m[2].trim()) open = null;
      continue;
    }
    if (m && !(m[1][0] === "`" && m[2].includes("`"))) { open = m[1]; continue; }
    out.push(line);
  }
  return out.join("\n");
}
const pageFile = (p, slug) => path.join(dist, p, "docs", slug, "index.html");

// ---------- 1 + 2: coverage and headings ----------
const summary = {};
for (const [product, cfg] of Object.entries(nav)) {
  if (product.startsWith("$")) continue;
  const srcDir = path.join(root, "content/docs", product);
  const files = walk(srcDir).filter((f) => f.endsWith(".md")).map((f) => path.relative(srcDir, f).split(path.sep).join("/")).sort();
  const listed = new Set(cfg.groups.flatMap((g) => g.items.map((i) => i.file).filter(Boolean)));
  const s = (summary[product] = { synced: files.length, fromDocs: 0, authored: 0, excluded: 0, overview: 0, headings: 0 });
  if (!files.length) warnings.push(`${product}: content/docs/${product}/ is missing or empty`);
  if (!fs.existsSync(path.join(srcDir, "_source.json"))) warnings.push(`${product}: content/docs/${product}/_source.json is missing`);
  if (fs.existsSync(path.join(dist, product, "docs", "index.html"))) s.overview = 1;
  else errors.push(`${product}: overview page ${base}${product}/docs/ was not built`);

  for (const item of cfg.groups.flatMap((g) => g.items)) {
    if (item.file && !files.includes(item.file)) warnings.push(`${product}: docs-nav.json lists ${item.file}, which is not in the synced docs`);
    if (item.page) {
      if (fs.existsSync(pageFile(product, item.page))) s.authored++;
      else errors.push(`${product}: site-authored page ${item.page} was not built`);
    }
  }
  for (const f of files) {
    const reason = isExcluded(f, cfg.exclude);
    if (reason && !listed.has(f)) { s.excluded++; continue; }
    if (!listed.has(f)) warnings.push(`${product}: ${f} is not placed in docs-nav.json (rendered under "More")`);
    const out = pageFile(product, slugOf(f));
    if (!fs.existsSync(out)) { errors.push(`${product}: ${f} has no page (${path.relative(dist, out)})`); continue; }
    s.fromDocs++;
    const html = read(out);
    const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1 !== 1) errors.push(`${product}: ${f} renders ${h1} <h1> elements`);
    const md = outsideFences(read(path.join(srcDir, f)));
    const want = (md.match(/^#{2,3}\s+\S/gm) ?? []).length;
    const got = (html.match(/<h[23] id="[^"]+" class="doc-h"/g) ?? []).length;
    s.headings += got;
    if (want !== got) errors.push(`${product}: ${f} has ${want} ## / ### headings but the page renders ${got}`);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) errors.push(`${product}: ${f} has duplicate ids: ${[...new Set(dup)].join(", ")}`);
  }
}

// ---------- 3: links ----------
const htmlFiles = walk(dist).filter((f) => f.endsWith(".html"));
const idCache = new Map();
const idsOf = (file) => {
  if (!idCache.has(file)) idCache.set(file, new Set([...read(file).matchAll(/\sid="([^"]+)"/g)].map((m) => decodeURIComponent(m[1]))));
  return idCache.get(file);
};
const resolveTarget = (urlPath) => {
  const rel = decodeURIComponent(urlPath.slice(base.length));
  const cand = rel === "" || rel.endsWith("/") ? path.join(dist, rel, "index.html") : path.join(dist, rel);
  if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
  const asDir = path.join(dist, rel, "index.html");
  return fs.existsSync(asDir) ? asDir : null;
};
let internal = 0, external = 0, fragments = 0;
for (const file of htmlFiles) {
  const html = read(file).replace(/<script[\s\S]*?<\/script>/g, "");
  const page = "/" + path.relative(dist, file).split(path.sep).join("/").replace(/index\.html$/, "");
  for (const m of html.matchAll(/\s(href|src|srcset)="([^"]*)"/g)) {
    const [, attr, raw] = m;
    const urls = attr === "srcset" ? raw.split(",").map((s) => s.trim().split(/\s+/)[0]) : [raw];
    for (const url0 of urls) {
      const url = url0.replace(/&amp;/g, "&");
      if (!url || /^(https?:|mailto:|data:)/.test(url)) { if (/^https?:/.test(url)) external++; continue; }
      if (url.startsWith("#")) {
        fragments++;
        if (url.length > 1 && !idsOf(file).has(decodeURIComponent(url.slice(1)))) errors.push(`${page}: broken fragment ${url}`);
        continue;
      }
      if (!url.startsWith("/")) { errors.push(`${page}: relative ${attr} "${url}" breaks under the ${base} base`); continue; }
      if (!url.startsWith(base)) { errors.push(`${page}: ${attr} "${url}" is outside the ${base} base`); continue; }
      internal++;
      const [p, hash] = url.split("#");
      const target = resolveTarget(p.split("?")[0]);
      if (!target) { errors.push(`${page}: broken link ${url}`); continue; }
      if (hash) {
        fragments++;
        if (!idsOf(target).has(decodeURIComponent(hash))) errors.push(`${page}: broken fragment ${url}`);
      }
    }
  }
}

// ---------- report ----------
let total = 0;
console.log("Docs pages per product (overview + synced docs + site-authored):");
for (const [p, s] of Object.entries(summary)) {
  const n = s.overview + s.fromDocs + s.authored;
  total += n;
  console.log(`  ${p.padEnd(6)} ${String(n).padStart(3)} pages = ${s.overview} overview + ${s.fromDocs} from docs + ${s.authored} site-authored · ${s.synced} synced files, ${s.excluded} excluded · ${s.headings} headings`);
}
console.log(`  total  ${String(total).padStart(3)} pages`);
console.log(`Links: ${htmlFiles.length} HTML files, ${internal} internal links, ${fragments} fragments checked, ${external} external links skipped`);
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(errors.length ? `FAILED with ${errors.length} error(s)` : "OK");
process.exit(errors.length ? 1 : 0);
