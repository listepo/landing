---
name: typography-3d-aesthetics
description: Use this when styling headings and text for depth-heavy, glassy landing pages — tight display type, gradient text, fluid sizes and readable body copy.
---

# Typography for 3D aesthetics

## When to use
- Hero headlines, section titles, kickers/eyebrows and lede paragraphs on dark, layered pages.
- Any time big type sits over gradients or glass.

## Principles
- **Big, tight, heavy display type**: large `clamp()` sizes, negative tracking (−0.03 to −0.05em), line-height ≈ 1.0–1.1.
- **Contrast in scale, calm in color**: headline in near-white, one phrase in gradient text, body in muted.
- **Small uppercase kickers** with wide tracking to label sections.
- **Balanced wrapping**: `text-wrap: balance` for headings, `text-wrap: pretty` for paragraphs.
- System/Inter stack: no webfont required, but Inter / Geist / SF look best.

## Example — display heading (the landing's hero)

Before:
```html
<h1>Ship calmer. Build faster.</h1>
<style>h1 { font-size: 48px; }</style>
```

After:
```html
<p class="kicker">Features</p>
<h1 class="display">
  Ship calmer.<br />
  <span class="gradient-text">Build faster.</span>
</h1>
<p class="lede">Lumen is the quiet command center for your builds, tests and deploys.</p>
```
```css
:root {
  --font-sans: "Inter", "SF Pro Display", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace;
}
body { font-family: var(--font-sans); line-height: 1.6; -webkit-font-smoothing: antialiased; }

.display {
  font-size: clamp(2.75rem, 7vw, 5.25rem);
  line-height: 1.02;
  letter-spacing: -0.045em;
  font-weight: 700;
  text-wrap: balance;
}
.h2   { font-size: clamp(2rem, 4.5vw, 3.25rem); line-height: 1.08; letter-spacing: -0.035em; font-weight: 680; text-wrap: balance; }
.lede { font-size: clamp(1.05rem, 1.4vw, 1.2rem); color: var(--muted); max-width: 38rem; text-wrap: pretty; }
.kicker { font-size: .8rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }

.gradient-text {
  background: linear-gradient(100deg, #fff 0%, var(--accent) 35%, var(--accent-2) 65%, var(--accent-3) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text;
  color: transparent;
  animation: text-shine 8s linear infinite;
}
@keyframes text-shine { to { background-position: 200% center; } }
@media (prefers-reduced-motion: reduce) { .gradient-text { animation: none; } }
```

Numbers & code: big metrics use tight tracking (`.metric { font-size: 1.9rem; font-weight: 700; letter-spacing: -0.03em; }`); terminal/code snippets use `--font-mono` at ~.8rem with generous line-height (1.7).

## Do
- Scale tracking with size: bigger text → more negative letter-spacing; small caps text → positive.
- Keep gradient text to one short phrase; start the gradient from white so the first letters stay legible.
- Limit line length of body copy to ~60–75 characters (`max-width: 38rem`).

## Don't
- Don't apply gradient text to paragraphs or links.
- Don't use thin weights (<400) on dark glass — they shimmer and fail contrast.
- Don't set `font-size` in fixed px for headings; use `clamp()` so it scales without breakpoints.

## Performance
- System stack = zero font requests. If you add Inter/Geist, self-host a variable WOFF2, `font-display: swap`, and preload only the weights used.

## Accessibility
- Gradient text: make sure every stop has ≥3:1 against the background for large text (all accents here do on `#07070c`).
- `<br>` in headings is fine for visual rhythm; screen readers read the text continuously.
- Keep heading levels semantic (one `h1`, then `h2`s per section) regardless of visual size.
