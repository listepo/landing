// Product documentation pages, built from content/docs/<product>/ — a copy of each product
// repository's docs/ folder that the product's sync-docs workflow keeps up to date
// (see content/docs/README.md). Navigation, titles and exclusions: src/data/docs-nav.json.
import { Marked, type Tokens } from "marked";
import nav from "../data/docs-nav.json";
import { u } from "./site";
import { safeHref, safeHtml } from "./html";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Raw Markdown of every synced doc, keyed by `/content/docs/<product>/<path>.md`. */
const RAW = import.meta.glob<string>("/content/docs/*/**/*.md", { query: "?raw", import: "default", eager: true });
/** Where each product's copy came from (written by the sync). */
const SOURCES = import.meta.glob<{ repo: string; sha: string; ref: string }>("/content/docs/*/_source.json", {
  import: "default",
  eager: true,
});

interface NavItem { file?: string; page?: string; title?: string; summary?: string }
interface NavGroup { label: string; items: NavItem[] }
interface ProductNav { groups: NavGroup[]; exclude?: Record<string, string> }
const NAV = nav as unknown as Record<string, ProductNav>;

export interface TocEntry { id: string; text: string; depth: 2 | 3 }
export interface DocPage {
  product: string;
  /** URL segment: `/<product>/docs/<slug>/`. */
  slug: string;
  title: string;
  /** Short title for tabs. */
  navTitle: string;
  group: string;
  /** Path inside the product's docs/ folder, or null for a site-authored page. */
  file: string | null;
  /** First paragraph of the doc as plain text (for cards and meta description). */
  summary: string;
  html: string;
  toc: TocEntry[];
  sourceUrl: string | null;
}
export interface ProductDocs {
  product: string;
  source: { repo: string; sha: string; ref: string } | null;
  pages: DocPage[];
  groups: { label: string; pages: DocPage[] }[];
  /** Synced files that intentionally have no page, with the reason. */
  excluded: { file: string; reason: string }[];
}

