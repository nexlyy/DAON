# Reservation API

The half of the site that cannot live in a browser: it keeps the reservations,
decides what is still free, and tells the restaurant about each booking over
Telegram, in Polish.

A static build cannot do either job. It cannot hold a bot token — anything
shipped to the browser is public — and it cannot be trusted about what is
booked, because every visitor would have their own answer.

```
site → POST /bookings → Supabase
                     └→ Telegram → the restaurant's phone
```

## The calls

```
GET  /closed-dates?from&to          dates the kitchen is shut
GET  /slots?date&partySize          seating times, and what is still free
GET  /tables?date&time&partySize    per-table availability
POST /bookings                      take a booking, then tell the staff
POST /bookings/move                 the guest changes day, time, size or table
POST /bookings/lookup               a guest's own booking, by code and token
POST /bookings/cancel               the guest cancels
POST /waitlist                      a guest waits for a full time; the staff get a card
GET  /health                        liveness, which store, whether a chat is set
```

They are the same four the site's `BookingApi` interface describes, so pointing
`VITE_BOOKING_API_URL` at this service is the whole switch — nothing in the UI
changes.

Opening hours, the joining rules and the table numbers are not repeated here:
`npm run sync:data` copies them out of `src/content/restaurant.json` and the
floor plan into `reservation-data.json`, and a publish from the admin panel
rewrites the hours and the rules in it by itself.

## The waiting list

When the form finds a time full, the guest can leave a name and a number
instead (`waitlist.js`). Nothing is held: the staff get a card with two
buttons, *Found a table* and *Take off the list*; the first press decides, and
every copy of the card says who pressed it. `/waitlist` in the bot lists who is
still waiting. One number can wait for three evenings at most. The entry is
deleted the day after the date it was for, together with its cards in Telegram
— the privacy policy says exactly that.

## Running it

```bash
cd server
cp .env.example .env      # then paste the token from @BotFather
npm start
```

No dependencies: Node 18 or newer is all it needs.

## Supabase

`server/supabase/schema.sql`, run once in the SQL editor, creates two tables and
one function. The guarantee lives in the database rather than in this code: a
unique index on (date, time, table) means two parties cannot be given the same
table, whatever the service believes, and `create_reservation` books all of a
party's tables or none of them.

Row level security is on and nothing is granted to the publishable key, so the
tables are reachable only with the secret key — which stays in `server/.env` and
never goes near the browser.

One thing worth knowing if you write another function like this: Postgres grants
EXECUTE to PUBLIC on every new function, and revoking from `anon` by name leaves
that standing. On a `security definer` function that is a hole straight through
row level security. The schema revokes from PUBLIC and grants back to
`service_role` alone.

Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` and restart. Without them the
bookings go to `server/data/bookings.json`, which is fine for a trial and
nothing else: it is a single file on one machine.

## What the staff can do from Telegram

Every booking arrives as a card with three buttons: guests left, cancel, change.
A button pressed by one person rewrites the card for everyone.

```
/book                   take a phone booking or seat a walk-in, step by step
/book friday 19:00 4 Anna +48 600 123 456 - nut allergy
/all                    every upcoming reservation, grouped by day
/all past               the last 30 days
/today  /tomorrow  /day saturday
/find Anna              by name, phone digits or DAON code
/move DAON-XXXXX        new day, time, party size or table
/cancel DAON-XXXXX      asks once, then cancels
/free DAON-XXXXX        the guests have left
/close 24.12 Christmas Eve
/open 24.12
/help
```

`/book` takes whatever it is given on one line and asks for the rest: day,
guests, time, table, name, phone, notes. It offers only the times and tables
that are still free, lets staff type any time outside the usual slots, warns
before booking outside opening hours, and shows a card to confirm. Once the
booking is made, the messages staff typed with the guest's name and phone are
deleted, so the only copy in the chat is the card, which is scrubbed with the
rest after the retention period.

Dates are read in any common form: `20.09`, `20/09/2026`, `2026-09-20`,
`20 września`, `20 sep`, `20 сентября`, `9월 20일`, `today`, `jutro`,
`завтра`, `friday`, `w piątek`, `в пятницу`, `za 3 dni`. A date without a year
is the next one to come; for `/day` it is the nearest, so last Saturday can
still be looked up. The bot always writes the date back with its weekday.

Closing a day takes it out of the calendar on the site and refuses any booking
for it. If the day already has bookings the bot says so, with the count — it
does not cancel them, because those guests need a phone call rather than a
silent disappearance.

Only the accounts in `TELEGRAM_STAFF_IDS` can use these, and only in a private
chat with the bot. The closures live in
`server/data/closures.json`; the nightly backup copies them alongside the
bookings.

## Who gets the bot

`TELEGRAM_STAFF_IDS` in `.env` is the whole list: numeric Telegram user ids,
comma separated. Every reservation goes to each of them, a button pressed by one
rewrites the message for all, and the bot answers nobody else — a stranger who
sends `/start` gets one line saying the bot is private, and every other command
from them is ignored. It only answers in private chats, so adding it to a group
does not put guests' names and phone numbers in front of the group.

The ids are user ids, not usernames. A username can be dropped and taken by
someone else; the id stays with the account. The service refuses to start with
the list empty.

Telegram does not let a bot write first. Each person has to open the bot and
press Start once; until they do, the service logs a line naming the id it cannot
reach, and that person gets nothing.

To find someone's id: have them message the bot, then stop the service and run
`npm run chat-id` — it prints every account that has written to the bot lately.
Stopping matters, because the running service reads the same updates. Or look
in the log, which names everyone it ignored:

```bash
ssh mcr 'journalctl -u daon-api --since today | grep Ignored'
```

Changing the list is an edit to `/opt/daon-api/.env` and a restart.

## What the restaurant sees

```
Nowa rezerwacja · DAON-3F2A1

