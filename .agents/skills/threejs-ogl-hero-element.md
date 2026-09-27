---
name: threejs-ogl-hero-element
description: Use this when adding a small real-time 3D object (WebGL) to a hero — lazy-loaded, paused offscreen, reduced-motion aware, with a CSS fallback.
---

# Small Three.js / OGL hero element

## When to use
- A single focal 3D object in the hero (orb, torus, logo mark, abstract shape) that reacts subtly to the pointer.
- When a pure-CSS orb isn't enough but a full 3D scene would be overkill.

## Picking the library
| Need | Pick |
|---|---|
| One shape + custom shader, smallest bundle | **OGL** (`ogl`, ~16 KB gzip for this demo chunk) — used here |
| Loaders (GLTF), post-processing, controls, big ecosystem | **Three.js** (`three`) |
| React app | **React Three Fiber** + **drei** |
| Vue app | **TresJS** (`@tresjs/core`) |
| Designer-authored scene, no code | **Spline** (`@splinetool/runtime`) or **Unicorn Studio** |

## Example — iridescent torus with OGL (from `src/hero3d.ts`)

```html
<div class="stage__orb" id="hero-3d" aria-hidden="true">
  <div class="orb-fallback"></div> <!-- CSS orb shown if WebGL is missing or fails -->
</div>
```
```css
.stage__orb { position: absolute; inset: 0; display: grid; place-items: center; }
.stage__orb canvas { width: 100% !important; height: 100% !important; }
.stage__orb.has-webgl .orb-fallback { display: none; }
```
```ts
// main.ts — lazy-load only when WebGL exists, during idle time
const host = document.querySelector<HTMLElement>('#hero-3d')!;
const probe = document.createElement('canvas');
if (probe.getContext('webgl2') || probe.getContext('webgl')) {
  requestIdleCallback(() =>
    import('./hero3d').then(({ mountHero3D }) => {
      mountHero3D(host, { reduceMotion: matchMedia('(prefers-reduced-motion: reduce)') });
      host.classList.add('has-webgl');
    }).catch(() => { /* keep CSS fallback */ }),
  { timeout: 1200 });
}
```
```ts
// hero3d.ts (condensed)
import { Renderer, Camera, Transform, Program, Mesh, Torus } from 'ogl';

const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(devicePixelRatio, 2) });
const gl = renderer.gl;
gl.clearColor(0, 0, 0, 0);
host.prepend(gl.canvas);

const camera = new Camera(gl, { fov: 35 });
camera.position.z = 7;
const scene = new Transform();
const program = new Program(gl, {
  vertex, fragment,                      // fresnel + 3-color iridescence, see file
  uniforms: { uTime: { value: 0 } },
  transparent: true, cullFace: false,
});
const mesh = new Mesh(gl, { geometry: new Torus(gl, { radius: 1, tube: 0.42, radialSegments: 48, tubularSegments: 160 }), program });
mesh.setParent(scene);

new ResizeObserver(() => {
  const { width, height } = host.getBoundingClientRect();
  renderer.setSize(width, height);
  camera.perspective({ aspect: width / height });
}).observe(host);

// Loop runs only when visible, tab active, and motion allowed; otherwise render one static frame.
```
Fragment shader core (fresnel rim + gradient by normal):
```glsl
float fresnel = pow(1.0 - max(dot(n, vView), 0.0), 2.2);
float t = n.y * 0.5 + 0.5 + sin(uTime * 0.4 + n.x * 3.0) * 0.15;
vec3 col = mix(mix(violet, cyan, clamp(t, 0.0, 1.0)), pink, fresnel);
float key = max(dot(n, normalize(vec3(-0.4, 0.8, 0.6))), 0.0);
col = col * (0.45 + 0.55 * key) + fresnel * 0.55;
gl_FragColor = vec4(col, 0.6 + fresnel * 0.4);
```

Three.js equivalent (if you need its ecosystem): `new THREE.Mesh(new THREE.TorusGeometry(1, .42, 48, 160), new THREE.ShaderMaterial({ vertexShader, fragmentShader, transparent: true }))` with `WebGLRenderer({ alpha: true, antialias: true })` and the same lifecycle rules.

## Do
- Dynamic `import()` so the 3D chunk never blocks first paint (here: 4 KB main JS vs 53 KB lazy chunk).
- Cap DPR at 2; keep geometry modest (<50k tris for a hero ornament).
- Pause with `IntersectionObserver` + `visibilitychange`; clean up (`loseContext`) on unmount in SPAs.
- Match the object's colors to the palette tokens so it feels part of the page.

## Don't
- Don't make the 3D object the only place key content lives — it's decoration (`aria-hidden`).
- Don't render at 60fps forever when offscreen or when reduced motion is on.
- Don't ship Three.js + a GLTF + HDRI for a spinning blob — OGL or CSS will do.

## Performance
- Measure on a mid-range phone; if frame time > 8ms, drop tubular segments or DPR.
- Transparent canvas over a CSS mesh is cheap; avoid full-screen post-processing on landing pages.

## Accessibility
- Reduced motion → single static frame (handled in `start()`).
- Pointer-driven rotation is subtle and not required for any interaction.
