// Procedural abstract "glass" art. Renders SVG scenes to HTML; Chrome screenshots them.
import { writeFileSync } from "node:fs";

const ISO = (x, y) => [ (x - y) * 0.866, (x + y) * 0.5 ];
const pts = (a) => a.map(p => p.join(",")).join(" ");
let uid = 0;
const id = (p) => `${p}${uid++}`;

function defsCommon(w, h) {
  return `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0"/>
  </filter>
  <filter id="blur80" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="150"/></filter>
  <filter id="blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
  <filter id="blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="blur4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  <radialGradient id="vign" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".7"/></radialGradient>`;
}
function bg(w, h, base, blobs) {
  return `<rect width="${w}" height="${h}" fill="${base}"/>
  <g filter="url(#blur80)">${blobs.map(b => `<ellipse cx="${b[0]}" cy="${b[1]}" rx="${b[2]}" ry="${b[3]}" fill="${b[4]}" opacity="${b[5]}"/>`).join("")}</g>`;
}
function finish(w, h) {
  return `<rect width="${w}" height="${h}" fill="url(#vign)"/><rect width="${w}" height="${h}" filter="url(#grain)"/>`;
}
function page(w, h, svg) {
  return `<!doctype html><html><head><style>html,body{margin:0;background:#000}svg{display:block}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg></body></html>`;
}

/* ---------- isometric glass panel ---------- */
function isoPanel(cx, cy, W, D, thick, accent, content) {
  const g = id("pg"), s = id("ps");
  const c = (x, y, z = 0) => { const [a, b] = ISO(x, y); return [cx + a, cy + b - z]; };
  const top = [c(0,0,thick), c(W,0,thick), c(W,D,thick), c(0,D,thick)];
  const left = [c(0,D,thick), c(W,D,thick), c(W,D,0), c(0,D,0)];
  const right = [c(W,0,thick), c(W,D,thick), c(W,D,0), c(W,0,0)];
  let inner = "";
  if (content) inner = content(c, thick);
  const shadow = [c(20,40,0), c(W+40,40,0), c(W+40,D+60,0), c(20,D+60,0)];
  return `
  <defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".45" stop-color="${accent}" stop-opacity=".10"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".04"/>
    </linearGradient>
    <linearGradient id="${s}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity=".45"/><stop offset="1" stop-color="${accent}" stop-opacity=".08"/></linearGradient>
  </defs>
  <polygon points="${pts(shadow)}" fill="#000" opacity=".55" filter="url(#blur30)"/>
  <polygon points="${pts(shadow)}" fill="${accent}" opacity=".16" filter="url(#blur30)"/>
  <polygon points="${pts(left)}" fill="url(#${s})"/>
  <polygon points="${pts(right)}" fill="url(#${s})" opacity=".7"/>
  <polygon points="${pts(top)}" fill="#0b1220" opacity=".55"/>
  <polygon points="${pts(top)}" fill="url(#${g})" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
  <polyline points="${pts([top[3], top[0], top[1]])}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/>
  ${inner}`;
}
const isoBar = (c, z, x, y, w, h, fill, op) => `<polygon points="${pts([c(x,y,z), c(x+w,y,z), c(x+w,y+h,z), c(x,y+h,z)])}" fill="${fill}" opacity="${op}"/>`;
const isoDot = (c, z, x, y, r, fill, op) => { const [px, py] = c(x, y, z); return `<ellipse cx="${px}" cy="${py}" rx="${r*1.2}" ry="${r*0.7}" fill="${fill}" opacity="${op}"/>`; };

