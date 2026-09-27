#!/usr/bin/env bash
# Assembles the deployable site into dist/ from the shared template plus each
# site's own configs/<site>.json and bundles/<site>/. Sites are discovered
# from configs/*.json, so adding a site is just adding its config + a
# matching bundles/ subfolder - no list to edit here.
#
# assets/ (photos, logos, favicon) is copied once to dist/assets/ and
# shared by every site - config.json entries point into it with "../assets/..."
# paths rather than each site keeping its own copy.
#
# Nothing under dist/ is checked in - this script (run locally for preview,
# or by the Pages workflow) is what produces it.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

rm -rf dist
mkdir -p dist
cp index.html dist/
cp -R assets dist/assets

sites=()
for config in configs/*.json; do
  site="$(basename "$config" .json)"
  sites+=("$site")

  out="dist/$site"
  mkdir -p "$out"
  cp shared/index.html shared/app.js shared/style.css shared/shop.css "$out/"
  cp "$config" "$out/config.json"
  cp -R "bundles/$site" "$out/bundle"
done

echo "Built dist/ for: ${sites[*]}"
