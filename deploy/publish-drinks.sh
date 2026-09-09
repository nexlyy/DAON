#!/bin/sh
# Puts the drinks menu on the server, behind its own path.
#
# The bundle lives outside the site directory (/var/www/daon-private, not
# /var/www/daon), so publishing the site cannot wipe it and publishing this
# cannot touch the site. The directory is named after the key in
# private/key.txt, which is what makes the address unguessable — it is not in
# the repository and it is not in the build.
#
# Rotating the link is a rename: put a new key in private/key.txt, run this
# again, and delete the old directory on the server.

set -eu

export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

HOST="${DAON_HOST:-mcr}"
ROOT="${DAON_PRIVATE_ROOT:-/var/www/daon-private}"

cd "$(dirname "$0")/.."

[ -f private/key.txt ] || { echo "private/key.txt is missing" >&2; exit 1; }
[ -f private/site/drinks.json ] || { echo "run python private/build-drinks.py first" >&2; exit 1; }

KEY="$(tr -d ' \t\r\n' < private/key.txt)"
case "$KEY" in
  '' | */* | *.*) echo "private/key.txt does not look like a key" >&2; exit 1 ;;
esac

tar -czf - -C private/site . | ssh "$HOST" "
  set -eu
  rm -rf '$ROOT/$KEY.new'
  mkdir -p '$ROOT/$KEY.new'
  tar -xzf - -C '$ROOT/$KEY.new'
  chmod -R a+rX '$ROOT/$KEY.new'
  rm -rf '$ROOT/$KEY.old'
  [ -d '$ROOT/$KEY' ] && mv '$ROOT/$KEY' '$ROOT/$KEY.old' || true
  mv '$ROOT/$KEY.new' '$ROOT/$KEY'
  chmod a+rX '$ROOT'
  rm -rf '$ROOT/$KEY.old'
  echo \"published \$(find '$ROOT/$KEY' -type f | wc -l) files\"
"

echo "https://daon.pl/drinks/$KEY"
