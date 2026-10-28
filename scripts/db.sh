#!/usr/bin/env bash
# Local Postgres 18 in a container. Data lives inside the container: reset freely.
# Usage: npm run db:up | db:down | db:reset
set -euo pipefail

NAME=fast-grc-db
IMAGE=postgres:18

up() {
  if docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
    echo "$NAME is running"
  elif docker ps -a --format '{{.Names}}' | grep -qx "$NAME"; then
    docker start "$NAME" >/dev/null
  else
    docker run -d --name "$NAME" -p 5432:5432 \
      -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=fast_grc "$IMAGE" >/dev/null
  fi
  until docker exec "$NAME" pg_isready -U postgres -d fast_grc -q; do sleep 0.5; done
  echo "Postgres ready on localhost:5432 (database fast_grc)"
}

down() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  echo "$NAME removed"
}

case "${1:-up}" in
  up) up ;;
  down) down ;;
  reset) down && up && npm run --silent db:migrate ;;
  *) echo "usage: db.sh up|down|reset" >&2; exit 1 ;;
esac
