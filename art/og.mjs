import { writeFileSync } from "node:fs";
const cards = {
  home: { t: "Tiller", s: "Ship with agents. Keep the receipts.", k: "Open-source core · Pro for teams", a: "#4C8DFF", b: "#3EE6C4", mono: false },
  rtok: { t: "rtok", s: "Token-reduction CLI for AI coding agents — hooks, an MCP server and an API proxy in one Rust binary.", k: "Open source · v0.10.0", a: "#5CE1FF", b: "#FF6B4A", mono: true },
  cox: { t: "cox", s: "A modular terminal coding agent in Rust with a safe, event-driven core.", k: "Open source · v0.1.0", a: "#A8E06C", b: "#6FD6B4", mono: true },
  ketch: { t: "ketch", s: "Catch releases straight from GitHub.", k: "Open source · v0.6.0", a: "#3DDCB0", b: "#5CC8FF", mono: true },
};
for (const [k, c] of Object.entries(cards)) {
  writeFileSync(`og-${k}.html`, `<!doctype html><html><head><style>
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#000;font-family:"Noto Sans",system-ui,sans-serif}
  .bg{position:absolute;inset:0;background:url(${k}-hero.png) 70% 50%/cover}
  .fade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,8,14,.95) 0%,rgba(5,8,14,.8) 42%,rgba(5,8,14,.1) 80%)}
  .c{position:absolute;left:72px;top:0;bottom:0;width:620px;display:flex;flex-direction:column;justify-content:center;gap:22px}
  .k{font-size:20px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${c.a}}
  .t{font-size:${c.mono ? 120 : 110}px;font-weight:800;letter-spacing:-.05em;line-height:.95;color:#fff;${c.mono ? 'font-family:"DejaVu Sans Mono",monospace;' : ""}}
  .t span{color:${c.a}}
  .s{font-size:30px;line-height:1.3;color:#c9d1dc;font-weight:500}
  .brand{position:absolute;left:72px;bottom:48px;display:flex;align-items:center;gap:12px;color:#fff;font-weight:700;font-size:22px}
  .m{width:28px;height:28px;border-radius:8px;background:conic-gradient(from 210deg,#4C8DFF,#3EE6C4,#4C8DFF);position:relative}
  .m::after{content:"";position:absolute;inset:8px;border-radius:3px;background:#070910}
  .edge{position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
  </style></head><body><div class="bg"></div><div class="fade"></div>
  <div class="c"><div class="k">${c.k}</div><div class="t">${c.t}<span>.</span></div><div class="s">${c.s}</div></div>
  <div class="brand"><span class="m"></span>Tiller</div><div class="edge"></div></body></html>`);
}
