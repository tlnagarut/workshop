/* ============================================================================
 * Turns the owner's original photos into web-ready files. LOCAL ONLY — needs
 * libvips (`brew install vips`); the deploy does not run this, because the
 * finished files are committed.  Run:  node tools/process-photos.mjs
 *
 * Originals stay OUTSIDE the site folder and are never modified:
 *   ~/dev/tl-nagarut-photos/<group>/<file>      (override with PHOTOS_DIR=...;
 *   PHOTOS_CONFIG= and PHOTOS_OUT= override the list and output, for testing)
 * Which photos to use, and their file names / alt text / captions, are listed
 * in content/photos.yml. Each group is one place on the site:
 *   hero      → home-page banner, cropped 16:9
 *   anything else (workshop, spray, …) → gallery tiles, cropped 4:3
 *
 * For every photo it: rotates it upright (using the phone's rotation tag),
 * crops it to the group's shape keeping the most important part in frame
 * (libvips "attention" crop, or `focus:` from photos.yml), converts colours
 * to sRGB, strips camera/GPS metadata, and saves 480/800/1200/1600 px wide
 * versions as WebP + JPEG, each under ~300 KB. No filters or retouching.
 *
 * Output: assets/img/photos/<group>/<name>-<width>.{webp,jpg}
 *         assets/img/photos/manifest.json   (read by tools/build-pages.mjs)
 * Photos whose original hasn't changed since the last run are skipped.
 * ========================================================================== */
import { execFileSync } from "node:child_process";
import {
  existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync,
  statSync, unlinkSync, writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml } from "./yaml.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const originalsDir = process.env.PHOTOS_DIR || join(homedir(), "dev", "tl-nagarut-photos");
const outRoot = process.env.PHOTOS_OUT || join(root, "assets", "img", "photos");
const configFile = process.env.PHOTOS_CONFIG || join(root, "content", "photos.yml");
const manifestFile = join(outRoot, "manifest.json");

const WIDTHS = [480, 800, 1200, 1600];
const MAX_BYTES = 300 * 1024;
const SHAPES = { hero: [16, 9] }; // every other group is 4:3
const DEFAULT_SHAPE = [4, 3];
// focus: in photos.yml → libvips crop mode. "low" keeps the top/left edge,
// "high" keeps the bottom/right edge.
const FOCUS = {
  attention: "attention", centre: "centre", center: "centre",
  top: "low", left: "low", bottom: "high", right: "high",
};
const VERSION = 1; // bump to force every photo to be re-processed