/* ---------- isometric glass cube ---------- */
function isoCube(cx, cy, S, H, color, alpha, mode = "solid") {
  const c = (x, y, z = 0) => { const [a, b] = ISO(x, y); return [cx + a, cy + b - z]; };
  const top = [c(0,0,H), c(S,0,H), c(S,S,H), c(0,S,H)];
  const left = [c(0,S,H), c(S,S,H), c(S,S,0), c(0,S,0)];
  const right = [c(S,0,H), c(S,S,H), c(S,S,0), c(S,0,0)];
  const g = id("cg");
  if (mode === "ghost") {
    return `<g opacity=".9"><polygon points="${pts(top)}" fill="none" stroke="${color}" stroke-opacity=".75" stroke-width="2.5" stroke-dasharray="10 8"/>
    <polygon points="${pts(left)}" fill="${color}" opacity=".06" stroke="${color}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="10 8"/>
    <polygon points="${pts(right)}" fill="${color}" opacity=".05" stroke="${color}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="10 8"/></g>`;
  }
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${.5*alpha}"/><stop offset=".5" stop-color="${color}" stop-opacity="${.55*alpha}"/><stop offset="1" stop-color="${color}" stop-opacity="${.18*alpha}"/></linearGradient></defs>
  <polygon points="${pts([c(0,0,0), c(S,0,0), c(S,S,0), c(0,S,0)])}" fill="${color}" opacity="${.35*alpha}" filter="url(#blur12)"/>
  <polygon points="${pts(left)}" fill="${color}" opacity="${.42*alpha}"/>
  <polygon points="${pts(right)}" fill="${color}" opacity="${.24*alpha}"/>
  <polygon points="${pts(top)}" fill="url(#${g})"/>
  <polygon points="${pts(top)}" fill="none" stroke="#fff" stroke-opacity="${.75*alpha}" stroke-width="2"/>
  <polyline points="${pts([left[0], left[3]])}" stroke="#fff" stroke-opacity="${.3*alpha}" stroke-width="1.5"/>
  <polyline points="${pts([top[2], left[2]])}" stroke="#fff" stroke-opacity="${.55*alpha}" stroke-width="2"/>`;
}

/* ---------- glass ring ---------- */
function ringDefs(key, a, b) {
  return `<linearGradient id="rg${key}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".3" stop-color="${a}" stop-opacity=".75"/>
    <stop offset=".7" stop-color="${b}" stop-opacity=".35"/><stop offset="1" stop-color="${a}" stop-opacity=".6"/></linearGradient>`;
}
function ring(cx, cy, r, sw, key, rot = 0, tilt = 1, extra = "") {
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(1 ${tilt})" ${extra}>
    <circle r="${r}" fill="none" stroke="url(#rg${key})" stroke-width="${sw}" opacity=".5" filter="url(#blur30)"/>
    <circle r="${r}" fill="none" stroke="url(#rg${key})" stroke-width="${sw}" opacity=".55"/>
    <circle r="${r + sw/2 - 3}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>
    <circle r="${r - sw/2 + 3}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>
    <circle r="${r}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="${sw*0.18}" stroke-dasharray="${r*1.2} ${r*6}" stroke-linecap="round" transform="rotate(-130)"/>
  </g>`;
}

/* ---------- glass sphere ---------- */
function sphere(cx, cy, r, color) {
  const g = id("sg");
  return `<defs><radialGradient id="${g}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${color}" stop-opacity=".55"/><stop offset=".75" stop-color="${color}" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></radialGradient></defs>
  <circle cx="${cx}" cy="${cy + r*0.9}" r="${r*0.8}" fill="${color}" opacity=".25" filter="url(#blur30)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>
  <circle cx="${cx}" cy="${cy}" r="${r-1.5}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>
  <ellipse cx="${cx - r*0.35}" cy="${cy - r*0.45}" rx="${r*0.28}" ry="${r*0.14}" fill="#fff" opacity=".55" transform="rotate(-30 ${cx - r*0.35} ${cy - r*0.45})" filter="url(#blur4)"/>`;
}

/* ================= SCENES ================= */
const scenes = {};