Data: 11-09-2026
Godzina: 19:30
Liczba osób: 4
Stoliki: 4, 1 (Sala 1)
Imię: Jan Kowalski
Telefon: +48 600 123 456
Uwagi: Alergia na orzechy
```

An empty note is printed as `—` rather than left blank, so nothing reads as
missing.

## Pointing the site at it

`VITE_BOOKING_API_URL` at build time. On GitHub Pages that is a repository
variable, `BOOKING_API_URL`, read by the deploy workflow. Without it the site
falls back to the in-browser demo adapter, which forgets everything on reload.

The service has to be reachable over HTTPS from the published site: a browser on
`https://` will not call an `http://` endpoint.

## The admin panel

The restaurant edits its own site at `daon.pl/admin`; this is the half of it that
holds the keys. Three things live behind `/api/admin`:

- `content.js` — the menu, the categories, the hours, the promotion and the site
  wording, in three copies: `live` (what the pages are rendered from), `draft`
  (what the panel writes) and `history` (the last sixty live copies). Everything
  the panel sends is checked first: a price that is not a number, a dish in a
  category that does not exist or a piece of wording that lost its `{percent}`
  is refused with a sentence saying which dish and which field.
- `render.js` — runs the prerender from `/opt/daon-site` and swaps the twenty
  pages in one at a time, but only once the whole set has rendered and every
  asset the new pages name is still on disk.
- `photos.js` — writes an uploaded picture at 640 and 320 pixels in WebP and
  AVIF with ffmpeg, into `/var/www/daon-uploads`, named after a hash of the
  file.

What guards it:

- the password is a scrypt hash in `data/admin.json`, never in the repository,
  and `ADMIN_USER` / `ADMIN_PASSWORD` in `.env` only set the first one;
- until that first password is replaced from inside the panel, every write
  answers 423 — a password that has been typed into a chat cannot change what a
  guest reads;
- five wrong guesses from one address block it for fifteen minutes, then thirty,
  then an hour, then four;
- the session is an HttpOnly, SameSite=Strict cookie confined to `/api/admin`,
  and every write also has to carry that session's own token in a header;
- the staff chat is told about every lock-out, every publish, every password
  change and every sign-in from an address none of the current sessions use;
- `data/admin-log.jsonl` keeps who did what, and the panel shows it.

**Preview** renders the saved draft the same way a publish would and keeps it
in `data/previews` behind a random link that works for 24 hours, five at a
time. The link needs no password — it is meant to be sent to whoever should
look — and the page it opens says, in a bar at the bottom, that none of it is
published.

A publish also rewrites the hours and the reservation rules inside
`reservation-data.json`, so the booking form and the page can never disagree
about when the kitchen closes.

## Deployment

It runs on the VPS as `daon-api.service`, in `/opt/daon-api`, behind nginx at
`https://mcrplanet.com/daon/`. To update it:

```bash
scp -r src scripts reservation-data.json mcr:/opt/daon-api/
ssh mcr systemctl restart daon-api
ssh mcr journalctl -u daon-api -n 20
```

`server/.env` and `server/data/` live only on the machine — neither is in the
repository.

## On the machine

Two cron jobs, in `/etc/cron.d/daon-api`:

- `scripts/backup.sh` — nightly, copies both tables into
  `/var/backups/daon/reservations-YYYYMMDD.json` and keeps a month. A free
  Supabase project is not backed up, and the bookings are the one thing here
  that cannot be rebuilt from the repository.
- `scripts/watchdog.sh` — every ten minutes, checks that the service answers
  `/health` and that last night's copy exists, and messages the restaurant when
  either changes. systemd restarts a crashed process; it cannot see one that is
  running and not answering. It says nothing about the database: Supabase
  misses the odd check at night and is back by the next one, so those only go
  to `journalctl -u daon-api`.

Both speak only on a change of state, so an outage over a night is two messages
rather than fifty.

## Cancelling

The guest gets no account and no e-mail, so their way out is a token: an HMAC of
the booking's id under a server-side key. It goes back once with the booking,
the browser keeps it, and `POST /bookings/cancel` checks it. Nothing is stored
for it, and a guessed reference is useless without the key — a wrong token and a
wrong reference give the same answer, so the codes cannot be probed.

Cancelling marks the reservation and then deletes its table rows, in that order.
If the second step failed the table would stay blocked, which is the safe way to
fail; the other order could hand one table to two parties.

## What it checks

A booking is refused unless the date is in the future, the time is one the
kitchen actually seats, the tables exist, they seat the party, they can be
pushed together according to `joinsWith`, and none of them is already taken. The
last check runs twice: once here, once as a unique index in the database, which
is what actually decides a race between two guests booking at the same moment.

`POST /bookings` is capped at twelve an hour per address. There is no API key:
a static site has nowhere to keep one.
