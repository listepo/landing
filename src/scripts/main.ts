// Progressive enhancement only — every page is complete without JavaScript.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const motionOK = () => !reduceMotion.matches && finePointer.matches;

/* Cursor-follow shine on cards (fine pointers only). */
function initShine() {
  const sync = () => document.documentElement.classList.toggle("has-shine", finePointer.matches);
  sync();
  finePointer.addEventListener("change", sync);
  document.addEventListener("pointermove", (e) => {
    if (!finePointer.matches) return;
    const el = (e.target as Element | null)?.closest<HTMLElement>(".shine");
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* Hero stage: tilt + parallax layers, lerped, rAF only while settling. */
function initStage() {
  const stage = document.querySelector<HTMLElement>("[data-stage]");
  if (!stage) return;
  const tilt = stage.querySelector<HTMLElement>(".stage__tilt");
  const layers = [...stage.querySelectorAll<HTMLElement>("[data-depth]")];
  let tx = 0, ty = 0, cx = 0, cy = 0, frame = 0, visible = true;

  const tick = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    tilt?.style.setProperty("--ry", `${cx * 8}deg`);
    tilt?.style.setProperty("--rx", `${-cy * 6}deg`);
    for (const l of layers) {
      const d = Number(l.dataset.depth) || 0;
      l.style.translate = `${-cx * d}px ${-cy * d}px`;
    }
    frame = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(tick) : 0;
  };
  const onMove = (e: PointerEvent) => {
    if (!motionOK() || !visible) return;
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const reset = () => {
    tx = ty = 0;
    if (!frame) frame = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (!visible) reset(); }).observe(stage);
  addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", reset);
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      cancelAnimationFrame(frame); frame = 0; tx = ty = cx = cy = 0;
      tilt?.style.removeProperty("--rx"); tilt?.style.removeProperty("--ry");
      layers.forEach((l) => (l.style.translate = ""));
    }
  });
}

/* Copy buttons: button label flips to "Copied", a small toast confirms, aria-live announces. */
function initCopy() {
  const live = document.createElement("p");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  document.body.append(live);
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("aria-hidden", "true");
  toast.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Copied</span>';
  document.body.append(toast);
  let toastTimer = 0;
  const showToast = (text: string) => {
    toast.querySelector("span")!.textContent = text;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 1600);
  };
  for (const btn of document.querySelectorAll<HTMLButtonElement>("button[data-copy]")) {
    if (!navigator.clipboard) continue;
    btn.hidden = false;
    const label = btn.querySelector(".copy__label");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? "");
        btn.dataset.state = "copied";
        if (label) label.textContent = "Copied";
        live.textContent = "Copied to clipboard";
        showToast("Copied to clipboard");
        setTimeout(() => {
          delete btn.dataset.state;
          if (label) label.textContent = "Copy";
          live.textContent = "";
        }, 1800);
      } catch {
        live.textContent = "Copy failed — select the text instead";
        showToast("Copy failed — select the text instead");
      }
    });
  }
}

/* Docs nav: edge fades while the strip overflows, current tab scrolled into view, and a
   sliding underline that follows hover/focus and returns to the current page. */
