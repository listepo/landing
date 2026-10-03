// Guards for HTML that comes from synced Markdown (product READMEs and docs/ folders).

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Raw tags kept as HTML; everything else is shown as text. */
const SAFE_TAGS = new Set(["br", "kbd", "sub", "sup", "details", "summary", "b", "i", "em", "strong", "code"]);

/**
 * Raw HTML inside Markdown. Placeholders such as `<name>` or `<id>` written outside backticks
 * would otherwise become unknown elements: the text vanishes and the unclosed element breaks
 * the page structure. Comments are dropped; allowlisted tags pass only without attributes
 * (bar a bare `open` on <details>).
 */
export function safeHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(/<\/?([A-Za-z][\w-]*)([^<>]*)>|[<>]/g, (m, name?: string, attrs?: string) =>
      name && SAFE_TAGS.has(name.toLowerCase()) && /^(\s+open)?\s*\/?$/i.test(attrs ?? "") ? m.toLowerCase() : esc(m),
    );
}

/** Link and image targets: drop script-capable schemes (javascript:, vbscript:, data:). */
export function safeHref(href: string): string {
  const scheme = href.replace(/[\u0000-\u0020]/g, "").match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  return scheme && !["http", "https", "mailto"].includes(scheme) ? "#" : href;
}
