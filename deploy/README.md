# daon.pl

Live since 4 September 2026. This is how it is put together, and how to publish
a change.

The site and the reservation API both live on the VPS, under one domain. Same
origin for both means the browser makes ordinary calls to `/api/` — no CORS, one
certificate, and an address short enough to print on a table.

```
daon.pl            → /var/www/daon        the built site
daon.pl/api/       → 127.0.0.1:8787       the reservation service
mcrplanet.com      → untouched            a second name on the same nginx
```

## DNS

Done. `daon.pl` and `www.daon.pl` both answer `204.168.243.140`, and the AAAA
record points at the machine's IPv6 address.

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `204.168.243.140` | 600 |
| AAAA | `@` | `2a01:4f9:c014:ce7::1` | 600 |
| CNAME | `www` | `daon.pl.` | 1 hour |

The existing `A @ → WebsiteBuilder Site` points at the registrar's parking page
— today `daon.pl` answers `13.248.243.5` and `76.223.105.230`, which are
GoDaddy's, not ours. Edit that record rather than adding a second one: two A
records for `@` would send half the visitors to the parking page. The `www`
CNAME is already right. The AAAA is optional; without it the site is simply
IPv4-only.

Leave the NS, SOA, `_domainconnect` and `_dmarc` records alone.

Check it has landed:

```bash
dig +short daon.pl
dig +short www.daon.pl
```

The first should answer `204.168.243.140`. GoDaddy usually takes a few minutes
to an hour.

## 2. The server

Already done: nginx answers to `daon.pl` on port 80, `/var/www/daon` holds a
build made for a domain root, and the ACME path is open. The site can be seen
before DNS moves:

```bash
curl --resolve daon.pl:80:204.168.243.140 http://daon.pl/
```

The certificate covers both names and expires on 3 December 2026; `certbot.timer`
renews it twice a day along with mcrplanet's. It was issued with the webroot
plugin, which needs `/.well-known/acme-challenge/` to keep answering over plain
HTTP — that location sits above the redirect in the config for exactly that
reason.

One thing to know if you edit the config: this nginx is 1.24, where `http2` is a
parameter of `listen`, not a directive of its own. `http2 on;` is 1.25 and
newer, and 1.24 refuses to start with it.

## Publishing a change

```bash
deploy/publish.sh
```

It builds for a domain root rather than a repository subfolder, ships the result
as a tarball, unpacks it beside the live directory and swaps the two in one
move. The previous build stays as `/var/www/daon.old`, so a bad deploy is one
`mv` away from undone.

It does not use rsync. The rsync on the machine this is built from is a
zero-byte stub that exits successfully having copied nothing.

## The old address

The GitHub Pages copy no longer carries the site. The workflow publishes a
single page that forwards any address to the same path on daon.pl and asks not
to be indexed, so old links still land somewhere and search engines see one
site instead of two.

## What search engines are given

Every route is a prerendered file, so nginx answers `try_files $uri
$uri/index.html =404` and a made-up address gets a real 404 with the site's own
page, not the home page under a 200. HTML goes out with `Cache-Control:
no-cache` through a `map` on the content type: a deploy deletes the previous
hashed assets, and a page a browser kept by guesswork would point at files that
are gone. The drinks route is served `shell.html`, an empty page marked
noindex, rather than the prerendered home.

Each language has its own addresses: Polish at the root (`/menu`), English under
`/en` and Korean under `/ko`. Every page is prerendered three times with its own
`lang`, title and description, a canonical address, and `hreflang` links to the
other two with the Polish page as `x-default`; `sitemap.xml` lists all of them
with the same alternates. A visitor who once picked English is sent to the
English address, but nobody is redirected by browser language — a crawler
without a stored choice sees Polish at the root. `/pl/...` redirects to the root.

Titles, descriptions and `sitemap.xml` come from the build; the structured data
(a `Restaurant` and a `WebSite`, with Daon, 다온 and Даон as alternate names) is
generated in `vite.config.ts` from `src/data/restaurant.ts` and the dish prices.

## Why not GitHub Pages with a custom domain

It would work, and it would be less to run. But the API would stay on another
host, so every call the reservation makes would be cross-origin — a preflight
before each one, a CORS list to keep in step with the domain, and a second
certificate to renew. The VPS already serves a site behind nginx with certbot
renewing on a timer; adding a name to it is a config file.

## A second copy of the backups

The nightly backup lands in `/var/backups/daon` on the same server that runs
the API. The reservations themselves live in Supabase, so one lost machine does
not lose them, but a copy somewhere else as well costs nothing.
`deploy/pull-backups.ps1` fetches the backups over the same `ssh mcr` login the
deploy uses and keeps the last 30 days in `Documents\DAON backups`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\pull-backups.ps1
```

To run it every day on a Windows machine that stays on (it catches up the next
time the machine is on):

```powershell
schtasks /Create /SC DAILY /ST 10:00 /TN "DAON backups" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"C:\path\to\DAON\deploy\pull-backups.ps1\""
```

The files hold guests' names and phone numbers, so the machine has to be one
the restaurant would name in its privacy policy, and it deletes anything older
than 30 days just as the server does.
