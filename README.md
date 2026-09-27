# landing

A small, dependency-light landing page that demonstrates the **"3D aesthetics"** web design trend popularised by sites like Linear, Vercel and Arc: depth, glassmorphism, soft layered shadows, floating layers with subtle parallax / mouse tilt, and an animated gradient-mesh background — plus a tiny real-time WebGL object.

The content is a fictional dev-tool product called **Lumen** (generic hero, features, how-it-works, pricing, CTA). It is a design demo, not a real product.

## Stack
- [Vite](https://vite.dev) 8 + vanilla **TypeScript** (no framework)
- [OGL](https://github.com/oframe/ogl) — minimal WebGL library for the hero torus (lazy-loaded)
- Everything else is plain modern CSS

## Techniques used
| Technique | Where |
|---|---|
| Animated gradient mesh via `@property`-registered percentages driving `radial-gradient` positions, blurred + grain overlay | `.bg__mesh`, `.bg__grain` in `src/style.css` |
| Glassmorphism: translucent gradient fill, 1px light border, inset top highlight, `backdrop-filter: blur() saturate()` with an opaque fallback | `.glass` |
| Layered soft shadows (3–4 stacked shadows per elevation) + colored glows | `--shadow-sm/md/lg`, `--glow` |
| Floating layers: `@property --float` keyframes composed with a perspective tilt in one `transform` | `.float-card` |
| Mouse tilt (`--rx/--ry`) and lerped mouse parallax using the individual `translate` property | `initTilt`, `initParallax` in `src/main.ts` |
| Cursor spotlight + animated conic-gradient border ring (mask-composite) on cards | `.card::before/::after` |
| Scroll-driven reveal with `animation-timeline: view()` (progressive enhancement, `@supports`) | `.reveal` |
| View Transitions API for the pricing toggle (instant fallback) | `initBillingToggle` |
| Small WebGL torus with fresnel/iridescent shader, paused offscreen, DPR-capped, CSS-orb fallback | `src/hero3d.ts` |
| Fluid display typography, tight tracking, gradient text, `text-wrap: balance` | `.display`, `.h2`, `.gradient-text` |

### Accessibility & performance
- `prefers-reduced-motion: reduce` stops all CSS animation/transitions; JS disables tilt/parallax and the WebGL loop renders a single static frame.
- Pointer effects only on fine pointers with hover (not on touch).
- Text tokens: `#f4f4f8` (~18.3:1) and `#a9abc2` (~8.9:1) on `#07070c`.
- Skip link, semantic landmarks, visible `:focus-visible` outlines, decorative layers `aria-hidden`.
- The WebGL chunk is code-split and loaded on idle; the main JS bundle is ~2 KB gzip.

## Run
Requires Node 20+ (tested with Node 26 via mise) and pnpm (npm works too).

```bash
pnpm install     # or: npm install
pnpm dev         # dev server at http://localhost:5173
pnpm build       # type-check (tsc --noEmit) + production build to dist/
pnpm preview     # serve the production build
```

## Project layout
```
index.html               markup for all sections
src/main.ts              tilt, parallax, spotlight, view-transition toggle, lazy WebGL
src/hero3d.ts            OGL torus + shaders
src/style.css            tokens and all visual techniques
public/favicon.svg
AGENTS.md                guide for AI agents
.agents/skills/*.md      reusable skill docs (glass, mesh, shadows, motion, palette, type, WebGL)
```

## Agent skills
`.agents/skills/` contains one Markdown playbook per technique (with YAML frontmatter `name` / `description`), each with when-to-use guidance, copy-pasteable snippets taken from this page, a before/after example, do/don't lists and performance/accessibility notes. `AGENTS.md` indexes them.