scenes["home-hero"] = () => {
  const W = 2400, H = 1600, A = "#4C8DFF", B = "#3EE6C4";
  let s = defsCommon(W, H) + bg(W, H, "#070a12", [[700, 500, 700, 420, A, .45], [1800, 1000, 600, 420, B, .30], [1300, 1500, 500, 260, "#8a6bff", .08]]);
  const panel = (y, acc, kind) => isoPanel(1350, y, 900, 620, 18, acc, (c, z) => {
    let o = isoBar(c, z, 0, 0, 900, 70, "#fff", .06);
    o += isoDot(c, z, 40, 35, 9, "#ff6b6b", .7) + isoDot(c, z, 75, 35, 9, "#ffcc66", .7) + isoDot(c, z, 110, 35, 9, "#5ee39a", .7);
    if (kind === "editor") for (let i = 0; i < 9; i++) o += isoBar(c, z, 60 + (i % 3) * 30, 110 + i * 52, 260 + ((i * 97) % 380), 18, i % 4 === 1 ? B : "#fff", i % 4 === 1 ? .55 : .22);
    if (kind === "chat") { o += isoBar(c, z, 60, 120, 520, 110, A, .28) + isoBar(c, z, 320, 270, 520, 90, "#fff", .12) + isoBar(c, z, 60, 400, 460, 130, A, .22); }
    if (kind === "term") for (let i = 0; i < 7; i++) o += isoBar(c, z, 60, 120 + i * 64, 40, 18, B, .8) + isoBar(c, z, 120, 120 + i * 64, 200 + ((i * 131) % 460), 18, "#fff", .25);
    return o;
  });
  s += panel(760, B, "term") + panel(520, A, "chat") + panel(280, "#9ab8ff", "editor");
  return page(W, H, s + finish(W, H));
};

scenes["rtok-hero"] = () => {
  const W = 2400, H = 1600, A = "#5CE1FF", C = "#FF6B4A";
  let s = defsCommon(W, H) + bg(W, H, "#06101A", [[800, 600, 700, 420, A, .35], [1800, 1100, 520, 360, C, .22], [1500, 300, 500, 260, A, .15]]);
  const map = ["KKTC","KCKT","TKKC","KTKK"];
  const S = 150, gap = 40;
  let cubes = [];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) cubes.push([x, y, map[y][x]]);
  cubes.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const [x, y, t] of cubes) {
    const [ox, oy] = ISO(x * (S + gap), y * (S + gap));
    const cx = 1300 + ox, cy = 430 + oy;
    if (t === "K") s += isoCube(cx, cy, S, 150, A, 1);
    if (t === "T") s += isoCube(cx, cy + 0, S, 60, "#7aa3b8", .55);
    if (t === "C") s += isoCube(cx, cy, S, 150, C, 1, "ghost");
  }
  return page(W, H, s + finish(W, H));
};

scenes["cox-hero"] = () => {
  const W = 2400, H = 1600, A = "#A8E06C", B = "#3D8B3A";
  let s = `<defs>${defsCommon(W, H)}${ringDefs("a", A, B)}${ringDefs("b", "#d9f5b8", A)}${ringDefs("c", A, "#2c5f5a")}
  <clipPath id="front"><rect x="0" y="0" width="${W}" height="800"/></clipPath></defs>` + bg(W, H, "#070b08", [[900, 700, 700, 420, A, .28], [1700, 900, 520, 360, B, .35], [1400, 300, 400, 260, "#6fe0c8", .10]]);
  s += ring(1150, 800, 360, 70, "a", -20, .62);
  s += ring(1600, 800, 360, 70, "b", 25, .62);
  s += `<g clip-path="url(#front)">${ring(1150, 800, 360, 70, "a", -20, .62)}</g>`;
  s += ring(1380, 560, 230, 46, "c", 70, .5);
  return page(W, H, s + finish(W, H));
};

