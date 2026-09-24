# Setly on a VPS

The `Build VPS bundle` GitHub Actions workflow builds Linux images and tests a clean
PostgreSQL 18 database, repeatable migrations/seed, readiness and SPA/API routing.
No credentials or real user data are included. Download the successful run's artifact.
Images use the source commit SHA as a release tag. Do not use a failed run's bundle.

## First launch

1. Point the A record for `setly.su` to your VPS. Remove a conflicting AAAA record
   only if it points somewhere else and you do not use IPv6. Allow inbound TCP 80/443
   and keep SSH available. Check `ss -lntp` for an existing web server before launching.
2. Copy the extracted artifact to `/opt/setly` on the VPS (including the `deploy`
   directory). Keep this directory for later updates; do not recreate its `.env`.
3. From `/opt/setly` run:

```bash
docker load -i images.tar.gz
bash deploy/init-env.sh "$(cat RELEASE_TAG)"
bash deploy/start.sh
```

The initializer creates random passwords in a mode-600 `.env`, without printing them.
Never commit or send this file. A fresh named database volume starts empty; the seed
only adds six standard muscle groups. Email verification is disabled in both images.
API and PostgreSQL ports are not published. Caddy is the single trusted HTTP proxy
and automatically obtains HTTPS certificates once DNS and inbound ports are ready.
There is no `www` alias in this configuration.

Verify `https://setly.su/readyz`, registration, login, workout creation and editing,
logout and persistence after `docker compose restart`. Check `docker compose logs
--tail=100 api web` for errors (do not post cookies, tokens or private account data).

## Backups and updates

`bash deploy/backup.sh` creates a private PostgreSQL custom-format dump in `.backups`.
It checks the archive listing, not a complete restore. Copy backups to storage outside
this VPS and test restoring into a separate database. Schedule daily backups before
accepting real users. Do not treat the database volume or a same-server dump as an
off-server backup. Keep a secure copy of `.env` as well.

For an update: download the new successful bundle, preserve `.env` and `.backups`, load
the new images, change only `SETLY_TAG` in `.env` to the new `RELEASE_TAG`, then run
`bash deploy/start.sh`. It backs up the database before applying migrations. Do not
overwrite secrets with new ones: changing POSTGRES_PASSWORD in `.env` does not change
the password stored inside an existing database. Keep the previous release's images.
Schema changes must remain compatible with the old API while migration runs.
Do not automatically roll back a migrated database; plan and test a restore if needed.

Never run `docker compose down -v`: it deletes database and certificate volumes.

## Source references

- https://docs.docker.com/compose/how-tos/startup-order/
- https://hub.docker.com/_/postgres (PostgreSQL 18 volume is `/var/lib/postgresql`)
- https://caddyserver.com/docs/automatic-https
