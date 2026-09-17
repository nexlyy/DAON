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
KIT="${DAON_KIT:-/opt/daon-site}"

cd "$(dirname "$0")/.."

# The menu and the hours can be edited on the site itself, so the live copy is
# the one that counts. Publishing stops rather than quietly building pages from
# an older copy of the menu; `content.sh pull` or `push` settles it.
if ! sh deploy/content.sh check; then
  [ $? = 2 ] || exit 1
  sh deploy/content.sh push
fi

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

# What the server needs to write these pages again by itself: the server
# bundle, the page it renders into, the three dictionaries and the two scripts
# that put it together. It renders from its own copy of the content, which is
# what the admin panel edits, and never from a checkout.
tar -czf -   scripts/prerender.mjs   scripts/content.mjs   dist-ssr/entry-server.js   dist-ssr/template.html   src/i18n/locales/pl.json   src/i18n/locales/en.json   src/i18n/locales/ko.json | ssh "$HOST" "
  set -eu
  mkdir -p '$KIT'
  tar -xzf - -C '$KIT'
  echo \"render kit: \$(find '$KIT' -type f | wc -l) files\"
"
