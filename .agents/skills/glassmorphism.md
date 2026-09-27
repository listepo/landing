---
name: glassmorphism
description: Use this when building frosted-glass surfaces (nav bars, cards, modals, pills) that sit over a colorful or animated background and need depth without losing legibility.
---

# Glassmorphism

## When to use
- Floating UI over a **busy, colorful background** (gradient mesh, blobs, 3D canvas). Glass over a flat solid color just looks grey — skip it there.
- Sticky nav pills, feature cards, pricing cards, toasts, command palettes.
- Not for dense data tables or long-form text blocks — use an opaque elevated surface instead.

## Core recipe (used in `src/style.css`)
```css
:root {
  --glass-bg: linear-gradient(180deg, rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.03));
  --glass-border: rgb(255 255 255 / 0.12);
  --glass-highlight: inset 0 1px 0 0 rgb(255 255 255 / 0.14); /* top "lip" of light */
  --glass-blur: 16px;
}

.glass {
  position: relative;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-highlight), var(--shadow-md);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--glass-blur)) saturate(160%);
}

/* No backdrop-filter? Go nearly opaque so text stays readable. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: rgb(20 20 32 / 0.92); }
}
```

Key ingredients: **translucent vertical gradient fill** (lighter at top), **1px light border**, **inset top highlight**, **blur + saturate** (saturate keeps colors behind the glass vivid instead of muddy), plus a **soft outer shadow** to lift it off the page.

## Example — glass feature card

Before (flat card):
```html
<article class="card">
  <h3>Instant pipelines</h3>
  <p>Smart caching cuts build time in half.</p>
</article>
<style>
  .card { background: #15151f; border-radius: 20px; padding: 1.6rem; }
</style>
```

After (glass + cursor spotlight + animated conic border, as in the landing's `#features` grid):
```html
<article class="card glass" data-spotlight>
  <div class="card__icon" aria-hidden="true">⚡</div>
  <h3>Instant pipelines</h3>
  <p>Smart caching cuts build time in half.</p>
</article>
```
```css
@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes spin-angle { to { --angle: 360deg; } }

.card {
  --mx: 50%; --my: 0%;
  border-radius: 20px; padding: 1.6rem; overflow: hidden; isolation: isolate;
  transition: translate .5s cubic-bezier(.22,1,.36,1), box-shadow .5s cubic-bezier(.22,1,.36,1);
}
.card::before { /* spotlight that follows the cursor */
  content: ""; position: absolute; inset: 0; z-index: -1; opacity: 0; transition: opacity .4s;
  background: radial-gradient(420px circle at var(--mx) var(--my), rgb(167 139 250 / .18), transparent 45%);
}
.card::after { /* 1px animated gradient ring */
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; opacity: 0;
  background: conic-gradient(from var(--angle), transparent 0 60%, #a78bfa 75%, #22d3ee 85%, transparent 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  transition: opacity .4s; animation: spin-angle 4s linear infinite;
}
.card:hover { translate: 0 -6px; box-shadow: var(--glass-highlight), var(--shadow-lg); }
.card:hover::before, .card:hover::after { opacity: 1; }
```
```ts
// src/main.ts
document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
});
```

## Do
- Keep fill alpha low (0.03–0.10 on dark UIs) and let the background do the color work.
- Always pair with a colorful layer *behind* it.
- Use `translate` (not `transform`) for hover lift if the element also has a scroll-driven/keyframe `transform` animation — otherwise the animation wins.
- Add a grain overlay on the page to hide banding in blurred areas.

## Don't
- Don't stack many blurred layers on top of each other (each `backdrop-filter` re-samples everything behind it).
- Don't blur huge full-screen elements that scroll — expensive on low-end GPUs/mobile.
- Don't put low-contrast grey text on glass; test contrast against the *brightest* spot of the background.

## Performance
- `backdrop-filter` cost scales with blurred area × blur radius. Prefer 8–20px; keep glass surfaces reasonably small.
- Avoid animating `backdrop-filter` itself.

## Accessibility
- Body text on glass should hit WCAG AA (4.5:1) against the worst-case background. Here `--fg #f4f4f8` / `--muted #a9abc2` on the dark mesh stay well above that.
- Respect `prefers-reduced-transparency` if you want to go further: `@media (prefers-reduced-transparency: reduce) { .glass { background: rgb(20 20 32 / .95); backdrop-filter: none; } }`.
