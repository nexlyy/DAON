# Reservation notifier

A small Node service that takes each confirmed reservation from the site and
sends it to the restaurant's Telegram, in Polish.

The site is a static build on GitHub Pages, so it cannot hold a bot token —
anything shipped to the browser is public. This service holds it instead.

```
site → POST /bookings/notify → Telegram → the restaurant's phone
```

## Running it

```bash
cd server
cp .env.example .env      # then paste the token from @BotFather
npm start
```

No dependencies: Node 18 or newer is all it needs.

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

Set `VITE_BOOKING_NOTIFY_URL` in the site's build to wherever this runs, and
rebuild. Without it the site does not announce anything — it does not fail, it
simply stays quiet, which is the right behaviour for a preview build.

The service has to be reachable over HTTPS from the published site: a browser
on `https://` will not call an `http://` endpoint.

## What it does not do

It does not store availability or replace the booking backend — the site still
decides what is free. It takes a booking that already happened and passes it on.
Because a static site cannot keep a secret, `POST /bookings/notify` is open by
nature: it validates every field, caps a single address at 30 messages an hour,
and writes each one to `server/data/bookings.log`. `NOTIFY_SECRET` adds a header
check, which raises the bar without being a real secret.

Moving the endpoint behind a serverless function that also writes the booking to
a database is the next step if the volume ever justifies it.
