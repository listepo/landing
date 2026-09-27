import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/** Perspective tilt: sets --rx/--ry on elements with [data-tilt="maxDeg"]. */
function initTilt(): void {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const max = Number(el.dataset.tilt) || 8;
    let frame = 0;
    el.addEventListener('pointermove', (e) => {
      if (reduceMotion.matches || !finePointer.matches) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--ry', `${(px * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-py * max * 2).toFixed(2)}deg`);
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/** Cursor spotlight: sets --mx/--my (in %) on [data-spotlight] cards. */
function initSpotlight(): void {
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}

/**
 * Mouse parallax: layers with [data-depth="px"] drift opposite to the pointer.
 * Uses the individual `translate` property so it composes with CSS transforms/animations.
 * Eased with a lerp and only runs rAF while settling.
 */
function initParallax(): void {
  const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-depth]'));
  if (!layers.length) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, frame = 0;

  const tick = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    for (const layer of layers) {
      const d = Number(layer.dataset.depth) || 0;
      layer.style.translate = `${(-cx * d).toFixed(2)}px ${(-cy * d).toFixed(2)}px`;
    }
    frame = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(tick) : 0;
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (reduceMotion.matches || !finePointer.matches) return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!frame) frame = requestAnimationFrame(tick);
    },
    { passive: true },
  );

  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) layers.forEach((l) => (l.style.translate = ''));
  });
}

/** Pricing toggle with the View Transitions API (falls back to an instant swap). */
function initBillingToggle(): void {
  const toggle = document.querySelector<HTMLButtonElement>('#billing-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const yearly = toggle.getAttribute('aria-pressed') !== 'true';
    const apply = () => {
      toggle.setAttribute('aria-pressed', String(yearly));
      document.querySelectorAll<HTMLElement>('[data-monthly]').forEach((el) => {
        el.textContent = (yearly ? el.dataset.yearly : el.dataset.monthly) ?? el.textContent;
      });
    };
    if (typeof document.startViewTransition === 'function' && !reduceMotion.matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  });
}

/** Lazy-load the small OGL hero object only if WebGL is available. */
function initHero3D(): void {
  const host = document.querySelector<HTMLElement>('#hero-3d');
  if (!host) return;
  const probe = document.createElement('canvas');
  const hasWebGL = !!(probe.getContext('webgl2') || probe.getContext('webgl'));
  if (!hasWebGL) return;

  const load = () =>
    import('./hero3d')
      .then(({ mountHero3D }) => {
        mountHero3D(host, { reduceMotion });
        host.classList.add('has-webgl');
      })
      .catch((err) => console.warn('[hero3d] falling back to CSS orb', err));

  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 1200 });
  else setTimeout(load, 200);
}

initTilt();
initSpotlight();
initParallax();
initBillingToggle();
initHero3D();
