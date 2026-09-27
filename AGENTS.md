# AGENTS.md

Guidance for AI coding agents working in this repo.

## Project
`landing` — a Vite + vanilla TypeScript demo landing page for the "3D aesthetics" web trend (depth, glassmorphism, layered shadows, floating/parallax layers, animated gradient meshes, a small OGL WebGL object). See `README.md`.

- Entry: `index.html` → `src/main.ts` (interactions) + `src/style.css` (all visual tokens/techniques)
- Lazy WebGL hero: `src/hero3d.ts` (OGL)
- Commands: `pnpm install`, `pnpm dev`, `pnpm build` (runs `tsc --noEmit` then `vite build`), `pnpm preview`

## Skills
Task-specific playbooks live in `.agents/skills/`. Read the matching file **before** implementing that kind of UI:

| Skill | Use it when… |
|---|---|
| [`glassmorphism`](.agents/skills/glassmorphism.md) | building frosted-glass cards, nav pills, modals |
| [`gradient-mesh-backgrounds`](.agents/skills/gradient-mesh-backgrounds.md) | adding animated mesh/aurora backgrounds |
| [`depth-and-layered-shadows`](.agents/skills/depth-and-layered-shadows.md) | adding elevation, soft shadows, glows, buttons |
| [`floating-parallax-animations`](.agents/skills/floating-parallax-animations.md) | floating layers, tilt, parallax, scroll reveals, view transitions |
| [`color-palettes-3d-dark`](.agents/skills/color-palettes-3d-dark.md) | choosing/extending color tokens for dark 3D UIs |
| [`typography-3d-aesthetics`](.agents/skills/typography-3d-aesthetics.md) | display headings, gradient text, fluid type |
| [`threejs-ogl-hero-element`](.agents/skills/threejs-ogl-hero-element.md) | adding a small WebGL object to a hero |

## Rules
- Keep dependencies minimal (currently only `ogl`). Prefer CSS over JS for visual effects.
- Every animation must respect `prefers-reduced-motion` (global CSS block + JS guards).
- Keep text contrast at WCAG AA or better over the brightest background area.
- Reuse the tokens in `:root` (`--shadow-*`, `--glass-*`, `--accent*`) instead of hard-coding values.
- Run `pnpm build` before committing; it must pass with no type errors.
