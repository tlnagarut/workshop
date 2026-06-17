// Stamp cache-busting ?v=<hash> query strings on versioned CSS/JS references.
//
// For every *.html in the repo root, finds asset references that already carry
// a ?v= query (e.g. styles.css?v=9) and rewrites the value to a short content
// hash of the referenced file. Each asset is versioned independently, so a
// visitor's cache only busts for files that actually changed.
//
// Run: node tools/stamp-versions.mjs   (invoked by build.sh)

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Matches  href="assets/css/styles.css?v=9"  or  src="assets/js/main.js?v=2"
// Captures: 1=attr+path up to the file, 2=the asset path, 3=closing quote tail
const REF = /((?:href|src)="(assets\/[^"?]+\.(?:css|js))\?v=)[^"]*(")/g;

const hashCache = new Map();
function hashOf(assetPath) {
  if (hashCache.has(assetPath)) return hashCache.get(assetPath);
  const full = join(root, assetPath);
  if (!existsSync(full)) {
    console.warn(`  ⚠ referenced asset not found, leaving as-is: ${assetPath}`);
    return null;
  }
  const h = createHash("md5").update(readFileSync(full)).digest("hex").slice(0, 8);
  hashCache.set(assetPath, h);
  return h;
}

const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));
let totalChanged = 0;

for (const file of htmlFiles) {
  const path = join(root, file);
  const before = readFileSync(path, "utf8");
  const after = before.replace(REF, (match, head, assetPath, tail) => {
    const h = hashOf(assetPath);
    return h === null ? match : `${head}${h}${tail}`;
  });
  if (after !== before) {
    writeFileSync(path, after);
    totalChanged++;
    console.log(`  ✓ stamped ${file}`);
  }
}

console.log(
  totalChanged === 0
    ? "  (versions already up to date)"
    : `  updated ${totalChanged} file(s)`
);
