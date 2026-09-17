#!/bin/sh
# Tells the staff when online reservations stop working, and keeps telling them
# every few hours until someone fixes it.
#
# Three things are watched. The service itself; the database behind it, which
# /health now actually queries; and the nightly copy of the reservations, which
# fails quietly otherwise. Each speaks up when it breaks, reminds while it stays
# broken, and says so once when it recovers.

set -eu

ENV_FILE=/opt/daon-api/.env
STATE_DIR=/opt/daon-api/data/watchdog
BACKUPS=/var/backups/daon
REMIND_EVERY=21600
BACKUP_STALE_AFTER=93600

# shellcheck disable=SC1090
. "$ENV_FILE"

[ -n "${TELEGRAM_STAFF_IDS:-}" ] || exit 0
mkdir -p "$STATE_DIR"
NOW=$(date +%s)

say() {
  for ID in $(printf '%s' "$TELEGRAM_STAFF_IDS" | tr ',' ' '); do
    curl -sf -o /dev/null "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      --data-urlencode "chat_id=$ID" \
      --data-urlencode "text=$1" || true
  done
}

since() {
  date -d "@$1" '+%d-%m-%Y %H:%M'
}

track() {
  name=$1 state=$2 problem=$3 recovered=$4
  file="$STATE_DIR/$name"
  was=ok started=0 told=0
  [ -f "$file" ] && read -r was started told < "$file"

  if [ "$state" = down ]; then
    if [ "$was" != down ]; then
      started=$NOW
      say "$problem"
      told=$NOW
    elif [ $((NOW - told)) -ge $REMIND_EVERY ]; then
      say "Still not fixed (since $(since "$started")). $problem"
      told=$NOW
    fi
  else
    [ "$was" = down ] && say "$recovered"
    started=0 told=0
  fi

  printf '%s %s %s\n' "$state" "$started" "$told" > "$file"
}

BODY=$(mktemp)
CODE=$(curl -s -o "$BODY" -w '%{http_code}' --max-time 15 http://127.0.0.1:8787/health || true)

case "$(cat "$BODY")" in
  *'"database"'*)
    track service ok "" \
      "Online reservations are working again: the booking service answers."
    case "$(cat "$BODY")" in
      *'"database":"ok"'*) DB=ok ;;
      *) DB=down ;;
    esac
    track database "$DB" \
      "Needs fixing: the reservations database is not answering, so bookings from daon.pl cannot be saved. Guests can still call. Tell whoever looks after the website (server: journalctl -u daon-api; Supabase may be down or its key revoked)." \
      "The reservations database answers again. Bookings from daon.pl are saved as usual."
    ;;
  *)
    track service down \
      "Needs fixing: online reservations are down, the booking service on the server is not answering (HTTP $CODE). Guests cannot book on daon.pl. Tell whoever looks after the website (server: systemctl status daon-api)." \
      "Online reservations are working again: the booking service answers."
    ;;
esac
rm -f "$BODY"

LATEST=$(ls -t "$BACKUPS"/reservations-*.json 2>/dev/null | head -n 1 || true)
if [ -n "$LATEST" ]; then
  AGE=$((NOW - $(stat -c %Y "$LATEST")))
else
  AGE=$((BACKUP_STALE_AFTER + 1))
fi

if [ "$AGE" -gt "$BACKUP_STALE_AFTER" ]; then
  HOURS=$((AGE / 3600))
  track backup down \
    "Needs fixing: the copy of the reservations database has not been updated for ${HOURS} hours. Nothing is lost yet, but there is no fresh backup. Tell whoever looks after the website (server: /opt/daon-api/scripts/backup.sh)." \
    "The copy of the reservations database is up to date again."
else
  track backup ok "" "The copy of the reservations database is up to date again."
fi

rm -f /opt/daon-api/data/watchdog.state
