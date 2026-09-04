import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

const load = (relative) => import(pathToFileURL(resolve(root, relative)).href)

const { openingHours, reservation, restaurant } = await load('src/data/restaurant.ts')
const { floorPlan } = await load('src/data/tables/floorPlan.ts')

const strings = JSON.parse(readFileSync(resolve(root, 'src/i18n/locales/en.json'), 'utf8'))

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
  
  zones: Object.fromEntries(
    floorPlan.zones.map((zone) => [zone.id, strings.floorPlan.zones[zone.labelKey] ?? zone.id]),
  ),
}

const out = resolve(here, '..', 'reservation-data.json')
writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`)
console.log(`Wrote ${out}: ${data.tables.length} tables, hours for 7 days.`)
