#!/bin/bash
# Rebuild all static content in one go
# Run: ./build.sh

set -e  # Exit on first error

echo "🔨 Rebuilding all static content..."
echo ""

echo "▶ generate-placeholders.mjs"
node tools/generate-placeholders.mjs

echo "▶ build-content.mjs"
node tools/build-content.mjs

echo "▶ build-workshop.mjs"
node tools/build-workshop.mjs

echo "▶ build-projects.mjs"
node tools/build-projects.mjs

echo "▶ build-stamp.mjs"
node tools/build-stamp.mjs

echo "▶ stamp-versions.mjs"
node tools/stamp-versions.mjs

echo ""
echo "✓ All builds complete!"
