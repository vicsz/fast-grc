#!/usr/bin/env bash
# Provision, deploy a packaged build, and wait until it is live.
# Usage: npm run deploy -- <env> [path/to/fast-grc-<version>.zip]
# Without a zip it packages the working tree first. Same script locally and in CI.
set -euo pipefail

ENV="${1:?usage: npm run deploy -- <dev|demo> [zip]}"
ZIP="${2:-}"
RG="${FAST_GRC_RG:-fast-grc-rg}"
LOCATION="${FAST_GRC_LOCATION:-canadacentral}"
APP="${FAST_GRC_APP_PREFIX:-fast-grc}-$ENV"

if [[ "$ENV" != "dev" && "${GITHUB_ACTIONS:-}" != "true" ]]; then
  echo "Local deploys target dev only; $ENV is promoted from CI." >&2
  exit 1
fi

start=$(date +%s)

if [[ -z "$ZIP" ]]; then
  echo "==> Package"
  ZIP=$(bash scripts/package.sh | tail -1)
fi
version=$(unzip -p "$ZIP" build-info.json | node -pe "JSON.parse(require('fs').readFileSync(0)).version")

echo "==> Provision $RG/$APP ($LOCATION)"
az group create -n "$RG" -l "$LOCATION" -o none
url=$(az deployment group create -g "$RG" -f infra/main.bicep \
  -p env="$ENV" appName="$APP" --query properties.outputs.url.value -o tsv)

echo "==> Deploy $version to $url"
az webapp deploy -g "$RG" -n "$APP" --src-path "$ZIP" --type zip -o none

echo "==> Waiting for $version"
for _ in $(seq 1 60); do
  live=$(curl -fs "$url/version" | node -pe "JSON.parse(require('fs').readFileSync(0)).version" 2>/dev/null || true)
  if [[ "$live" == "$version" ]]; then
    echo "Live: $url  version $version  ($(( $(date +%s) - start ))s)"
    exit 0
  fi
  sleep 5
done

echo "Timed out: $url/version is '${live:-unreachable}', expected $version" >&2
exit 1
