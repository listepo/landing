// Turns a project Markdown body into the structured pieces the page template renders.
import { Marked, type Tokens } from "marked";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Code block with an accessible copy button (button stays hidden until JS enables it). */
export function codeBlock(text: string, lang = "bash", label = "command"): string {
  const lines = text.replace(/\n$/, "").split("\n").map((line) => {
    const m = line.match(/^(.*?)(\s+#\s.*)$/);
    const body = m ? `${esc(m[1])}<span class="tok-c">${esc(m[2])}</span>` : esc(line);
    return lang === "text" ? body : `<span class="tok-p" aria-hidden="true">$ </span>${body}`;
  });
  return `<div class="codeblock">
  <pre class="code" tabindex="0" aria-label="${esc(label)}"><code data-lang="${esc(lang)}">${lines.join("\n")}</code></pre>
  <button class="copy" type="button" data-copy="${esc(text.replace(/\n$/, ""))}" hidden>
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 10.5V4a1.5 1.5 0 0 1 1.5-1.5H10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <span class="copy__label">Copy</span><span class="sr-only"> ${esc(label)}</span>
  </button>
</div>`;
}

const md = new Marked({ gfm: true });
md.use({
  renderer: {
    code({ text, lang }: Tokens.Code) {
      return codeBlock(text, lang === "powershell" ? "powershell" : lang || "bash");
    },
    link({ href, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens);
      const ext = /^https?:/.test(href);
      return `<a href="${esc(href)}"${ext ? ' rel="noopener"' : ""}>${text}</a>`;
    },
  },
});

export const renderMd = (src: string) => md.parse(src, { async: false }) as string;
export const renderInline = (src: string) => md.parseInline(src, { async: false }) as string;

/** Split the body on H2 headings. Keys are lowercased heading text. */
export function splitSections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const clean = body.replace(/<!--[\s\S]*?-->/g, "");
  const parts = clean.split(/^##\s+/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    out[part.slice(0, nl).trim().toLowerCase()] = part.slice(nl + 1).trim();
  }
  return out;
}

export interface Feature { name: string; html: string }

/** `- **Name.** description` bullets → cards. */
export function parseFeatures(src = ""): Feature[] {
  const items = src.split(/^\s*-\s+/m).map((s) => s.trim()).filter(Boolean);
  return items.map((item) => {
    const text = item.replace(/\s*\n\s*/g, " ");
    const m = text.match(/^\*\*(.+?)\*\*\s*[—–-]?\s*(.*)$/);
    const name = (m ? m[1] : text.split(".")[0]).replace(/[.:]\s*$/, "");
    return { name, html: renderInline(m ? m[2] : text) };
  });
}

export interface UsageGroup { caption: string; code: string; lang: string }

/** Paragraph followed by a code fence → captioned usage card. */
export function parseUsage(src = ""): UsageGroup[] {
  const groups: UsageGroup[] = [];
  let caption = "";
  for (const t of md.lexer(src)) {
    if (t.type === "paragraph") caption = renderInline((t as Tokens.Paragraph).text.replace(/\s*\n\s*/g, " "));
    if (t.type === "code") {
      groups.push({ caption, code: (t as Tokens.Code).text, lang: (t as Tokens.Code).lang || "bash" });
      caption = "";
    }
  }
  return groups;
}

export interface LinkItem { label: string; href: string }

/** Links bullets `Label: <url>`; the License bullet is dropped (the site renders one shared license block). */
export function parseLinks(src = ""): LinkItem[] {
  return src
    .split(/^\s*-\s+/m)
    .map((s) => s.trim().replace(/\s*\n\s*/g, " "))
    .filter((s) => s && !/^licen[cs]e/i.test(s))
    .map((s) => {
      const m = s.match(/^(.+?):\s*<?(https?:\/\/[^\s>]+)>?/) ?? s.match(/^\[(.+?)\]\((https?:\/\/[^)]+)\)/);
      return m ? { label: m[1].trim(), href: m[2] } : null;
    })
    .filter((x): x is LinkItem => !!x);
}