function initDocsNav() {
  const nav = document.querySelector<HTMLElement>("[data-dnav]");
  const scroller = nav?.querySelector<HTMLElement>("[data-dnav-scroller]");
  if (!nav || !scroller) return;
  const indicator = scroller.querySelector<HTMLElement>(".dnav__indicator")!;
  const tabs = [...scroller.querySelectorAll<HTMLAnchorElement>(".dnav__tab")];
  const current = tabs.find((t) => t.getAttribute("aria-current") === "page");
  const fades = () => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    scroller.toggleAttribute("data-fade-l", scroller.scrollLeft > 4);
    scroller.toggleAttribute("data-fade-r", scroller.scrollLeft < max - 4);
  };
  const moveTo = (el: HTMLElement | undefined) => {
    if (!el) { indicator.style.setProperty("--w", "0"); return; }
    const pad = 12;
    const left = el.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
    indicator.style.setProperty("--x", `${left + pad}px`);
    indicator.style.setProperty("--w", `${Math.max(el.offsetWidth - pad * 2, 0)}`);
  };
  if (current) {
    const left = current.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    const target = left - (scroller.clientWidth - current.offsetWidth) / 2;
    scroller.scrollLeft = Math.max(0, target);
  }
  moveTo(current);
  nav.classList.add("is-ready");
  fades();
  scroller.addEventListener("scroll", fades, { passive: true });
  addEventListener("resize", () => { fades(); moveTo(current); }, { passive: true });
  for (const t of tabs) {
    t.addEventListener("pointerenter", () => moveTo(t));
    t.addEventListener("focus", () => moveTo(t));
  }
  scroller.addEventListener("pointerleave", () => moveTo(current));
  scroller.addEventListener("focusout", (e) => { if (!scroller.contains(e.relatedTarget as Node)) moveTo(current); });
  document.fonts?.ready.then(() => { moveTo(current); fades(); });
}

/* Docs TOC: highlight the section being read. */
function initToc() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")];
  if (!links.length) return;
  const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const heads = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  const set = (id: string) => {
    for (const a of links) {
      if (byId.get(id) === a) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  };
  const onScroll = () => {
    let active = heads[0]?.id;
    for (const h of heads) if (h.getBoundingClientRect().top < 200) active = h.id;
    if (active) set(active);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* Step rails: reveal once in view — only when motion is allowed. */
function initReveal() {
  const steps = [...document.querySelectorAll<HTMLElement>(".gs__step, .rail__step")];
  if (!steps.length || reduceMotion.matches || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -10% 0px" });
  steps.forEach((s) => io.observe(s));
  reduceMotion.addEventListener("change", () => { if (reduceMotion.matches) steps.forEach((s) => s.classList.add("is-in")); });
}

/* Home: Pro/OSS audience toggle. */
function initAudience() {
  const root = document.querySelector<HTMLElement>("[data-audience]");
  if (!root) return;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-set-audience]")];
  for (const b of buttons) {
    b.addEventListener("click", () => {
      const apply = () => {
        root.dataset.audience = b.dataset.setAudience!;
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      };
      const vt = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition;
      if (vt && !reduceMotion.matches) vt.call(document, apply);
      else apply();
    });
  }
}

/* Home hero hotspots: one open at a time; Esc / outside click closes and returns focus. */
function initHotspots() {
  const dots = [...document.querySelectorAll<HTMLButtonElement>("[data-hotspots] .hotspot__dot")];
  if (!dots.length) return;
  const tipOf = (b: HTMLButtonElement) => document.getElementById(b.getAttribute("aria-controls")!)!;
  const close = (b: HTMLButtonElement) => { b.setAttribute("aria-expanded", "false"); tipOf(b).hidden = true; };
  for (const b of dots) {
    b.addEventListener("click", () => {
      const open = b.getAttribute("aria-expanded") === "true";
      dots.forEach(close);
      if (!open) { b.setAttribute("aria-expanded", "true"); tipOf(b).hidden = false; }
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openDot = dots.find((b) => b.getAttribute("aria-expanded") === "true");
    if (openDot) { close(openDot); openDot.focus(); }
  });
  document.addEventListener("click", (e) => {
    if (!(e.target as Element).closest(".hotspot")) dots.forEach(close);
  });
}

/* Products menu: close on Esc / outside click, keep focus sensible. */
function initMenu() {
  const menus = [...document.querySelectorAll<HTMLDetailsElement>("[data-menu]")];
  if (!menus.length) return;
  document.addEventListener("click", (e) => {
    for (const m of menus) if (m.open && !m.contains(e.target as Node)) m.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    for (const m of menus) if (m.open) { m.open = false; m.querySelector("summary")?.focus(); }
  });
}

/* Terminal demo: type once in view; Pause / Replay; static final state under reduced motion. */
function initTerminals() {
  for (const term of document.querySelectorAll<HTMLElement>("[data-term]")) {
    const lines = [...term.querySelectorAll<HTMLElement>(".term__line")];
    const ctl = term.querySelector<HTMLButtonElement>("[data-term-ctl]");
    const typed = lines.map((l) => l.querySelector<HTMLElement>(".term__typed"));
    const full = typed.map((t) => t?.textContent ?? "");
    let timer = 0, i = 0, c = 0, playing = false, done = false;
    const showAll = () => { lines.forEach((l, k) => { l.removeAttribute("data-hide"); if (typed[k]) typed[k]!.textContent = full[k]; }); };
    const setCtl = () => { if (ctl) ctl.textContent = playing ? "Pause" : done ? "Replay" : "Play"; };
    const step = () => {
      if (!playing) return;
      if (i >= lines.length) { playing = false; done = true; setCtl(); return; }
      const line = lines[i], t = typed[i];
      line.removeAttribute("data-hide");
      if (t && c <= full[i].length) {
        t.textContent = full[i].slice(0, c++);
        timer = window.setTimeout(step, c === 1 ? 380 : 24 + Math.random() * 38);
        return;
      }
      i++; c = 0;
      timer = window.setTimeout(step, t ? 260 : 110);
    };
    const start = () => {
      clearTimeout(timer); i = 0; c = 0; done = false; playing = true;
      lines.forEach((l, k) => { if (k < lines.length) l.setAttribute("data-hide", ""); if (typed[k]) typed[k]!.textContent = ""; });
      setCtl(); step();
    };
    if (ctl) {
      ctl.hidden = false; setCtl();
      ctl.addEventListener("click", () => {
        if (playing) { playing = false; clearTimeout(timer); setCtl(); }
        else if (done || i === 0) start();
        else { playing = true; setCtl(); step(); }
      });
    }
    if (term.hasAttribute("data-term-manual")) {
      term.addEventListener("term:play", () => { if (reduceMotion.matches) { showAll(); done = true; setCtl(); } else if (!playing) start(); });
      term.addEventListener("term:stop", () => { if (playing) { playing = false; clearTimeout(timer); showAll(); done = true; setCtl(); } });
      continue;
    }
    if (reduceMotion.matches) { done = true; setCtl(); continue; }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); start(); } }, { threshold: 0.35 });
    io.observe(term);
    reduceMotion.addEventListener("change", () => { if (reduceMotion.matches) { playing = false; clearTimeout(timer); showAll(); done = true; setCtl(); } });
  }
}

