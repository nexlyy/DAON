/**
 * Copies the facts the API needs out of the site's own data files.
 *
 * The opening hours, the reservation rules and the floor plan live in
 * `src/data/*.ts` and are the single source for both halves of the project.
 * The API runs on a server with an older Node that cannot import TypeScript,
 * so this writes them out as JSON — run it after changing either file:
 *
 *   npm run sync:data
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

const load = (relative) => import(pathToFileURL(resolve(root, relative)).href)

const { openingHours, reservation, restaurant } = await load('src/data/restaurant.ts')
const { floorPlan } = await load('src/data/tables/floorPlan.ts')
const pl = JSON.parse(readFileSync(resolve(root, 'src/i18n/locales/pl.json'), 'utf8'))

const data = {
  generatedFrom: 'src/data/restaurant.ts, src/data/tables/floorPlan.ts',
  openingHours,
  reservation,
  restaurant: { name: restaurant.name, phone: restaurant.phone },
  tables: floorPlan.tables.map((table) => ({
    id: table.id,
    label: table.label,
    seats: table.seats,
    zone: table.zone,
    joinsWith: table.joinsWith ?? [],
    disabled: table.disabled ?? false,
  })),
  // The restaurant reads Polish whatever language the guest booked in.
  zones: Object.fromEntries(
    floorPlan.zones.map((zone) => [zone.id, pl.floorPlan.zones[zone.labelKey] ?? zone.id]),
  ),
}

const out = resolve(here, '..', 'reservation-data.json')
writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`)
console.log(`Wrote ${out}: ${data.tables.length} tables, hours for 7 days.`)
