#!/usr/bin/env bash
# Copy the Pyodide core files into site/vendor/pyodide/ so the page doesn't
# depend on the jsDelivr CDN (useful if a school network filters it).
# Afterwards set LAB_CONFIG.pyodide = 'vendor/pyodide/' in site/index.html.
set -euo pipefail
VERSION="${1:-0.26.4}"
BASE="https://cdn.jsdelivr.net/pyodide/v${VERSION}/full"
DEST="$(cd "$(dirname "$0")/.." && pwd)/site/vendor/pyodide"
mkdir -p "$DEST"
for f in pyodide.js pyodide.asm.js pyodide.asm.wasm python_stdlib.zip pyodide-lock.json; do
  echo "fetching $f"
  curl -fsSL "$BASE/$f" -o "$DEST/$f"
done
curl -fsSL "https://raw.githubusercontent.com/pyodide/pyodide/${VERSION}/LICENSE" -o "$DEST/LICENSE"
echo "done: $(du -sh "$DEST" | cut -f1) in $DEST"