/* rtok bitset: blocks settle into their target state; Δtok counts removed blocks. */
function initBitset() {
  const root = document.querySelector<HTMLElement>("[data-bitset]");
  if (!root || reduceMotion.matches) return;
  const bits = [...root.querySelectorAll<HTMLElement>(".bit")];
  const out = root.querySelector<HTMLElement>("[data-bitset-count]");
  const run = () => {
    bits.forEach((b) => (b.dataset.state = "K"));
    if (out) out.textContent = "−0";
    let removed = 0;
    const order = bits.map((b, k) => ({ b, k, r: Math.random() })).sort((a, b) => a.r - b.r);
    order.forEach(({ b }, n) => {
      setTimeout(() => {
        b.dataset.state = b.dataset.target!;
        if (b.dataset.target !== "K") { removed++; if (out) out.textContent = `−${removed}`; }
      }, 500 + n * 140);
    });
  };
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
  io.observe(root);
}

/* One rAF-throttled scroll loop for the scroll-scrubbed visuals (no scroll-jacking). */
const scrubbers: (() => void)[] = [];
let scrubFrame = 0;
const runScrub = () => { scrubFrame = 0; scrubbers.forEach((f) => f()); };
const queueScrub = () => { if (!scrubFrame) scrubFrame = requestAnimationFrame(runScrub); };
addEventListener("scroll", queueScrub, { passive: true });
addEventListener("resize", queueScrub, { passive: true });
/** 0 → 1 as the element travels from entering the lower viewport to leaving the upper-middle. */
const progress = (el: Element, start = 0.9, end = 0.25) => {
  const r = el.getBoundingClientRect();
  const a = innerHeight * start, b = innerHeight * end - r.height;
  return Math.min(1, Math.max(0, (a - r.top) / (a - b)));
};

