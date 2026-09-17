#!/bin/sh
# The menu, the hours and the promotion as the server holds them.
#
# Two copies of this content exist: the one in the repository and the live one
# on the server, which is what the admin panel writes. The live one wins —
# publishing the site must never undo a price someone changed this morning.
#
#   sh deploy/content.sh pull     bring the live content into the repository
#   sh deploy/content.sh push     send the repository's content to the server
#   sh deploy/content.sh check    say whether the two differ
#
# `publish.sh` runs `check` on its own and stops if they have drifted, so the
# choice of which copy to keep is always made on purpose.

set -eu

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

HOST="${DAON_HOST:-mcr}"
LIVE="${DAON_CONTENT_DIR:-/opt/daon-api/content/live}"

cd "$(dirname "$0")/.."
LOCAL=src/content
FILES='menu.json categories.json allergens.json restaurant.json promo.json'

local_sum() {
  for file in $FILES; do
    cat "$LOCAL/$file"
  done | sha256sum | cut -d' ' -f1
}

remote_sum() {
  ssh "$HOST" "cd '$LIVE' 2>/dev/null && cat $FILES 2>/dev/null | sha256sum | cut -d' ' -f1" || true
}

case "${1:-check}" in
  pull)
    ssh "$HOST" "cd '$LIVE' && tar -czf - $FILES" | tar -xzf - -C "$LOCAL"
    echo "pulled into $LOCAL"
    ;;

  push)
    tar -czf - -C "$LOCAL" $FILES | ssh "$HOST" "
      set -eu
      mkdir -p '$LIVE'
      tar -xzf - -C '$LIVE'
      chmod 644 '$LIVE'/*.json
      ls '$LIVE' | wc -l | xargs printf 'the server now holds %s files\n'
    "
    ;;

  check)
    # Compares by content, not by timestamp: the files are written by two
    # different machines and mtimes say nothing useful.
    remote="$(remote_sum)"
    if [ -z "$remote" ]; then
      echo "the server holds no content yet"
      exit 2
    fi
    if [ "$remote" = "$(local_sum)" ]; then
      echo 'the same content on both sides'
    else
      echo 'the content here and the content on the server differ' >&2
      echo 'keep the live one:  sh deploy/content.sh pull' >&2
      echo 'keep this one:      sh deploy/content.sh push' >&2
      exit 1
    fi
    ;;

  *)
    echo "usage: $0 pull|push|check" >&2
    exit 64
    ;;
esac
