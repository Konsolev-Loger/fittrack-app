#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose config --quiet
# Fail before interrupting service if the new release has not been loaded.
for service in api web migrate; do
  image=$(docker compose --profile tools config --format json | python3 -c "import json,sys; print(json.load(sys.stdin)['services']['$service']['image'])")
  docker image inspect "$image" > /dev/null
done
# Images are built by GitHub Actions, not on the small VPS.
docker compose up -d --wait db
# Prevent writes and old API queries while the schema is changing.
docker compose stop api
bash deploy/backup.sh
docker compose run --rm migrate
docker compose up -d --wait --wait-timeout 180 api web
docker compose ps