/* Home: 3D ring carousel — buttons, ←/→, drag, focus-follow; auto-rotate unless reduced motion. */
function initRing() {
  const ring = document.querySelector<HTMLElement>("[data-ring]");
  if (!ring) return;
  const stage = ring.querySelector<HTMLElement>("[data-ring-stage]")!;
  const track = ring.querySelector<HTMLElement>("[data-ring-track]")!;
  const items = [...ring.querySelectorAll<HTMLElement>("[data-ring-item]")];
  const status = ring.querySelector<HTMLElement>("[data-ring-status]");
  const n = items.length, step = 360 / n;
  let index = 0, rot = 0, auto = 0, userTouched = false;
  ring.classList.add("is-ready");
  ring.querySelector<HTMLElement>("[data-ring-controls]")!.hidden = false;
  const titleOf = (el: HTMLElement) => el.querySelector(".ring__title")?.textContent?.replace(/\.$/, "") ?? "";
  const render = (announce = true) => {
    track.style.setProperty("--rot", `${rot}deg`);
    items.forEach((el, k) => el.classList.toggle("is-active", k === index));
    if (status && announce) status.textContent = `${titleOf(items[index])} · ${index + 1} / ${n}`;
  };
  const go = (k: number, announce = true) => {
    const delta = ((k - index) % n + n) % n;           // shortest way round
    const signed = delta > n / 2 ? delta - n : delta;
    index = ((k % n) + n) % n; rot += signed * step; render(announce);
  };
  const stop = () => { userTouched = true; clearInterval(auto); };
  ring.querySelector("[data-ring-prev]")!.addEventListener("click", () => { stop(); go(index - 1); });
  ring.querySelector("[data-ring-next]")!.addEventListener("click", () => { stop(); go(index + 1); });
  ring.addEventListener("keydown", (e) => {
    if ((e.target as Element).closest(".hotspot")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(index + 1); items[index].querySelector<HTMLElement>(".ring__card")?.focus({ preventScroll: true }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(index - 1); items[index].querySelector<HTMLElement>(".ring__card")?.focus({ preventScroll: true }); }
  });
  items.forEach((el, k) => el.addEventListener("focusin", () => { stop(); if (k !== index) go(k); }));
  // drag
  let startX = 0, startRot = 0, dragging = false, moved = false;
  stage.addEventListener("pointerdown", (e) => {
    if (matchMedia("(max-width: 767px)").matches || (e.target as Element).closest(".hotspot")) return;
    dragging = true; moved = false; startX = e.clientX; startRot = rot;
  });
  addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 6) { moved = true; stop(); stage.classList.add("is-dragging"); }
    if (moved) { rot = startRot - dx * 0.35; track.style.setProperty("--rot", `${rot}deg`); }
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false; stage.classList.remove("is-dragging");
    if (!moved) return;
    const k = Math.round(rot / step); rot = k * step; index = ((k % n) + n) % n; render();
    // The click that ends a drag (if any) fires right after pointerup; forget the drag after it,
    // so a drag released outside the stage cannot swallow the next click.
    setTimeout(() => { moved = false; }, 0);
  };
  addEventListener("pointerup", endDrag);
  // A touch that turns into a vertical scroll is cancelled: snap to the nearest card instead of
  // leaving the ring half-turned with dragging still on.
  addEventListener("pointercancel", endDrag);
  stage.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  // auto-rotate: only with motion allowed, never after the user took over, paused on hover/focus
  const startAuto = () => {
    clearInterval(auto);
    if (userTouched || reduceMotion.matches) return;
    auto = window.setInterval(() => {
      if (document.hidden || ring.matches(":hover") || ring.contains(document.activeElement)) return;
      if (ring.querySelector('.hotspot__dot[aria-expanded="true"]')) return;
      go(index + 1, false);
    }, 4200);
  };
  reduceMotion.addEventListener("change", startAuto);
  render(false); startAuto();
}

