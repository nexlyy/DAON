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

## The four calls

```
GET  /closed-dates?from&to          dates the kitchen is shut
GET  /slots?date&partySize          seating times, and what is still free
GET  /tables?date&time&partySize    per-table availability
POST /bookings                      take a booking, then tell the staff
GET  /health                        liveness, which store, whether a chat is set
```

They are the same four the site's `BookingApi` interface describes, so pointing
`VITE_BOOKING_API_URL` at this service is the whole switch — nothing in the UI
changes.

Opening hours, the joining rules and the table numbers are not repeated here:
`npm run sync:data` copies them out of `src/data/*.ts` into
`reservation-data.json`. Run it after changing either file.

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

Row level security is on and nothing is granted to the anon key, so the tables
are reachable only with the service key — which stays in `server/.env` and never
goes near the browser.

Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` and restart. Without them the
bookings go to `server/data/bookings.json`, which is fine for a trial and
nothing else: it is a single file on one machine.

## Telling it where to send

Open the bot in Telegram and send `/start`. It replies with the chat id and
remembers it in `server/data/chat.json`, so the first message from the
restaurant is all the setup there is. To pin it instead, put the number in
`TELEGRAM_CHAT_ID` and that wins over anything saved.

`npm run chat-id` prints the bot's name and every chat that has written to it,
without starting the service.

For a group or a channel, add the bot to it and send `/start` there — the id
will be negative, which is normal.

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

## What it checks

A booking is refused unless the date is in the future, the time is one the
kitchen actually seats, the tables exist, they seat the party, they can be
pushed together according to `joinsWith`, and none of them is already taken. The
last check runs twice: once here, once as a unique index in the database, which
is what actually decides a race between two guests booking at the same moment.

`POST /bookings` is capped at twelve an hour per address. There is no API key:
a static site has nowhere to keep one.
