import sharp from "sharp";
const [file, chunk = "1300"] = process.argv.slice(2);
const m = await sharp(file).metadata();
const H = Number(chunk); let i = 0;
for (let y = 0; y < m.height; y += H, i++) {
  await sharp(file).extract({ left: 0, top: y, width: m.width, height: Math.min(H, m.height - y) }).toFile(file.replace(/\.png$/, `.part${i}.png`));
}
console.log(file, m.width, m.height, i);
