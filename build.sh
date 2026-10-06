#!/bin/bash
# Rebuild the whole site in one go.
# Run: ./build.sh
#
# Steps 1–2 run on this computer only (they need the originals folder and
# libvips); their output is committed, so the deploy skips them. Steps 3–4 are
# mirrored in .github/workflows/deploy.yml — keep the two in sync.

set -e  # Exit on first error

echo "🔨 Rebuilding the site..."
echo ""

echo "▶ generate-placeholders.mjs   (local only)"
node tools/generate-placeholders.mjs

echo "▶ process-photos.mjs         (local only)"
node tools/process-photos.mjs

# English pages in the root, Hebrew pages in he/, and sitemap.xml
echo "▶ build-pages.mjs"
node tools/build-pages.mjs

# Cache-busting ?v= hashes on CSS/JS, in the root and he/ pages
echo "▶ stamp-versions.mjs"
node tools/stamp-versions.mjs

echo ""
echo "✓ All builds complete!"
