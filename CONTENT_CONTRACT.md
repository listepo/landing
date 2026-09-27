# Content contract — `content/projects/<slug>.md`

Each product in the catalog (home grid, Products menu, footer, pricing) and its showcase page is generated from one Markdown file in `content/projects/`. The files are
**synced** from each project's `docs/site.md` (see `content/projects/README.md`): do not edit them here.

The file name is the slug and the URL: `content/projects/rtok.md` → `<base>rtok/` (base defaults to `/landing/`, override with `SITE_BASE`)
(route `src/pages/[slug].astro`). The schema lives in `src/content.config.ts`; `npm run build` fails on a
violation. `content/projects/README.md` is excluded from the collection.

## Frontmatter

| Field | Required | Type | Rule |
| --- | --- | --- | --- |
| `title` | yes | string | Project name as the repository spells it |
| `tagline` | yes | string, ≤ 160 chars | One-sentence pitch |
| `repo` | yes | URL | Starts with `https://github.com/` |
| `homepage` | no | URL | The project's own documentation site (renders a “Documentation” button) |
| `install` | yes | string | Primary install command, one line (hero install block with copy button) |
| `install_alternatives` | no | list of strings | Other install commands, README order (the home card prefers a `ketch install …` one) |
| `version` | yes | semver, no `v` | Latest published release |
| `accent` | yes | `#RRGGBB` | Dark-theme accent of the project's own site → page `--accent` |
| `accent2` | no | `#RRGGBB` | Second accent (e.g. rtok coral `#FF6B4A`) → page `--accent-2` |
| `accentLight` | no | `#RRGGBB` | Darker accent for light surfaces (e.g. cox `#3D8B3A`, ketch `#0F6F5C`) → `--accent-light` |
| `pro_price` | no | string, ≤ 24 chars | Pro price label override (**placeholder**; default from `PRO` in `src/lib/site.ts`) |
| `featured` | no | boolean | Show this product in the home “Featured tool” slot (first `true` wins, else the first by `order`) |
| `order` | no | integer | Catalog order (ascending; ties by title) |

When `accent2` / `accentLight` are missing, the page falls back to the theme table in `src/lib/site.ts`.

## Body

An HTML comment naming the source, then these H2 sections, in this order:

1. `## Overview` — one or two paragraphs, including any status caveat. Rendered as prose.
2. `## Features` — bullets `- **Name.** Description.` → one glass card per bullet.
3. `## Install` — primary command first, then alternatives in fenced blocks → each block gets a copy button.
4. `## Usage examples` (or `## Usage`) — a paragraph caption followed by a fenced block, repeated → usage cards.
5. `## Links` — `- Label: <https://…>` bullets → link tiles.

## Adding a product

1. Add `content/projects/<slug>.md` following this contract. The catalog, Products menu, footer and pricing
   pick it up automatically; the showcase terminal is built from its `## Usage examples` code blocks.
2. Optional polish: a scripted terminal in `DEMOS` / a flow in `FLOWS` (`src/data/showcase.ts`), a theme in
   `THEMES`, Pro placeholder copy in `PRO` and free highlights in `FREE_HIGHLIGHTS` (`src/lib/site.ts`), and
   art in `public/images/<slug>/` (`hero-*`, `prop-*`, `og.jpg`; see `art/`).

## Site rules

- **License:** the page ignores the `License:` bullet in `## Links` and renders one shared license block for
  every project: GNU GPLv3, a royalty-free license (proprietary desktop, mobile and web apps with
  attribution), or a commercial license — at your choice (`LICENSE` in `src/lib/site.ts`).
- **README caveats** the synced copy lacks are kept in `CAVEATS` in `src/lib/site.ts` (e.g. rtok: no live
  A/B cost reduction has been established yet).
- **Pro tiers are placeholders:** every Pro price and Pro feature is labelled “Placeholder” on the site.
- Facts come only from the project's own README / site copy. Never invent features, stars, download
  counts, benchmarks or testimonials.
- English only; inline code for commands, flags and paths.