/* rtok: MCP code graph draws in once visible. */
function initGraph() {
  const g = document.querySelector<HTMLElement>("[data-graph]");
  if (!g || reduceMotion.matches) return;
  g.classList.add("is-armed");
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); requestAnimationFrame(() => g.classList.add("is-drawn")); } }, { threshold: 0.4 });
  io.observe(g);
}

/* rtok: token particles scroll-scrubbed into a narrow context band, reversible. Illustrative only. */
function initParticles() {
  const root = document.querySelector<HTMLElement>("[data-particles]");
  const canvas = root?.querySelector<HTMLCanvasElement>("[data-p-canvas]");
  const ctx = canvas?.getContext("2d");
  if (!root || !canvas || !ctx) return;
  const out = root.querySelector<HTMLElement>("[data-p-count]");
  const css = getComputedStyle(document.documentElement);
  const cyan = css.getPropertyValue("--accent").trim() || "#5CE1FF";
  const coral = css.getPropertyValue("--accent-2").trim() || "#FF6B4A";
  const N = 240;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  type P = { kind: "K" | "T" | "C"; sx: number; sy: number; w: number; bx: number; by: number; ph: number };
  const ps: P[] = [];
  for (let i = 0; i < N; i++) {
    const r = rnd();
    ps.push({ kind: r < 0.55 ? "K" : r < 0.72 ? "T" : "C", sx: rnd(), sy: rnd(), w: 6 + rnd() * 12, bx: 0, by: 0, ph: rnd() * Math.PI * 2 });
  }
  const cut = ps.filter((p) => p.kind === "C").length;
  let W = 0, H = 0, last = -1, rows = 1;
  const layout = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // band targets: kept + thinned pack into rows inside a narrow band; cut tokens go to the archive corner
    const bandW = W * 0.62, x0 = W * 0.08, rowH = 9;
    let x = x0, row = 0;
    const archive = { x: W * 0.8, y: H * 0.72 };
    let ai = 0;
    for (const p of ps) {
      if (p.kind === "C") { p.bx = archive.x + (ai % 12) * 9; p.by = archive.y + Math.floor(ai / 12) * 8 - 20; ai++; continue; }
      const w = p.kind === "T" ? p.w * 0.35 : p.w * 0.8;
      if (x + w > x0 + bandW) { x = x0; row++; }
      p.bx = x; p.by = H / 2 - 18 + row * rowH; x += w + 3;
    }
    rows = row + 1;
    last = -1;
  };
  const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const draw = (p0: number) => {
    const t = ease(p0);
    ctx.clearRect(0, 0, W, H);
    // the context band
    ctx.fillStyle = `rgba(92,225,255,${0.04 + t * 0.06})`;
    const bh = rows * 9 + 12;
    ctx.fillRect(W * 0.06, H / 2 - 24, W * 0.66, bh + (H * 0.5 - bh) * (1 - t));
    for (const p of ps) {
      const x = p.sx * (W - 20) + 10, y = p.sy * (H - 20) + 10;
      const px = x + (p.bx - x) * t, py = y + (p.by - y) * t;
      const w = p.kind === "T" ? p.w * (1 - 0.65 * t) : p.kind === "K" ? p.w * (1 - 0.2 * t) : p.w * (1 - 0.5 * t);
      ctx.globalAlpha = p.kind === "T" ? 0.75 - 0.25 * t : p.kind === "C" ? 0.9 - 0.35 * t : 0.95;
      if (p.kind === "C") { ctx.strokeStyle = coral; ctx.lineWidth = 1.2; ctx.strokeRect(px, py, w, 5); }
      else { ctx.fillStyle = p.kind === "K" ? cyan : "#7aa3b8"; ctx.fillRect(px, py, w, p.kind === "K" ? 5 : 4); }
    }
    ctx.globalAlpha = 1;
    if (out) out.textContent = `−${Math.round(cut * t)}`;
  };
  const tick = () => {
    const p = reduceMotion.matches ? 1 : progress(root, 0.95, 0.35);
    if (Math.abs(p - last) < 0.002) return;
    last = p; draw(p);
  };
  new ResizeObserver(() => { layout(); tick(); }).observe(canvas);
  scrubbers.push(tick);
  reduceMotion.addEventListener("change", () => { last = -1; tick(); });
}