/** File path inside docs/ → URL slug: `design/loop.md` → `design-loop`, `COMMANDS.md` → `commands`. */
export const slugOf = (file: string) => file.replace(/\.md$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** GitHub-style heading id (matches the anchors the docs already link to). */
export function makeSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    // HTML tags are dropped, but text inside code spans is literal (`<NAME>` stays "name"),
    // as on GitHub, so the anchors the docs link to keep resolving.
    const base = text
      .split(/(`+[^`]*`+)/)
      .map((part) => (part.startsWith("`") ? part.replace(/`/g, "") : part.replace(/<[^>]+>/g, "")))
      .join("")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .trim()
      .replace(/\s/g, "-");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

const posixJoin = (dir: string, rel: string) => {
  const out: string[] = dir ? dir.split("/") : [];
  for (const part of rel.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
};

const SHELL = new Set(["bash", "sh", "shell", "zsh", "console", "powershell", "ps1", "pwsh"]);

/** Docs code block: shell prompts only for shell languages, a language tag, and the shared copy button. */
export function docCodeBlock(text: string, lang = ""): string {
  const shell = SHELL.has(lang);
  const lines = text.replace(/\n$/, "").split("\n").map((line) => {
    if (!shell) return esc(line);
    if (/^\s*#/.test(line)) return `<span class="tok-c">${esc(line)}</span>`;
    const m = line.match(/^(.*?)(\s+#\s.*)$/);
    return m ? `${esc(m[1])}<span class="tok-c">${esc(m[2])}</span>` : esc(line);
  });
  const label = lang ? `${lang} code` : "code";
  return `<div class="codeblock codeblock--doc"${lang ? ` data-lang="${esc(lang)}"` : ""}>
  <pre class="code" tabindex="0" role="group" aria-label="${esc(label)}"><code>${lines.join("\n")}</code></pre>
  <button class="copy" type="button" data-copy="${esc(text.replace(/\n$/, ""))}" hidden>
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 10.5V4a1.5 1.5 0 0 1 1.5-1.5H10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <span class="copy__label">Copy</span><span class="sr-only"> ${esc(label)}</span>
  </button>
</div>`;
}

const plain = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** First prose paragraph (after the H1, else after the first H2), cut at a sentence near 200 chars. */
function summarize(body: string): string {
  const blocks = body.replace(/<!--[\s\S]*?-->/g, "").replace(/```[\s\S]*?```/g, "\n\n").split(/\n\s*\n/);
  const para = blocks.map((b) => b.trim()).find((b) => b && !/^(#|\||-|\*|\d+\.|>|<)/.test(b));
  if (!para) return "";
  const text = plain(para).replace(/:$/, ".");
  if (text.length <= 220) return text;
  const cut = text.slice(0, 220);
  const dot = cut.search(/[.!?](?=\s)[^.!?]*$/);
  return dot > 80 ? cut.slice(0, dot + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}

function isExcluded(file: string, exclude: Record<string, string> = {}): string | null {
  for (const [pattern, reason] of Object.entries(exclude)) {
    if (pattern.endsWith("/") ? file.startsWith(pattern) : pattern.endsWith(".md") ? file === pattern : file.startsWith(pattern)) return reason;
  }
  return null;
}

const cache = new Map<string, ProductDocs>();

export function productsWithDocs(): string[] {
  return Object.keys(NAV).filter((p) => !p.startsWith("$")).filter((p) => Object.keys(RAW).some((k) => k.startsWith(`/content/docs/${p}/`)) || NAV[p].groups.some((g) => g.items.some((i) => i.page)));
}

export function getProductDocs(product: string): ProductDocs {
  const hit = cache.get(product);
  if (hit) return hit;
  const cfg = NAV[product] ?? { groups: [] };
  const prefix = `/content/docs/${product}/`;
  const files = Object.keys(RAW).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)).sort();
  const source = SOURCES[`${prefix}_source.json`] ?? null;
  const excluded: { file: string; reason: string }[] = [];
  const listed = new Set(cfg.groups.flatMap((g) => g.items.map((i) => i.file).filter(Boolean) as string[]));
  const pageFiles = new Set<string>();
  for (const f of files) {
    const reason = isExcluded(f, cfg.exclude);
    if (reason && !listed.has(f)) excluded.push({ file: f, reason });
    else pageFiles.add(f);
  }
  const fileToSlug = new Map([...pageFiles].map((f) => [f, slugOf(f)]));

  const groups: ProductDocs["groups"] = [];
  const pages: DocPage[] = [];
  const addGroup = (label: string, items: NavItem[]) => {
    const g = { label, pages: [] as DocPage[] };
    for (const it of items) {
      let page: DocPage | null = null;
      if (it.page) {
        page = { product, slug: it.page, title: it.title ?? it.page, navTitle: it.title ?? it.page, group: label, file: null, summary: it.summary ?? "", html: "", toc: [], sourceUrl: null };
      } else if (it.file && pageFiles.has(it.file)) {
        page = renderDoc(product, it.file, RAW[prefix + it.file], label, it.title, fileToSlug, source);
        if (it.summary) page.summary = it.summary;
      }
      if (page) { g.pages.push(page); pages.push(page); }
    }
    if (g.pages.length) groups.push(g);
  };
  for (const g of cfg.groups) addGroup(g.label, g.items);
  // Docs added upstream but not yet placed in docs-nav.json still get a page.
  const unplaced = [...pageFiles].filter((f) => !listed.has(f)).map((file) => ({ file }));
  if (unplaced.length) addGroup("More", unplaced);

  const out = { product, source, pages, groups, excluded };
  cache.set(product, out);
  return out;
}

function renderDoc(
  product: string,
  file: string,
  raw: string,
  group: string,
  navTitle: string | undefined,
  fileToSlug: Map<string, string>,
  source: ProductDocs["source"],
): DocPage {
  const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : "";
  const repo = source?.repo ?? `pyrlyn/${product}`;
  const ref = source?.sha ?? "main";
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
  const h1 = body.match(/^#\s+(.+)$/m);
  const title = h1 ? plain(h1[1]) : navTitle ?? file;
  const rest = h1 ? body.replace(h1[0], "") : body;
  const slugger = makeSlugger();
  const toc: TocEntry[] = [];
  // Scrollable tables are named regions; name each after the section it sits in, and keep the
  // names unique on the page (screen readers list regions by name).
  let section = title;
  const tableNames = new Map<string, number>();
  const tableName = () => {
    const n = (tableNames.get(section) ?? 0) + 1;
    tableNames.set(section, n);
    return n > 1 ? `${section} table ${n}` : `${section} table`;
  };

  const resolveHref = (raw: string): string => {
    const href = safeHref(raw);
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    const [pathPart, hash = ""] = href.split("#");
    const target = posixJoin(dir, decodeURI(pathPart));
    const anchor = hash ? `#${hash}` : "";
    const docTarget = target.replace(/\/$/, "");
    if (fileToSlug.has(docTarget)) return u(`/${product}/docs/${fileToSlug.get(docTarget)}/`) + anchor;
    // Anything else (source files, excluded docs, folders) lives in the repository.
    const repoPath = target.startsWith("..") ? target : posixJoin("docs", target);
    const clean = posixJoin("", repoPath);
    const kind = pathPart.endsWith("/") || !/\.[a-z0-9]+$/i.test(pathPart) ? "tree" : "blob";
    return `https://github.com/${repo}/${kind}/${ref}/${clean}${anchor}`;
  };

  const md = new Marked({ gfm: true });
  md.use({
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const id = slugger(text);
        const d = Math.min(Math.max(depth, 2), 6);
        if (d === 2 || d === 3) toc.push({ id, text: plain(text), depth: d as 2 | 3 });
        section = plain(text);
        return `<h${d} id="${esc(id)}" class="doc-h"><a class="doc-anchor" href="#${esc(id)}" aria-label="Link to this section"></a>${inner}</h${d}>\n`;
      },
      code({ text, lang }: Tokens.Code) {
        return docCodeBlock(text, (lang ?? "").split(/\s/)[0]);
      },
      link({ href, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens);
        const out = resolveHref(href);
        const ext = /^https?:/.test(out);
        return `<a href="${esc(out)}"${ext ? ' rel="noopener"' : ""}>${text}</a>`;
      },
      image({ href, text }: Tokens.Image) {
        if (safeHref(href) !== href) return esc(text);
        const src = /^https?:/.test(href) ? href : `https://raw.githubusercontent.com/${repo}/${ref}/${posixJoin("docs/" + dir, href)}`;
        return `<img src="${esc(src)}" alt="${esc(text)}" loading="lazy" decoding="async">`;
      },
      table(token: Tokens.Table) {
        const head = token.header.map((c) => `<th${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</th>`).join("");
        const rows = token.rows.map((r) => `<tr>${r.map((c) => `<td${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`).join("");
        return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(tableName())}"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
      },
      html({ text }: Tokens.HTML | Tokens.Tag) {
        return safeHtml(text);
      },
      blockquote({ tokens }: Tokens.Blockquote) {
        let inner = this.parser.parse(tokens);
        const m = inner.match(/^<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
        const kind = m ? m[1].toLowerCase() : "note";
        if (m) inner = inner.replace(m[0], "<p>");
        const label = m ? m[1][0] + m[1].slice(1).toLowerCase() : "";
        return `<aside class="callout callout--${kind}">${label ? `<p class="callout__label">${label}</p>` : ""}${inner}</aside>`;
      },
    },
  });
  const html = md.parse(rest, { async: false }) as string;
  const slug = fileToSlug.get(file)!;
  return {
    product,
    slug,
    title,
    navTitle: navTitle ?? title,
    group,
    file,
    summary: summarize(rest),
    html,
    toc,
    sourceUrl: `https://github.com/${repo}/blob/${source?.ref ?? "main"}/docs/${file}`,
  };
}

/** Site path of a docs page. */
export const docsHref = (product: string, slug?: string) => u(slug ? `/${product}/docs/${slug}/` : `/${product}/docs/`);
