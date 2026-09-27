---
name: color-palettes-3d-dark
description: Use this when choosing or extending colors for dark, 3D/glassy UIs — background, surface, text and accent tokens that stay legible over gradients and glass.
---

# Color palettes for 3D / dark UIs

## When to use
- Setting up tokens for a dark "premium" product page or app shell.
- Adding a new accent, state color or surface and wanting it to fit the existing depth language.

## Principles
- **Background is almost black, not black.** A hint of blue/violet (`#07070c`) makes glows and glass read richer than `#000`.
- **One dominant accent + two supporting accents**, all from the same "temperature" family (here: violet → cyan → pink).
- **Accents live in light, not in surfaces.** Use them in gradients, glows, borders, icons and small highlights; keep surfaces neutral and translucent.
- **Text is off-white**, muted text is a desaturated lavender-grey — never mid grey on glass.
- **Alpha, not new hexes**, for surfaces: `rgb(255 255 255 / .06)` over the mesh gives automatic tinting.

## Example — palette tokens (exactly what `src/style.css` uses)
```css
:root {
  color-scheme: dark;

  /* Base */
  --bg:       #07070c;
  --bg-elev:  #0e0e18;

  /* Text */
  --fg:       #f4f4f8;   /* ≈18.3:1 on --bg */
  --muted:    #a9abc2;   /* ≈8.9:1 on --bg  */

  /* Accents (Tailwind-ish 400 tones: bright enough for glow on dark) */
  --accent:   #a78bfa;   /* violet */
  --accent-2: #22d3ee;   /* cyan   */
  --accent-3: #f472b6;   /* pink   */
  --ok:       #34d399;   /* status */

  /* Surfaces (alpha over whatever is behind) */
  --glass-bg:     linear-gradient(180deg, rgb(255 255 255 / .09), rgb(255 255 255 / .03));
  --glass-border: rgb(255 255 255 / .12);
}
```
Applied in a component:
```css
.badge {                      /* accent as a gradient chip, dark text for contrast */
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  color: #0b0b14;
}
.kicker { color: var(--accent); letter-spacing: .14em; text-transform: uppercase; }
.plan--featured {             /* accent as tinted glass + glow, not a solid fill */
  background: linear-gradient(180deg, rgb(167 139 250 / .18), rgb(255 255 255 / .04));
  border-color: rgb(167 139 250 / .45);
  box-shadow: var(--glass-highlight), var(--shadow-lg),
              0 0 0 1px rgb(167 139 250 / .25), 0 10px 40px -10px rgb(167 139 250 / .55);
}
.brand__mark {
  background: conic-gradient(from 210deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent));
}
```

## Alternative palettes (same structure, swap values)
| Mood | --bg | --accent | --accent-2 | --accent-3 |
|---|---|---|---|---|
| Aurora (default) | `#07070c` | `#a78bfa` | `#22d3ee` | `#f472b6` |
| Ember | `#0c0806` | `#fb923c` | `#f43f5e` | `#facc15` |
| Mint | `#050b0a` | `#34d399` | `#22d3ee` | `#a3e635` |
| Mono-blue (Linear-ish) | `#08090d` | `#6e79ff` | `#8b9bff` | `#c4b5fd` |

## Do
- Check contrast of text tokens against `--bg` **and** against the brightest mesh blob.
- Use modern `rgb(r g b / a)` or `oklch()` for easy alpha variants; `oklch` keeps perceived lightness consistent across hues.
- Put dark text (`#0b0b14`) on bright accent fills.

## Don't
- Don't use saturated accents for body text or large surfaces.
- Don't introduce a 4th accent hue for decoration — use a state color only when it means something (success, error).
- Don't use pure `#fff` on `#000` for large text blocks (halation); `#f4f4f8` on `#07070c` is softer.

## Accessibility
- Minimum: body text 4.5:1, large text/UI 3:1 (WCAG 2.2 AA).
- Never encode status by color alone — pair with icon/text (the build card uses a dot **and** "Passed").
- Set `color-scheme: dark` so form controls and scrollbars match.
