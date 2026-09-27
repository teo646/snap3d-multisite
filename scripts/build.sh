#!/usr/bin/env bash
# Assembles the deployable site into dist/ from the shared template plus each
# site's own configs/<site>.json, assets/<site>/, and bundles/<site>/. Sites
# are discovered from configs/*.json, so adding a site is just adding its
# config + matching assets/bundles subfolders - no list to edit here.
#
# Nothing under dist/ is checked in - this script (run locally for preview,
# or by the Pages workflow) is what produces it.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

rm -rf dist
mkdir -p dist
cp index.html dist/

sites=()
for config in configs/*.json; do
  site="$(basename "$config" .json)"
  sites+=("$site")

  out="dist/$site"
  mkdir -p "$out"
  cp shared/index.html shared/app.js shared/style.css shared/shop.css "$out/"
  cp "$config" "$out/config.json"
  cp -R "assets/$site" "$out/assets"
  cp -R "bundles/$site" "$out/bundle"
done

echo "Built dist/ for: ${sites[*]}"
