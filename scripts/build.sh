#!/usr/bin/env bash
# Assembles the deployable site into dist/ from the shared template plus each
# site's own configs/<site>.json. Sites are discovered from configs/*.json,
# so adding a site is just adding its config - no list to edit here.
#
# Each config's "siteType" picks which shared template it's built from:
#   - "marketing" (default if omitted): the full before/after shop demo plus
#     feature cards, from shared/index.html, app.js, style.css, shop.css.
#   - "show_case": no chrome at all - just a row of thumbnail buttons
#     (config.bundles[].image) and a live viewer for whichever bundle is
#     selected, entirely from shared/showcase/ (its own showcase.css).
#
# assets/ (photos, logos, favicon, and bundles/) is copied once to
# dist/assets/ and shared by every site - config.json entries (logo.src,
# product.image.src, favicon, bundle(s), ...) point into it with
# "../assets/..." paths rather than each site keeping its own copy.
#
# simple_example.html is copied to the dist root as-is - it's the minimal,
# self-contained viewer demo the "간단하게 웹사이트 연동" feature card links
# to for download (see configs/*.json's featureCards[].download).
#
# Nothing under dist/ is checked in - this script (run locally for preview,
# or by the Pages workflow) is what produces it.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

rm -rf dist
mkdir -p dist
cp index.html dist/
cp 3Dfit_example.html dist/
cp ArtIn3D_example.html dist/
cp SampleInWeb_example.html dist/
cp -R assets dist/assets

sites=()
for config in configs/*.json; do
  site="$(basename "$config" .json)"
  sites+=("$site")
  site_type="$(jq -r '.siteType // "marketing"' "$config")"

  out="dist/$site"
  mkdir -p "$out"
  if [ "$site_type" = "show_case" ]; then
    cp shared/showcase/index.html shared/showcase/app.js shared/showcase/showcase.css "$out/"
  else
    cp shared/index.html shared/app.js shared/style.css shared/shop.css "$out/"
  fi
  cp "$config" "$out/config.json"
done

echo "Built dist/ for: ${sites[*]}"
