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

CLOSURES=/opt/daon-api/data/closures.json

{
  printf '{"takenAt":"%s","reservations":' "$(date -Iseconds)"
  fetch reservations
  printf ',"reservation_tables":'
  fetch reservation_tables
  # The days the staff closed are settings rather than rows, and they live in a
  # file — worth the same copy, since losing them reopens Christmas Eve.
  printf ',"closures":'
  if [ -f "$CLOSURES" ]; then cat "$CLOSURES"; else printf '[]'; fi
  printf '}\n'
} > "$FILE.tmp"

mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

find "$OUT_DIR" -name 'reservations-*.json' -mtime +$KEEP_DAYS -delete

# What the restaurant writes from the admin panel: the menu, the hours, the
# wording, and the photographs of the dishes. The menu can be rebuilt from the
# repository, the edits made since cannot, and an uploaded photograph exists
# nowhere else at all.
CONTENT=/opt/daon-api/content/live
UPLOADS=/var/www/daon-uploads

if [ -d "$CONTENT" ]; then
  tar -czf "$OUT_DIR/content-$STAMP.tar.gz.tmp" -C "$CONTENT" .
  mv "$OUT_DIR/content-$STAMP.tar.gz.tmp" "$OUT_DIR/content-$STAMP.tar.gz"
  chmod 600 "$OUT_DIR/content-$STAMP.tar.gz"
  find "$OUT_DIR" -name 'content-*.tar.gz' -mtime +$KEEP_DAYS -delete
fi

# The pictures are the heavy part, so a copy is written only when they have
# changed, and a week of those is enough to undo a mistake.
if [ -d "$UPLOADS" ]; then
  SUM=$(find "$UPLOADS" -type f -printf '%p %s %T@
' 2>/dev/null | sort | sha256sum | cut -d' ' -f1)
  MARK="$OUT_DIR/.uploads-sum"
  if [ ! -f "$MARK" ] || [ "$SUM" != "$(cat "$MARK")" ]; then
    tar -czf "$OUT_DIR/uploads-$STAMP.tar.gz.tmp" -C "$UPLOADS" .
    mv "$OUT_DIR/uploads-$STAMP.tar.gz.tmp" "$OUT_DIR/uploads-$STAMP.tar.gz"
    chmod 600 "$OUT_DIR/uploads-$STAMP.tar.gz"
    printf '%s' "$SUM" > "$MARK"
    find "$OUT_DIR" -name 'uploads-*.tar.gz' -mtime +7 -delete
  fi
fi

# The privacy policy promises that a guest's name, phone and notes are wiped a
# set number of days after the visit. The reservation itself stays — date, time,
# party size and tables are not personal — and the copies above age out on their
# own. It runs after the copy so a failed wipe never costs a backup. The number
# of days comes from src/data/restaurant.ts, the same place the policy reads it.
RETENTION_DAYS=$(node -p "require('/opt/daon-api/reservation-data.json').reservation.retentionDays ?? 30")
CUTOFF=$(date -d "-$RETENTION_DAYS days" +%F)

curl -sf -o /dev/null -X PATCH "$SUPABASE_URL/rest/v1/reservations?booking_date=lt.$CUTOFF"   -H "apikey: $SUPABASE_SERVICE_KEY"   -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"   -H "Content-Type: application/json"   -H "Prefer: return=minimal"   --data '{"guest_name":"","phone":"","notes":""}'
