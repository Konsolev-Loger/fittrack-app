#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose config --quiet
# Images are built by GitHub Actions, not on the small VPS.
docker compose up -d --wait db
bash deploy/backup.sh
docker compose run --rm migrate
docker compose up -d --wait api web
docker compose ps
