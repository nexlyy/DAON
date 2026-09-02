#!/bin/sh
# A copy of the reservations, kept on the machine.
#
# Supabase does not back up a free project, and the one thing here that cannot
# be rebuilt from the repository is the bookings. Runs nightly from cron; keeps
# a month.

set -eu

ENV_FILE=/opt/daon-api/.env
OUT_DIR=/var/backups/daon
KEEP_DAYS=30

# shellcheck disable=SC1090
. "$ENV_FILE"

[ -n "${SUPABASE_URL:-}" ] || { echo "no SUPABASE_URL; nothing to back up"; exit 0; }

mkdir -p "$OUT_DIR"
STAMP=$(date +%Y%m%d)
FILE="$OUT_DIR/reservations-$STAMP.json"

fetch() {
  curl -sf "$SUPABASE_URL/rest/v1/$1?select=*" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
}

{
  printf '{"takenAt":"%s","reservations":' "$(date -Iseconds)"
  fetch reservations
  printf ',"reservation_tables":'
  fetch reservation_tables
  printf '}\n'
} > "$FILE.tmp"

mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

find "$OUT_DIR" -name 'reservations-*.json' -mtime +$KEEP_DAYS -delete
