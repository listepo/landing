# listepo tools — AI developer tool storefront

A marketplace landing for AI developer tools, built with [Astro](https://astro.build) and deployed to
GitHub Pages. The home page is the storefront (catalog, featured tool, how it works, per-tool pricing,
FAQ); every product gets its own showcase page generated from one Markdown file.

Live: https://listepo.github.io/landing/ — pages `/landing/rtok/`, `/landing/cox/`, `/landing/ketch/`.

> The previous site in this repository is preserved in branch and tag `archive/toha-landing-2026-09-27`.

## Run

```sh
npm i
npm run dev       # http://localhost:4321/landing/
npm run build     # static site in dist/
npm run preview   # serve dist
```

`astro.config.mjs` reads `SITE_URL` (default `https://listepo.github.io`) and `SITE_BASE` (default
`/landing/`). Every internal link and asset goes through `u()` in `src/lib/site.ts`, so moving the site is a
one-line change. `.github/workflows/pages.yml` builds and deploys on every push to `main`.

## Structure

- `content/projects/*.md` — one file per product (frontmatter + README-derived sections). See
  [`CONTENT_CONTRACT.md`](CONTENT_CONTRACT.md). Adding a file adds the product to the catalog, the
  Products menu, the footer, pricing and a new `/<slug>/` page.
- `src/pages/index.astro` — storefront; `src/pages/[slug].astro` — product showcase template.
- `src/components/` — `Terminal` (animated demo of real README commands), `TokenBitset` (rtok),
  `Flow` (cox event stream, ketch install/rollback), `Picture`, `Icon`.
- `src/data/showcase.ts` — terminal scripts and flow steps; `src/lib/site.ts` — brand, themes, license,
  caveats, Pro placeholders; `src/lib/catalog.ts` — collection helpers.
- `src/styles/global.css` — the design system; `src/scripts/main.ts` — progressive enhancement.
- `art/` — scripts that draw the 11 images in `public/images/` (4 hero, 3 props, 4 OG cards) as SVG,
  render them with headless Chrome and encode AVIF/WebP/JPEG with sharp.

## Design system

Dark-first depth: near-black blue-tinted background, CSS gradient mesh from each page accent
(`color-mix`/`oklch`, grain, faint grid, slow drift, scroll-driven parallax where `animation-timeline` is
supported), glass surfaces (hairline + top highlight + bottom edge, blur tiers 2/10/36px), three-level
shadow stacks, cursor-follow shine, two-ring focus. Per page accents: home `#4C8DFF`/`#3EE6C4`, rtok
`#5CE1FF`/`#FF6B4A` on navy `#06101A`, cox `#A8E06C`, ketch `#3DDCB0`.

Accessibility: AA contrast, skip link, 44px targets, keyboard hotspots and menu (Esc closes), content
visible without JS, opaque fallbacks for `prefers-reduced-transparency` and missing `backdrop-filter`,
`prefers-reduced-motion` stops drift, float, tilt, typing and parallax.

## Placeholders

All Pro tiers, Pro prices, Pro features and the waitlist buttons are **placeholders** and are labelled on
the page. Product facts (features, install commands, versions, terminal commands) come only from each
tool's own README / site copy. Licensing for every tool: GNU GPLv3, a royalty-free license, or a
commercial license — your choice.
