#!/bin/bash
# Open the site directly in the default browser (no server)
# Run: ./preview.sh

open "file://$(cd "$(dirname "$0")" && pwd)/index.html"
