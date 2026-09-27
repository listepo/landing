// Faithful full-page capture: scroll the real viewport and stitch tiles (fixed mesh + sticky nav render as users see them).
// Usage: node shoot.mjs <chromePath> <baseUrl> <outDir>
import puppeteer from "puppeteer-core";
import sharp from "sharp";
const [chrome, base, out] = process.argv.slice(2);
const shots = [
  ["home-desktop", "/", 1440, 900],
  ["home-mobile", "/", 390, 844],
  ["rtok-desktop", "/rtok/", 1440, 900],
  ["cox-desktop", "/cox/", 1440, 900],
  ["ketch-desktop", "/ketch/", 1440, 900],
];
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"] });
for (const [name, path, w, vh] of shots) {
  const page = await browser.newPage();
  const mobile = w < 600;
  await page.setViewport({ width: w, height: vh, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(base + path, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}*,*::before,*::after{animation-play-state:paused!important;transition:none!important}" });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const tiles = [];
  for (let y = 0; y < total; y += vh) {
    const top = Math.min(y, total - vh);
    await page.evaluate((t) => window.scrollTo(0, t), top);
    if (y > 0) await page.addStyleTag({ content: ".nav{visibility:hidden}" });
    await new Promise((r) => setTimeout(r, 250));
    const buf = await page.screenshot({ type: "png" });
    tiles.push({ buf, top });
  }
  const s = mobile ? 2 : 1;
  await sharp({ create: { width: w * s, height: total * s, channels: 3, background: "#000" } })
    .composite(tiles.map((t) => ({ input: t.buf, left: 0, top: t.top * s }))).png().toFile(`${out}/${name}.png`);
  await page.close();
  console.log(name, total);
}
await browser.close();
