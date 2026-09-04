#!/bin/sh
# Builds the site for daon.pl and puts it on the server.
#
# The default build targets a repository subfolder on GitHub Pages; this one
# targets a domain root, so the asset paths differ. Nothing else changes.
#
# The copy goes out as a tarball and is unpacked beside the live directory,
# which is then swapped in one move: nginx never serves a half-written tree, and
# the previous build stays as .old to fall back to.

set -eu

# Git Bash rewrites a lone "/" in an argument or an environment value into the
# path of its own installation, which produced a build whose every asset URL
# began with /Program Files/Git. The build refuses such a value now as well.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

HOST="${DAON_HOST:-mcr}"
ROOT="${DAON_ROOT:-/var/www/daon}"

cd "$(dirname "$0")/.."

BASE_PATH=/ VITE_BOOKING_API_URL="${VITE_BOOKING_API_URL:-https://daon.pl/api}" npm run build

tar -czf - -C dist . | ssh "$HOST" "
  set -eu
  rm -rf '$ROOT.new'
  mkdir -p '$ROOT.new'
  tar -xzf - -C '$ROOT.new'
  chmod -R a+rX '$ROOT.new'
  rm -rf '$ROOT.old'
  [ -d '$ROOT' ] && mv '$ROOT' '$ROOT.old' || true
  mv '$ROOT.new' '$ROOT'
  echo \"published \$(find '$ROOT' -type f | wc -l) files\"
"