function vips(...args) {
  return execFileSync("vips", args, { encoding: "utf8" }).trim();
}
function header(file, field) {
  return Number(execFileSync("vipsheader", ["-f", field, file], { encoding: "utf8" }).trim());
}
function slugify(s) {
  return String(s).toLowerCase().replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Save `src` at `width` px as `out`, lowering quality until it fits MAX_BYTES.
function saveSized(src, out, width, height, format) {
  for (let q = format === "webp" ? 80 : 82; q >= 50; q -= 6) {
    const opts = format === "webp"
      ? `[Q=${q},keep=none]`
      : `[Q=${q},optimize_coding,interlace,keep=none]`;
    vips("thumbnail", src, out + opts, String(width), "--height", String(height));
    if (statSync(out).size <= MAX_BYTES) return;
  }
  console.warn(`  ! ${out} is still over ${MAX_BYTES / 1024} KB at the lowest quality`);
}

function processPhoto(group, entry, srcFile, tmp) {
  const [aw, ah] = SHAPES[group] || DEFAULT_SHAPE;
  const crop = FOCUS[String(entry.focus || "attention").toLowerCase()] || "attention";

  // 1. Rotate upright using the EXIF orientation tag, then read the real size.
  //    `rotate: 90 / 180 / 270` in photos.yml turns it further (clockwise) for
  //    the odd photo whose phone tag is wrong.
  let upright = join(tmp, "upright.v");
  vips("autorot", srcFile, upright);
  const turn = { 90: "d90", 180: "d180", 270: "d270" }[Number(entry.rotate)];
  if (turn) {
    const turned = join(tmp, "turned.v");
    vips("rot", upright, turned, turn);
    upright = turned;
  }
  const w0 = header(upright, "width");
  const h0 = header(upright, "height");

  // 2. Crop once, at the largest size, so every width shows the same framing.
  const master = Math.min(WIDTHS[WIDTHS.length - 1], w0, Math.floor((h0 * aw) / ah));
  const masterH = Math.round((master * ah) / aw);
  const masterFile = join(tmp, "master.v");
  vips("thumbnail", upright, masterFile, String(master), "--height", String(masterH),
    "--crop", crop, "--export-profile", "srgb");

  // 3. Resize the crop to each width (never upscaling) and encode.
  let widths = WIDTHS.filter((w) => w <= master);
  if (!widths.length) widths = [master];
  const dir = join(outRoot, group);
  mkdirSync(dir, { recursive: true });
  for (const w of widths) {
    const h = Math.round((w * ah) / aw);
    saveSized(masterFile, join(dir, `${entry.name}-${w}.webp`), w, h, "webp");
    saveSized(masterFile, join(dir, `${entry.name}-${w}.jpg`), w, h, "jpg");
  }
  const big = widths[widths.length - 1];
  return { name: entry.name, file: entry.file, shape: `${aw}:${ah}`, widths,
    width: big, height: Math.round((big * ah) / aw) };
}

function main() {
  try { execFileSync("vips", ["--version"], { stdio: "ignore" }); }
  catch {
    console.log("  (libvips not installed — skipping photo processing; run: brew install vips)");
    return;
  }
  if (!existsSync(originalsDir)) {
    console.log(`  (no originals folder at ${originalsDir} — keeping the processed photos as they are)`);
    return;
  }

  const config = parseYaml(readFileSync(configFile, "utf8"));
  const old = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : {};
  const manifest = {};
  const tmp = mkdtempSync(join(tmpdir(), "tln-photos-"));
  let processed = 0, skipped = 0;

  try {
    for (const [group, list] of Object.entries(config)) {
      if (!Array.isArray(list)) continue; // an empty group
      manifest[group] = [];
      for (const raw of list) {
        if (!raw || !raw.file) continue;
        const entry = { ...raw, name: slugify(raw.name || raw.file) };
        if (!raw.name) console.warn(`  ! ${group}/${raw.file}: no "name" — using "${entry.name}"; give it a descriptive one`);
        const srcFile = join(originalsDir, group, raw.file);
        const prev = (old[group] || []).find((p) => p.name === entry.name);

        if (!existsSync(srcFile)) {
          console.warn(`  ! original not found: ${group}/${raw.file}`);
          if (prev) manifest[group].push(prev); // keep what was processed before
          continue;
        }
        const st = statSync(srcFile);
        const stamp = `${VERSION}|${st.size}|${Math.round(st.mtimeMs)}|${entry.focus || ""}|${raw.file}` +
          (entry.rotate ? `|r${entry.rotate}` : "");
        const outputsExist = prev && prev.widths.every((w) =>
          existsSync(join(outRoot, group, `${entry.name}-${w}.webp`)) &&
          existsSync(join(outRoot, group, `${entry.name}-${w}.jpg`)));
        if (prev && prev.stamp === stamp && outputsExist) {
          manifest[group].push(prev);
          skipped++;
          continue;
        }
        console.log(`  ▸ ${group}/${raw.file} → ${entry.name}`);
        manifest[group].push({ ...processPhoto(group, entry, srcFile, tmp), stamp });
        processed++;
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  // Remove processed files that no longer belong to any listed photo.
  if (existsSync(outRoot)) {
    for (const group of readdirSync(outRoot)) {
      const dir = join(outRoot, group);
      if (!statSync(dir).isDirectory()) continue;
      const keep = new Set((manifest[group] || []).flatMap((p) =>
        p.widths.flatMap((w) => [`${p.name}-${w}.webp`, `${p.name}-${w}.jpg`])));
      for (const f of readdirSync(dir)) {
        if (!f.startsWith(".") && !keep.has(f)) { unlinkSync(join(dir, f)); console.log(`  − removed ${group}/${f}`); }
      }
    }
  }

  mkdirSync(outRoot, { recursive: true });
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Photos: ${processed} processed, ${skipped} unchanged`);
}

main();