scenes["ketch-hero"] = () => {
  const W = 2400, H = 1600, A = "#3DDCB0", B = "#0F6F5C";
  let s = defsCommon(W, H) + bg(W, H, "#061210", [[900, 600, 700, 420, A, .28], [1700, 1100, 560, 360, B, .45], [1600, 300, 420, 240, "#5cc8ff", .12]]);
  // floating window (flat glass, slight perspective via skew)
  s += `<g transform="translate(1000 380) skewY(-6)">
    <rect x="30" y="60" width="1000" height="700" rx="36" fill="#000" opacity=".6" filter="url(#blur30)"/>
    <rect width="1000" height="700" rx="36" fill="#0c1a18" opacity=".55"/>
    <rect width="1000" height="700" rx="36" fill="url(#wg)" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
    <rect width="1000" height="80" rx="36" fill="#fff" opacity=".05"/>
    <circle cx="50" cy="40" r="11" fill="#ff6b6b" opacity=".75"/><circle cx="88" cy="40" r="11" fill="#ffcc66" opacity=".75"/><circle cx="126" cy="40" r="11" fill="#5ee39a" opacity=".75"/>
    ${[0,1,2,3,4].map(i => `<g transform="translate(60 ${130 + i*110})">
      <rect width="880" height="84" rx="18" fill="#fff" opacity="${i===1?.10:.045}" stroke="#fff" stroke-opacity="${i===1?.25:.08}"/>
      <rect x="24" y="22" width="40" height="40" rx="10" fill="${A}" opacity=".5"/>
      <rect x="90" y="26" width="${180 + (i*83)%160}" height="14" rx="7" fill="#fff" opacity=".55"/>
      <rect x="90" y="50" width="${120 + (i*61)%120}" height="10" rx="5" fill="#fff" opacity=".22"/>
      <circle cx="830" cy="42" r="16" fill="${A}" opacity="${i===3?.2:.75}"/>
      <path d="M822 42l6 6 11-12" fill="none" stroke="#062019" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="${i===3?0:1}"/>
    </g>`).join("")}
  </g>
  <defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="${A}" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".03"/></linearGradient></defs>`;
  s += sphere(900, 1120, 90, A) + sphere(2100, 420, 60, "#5cc8ff") + sphere(2060, 1180, 120, A);
  return page(W, H, s + finish(W, H));
};

scenes["rtok-prop"] = () => {
  const W = 800, H = 800, A = "#5CE1FF", C = "#FF6B4A";
  let s = defsCommon(W, H) + `<rect width="800" height="800" fill="#06101A"/>`;
  s += `<g filter="url(#blur80)"><circle cx="400" cy="420" r="220" fill="${A}" opacity=".35"/><circle cx="560" cy="560" r="140" fill="${C}" opacity=".25"/></g>`;
  s += isoCube(400, 320, 150, 150, A, 1) + isoCube(270, 400, 150, 60, "#7aa3b8", .55) + isoCube(530, 400, 150, 150, C, 1, "ghost") + isoCube(400, 480, 150, 150, A, 1);
  return page(W, H, s + finish(W, H));
};
scenes["cox-prop"] = () => {
  const W = 800, H = 800, A = "#A8E06C", B = "#3D8B3A";
  let s = `<defs>${defsCommon(W, H)}${ringDefs("a", A, B)}${ringDefs("b", "#d9f5b8", A)}<clipPath id="f"><rect width="800" height="400"/></clipPath></defs><rect width="800" height="800" fill="#070b08"/>`;
  s += `<g filter="url(#blur80)"><circle cx="400" cy="400" r="240" fill="${A}" opacity=".3"/></g>`;
  s += ring(330, 400, 170, 42, "a", -25, .7) + ring(470, 400, 170, 42, "b", 20, .7) + `<g clip-path="url(#f)">${ring(330, 400, 170, 42, "a", -25, .7)}</g>`;
  return page(W, H, s + finish(W, H));
};
scenes["ketch-prop"] = () => {
  const W = 800, H = 800, A = "#3DDCB0";
  let s = `<defs>${defsCommon(W, H)}${ringDefs("a", A, "#0F6F5C")}</defs><rect width="800" height="800" fill="#061210"/>`;
  s += `<g filter="url(#blur80)"><circle cx="400" cy="420" r="230" fill="${A}" opacity=".3"/></g>`;
  s += sphere(400, 400, 170, A) + ring(400, 400, 260, 16, "a", -18, .28) + sphere(640, 330, 28, "#5cc8ff");
  return page(W, H, s + finish(W, H));
};

for (const [name, fn] of Object.entries(scenes)) writeFileSync(`${name}.html`, fn());
console.log(Object.keys(scenes).join(" "));
