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

Every dish name, price and description in `src/data/menu/dishes.ts` is
transcribed from the printed DAON menu (English/Polish edition). Photographs in
`public/images/dishes/` and the brush headings in `public/images/titles/` are
cropped from the same pages. Nothing is invented.

Korean copy for the dishes is not in the data yet — the Korean edition of the
menu has not been supplied. Text resolution falls back to English for `ko`, so
adding it later means filling in one field per entry:

```ts
name: { en: 'Bulgogi', ko: '불고기' },
```

## The floor plan

`src/data/tables/floorPlan.ts` is a placeholder room, not the real one. The
picker draws entirely from that file — tables, zones, fixtures, seat counts —
so replacing it with the real layout needs no component changes:

```ts
{ id: 'H1', label: '5', seats: 4, zone: 'hall', shape: 'rect',
  x: 150, y: 300, w: 140, h: 92 }
```

Coordinates live in the SVG user space set by `size`; the component scales that
box to whatever width it is given.

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

## Still to confirm

- Street address, e-mail and opening hours are placeholders in
  `src/data/restaurant.ts`.
- The floor plan is provisional.
- Menu items 25–31 are missing from the source scans, as are the last two pages
  (drinks and desserts, going by the page numbering).
