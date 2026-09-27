---
name: floating-parallax-animations
description: Use this when adding floating layers, mouse-parallax, perspective tilt, scroll-driven reveals or view transitions — always with prefers-reduced-motion support.
---

# Floating layers, parallax & tilt (motion-safe)

## When to use
- Hero "stages" with floating UI panels, product mockups or 3D objects.
- Subtle life on otherwise static layouts: idle bobbing, cursor parallax, 3D tilt on hover, reveal-on-scroll.
- Keep it to 1–2 moving focal areas per viewport.

## Building blocks used in this repo
1. **Idle float** — keyframes on a registered `--float` length (composes with tilt inside one `transform`).
2. **Tilt** — JS writes `--rx/--ry` from pointer position; CSS applies `perspective() rotateX() rotateY()`.
3. **Parallax** — JS writes the individual `translate` property on `[data-depth]` layers (so it never fights `transform` animations), eased with a lerp, rAF only while settling.
4. **Scroll reveal** — CSS `animation-timeline: view()` behind `@supports`; no JS.
5. **View transitions** — `document.startViewTransition()` for state swaps (pricing toggle), with instant fallback.

## Example — floating animated hero card

```html
<div class="stage" aria-hidden="true">
  <div class="float-card glass" data-depth="42" data-tilt="10">
    <div class="float-card__body">
      <p class="muted small">Deploy frequency</p>
      <p class="metric">+38%</p>
    </div>
  </div>
</div>
```
```css
@property --float { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --rx    { syntax: "<angle>";  inherits: true;  initial-value: 0deg; }
@property --ry    { syntax: "<angle>";  inherits: true;  initial-value: 0deg; }

.stage { position: relative; min-height: 460px; perspective: 1200px; transform-style: preserve-3d; }

.float-card {
  position: absolute; border-radius: 20px; padding: 1rem 1.1rem;
  box-shadow: var(--glass-highlight), var(--shadow-lg);
  transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry)) translate3d(0, var(--float), 0);
  transition: --rx .4s cubic-bezier(.22,1,.36,1), --ry .4s cubic-bezier(.22,1,.36,1);
  animation: float 7s ease-in-out infinite;
  will-change: transform, translate;
}
.float-card__body { transform: translateZ(30px); } /* content pops forward during tilt */
@keyframes float { 0%, 100% { --float: 0px; } 50% { --float: -14px; } }
```
```ts
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer  = matchMedia('(hover: hover) and (pointer: fine)');

// Tilt
document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
  const max = Number(el.dataset.tilt) || 8;
  el.addEventListener('pointermove', (e) => {
    if (reduceMotion.matches || !finePointer.matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${px * max * 2}deg`);
    el.style.setProperty('--rx', `${-py * max * 2}deg`);
  });
  el.addEventListener('pointerleave', () => {
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  });
});

// Parallax (lerped, rAF only while moving)
const layers = [...document.querySelectorAll<HTMLElement>('[data-depth]')];
let tx = 0, ty = 0, cx = 0, cy = 0, frame = 0;
const tick = () => {
  cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
  for (const l of layers) {
    const d = Number(l.dataset.depth) || 0;
    l.style.translate = `${-cx * d}px ${-cy * d}px`;
  }
  frame = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(tick) : 0;
};
addEventListener('pointermove', (e) => {
  if (reduceMotion.matches || !finePointer.matches) return;
  tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
  if (!frame) frame = requestAnimationFrame(tick);
}, { passive: true });
```

### Scroll-driven reveal (CSS only)
```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal 1ms linear both;   /* shorthand first… */
      animation-timeline: view();          /* …timeline after (shorthand resets it) */
      animation-range: entry 0% cover 28%;
    }
  }
}
@keyframes reveal {
  from { opacity: 0; transform: translateY(32px) scale(.97); filter: blur(6px); }
  to   { opacity: 1; transform: none; filter: none; }
}
```
Supported in Chromium 115+ and Safari 26+; Firefox is still behind a flag as of Firefox 155 — unsupported browsers just show content (no hidden state).

### View transition for a state swap
```ts
const apply = () => { /* mutate DOM */ };
if (typeof document.startViewTransition === 'function' && !reduceMotion.matches) {
  document.startViewTransition(apply);
} else apply();
```

## Reduced motion (mandatory)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Plus JS guards (`reduceMotion.matches`) on tilt/parallax/WebGL loops, and listen for `change` so toggling the OS setting takes effect live.

## Do
- Depth values: background blobs ±20–30px, foreground cards 20–60px. Bigger = closer.
- Ease everything (`cubic-bezier(.22,1,.36,1)` or lerp). Linear parallax feels mechanical.
- Disable pointer effects on touch (`(hover: hover) and (pointer: fine)`).
- For JS-heavy sequences reach for **Motion** (`motion`, v12+/13) or **GSAP 3 + ScrollTrigger** (all plugins free since 2025); for smooth scrolling, **Lenis**.

## Don't
- Don't animate `top/left/width/height` — use `transform`, `translate`, `scale`, `opacity`.
- Don't set `transform` in two places on the same element (keyframes + hover) — split into `transform` vs `translate`/`scale`/`rotate`.
- Don't hide content until JS runs; reveals must be progressive enhancement.
- Don't scroll-jack.

## Performance
- One pointermove listener, one rAF loop; stop the loop when settled or offscreen (`IntersectionObserver`, `visibilitychange`).
- `will-change` only on the few elements that actually move.

## Accessibility
- Decorative stages get `aria-hidden="true"`.
- Motion never conveys information by itself.
- WCAG 2.3.3: provide the reduced-motion path; avoid large-area parallax that can trigger vestibular issues.
