#!/bin/bash
# Rebuild all static content in one go
# Run: ./build.sh

set -e  # Exit on first error

echo "🔨 Rebuilding all static content..."
echo ""

echo "▶ generate-placeholders.mjs"
node tools/generate-placeholders.mjs

echo "▶ build-i18n.mjs"
node tools/build-i18n.mjs

echo "▶ build-workshop.mjs"
node tools/build-workshop.mjs

echo "▶ build-projects.mjs"
node tools/build-projects.mjs

echo ""
echo "✓ All builds complete!"
