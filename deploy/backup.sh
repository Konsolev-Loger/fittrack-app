#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p .backups
file=".backups/setly-$(date -u +%Y%m%dT%H%M%S)-$$.dump"
docker compose exec -T db pg_dump -U setly -d setly -Fc > "$file.partial"
docker compose exec -T db pg_restore --list < "$file.partial" > /dev/null
mv "$file.partial" "$file"
echo "Backup saved: $file (copy it off this VPS too)."
