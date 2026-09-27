import sharp from "sharp";
const [out, ...files] = process.argv.slice(2);
const tiles = await Promise.all(files.map(f => sharp(f).resize(720, 480, { fit: "contain", background: "#222" }).png().toBuffer()));
const cols = 2, rows = Math.ceil(tiles.length / cols);
await sharp({ create: { width: 720 * cols, height: 480 * rows, channels: 3, background: "#222" } })
  .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * 720, top: Math.floor(i / cols) * 480 }))).png().toFile(out);
