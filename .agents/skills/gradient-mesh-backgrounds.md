---
name: gradient-mesh-backgrounds
description: Use this when a page or section needs a soft, animated "gradient mesh" / aurora background (Linear/Vercel/Stripe style) behind glass or 3D content.
---

# Gradient mesh backgrounds

## When to use
- Hero sections and full-page backdrops for dark, "premium" product pages.
- Behind glassmorphism — glass needs color behind it to read as glass.
- Not behind long reading content at full intensity; dim or mask it there.

## Core recipe — pure CSS, animated with `@property` (used in `src/style.css`)
Registered custom properties are interpolable, so gradient *positions* can animate smoothly — which plain CSS variables can't.

```css
@property --x1 { syntax: "<percentage>"; inherits: false; initial-value: 15%; }
@property --y1 { syntax: "<percentage>"; inherits: false; initial-value: 20%; }
@property --x2 { syntax: "<percentage>"; inherits: false; initial-value: 85%; }
@property --y2 { syntax: "<percentage>"; inherits: false; initial-value: 15%; }
@property --x3 { syntax: "<percentage>"; inherits: false; initial-value: 60%; }
@property --y3 { syntax: "<percentage>"; inherits: false; initial-value: 85%; }

.bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }

.bg__mesh {
  position: absolute; inset: -20%;          /* oversize so blur edges never show */
  background:
    radial-gradient(40% 50% at var(--x1) var(--y1), rgb(139 92 246 / .55), transparent 70%),
    radial-gradient(35% 45% at var(--x2) var(--y2), rgb(34 211 238 / .35), transparent 70%),
    radial-gradient(45% 50% at var(--x3) var(--y3), rgb(244 114 182 / .30), transparent 70%),
    #07070c;
  filter: blur(60px) saturate(120%);
  animation: mesh-drift 28s ease-in-out infinite alternate;
}
@keyframes mesh-drift {
  0%   { --x1: 15%; --y1: 20%; --x2: 85%; --y2: 15%; --x3: 60%; --y3: 85%; }
  33%  { --x1: 35%; --y1: 40%; --x2: 70%; --y2: 35%; --x3: 30%; --y3: 70%; }
  66%  { --x1: 20%; --y1: 70%; --x2: 90%; --y2: 55%; --x3: 70%; --y3: 30%; }
  100% { --x1: 45%; --y1: 15%; --x2: 60%; --y2: 80%; --x3: 20%; --y3: 45%; }
}

/* Grain overlay — removes banding, adds tactility */
.bg__grain {
  position: absolute; inset: 0; opacity: .07; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

/* Faint grid fading out from the top */
.bg__grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / .04) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / .04) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 75%);
}
```

## Example — gradient-mesh CTA section

Before:
```html
<section class="cta"><h2>Ready?</h2><a class="btn" href="#">Get started</a></section>
<style>.cta { background: #111; padding: 4rem; border-radius: 32px; text-align: center; }</style>
```

After (the landing's bottom CTA: rotating blurred conic mesh clipped inside a glass panel):
```html
<section class="cta glass">
  <h2 class="h2">Ready for a quieter pipeline?</h2>
  <p class="lede">Join thousands of developers who stopped refreshing their CI tab.</p>
  <a class="btn btn--primary" href="#pricing">Get started — it's free</a>
</section>
```
```css
@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes spin-angle { to { --angle: 360deg; } }

.cta {
  max-width: 1000px; margin: 2rem auto 5rem; border-radius: 32px;
  padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 4vw, 3rem);
  display: grid; justify-items: center; text-align: center; gap: 1.25rem;
  overflow: hidden; isolation: isolate;
}
.cta::before {
  content: ""; position: absolute; inset: -40%; z-index: -1;
  background: conic-gradient(from var(--angle) at 50% 50%,
    rgb(167 139 250 / .25), rgb(34 211 238 / .18), rgb(244 114 182 / .2), rgb(167 139 250 / .25));
  filter: blur(40px);
  animation: spin-angle 18s linear infinite;
}
```

## Library alternatives (when CSS isn't enough)
- **Paper Shaders** (`@paper-design/shaders`, `@paper-design/shaders-react`) — zero-dep WebGL `MeshGradient` (up to 10 colors, distortion, swirl, grain). Pre-1.0: pin the version.
- **ShaderGradient** (`@shadergradient/react`) — animated 3D-ish gradient planes/spheres, R3F-based.
- **Unicorn Studio** — no-code WebGL scene editor with a small embed runtime.

## Do
- 3–4 color stops max; one dominant hue, one or two accents.
- Slow motion (20–40s loops). The background should feel alive, not busy.
- Always add grain on large blurred gradients (banding is very visible on 8-bit displays).

## Don't
- Don't animate `background-position` of huge images or re-paint gradients every frame via JS.
- Don't put mid-brightness saturated blobs directly behind body text.

## Performance
- A single large `filter: blur()` layer animated via `@property` repaints each frame; it's fine on desktop, but on low-end mobile consider a static gradient (`@media (max-width: 480px)` or `prefers-reduced-motion`).
- Browsers without `@property` simply show the static initial positions — graceful fallback.

## Accessibility
- The global `prefers-reduced-motion: reduce` block in `style.css` freezes the drift.
- Mark decorative layers `aria-hidden="true"` and `pointer-events: none`.
