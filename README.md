# listepo tools — AI developer tool storefront

A marketplace landing for AI developer tools, built with [Astro](https://astro.build) and deployed to
GitHub Pages. The home page is the storefront (catalog, featured tool, how it works, per-tool pricing,
FAQ); every product gets its own showcase page generated from one Markdown file, and a docs section
generated from the product's own `docs/` folder.

Live: https://listepo.github.io/landing/ — showcase pages `/landing/rtok/`, `/landing/cox/`,
`/landing/ketch/`; docs under `/landing/<product>/docs/` (overview) and `/landing/<product>/docs/<slug>/`.

> The previous site in this repository is preserved in branch and tag `archive/toha-landing-2026-09-27`.

## Run

```sh
npm i
npm run dev       # http://localhost:4321/landing/
npm run build     # static site in dist/
npm run check:docs  # after a build: docs coverage, headings, internal links under the base
npm run check:seo   # after a build: title/description/canonical/OG per page, one h1, alt, JSON-LD, sitemap
npm run preview   # serve dist
```

`astro.config.mjs` reads `SITE_URL` (default `https://listepo.github.io`) and `SITE_BASE` (default
`/landing/`). Every internal link and asset goes through `u()` in `src/lib/site.ts`, so moving the site is a
one-line change. `.github/workflows/pages.yml` builds, runs `check:docs` and `check:seo` and deploys on every push to
`main`; pull requests run the build and the check without deploying.

## Structure

- `content/projects/*.md` — one file per product (frontmatter + README-derived sections). See
  [`CONTENT_CONTRACT.md`](CONTENT_CONTRACT.md). Adding a file adds the product to the catalog, the
  Products menu, the footer, pricing and a new `/<slug>/` page.
- `content/docs/<product>/**/*.md` — the product's `docs/` folder, synced from its repository together
  with `_source.json` (repo, commit). See [`content/docs/README.md`](content/docs/README.md).
- `src/pages/index.astro` — storefront; `src/pages/[slug].astro` — product showcase template (text from
  the README-derived `content/projects/<slug>.md`).
- `src/pages/[slug]/docs/index.astro` — docs overview per product (copy in `src/data/docs-overview.ts`,
  facts only from the product's docs/README); `src/pages/[slug]/docs/[doc].astro` — one page per synced
  doc, plus site-authored pages such as `src/components/docs/KetchGettingStarted.astro`.
- `src/lib/docs.ts` — reads the synced docs at build time, renders Markdown (heading ids matching
  GitHub's, internal `.md` links rewritten to site pages, other relative links pinned to the synced
  commit on GitHub), builds the TOC and summaries; `src/data/docs-nav.json` — tab order, titles,
  groups and exclusions; `src/layouts/DocsLayout.astro` + `src/components/DocsNav.astro` — the sticky
  horizontal docs nav, ~70ch column, on-page TOC (≥1280px) and prev/next; `src/styles/docs.css`.
- `scripts/check-docs.mjs`, `scripts/check-seo.mjs` — post-build checks run in CI.
- `src/lib/seo.ts` — titles, meta descriptions and schema.org JSON-LD (Organization/WebSite on the home
  page, SoftwareApplication + BreadcrumbList per product, TechArticle + BreadcrumbList per docs page);
  values come from the content only — no ratings, and Pro placeholder prices never reach structured data.
  `@astrojs/sitemap` writes the sitemap; `src/pages/robots.txt.ts` points to it.
- `src/components/` — `Terminal` (animated demo of real README commands), `TokenBitset` (rtok),
  `Flow` (cox event stream, ketch install/rollback), `Picture`, `Icon`.
- `src/data/showcase.ts` — terminal scripts and flow steps; `src/lib/site.ts` — brand, themes, license,
  caveats, Pro placeholders; `src/lib/catalog.ts` — collection helpers.
- `src/styles/global.css` — the design system; `src/scripts/main.ts` — progressive enhancement.
- `src/styles/tailwind.css` — Tailwind v4 (`@tailwindcss/vite`), theme + utilities only, **no preflight**,
  default theme replaced by the tokens from `global.css`. Responsive fixes go in markup as prefixed
  utilities (`tw:max-sm:px-3!`); the `tw:` prefix keeps them apart from the site's own class names
  (`.container`, `.grid`, `.ring` …), and `!` is needed where a utility must beat a rule in `global.css`
  (unlayered CSS wins over `@layer utilities`). Do not add new hand-written CSS for layout fixes.
- `art/` — scripts that draw the 11 images in `public/images/` (4 hero, 3 props, 4 OG cards) as SVG,
  render them with headless Chrome and encode AVIF/WebP/JPEG with sharp.

## Design system

Dark-first depth: near-black blue-tinted background, CSS gradient mesh from each page accent
(`color-mix`/`oklch`, grain, faint grid, slow drift, scroll-driven parallax where `animation-timeline` is
supported), glass surfaces (hairline + top highlight + bottom edge, blur tiers 2/10/36px), three-level
shadow stacks, cursor-follow shine, two-ring focus. Per page accents: home `#4C8DFF`/`#3EE6C4`, rtok
`#5CE1FF`/`#FF6B4A` on navy `#06101A`, cox `#A8E06C`, ketch `#3DDCB0`.

Docs pages keep the same system: a glass secondary nav stuck under the header (product mark, tabs with an
accent underline that slides to the hovered tab, edge fades and scroll-snap when the tabs overflow, a
"Section" disclosure on phones when there are more than 7 pages), prose at ~70ch, code blocks with copy
buttons and a "Copied" toast, tables in scrollable regions, callouts for blockquotes and GitHub alerts.

Accessibility: AA contrast, skip link, 44px targets, keyboard hotspots and menu (Esc closes), content
visible without JS, opaque fallbacks for `prefers-reduced-transparency` and missing `backdrop-filter`,
`prefers-reduced-motion` stops drift, float, tilt, typing, parallax, step reveals and hover motion.

## Placeholders

All Pro tiers, Pro prices, Pro features and the waitlist buttons are **placeholders** and are labelled on
the page. Product facts (features, install commands, versions, terminal commands) come only from each
tool's own README, docs and site copy. Licensing for every tool: GNU GPLv3, a royalty-free license, or a
commercial license — your choice.
