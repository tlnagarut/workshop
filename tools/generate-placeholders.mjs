// Generates the lightweight SVG wood-tone graphics used where there is no real
// photo yet. Run: node tools/generate-placeholders.mjs
// Safe to re-run; it only writes these two files.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Warm wood-tone palettes (top, bottom) for variety.
const palettes = [
  ["#c79a6b", "#8a5a37"],
  ["#d8b88f", "#9c6a3f"],
  ["#b98a55", "#6f4423"],
  ["#cda980", "#7d5230"],
  ["#e0c39c", "#a9743f"],
  ["#bf9263", "#73492a"],
];

function woodGrainSvg({ w, h, palette, label, seed = 1 }) {
  const [c1, c2] = palette;
  // A few gentle "grain" arcs for a hand-made, woody feel.
  const lines = [];
  const count = 7;
  for (let i = 0; i < count; i++) {
    const y = (h / (count + 1)) * (i + 1);
    const wobble = ((seed * (i + 3)) % 5) * 6 + 18;
    const op = 0.06 + ((i % 3) * 0.03);
    lines.push(
      `<path d="M ${-20} ${y} Q ${w / 2} ${y - wobble} ${w + 20} ${y}" ` +
        `fill="none" stroke="#3a2615" stroke-width="${2 + (i % 2)}" stroke-opacity="${op}"/>`
    );
  }
  const labelSvg = label
    ? `<text x="${w / 2}" y="${h - 26}" text-anchor="middle" ` +
      `font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(w / 22)}" ` +
      `fill="#fbf6ee" fill-opacity="0.92" letter-spacing="1.5">${label}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  ${lines.join("\n  ")}
  <rect width="${w}" height="${h}" fill="none" stroke="#3a2615" stroke-opacity="0.08" stroke-width="2"/>
  ${labelSvg}
</svg>\n`;
}

function write(rel, contents) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
  console.log("wrote", rel);
}

// Plain wood-tone background for the home-page banner (used until a real
// "hero" photo is listed in content/photos.yml) and the browser-tab icon.
write(
  "assets/img/hero.svg",
  woodGrainSvg({ w: 1920, h: 1080, palette: palettes[2], label: "", seed: 9 })
);
write(
  "assets/img/og-image.svg",
  woodGrainSvg({ w: 1200, h: 630, palette: palettes[2], label: "TLnagarut", seed: 4 })
);

console.log("Done.");
