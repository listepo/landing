// Tempo — tiny progressive enhancement. The page works fully without JS.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");

// Subtle pointer parallax on the hero stage (disabled for reduced motion / touch).
function initParallax() {
  const root = document.querySelector("[data-parallax-root]");
  if (!root) return;
  const stage = root.querySelector(".stage");
  const layers = [...root.querySelectorAll("[data-depth]")];
  let frame = 0;
  let target = { x: 0, y: 0 };

  const apply = () => {
    frame = 0;
    const { x, y } = target;
    stage.style.setProperty("--rx", `${8 - y * 6}deg`);
    stage.style.setProperty("--ry", `${-10 + x * 8}deg`);
    for (const el of layers) {
      const d = Number(el.dataset.depth) || 0;
      el.style.setProperty("--tx", `${x * d * 14}px`);
      el.style.setProperty("--ty", `${y * d * 14}px`);
    }
  };

  const onMove = (e) => {
    const r = root.getBoundingClientRect();
    target = {
      x: Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))),
      y: Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))),
    };
    if (!frame) frame = requestAnimationFrame(apply);
  };

  const reset = () => {
    target = { x: 0, y: 0 };
    if (!frame) frame = requestAnimationFrame(apply);
  };

  const enable = () => {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", reset);
  };
  const disable = () => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", reset);
    for (const el of [stage, ...layers]) el.removeAttribute("style");
  };

  const sync = () => (!reduceMotion.matches && finePointer.matches ? enable() : disable());
  reduceMotion.addEventListener("change", sync);
  sync();
}

// Mark the nav link for the current project page.
function markCurrentNav() {
  const path = location.pathname.replace(/index\.html$/, "");
  for (const a of document.querySelectorAll("[data-nav] a[href^='/']")) {
    const href = a.getAttribute("href");
    if (href.length > 1 && !href.includes("#") && path.startsWith(href)) a.setAttribute("aria-current", "page");
  }
}

initParallax();
markCurrentNav();
