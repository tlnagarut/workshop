/* ============================================================================
 * Small copies of the project photos for the Projects page tiles. LOCAL ONLY —
 * needs libvips (`brew install vips`); the deploy does not run this, because
 * the tiles are committed.  Run:  node tools/make-project-tiles.mjs
 *
 * The photos in assets/projects/<slug>/ are already web-ready and are never
 * changed; tapping a tile still opens that photo. For each one this writes
 *   assets/projects/<slug>/tiles/<same file name>
 * 800 px wide (never upscaled), JPEG, metadata stripped. No crop or filters:
 * the tile shape (4:3) comes from the page layout. Tiles newer than their
 * photo are skipped; tiles whose photo is gone are removed.
 * ========================================================================== */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectsDir = join(root, "assets", "projects");
const WIDTH = 800;

let made = 0, skipped = 0;
if (!existsSync(projectsDir)) {
  console.log("  (no assets/projects folder — nothing to do)");
} else {
  for (const slug of readdirSync(projectsDir)) {
    const dir = join(projectsDir, slug);
    if (!statSync(dir).isDirectory()) continue;
    const photos = readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f));
    const tilesDir = join(dir, "tiles");
    mkdirSync(tilesDir, { recursive: true });

    for (const file of photos) {
      const src = join(dir, file);
      const out = join(tilesDir, file);
      if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) { skipped++; continue; }
      execFileSync("vips", ["thumbnail", src, `${out}[Q=80,optimize_coding,interlace,keep=none]`,
        String(WIDTH), "--height", "10000", "--size", "down"]);
      console.log(`  ▸ ${slug}/tiles/${file}`);
      made++;
    }
    for (const file of readdirSync(tilesDir)) {
      if (!file.startsWith(".") && !photos.includes(file)) {
        unlinkSync(join(tilesDir, file));
        console.log(`  − removed ${slug}/tiles/${file}`);
      }
    }
  }
}
console.log(`Project tiles: ${made} made, ${skipped} unchanged`);
