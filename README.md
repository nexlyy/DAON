# DAON — Korean Restaurant

Website for DAON, a Korean restaurant in Poland: the full menu, and a table
reservation flow with an interactive floor plan. Korean, English and Polish,
picked automatically from the visitor's device language.

**Live:** https://nexlyy.github.io/DAON/

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/DAON/
npm run build    # static output in dist/
npm run preview
```

The site is a static bundle — no server, no database. It deploys to GitHub
Pages from `.github/workflows/deploy.yml` on every push to `main`.

## Stack

React 19 · Vite 7 · TypeScript · CSS Modules. Three runtime dependencies
(`react`, `react-dom`, `react-router-dom`) and nothing else.

## Layout

```
src/
├── components/
│   ├── Brand/                 roof mark and wordmark
│   ├── Hero/  Navbar/  Footer/
│   ├── LanguageSwitcher/
│   ├── Menu/                  dish card, dish dialog, category rail
│   ├── Ornament/              gold divider and vine, drawn from the menu artwork
│   ├── Reservation/           the five-step flow and its steps
│   └── RestaurantFloorPlan/   the SVG seat picker
├── data/
│   ├── menu/                  categories.ts · dishes.ts · types.ts
│   ├── tables/floorPlan.ts    room layout (see below)
│   └── restaurant.ts          contact details, opening hours, booking rules
├── i18n/                      provider, device-language detection, locales/*.json
├── pages/                     Home · Menu · Reservation · NotFound
├── services/booking/          the seam between UI and whatever stores bookings
└── styles/                    tokens.css · global.css
```

## The menu data

All 98 numbered items in `src/data/menu/dishes.ts` are transcribed from the two
menu files the restaurant supplied — "Eng and PL (2026.01.09)" and
"Kor (2025.01.09)". Numbers, prices and badges follow the English/Polish
edition, which is the newer of the two. Photographs in `public/images/dishes/`
and the brush headings in `public/images/titles/` are cropped from those same
pages. Nothing is invented.

The Korean edition is not a translation: it tells where each dish comes from.
So `ko` carries its own text rather than a rendering of the English.

`src/data/menu/allergens.ts` holds the allergy notice from the back of the
menu — four allergens listed against particular dish numbers, four marked
"contained in most dishes" and shown as a standing note instead.

### Photographs

The photographs are pulled from the PDF at the size they are stored there —
around 400px square — rather than re-cropped from a page raster, which is what
an earlier pass did and which cost a resample. Each one ships at 640px and
320px, as AVIF and WebP; `DishPhoto` picks between them. 640 is as far as the
originals go, so nothing is upscaled beyond a single Lanczos step and a light
unsharp pass. The brush headings are re-rendered from the PDF's own text at
600 dpi and keyed against the paper, so they are type, not a traced bitmap.

### PDF → website check

`dishes.ts` is checked back against the printed menu: every number 1–98 is
printed, no gaps and no duplicates; the price each dish shows is printed on the
page that prints its number; each name appears verbatim in one of the three
languages; and the section a dish is filed under is the section whose
calligraphy heads that page. It currently passes with nothing flagged.

### Where the two files disagree

Four entries differ between the English/Polish and Korean editions. The site
follows the newer English/Polish file; each is marked with a `sourceNote`
comment in `dishes.ts`.

| No. | English / Polish | Korean |
| --- | --- | --- |
| 26–29 | beef, pork, chicken, tofu | pork, chicken, beef, tofu |
| 38–43 | fried / spicy / sweet | plain / seasoned / garlic-soy |
| 47 | Dwaeji Galbi | 양념돼지목살 — marinated pork neck |
| 52 | Boneless ShortRib, 100 PLN | 양념 차돌박이 — marinated brisket, 105 PLN |

## The floor plan

`src/data/tables/floorPlan.ts` holds the real room: Sala 1, Środek, Sala 2 and
the Ogródek, plus the kitchen, bar and entrance. Nineteen tables, numbered the
way the restaurant numbers them. The picker draws entirely from that file, so
moving a table is a coordinate change and nothing else:

```ts
{ ...TABLE, id: 'T4', label: '4', zone: 'sala1', x: 275, y: 489,
  joinsWith: ['T6', 'T1', 'T3'] }
```

Coordinates live in the SVG user space set by `size`; the component scales that
box to whatever width it is given. Table positions are tidied onto a grid — what
is faithful is which room a table is in, its number and which tables it sits next
to.

Every table seats four. `joinsWith` lists the tables staff can push against this
one, and `resolveTableGroup` uses it: pick a table for a party of six and the
picker pulls in a free neighbour, selects both, and the booking records both.

## Reservations

`src/services/booking/types.ts` defines a four-call `BookingApi`. Two adapters
implement it:

- **mockApi** — the default. Availability is derived from a hash of
  date + time + table, so it looks plausible and stays stable across reloads.
  Confirmed bookings are kept in `localStorage`.
- **httpApi** — activated by setting `VITE_BOOKING_API_URL`. Same four calls
  against a real backend; the UI never learns which adapter it is talking to.

```
Frontend → BookingApi → (mock | HTTP → your service)
```

## Restaurant details

Address, phone, e-mail, opening hours and the outbound links all live in
`src/data/restaurant.ts`; no component holds a copy. Monday is `null` there,
which is what closes the day in the calendar and stops any slot being generated
for it. `reservation.lastSeatingBeforeClose` keeps the last seating 90 minutes
before closing, so Tuesday runs 13:00–20:30 and Saturday 12:00–21:30.

## Still to confirm

- The four rows in the table above, where the two menu files disagree.
