/**
 * Writes reservation-data.json: what the API needs to know about the place
 * without reading the site's source.
 *
 * The hours, the reservation rules and the address come from the site's content
 * files, which the admin panel also edits — the API rewrites these three
 * sections itself when something is published, so the two never drift. The
 * tables and the zones come from the floor plan, which is still code.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

const json = (relative) => JSON.parse(readFileSync(resolve(root, relative), 'utf8'))

const { floorPlan } = await import(
  pathToFileURL(resolve(root, 'src/data/tables/floorPlan.ts')).href
)

const content = json('src/content/restaurant.json')
const strings = json('src/i18n/locales/en.json')

const { place, hours, reservation, legal } = content

const data = {
  generatedFrom: 'src/content/restaurant.json, src/data/tables/floorPlan.ts',
  openingHours: hours,
  reservation,
  restaurant: {
    name: place.name,
    phone: place.phone,
    email: place.email,
    address: `${place.address.street}, ${place.address.postalCode} ${place.address.city}`,
    site: 'https://daon.pl',
    company: legal.companyName,
  },
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
