#!/usr/bin/env bash
# Provision, deploy a packaged build, and wait until it is live.
# Usage: npm run deploy -- <env> [path/to/fast-grc-<version>.zip] [--reset-db]
# Without a zip it packages the working tree first. Same script locally and in CI.
# --reset-db (dev only) drops and recreates the environment's database before deploying;
# the app then migrates and seeds on startup. Deploying an older build with it is a rollback.
set -euo pipefail

ENV="${1:?usage: npm run deploy -- <dev|demo> [zip] [--reset-db]}"
shift
ZIP=""
RESET_DB=false
for arg in "$@"; do
  case "$arg" in
    --reset-db) RESET_DB=true ;;
    *) ZIP="$arg" ;;
  esac
done

RG="${FAST_GRC_RG:-fast-grc-rg}"
LOCATION="${FAST_GRC_LOCATION:-canadacentral}"
PREFIX="${FAST_GRC_APP_PREFIX:-fast-grc}"
APP="$PREFIX-$ENV"
DB="fast_grc_$ENV"

if [[ "$ENV" != "dev" && "${GITHUB_ACTIONS:-}" != "true" ]]; then
  echo "Local deploys target dev only; $ENV is promoted from CI." >&2
  exit 1
fi
if [[ "$RESET_DB" == true && "$ENV" != "dev" ]]; then
  echo "--reset-db is dev only." >&2
  exit 1
fi

start=$(date +%s)

if [[ -z "$ZIP" ]]; then
  echo "==> Package"
  ZIP=$(bash scripts/package.sh | tail -1)
fi
version=$(unzip -p "$ZIP" build-info.json | node -pe "JSON.parse(require('fs').readFileSync(0)).version")

# The database password lives only in the apps' DATABASE_URL setting. Reuse it if any
# environment already has one; otherwise generate it (upper, lower and digits for Azure's rules).
db_password() {
  for app in "$PREFIX-dev" "$PREFIX-demo"; do
    local url
    url=$(az webapp config appsettings list -g "$RG" -n "$app" \
      --query "[?name=='DATABASE_URL'].value | [0]" -o tsv 2>/dev/null || true)
    if [[ -n "$url" ]]; then
      node -e "console.log(decodeURIComponent(new URL(process.argv[1]).password))" "$url"
      return
    fi
  done
  echo "Fg$(openssl rand -hex 16)9"
}

# Provision only when the infrastructure changed (or doesn't exist yet): re-applying the
# template on every deploy is slow and can collide with in-flight database operations.
infra_hash=$(shasum -a 256 infra/main.bicep | cut -c1-16)
deployed_hash=$(az webapp show -g "$RG" -n "$APP" --query tags.infraHash -o tsv 2>/dev/null || true)
if [[ "$deployed_hash" == "$infra_hash" && "${FORCE_PROVISION:-}" != "true" ]]; then
  echo "==> Infrastructure unchanged ($infra_hash), skipping provisioning"
  url="https://$(az webapp show -g "$RG" -n "$APP" --query defaultHostName -o tsv)"
else
  echo "==> Provision $RG/$APP"
  az group create -n "$RG" -l "$LOCATION" -o none
  url=$(az deployment group create -g "$RG" -f infra/main.bicep \
    -p env="$ENV" appName="$APP" dbPassword="$(db_password)" infraHash="$infra_hash" \
    --query properties.outputs.url.value -o tsv)
fi

if [[ "$RESET_DB" == true ]]; then
  echo "==> Reset database $DB"
  # Azure drops the database even with the app connected; the deploy restarts the app,
  # which migrates and seeds the empty database.
  az postgres flexible-server db delete -g "$RG" -s fast-grc-pg -n "$DB" --yes -o none
  az postgres flexible-server db create -g "$RG" -s fast-grc-pg -n "$DB" -o none
fi

echo "==> Deploy $version to $url"
# Our /version check below confirms the new build is serving, so skip az's own startup tracking.
az webapp deploy -g "$RG" -n "$APP" --src-path "$ZIP" --type zip --track-status false -o none

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
