#!/bin/sh
# Tells the restaurant when the booking service stops answering.
#
# systemd restarts a crashed process, but it cannot see a service that is up and
# broken — a database that stopped answering, or a bot token that was revoked.
# This asks the service the same question the site asks, and speaks up only when
# the answer changes, so a long outage does not become a stream of messages.

set -eu

ENV_FILE=/opt/daon-api/.env
STATE=/opt/daon-api/data/watchdog.state

# shellcheck disable=SC1090
. "$ENV_FILE"

[ -n "${TELEGRAM_STAFF_IDS:-}" ] || exit 0

say() {
  for ID in $(printf '%s' "$TELEGRAM_STAFF_IDS" | tr ',' ' '); do
    curl -sf -o /dev/null "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      --data-urlencode "chat_id=$ID" \
      --data-urlencode "text=$1" || true
  done
}

HEALTH=$(curl -sf --max-time 10 http://127.0.0.1:8787/health || true)
WAS=$(cat "$STATE" 2>/dev/null || echo ok)

case "$HEALTH" in
  *'"ok":true'*)
    NOW=ok
    [ "$WAS" = "down" ] && say "Rezerwacje online znowu działają."
    ;;
  *)
    NOW=down
    [ "$WAS" = "ok" ] && say "Uwaga: rezerwacje online nie działają. Goście nie mogą zarezerwować stolika."
    ;;
esac

printf '%s' "$NOW" > "$STATE"
