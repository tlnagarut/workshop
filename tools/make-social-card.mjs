/* ============================================================================
 * Makes the 1200×630 link-preview image that WhatsApp, Facebook and others
 * show when someone shares the site. LOCAL ONLY — needs libvips
 * (`brew install vips`); the JPG is committed, so the deploy doesn't run this.
 *   node tools/make-social-card.mjs
 *
 * A simple card with the business name and what we do. Replace it with a real
 * workshop photo later by pointing SOCIAL_IMAGE in tools/build-pages.mjs at a
 * 1200×630 JPG.
 * ========================================================================== */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "img", "tlnagarut-custom-cabinets-solid-wood-doors-haifa.jpg");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a5a37"/>
      <stop offset="1" stop-color="#4a2d17"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#f3d8bd" stroke-opacity="0.45" stroke-width="2"/>
  <text x="600" y="270" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="124" font-weight="600" fill="#fbf6ee" letter-spacing="2">TLnagarut</text>
  <text x="600" y="350" text-anchor="middle" font-family="'Arial Hebrew', Arial, sans-serif"
        font-size="52" fill="#f3d8bd" direction="rtl">TL נגרות</text>
  <line x1="510" y1="398" x2="690" y2="398" stroke="#f3d8bd" stroke-opacity="0.7" stroke-width="2"/>
  <text x="600" y="466" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="42" fill="#fbf6ee">Custom cabinets and solid wood doors in Haifa</text>
</svg>
`;

const tmp = mkdtempSync(join(tmpdir(), "tln-card-"));
try {
  const src = join(tmp, "card.svg");
  writeFileSync(src, svg);
  execFileSync("vips", ["copy", src, `${out}[Q=88,optimize_coding,interlace,keep=none]`]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`Wrote ${out.replace(root + "/", "")} (${Math.round(statSync(out).size / 1024)} KB)`);