/* cox: perspective scenes; tabs + ←/→; active panel comes forward and types its README usage. */
function initScenes() {
  const root = document.querySelector<HTMLElement>("[data-scenes]");
  if (!root) return;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-scene]")];
  const stage = root.querySelector<HTMLElement>(".scenes__stage")!;
  let active = 0, seen = false;
  root.classList.add("is-ready");
  const set = (k: number, focus = false) => {
    const prev = active;
    active = (k + panels.length) % panels.length;
    stage.style.setProperty("--active", String(active));
    tabs.forEach((t, i) => { const on = i === active; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
    panels.forEach((p, i) => {
      const on = i === active;
      p.classList.toggle("is-active", on);
      p.toggleAttribute("inert", !on);
      p.style.setProperty("--off", String(Math.abs(i - active)));
    });
    if (focus) tabs[active].focus();
    if (seen) {
      if (prev !== active) panels[prev].querySelector("[data-term]")?.dispatchEvent(new Event("term:stop"));
      panels[active].querySelector("[data-term]")?.dispatchEvent(new Event("term:play"));
    }
  };
  tabs.forEach((t, i) => t.addEventListener("click", () => set(i)));
  panels.forEach((p, i) => p.addEventListener("click", () => { if (i !== active) set(i); }));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); set(active + 1, root.contains(document.activeElement) && (document.activeElement as HTMLElement).getAttribute("role") === "tab"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); set(active - 1, root.contains(document.activeElement) && (document.activeElement as HTMLElement).getAttribute("role") === "tab"); }
  });
  set(0);
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); seen = true; set(active); } }, { threshold: 0.35 });
  io.observe(root);
}

/* ketch: package chip travels the route on offset-path, stroke draws with scroll; rollback runs back. */
function initRoute() {
  const route = document.querySelector<HTMLElement>("[data-route]");
  if (!route) return;
  const fit = route.querySelector<HTMLElement>("[data-route-fit]")!;
  const box = route.querySelector<HTMLElement>("[data-route-box]")!;
  const path = route.querySelector<SVGPathElement>("[data-route-path]")!;
  const tips = [...route.querySelectorAll<HTMLElement>("[data-route-stop]")];
  tips.forEach((t, k) => t.style.setProperty("--k", String(k)));
  // fraction of the route at which each stop is reached (nearest sample on the path)
  const len = path.getTotalLength();
  const stopsAt = tips.map((t) => {
    const x = parseFloat(t.style.left), y = parseFloat(t.style.top);
    let best = 0, bd = Infinity;
    for (let i = 0; i <= 400; i++) {
      const pt = path.getPointAtLength((i / 400) * len);
      const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
      if (d < bd - 1) { bd = d; best = i / 400; }
    }
    return best;
  });
  // the install stop is revisited at the very end (rollback leg returns there)
  const backStart = stopsAt[3];
  const scale = () => { const s = Math.min(1, fit.clientWidth / 1000); route.style.setProperty("--s", String(s)); };
  new ResizeObserver(scale).observe(fit); scale();
  const tick = () => {
    const p = reduceMotion.matches ? 1 : progress(route, 0.85, 0.2);
    box.style.setProperty("--dist", `${p * 100}%`);
    route.style.setProperty("--dash", String(1 - p));
    path.style.strokeDashoffset = String(1 - p);
    route.classList.toggle("is-back", p > backStart + 0.02 && p < 1.01);
    tips.forEach((t, k) => t.classList.toggle("is-on", p + 0.005 >= stopsAt[k]));
  };
  scrubbers.push(tick); tick();
  reduceMotion.addEventListener("change", tick);
}

initMenu();
initTerminals();
initRing();
initGraph();
initParticles();
initScenes();
initRoute();
initBitset();
initHotspots();
initShine();
initStage();
initCopy();
initAudience();
initDocsNav();
initToc();
initReveal();
