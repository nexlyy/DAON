# Putting the site on daon.pl

The site and the reservation API both live on the VPS, under one domain. Same
origin for both means the browser makes ordinary calls to `/api/` — no CORS, one
certificate, and an address short enough to print on a table.

```
daon.pl            → /var/www/daon        the built site
daon.pl/api/       → 127.0.0.1:8787       the reservation service
mcrplanet.com      → untouched            a second name on the same nginx
```

## 1. DNS, at the registrar

One record has to change and one has to be added. Everything else in the zone
can stay as it is.

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `204.168.243.140` | 600 |
| AAAA | `@` | `2a01:4f9:c014:ce7::1` | 600 |
| CNAME | `www` | `daon.pl.` | 1 hour |

The existing `A @ → WebsiteBuilder Site` points at the registrar's parking page
and must be edited to the address above — GoDaddy will not let two A records for
`@` disagree. The `www` CNAME is already right. The AAAA is optional; without it
the site is simply IPv4-only.

Leave the NS, SOA, `_domainconnect` and `_dmarc` records alone.

Check it has landed:

```bash
dig +short daon.pl
dig +short www.daon.pl
```

The first should answer `204.168.243.140`. GoDaddy usually takes a few minutes
to an hour.

## 2. The server

```bash
scp deploy/nginx-daon.conf mcr:/etc/nginx/sites-available/daon.pl
ssh mcr ln -s /etc/nginx/sites-available/daon.pl /etc/nginx/sites-enabled/daon.pl
ssh mcr mkdir -p /var/www/daon
```

The config refers to a certificate that does not exist yet, so ask certbot for
one before reloading nginx — it writes the files and reloads by itself:

```bash
ssh mcr certbot --nginx -d daon.pl -d www.daon.pl --agree-tos -m daonpolska@gmail.com --redirect
```

Renewal is already automatic: `certbot.timer` runs twice a day and covers every
certificate on the machine.

## 3. The site

Built for a domain root rather than a repository subfolder:

```bash
BASE_PATH=/ npm run build
rsync -az --delete dist/ mcr:/var/www/daon/
```

`deploy/publish.sh` does both, and is what the GitHub Action runs on a push to
`main`.

## 4. What changes in the project

- `VITE_BOOKING_API_URL` becomes `https://daon.pl/api`
- `ALLOWED_ORIGIN` in `/opt/daon-api/.env` becomes `https://daon.pl`
- the canonical URL, the OG tags, `sitemap.xml` and `robots.txt`
- the QR codes — regenerate with `python scripts/make-qr.py` and reprint

## Why not GitHub Pages with a custom domain

It would work, and it would be less to run. But the API would stay on another
host, so every call the reservation makes would be cross-origin — a preflight
before each one, a CORS list to keep in step with the domain, and a second
certificate to renew. The VPS already serves a site behind nginx with certbot
renewing on a timer; adding a name to it is a config file.
