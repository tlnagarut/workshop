// Generates lightweight SVG placeholder images so the site looks complete
// before real photos are added. Run: node tools/generate-placeholders.mjs
// Safe to re-run; it only writes placeholder files.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Don't overwrite a project that already has real (non-SVG) photos.
function hasRealPhotos(slug) {
  const dir = join(root, "assets", "projects", slug);
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f));
}

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

// Discover project folders dynamically (matches build-projects.mjs), so a
// newly added project with no photos still gets placeholder images.
const projects = readdirSync(join(root, "assets", "projects"), {
  withFileTypes: true,
})
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

projects.forEach((id, idx) => {
  if (hasRealPhotos(id)) {
    console.log("skip", id, "(already has real photos)");
    return;
  }
  const palette = palettes[idx % palettes.length];
  write(
    `assets/projects/${id}/cover.svg`,
    woodGrainSvg({ w: 1200, h: 900, palette, label: "PHOTO", seed: idx + 1 })
  );
  for (let n = 1; n <= 3; n++) {
    write(
      `assets/projects/${id}/0${n}.svg`,
      woodGrainSvg({ w: 1600, h: 1100, palette, label: `PHOTO ${n}`, seed: idx + n + 1 })
    );
  }
});

// Hero + social-share image.
write(
  "assets/img/hero.svg",
  woodGrainSvg({ w: 1920, h: 1080, palette: palettes[2], label: "", seed: 9 })
);
write(
  "assets/img/og-image.svg",
  woodGrainSvg({ w: 1200, h: 630, palette: palettes[2], label: "TL NAGARUT", seed: 4 })
);

console.log("Done.");
