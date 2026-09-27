---
name: depth-and-layered-shadows
description: Use this when UI elements need believable elevation — soft, multi-layer shadows, inner highlights and glows for buttons, cards and floating panels.
---

# Depth & layered shadows

## When to use
- Any time something should look like it *floats* above the page: cards, popovers, buttons, the hero's floating panels.
- Establishing a consistent elevation scale (sm / md / lg) across a design system.

## Why layered?
A single `box-shadow: 0 10px 30px black` looks fake. Real light produces a tight dark **contact** shadow plus a wide soft **ambient** one. Stacking 3–4 shadows with increasing offset/blur and decreasing opacity reads as physical depth. On dark UIs, add an **inset top highlight** (light hitting the top edge) — that's what sells it.

## Core tokens (used in `src/style.css`)
```css
:root {
  --shadow-sm:
    0 1px 1px rgb(0 0 0 / .25),
    0 2px 4px rgb(0 0 0 / .2);
  --shadow-md:
    0 1px 1px rgb(0 0 0 / .2),
    0 4px 8px rgb(0 0 0 / .2),
    0 12px 24px rgb(0 0 0 / .25);
  --shadow-lg:
    0 1px 2px rgb(0 0 0 / .2),
    0 8px 16px rgb(0 0 0 / .22),
    0 24px 48px rgb(0 0 0 / .3),
    0 48px 96px rgb(0 0 0 / .35);
  --glass-highlight: inset 0 1px 0 0 rgb(255 255 255 / .14);
  --glow: 0 0 0 1px rgb(167 139 250 / .25), 0 10px 40px -10px rgb(167 139 250 / .55);
}
```
Pattern: each layer roughly **doubles** offset and blur. Colored glows use a **negative spread** (`-10px`) so the glow sits under the element instead of haloing it.

## Example — layered-shadow button

Before:
```css
.btn { background: #fff; color: #000; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,.5); }
```

After (the landing's `.btn--primary` + `.btn--glass`):
```html
<a class="btn btn--primary" href="#pricing">Start for free</a>
<a class="btn btn--glass" href="#how">See how it works</a>
```
```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  padding: .8rem 1.35rem; border-radius: 999px; font-weight: 600; font-size: .95rem;
  border: 1px solid transparent; cursor: pointer;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s cubic-bezier(.22,1,.36,1), background .3s;
}
.btn:hover  { transform: translateY(-2px); }
.btn:active { transform: translateY(0) scale(.98); }

.btn--primary {
  color: #0b0b14;
  background: linear-gradient(135deg, #fff 0%, #e4dcff 50%, #c7f3ff 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .9),          /* top lip */
    0 0 0 1px rgb(255 255 255 / .2),               /* hairline ring */
    0 8px 30px -6px rgb(167 139 250 / .7);         /* colored lift */
}
.btn--primary:hover {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .9), 0 0 0 1px rgb(255 255 255 / .3),
              0 14px 40px -6px rgb(167 139 250 / .9);
}

.btn--glass {
  color: #f4f4f8;
  background: rgb(255 255 255 / .06);
  border-color: rgb(255 255 255 / .14);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .1), var(--shadow-sm);
}
```

Elevation in use: nav/cards → `--shadow-md`; hovered cards & floating hero panels → `--shadow-lg`; featured pricing card & CTA → `--shadow-lg` + `--glow`.

## Do
- Define 3 elevation tokens and reuse them; don't hand-write shadows per component.
- Lift on hover by moving the element up *and* stepping to the next shadow token.
- Use `drop-shadow()` filter (not `box-shadow`) for non-rectangular things like SVG sparklines: `filter: drop-shadow(0 4px 10px rgb(34 211 238 / .45))`.

## Don't
- Don't use pure black at high opacity on dark backgrounds — it disappears. Rely on highlights and glows for separation instead.
- Don't animate `box-shadow` on dozens of elements at once (repaints). For heavy lists, animate the opacity of a pseudo-element that holds the bigger shadow.

## Performance
- Large blur radii on many elements cost paint time; fine for a handful of cards.
- `transform`/`translate` for hover lift is compositor-friendly; shadow transitions repaint.

## Accessibility
- Depth must not be the only affordance: buttons still need clear labels and a visible `:focus-visible` outline (`outline: 2px solid var(--accent-2); outline-offset: 3px`).
- Keep primary button text contrast high (dark text on the near-white gradient here is ~15:1).
