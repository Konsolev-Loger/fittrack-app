#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -e .env ]; then
  echo '.env already exists; leaving all secrets unchanged.'
  exit 0
fi
tag="${1:?Usage: bash deploy/init-env.sh RELEASE_TAG}"
[[ "$tag" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 1
umask 077
set -o noclobber
{
  printf 'DOMAIN=setly.su\nSETLY_TAG=%s\n' "$tag"
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)"
  printf 'ACCESS_TOKEN_SECRET=%s\n' "$(openssl rand -hex 48)"
  printf 'REFRESH_TOKEN_SECRET=%s\n' "$(openssl rand -hex 48)"
} > .env
echo 'Created private .env. Do not share its contents.'
