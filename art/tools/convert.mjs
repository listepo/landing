import sharp from "sharp";
const out = "/workspace/sm/public/images";
const art = "/workspace/art";
const jobs = [];
for (const p of ["home", "rtok", "cox", "ketch"]) {
  for (const w of [1200, 2400]) {
    const img = () => sharp(`${art}/${p}-hero.png`).resize(w);
    jobs.push(img().webp({ quality: 78 }).toFile(`${out}/${p}/hero-${w}.webp`));
    jobs.push(img().avif({ quality: 55 }).toFile(`${out}/${p}/hero-${w}.avif`));
  }
  if (p !== "home") for (const w of [400, 800]) {
    const img = () => sharp(`${art}/${p}-prop.png`).resize(w);
    jobs.push(img().webp({ quality: 80 }).toFile(`${out}/${p}/prop-${w}.webp`));
    jobs.push(img().avif({ quality: 55 }).toFile(`${out}/${p}/prop-${w}.avif`));
  }
}
await Promise.all(jobs);
console.log("converted", jobs.length);
