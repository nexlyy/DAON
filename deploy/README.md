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

The GitHub Pages copy still builds and still works; every page on it declares
`https://daon.pl/` as its canonical address, so search engines are pointed at
the domain. Turning it off is a one-line change to the workflow whenever you
want to — nothing depends on it any more.

## Why not GitHub Pages with a custom domain

It would work, and it would be less to run. But the API would stay on another
host, so every call the reservation makes would be cross-origin — a preflight
before each one, a CORS list to keep in step with the domain, and a second
certificate to renew. The VPS already serves a site behind nginx with certbot
renewing on a timer; adding a name to it is a config file.
