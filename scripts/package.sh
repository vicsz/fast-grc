#!/usr/bin/env bash
# Build once into a complete, deployable zip: out/fast-grc-<version>.zip
# Prints the zip path as the last line.
set -euo pipefail

npm run build --silent >&2
version=$(node -p "require('./build-info.json').version")

stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
cp -R dist drizzle build-info.json package.json package-lock.json "$stage/"
(cd "$stage" && npm ci --omit=dev --ignore-scripts --silent)

mkdir -p out
zip_path="$PWD/out/fast-grc-$version.zip"
rm -f "$zip_path"
(cd "$stage" && zip -qr "$zip_path" .)
echo "$zip_path"
