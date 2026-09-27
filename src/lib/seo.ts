// SEO helpers: absolute URLs, meta text, and schema.org JSON-LD nodes.
// Every value comes from the site's content (project front matter, synced Markdown, docs pages);
// nothing here invents ratings, reviews or prices. Pro prices are placeholders and never reach
// structured data; the only offer is the free open-source edition ($0), which is real.
import { u, BRAND } from "./site";
import type { Tool } from "./catalog";

const SITE = import.meta.env.SITE;

/** Absolute URL of an internal path, under the configured base. */
export const abs = (path = "/") => new URL(u(path), SITE).href;

export const HOME_URL = () => abs("/");
export const ORG_ID = () => `${abs("/")}#organization`;
export const WEBSITE_ID = () => `${abs("/")}#website`;
export const appId = (slug: string) => `${abs(`/${slug}/`)}#software`;

/** Markdown to plain text (comments, link targets and emphasis marks dropped; literal `<id>` text kept). */
export const plain = (s = "") =>
  s.replace(/<!--[\s\S]*?-->/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_]/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** Cut text to `max` characters at a sentence end if one is late enough, else at a word boundary. */
export function clip(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const dot = cut.search(/[.!?](?=\s)[^.!?]*$/);
  return dot > max * 0.5 ? cut.slice(0, dot + 1) : `${cut.slice(0, max - 1).replace(/[\s,;:—-]+\S*$/, "")}…`;
}

/** First sentence of a Markdown block. */
export const firstSentence = (md = "") => plain(md).match(/^(.*?[.!?])(\s|$)/)?.[1] ?? "";

/** Product <title>: name + the tagline's first clause (before " — " or " with "), brand when it fits. */
export function productTitle(t: Tool): string {
  const tag = t.data.tagline.replace(/\.$/, "");
  const lead = tag.split(" — ")[0];
  const short = lead.length > 55 && lead.includes(" with ") ? lead.split(" with ")[0] : lead;
  const title = `${t.data.title} — ${short}`;
  return title.length + BRAND.length + 3 <= 65 ? `${title} · ${BRAND}` : title;
}

/** Product meta description: the tagline, plus the overview's first sentence when both fit. */
export function productDescription(t: Tool, overviewMd = ""): string {
  const tag = t.data.tagline;
  const more = firstSentence(overviewMd);
  if (more && tag.length + 1 + more.length <= 160) return `${tag} ${more}`;
  const oss = "Free and open source.";
  return tag.length + 1 + oss.length <= 160 ? `${tag} ${oss}` : clip(tag);
}

export const organization = () => ({
  "@type": "Organization",
  "@id": ORG_ID(),
  name: "listepo",
  url: HOME_URL(),
  sameAs: ["https://github.com/listepo"],
});

export const website = (description: string) => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID(),
  name: BRAND,
  url: HOME_URL(),
  description,
  inLanguage: "en",
  publisher: { "@id": ORG_ID() },
});

/** Operating systems named in the project's own Install section. */
export function operatingSystems(installMd = ""): string {
  const os = [["macOS", /macos/i], ["Linux", /linux/i], ["Windows", /windows|powershell/i]] as const;
  return os.filter(([, re]) => re.test(installMd)).map(([n]) => n).join(", ") || "macOS, Linux";
}

export function softwareApplication(t: Tool, o: { description: string; installMd?: string; features?: string[] }) {
  const d = t.data;
  const url = abs(`/${t.id}/`);
  return {
    "@type": "SoftwareApplication",
    "@id": appId(t.id),
    name: d.title,
    description: o.description,
    url,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Command-line tool",
    operatingSystem: operatingSystems(o.installMd),
    softwareVersion: d.version,
    image: abs(`/images/${t.id}/og.jpg`),
    downloadUrl: `${d.repo}/releases`,
    installUrl: `${url}#install`,
    ...(o.features?.length ? { featureList: o.features } : {}),
    isAccessibleForFree: true,
    // The free open-source edition is a real $0 offer; Pro prices are placeholders and are left out.
    offers: { "@type": "Offer", name: "Free · open source", price: "0", priceCurrency: "USD", url: `${url}#pricing` },
    publisher: { "@id": ORG_ID() },
    sameAs: [d.repo, ...(d.homepage ? [d.homepage] : [])],
    mainEntityOfPage: url,
  };
}

/** The same product as source code, so the GitHub repository is linked as `codeRepository`. */
export const sourceCode = (t: Tool) => ({
  "@type": "SoftwareSourceCode",
  "@id": `${abs(`/${t.id}/`)}#source`,
  name: `${t.data.title} source code`,
  codeRepository: t.data.repo,
  programmingLanguage: "Rust",
  targetProduct: { "@id": appId(t.id) },
});

export const breadcrumbs = (items: { name: string; url: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
});

export function techArticle(t: Tool, o: { headline: string; description: string; url: string; sourceUrl?: string | null; section?: string }) {
  return {
    "@type": "TechArticle",
    "@id": `${o.url}#article`,
    headline: o.headline.slice(0, 110),
    description: o.description,
    url: o.url,
    mainEntityOfPage: o.url,
    inLanguage: "en",
    image: abs(`/images/${t.id}/og.jpg`),
    ...(o.section ? { articleSection: o.section } : {}),
    about: { "@type": "SoftwareApplication", "@id": appId(t.id), name: t.data.title, url: abs(`/${t.id}/`) },
    isPartOf: { "@id": WEBSITE_ID() },
    publisher: { "@id": ORG_ID() },
    ...(o.sourceUrl ? { isBasedOn: o.sourceUrl } : {}),
  };
}

/** Wrap nodes in one schema.org graph. */
export const graph = (nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
