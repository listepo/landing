// Site-wide constants and helpers.

/** Prefix an internal path with the configured base (`/shop-mvp/`). */
export function u(path = "/"): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Storefront name (neutral; the marketplace sells several tools). */
export const BRAND = "listepo tools";

/**
 * PLACEHOLDER Pro tiers per tool. Frontmatter `pro_price` overrides the price.
 * Nothing here is a real offer: prices and Pro features are invented for the MVP.
 */
export const PRO: Record<string, { price: string; features: string[] }> = {
  rtok: { price: "$9 / mo", features: ["Team-wide ledger sync", "Hosted savings dashboard", "Priority support"] },
  cox: { price: "$15 / mo", features: ["Shared session history", "Org permission policies", "Priority support"] },
  ketch: { price: "$6 / mo", features: ["Private package registry", "Fleet lockfile sync", "Priority support"] },
};
export const PRO_FALLBACK = { price: "$9 / mo", features: ["Team features", "Hosted dashboard", "Priority support"] };

/** Short real "free" highlights per tool for the pricing table (from each project's site copy). */
export const FREE_HIGHLIGHTS: Record<string, string[]> = {
  rtok: ["Hooks, MCP server and API proxy", "Lossless archive with rtok expand", "Local stats and doctor"],
  cox: ["Terminal UI and headless runs", "Sandboxed tools by default", "Local cost ledger"],
  ketch: ["Install from any GitHub release", "SHA-256 verification", "Rollback, lock and sync"],
};

/** One license wording for all three projects (rtok, cox and ketch share the same triple license). */
export const LICENSE = {
  short: "GPLv3, royalty-free or commercial — your choice",
  items: [
    { name: "GNU GPLv3", text: "free for open-source applications on any platform, including embedded systems." },
    { name: "Royalty-free license", text: "free for proprietary desktop, mobile and web applications, as long as you disclose that your application uses the project. Embedded systems are not covered." },
    { name: "Commercial license", text: "for proprietary applications, including embedded systems, without the attribution requirement." },
  ],
};

export type ThemeKey = "home" | "rtok" | "cox" | "ketch";

export interface Theme {
  accent: string;
  accent2: string;
  accentLight: string;
  bg: string;
  /** Image folder under public/images/ */
  images: string;
  heroAlt: string;
}

/** Page themes. Frontmatter `accent`, `accent2`, `accentLight` override these for project pages. */
export const THEMES: Record<ThemeKey, Theme> = {
  home: { accent: "#4C8DFF", accent2: "#3EE6C4", accentLight: "#2F6BDB", bg: "#070910", images: "home", heroAlt: "" },
  rtok: { accent: "#5CE1FF", accent2: "#FF6B4A", accentLight: "#0B7FA0", bg: "#06101A", images: "rtok", heroAlt: "" },
  cox: { accent: "#A8E06C", accent2: "#6FD6B4", accentLight: "#3D8B3A", bg: "#070B09", images: "cox", heroAlt: "" },
  ketch: { accent: "#3DDCB0", accent2: "#5CC8FF", accentLight: "#0F6F5C", bg: "#06100F", images: "ketch", heroAlt: "" },
};

/** README facts the synced site copy does not carry but the page must keep. Source: each repo's README.md.
 *  (cox's "under active development, APIs not stable" status is already in its synced Overview and the hero status card.) */
export const CAVEATS: Partial<Record<ThemeKey, string>> = {
  rtok: "From the README: estimates are a chars-per-token heuristic until matched with provider usage, and no live A/B cost reduction has been established yet.",
};
