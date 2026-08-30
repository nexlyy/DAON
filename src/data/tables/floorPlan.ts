/**
 * The DAON floor plan.
 *
 * Rooms, fixtures and table numbers follow the restaurant's own layout. The
 * tables were drawn by hand on the source sketch, so their positions here are
 * tidied onto a grid — the room each table sits in, its number and its
 * neighbours are what matter, and those are kept.
 *
 * Every table seats four. Larger parties are seated by pushing tables together,
 * which is what `joinsWith` describes: the tables staff can actually push
 * against this one.
 *
 * Everything the seat picker draws comes from this file. Moving a table is a
 * coordinate change here and nothing else.
 */

export type TableShape = 'round' | 'rect'

export interface FloorZone {
  id: string
  /** Translation key under `floorPlan.zones` in the locale files. */
  labelKey: string
  x: number
  y: number
  w: number
  h: number
}

export interface FloorTable {
  id: string
  /** Number the restaurant uses for this table. */
  label: string
  seats: number
  zone: string
  shape: TableShape
  /** Centre of the table. */
  x: number
  y: number
  /** Width and height of the table body. Round tables use `w` as diameter. */
  w: number
  h: number
  /** Degrees, clockwise. Optional; defaults to 0. */
  rotation?: number
  /** Table is out of service (renovation, staff table, …). */
  disabled?: boolean
  /** Tables that can be pushed together with this one, in preferred order. */
  joinsWith?: string[]
}

export type FixtureKind = 'kitchen' | 'bar' | 'entrance'

export interface FloorFixture {
  id: string
  kind: FixtureKind
  /** Translation key under `floorPlan.fixtures`. */
  labelKey: string
  x: number
  y: number
  w: number
  h: number
}

export interface FloorPlan {
  size: { width: number; height: number }
  zones: FloorZone[]
  fixtures: FloorFixture[]
  tables: FloorTable[]
}

/** Every table is a four-top of the same size. */
const TABLE = { seats: 4, shape: 'rect' as const, w: 76, h: 76 }

export const floorPlan: FloorPlan = {
  size: { width: 1220, height: 1240 },

  zones: [
    { id: 'sala1', labelKey: 'sala1', x: 60, y: 240, w: 430, h: 465 },
    { id: 'srodek', labelKey: 'srodek', x: 490, y: 240, w: 200, h: 465 },
    { id: 'sala2', labelKey: 'sala2', x: 690, y: 240, w: 480, h: 465 },
    { id: 'ogrodek', labelKey: 'ogrodek', x: 420, y: 875, w: 700, h: 325 },
  ],

  fixtures: [
    { id: 'kitchen', kind: 'kitchen', labelKey: 'kitchen', x: 560, y: 45, w: 220, h: 130 },
    { id: 'bar', kind: 'bar', labelKey: 'bar', x: 230, y: 175, w: 330, h: 65 },
    { id: 'entrance', kind: 'entrance', labelKey: 'entrance', x: 490, y: 705, w: 200, h: 110 },
  ],

  tables: [
    // Sala 1 — 7 alone by the bar wall, then two rows of three
    { ...TABLE, id: 'T7', label: '7', zone: 'sala1', x: 145, y: 359, joinsWith: ['T6'] },
    { ...TABLE, id: 'T6', label: '6', zone: 'sala1', x: 145, y: 489, joinsWith: ['T7', 'T4', 'T5'] },
    { ...TABLE, id: 'T4', label: '4', zone: 'sala1', x: 275, y: 489, joinsWith: ['T6', 'T1', 'T3'] },
    { ...TABLE, id: 'T1', label: '1', zone: 'sala1', x: 405, y: 489, joinsWith: ['T4', 'T2'] },
    { ...TABLE, id: 'T5', label: '5', zone: 'sala1', x: 145, y: 619, joinsWith: ['T6', 'T3'] },
    { ...TABLE, id: 'T3', label: '3', zone: 'sala1', x: 275, y: 619, joinsWith: ['T5', 'T4', 'T2'] },
    { ...TABLE, id: 'T2', label: '2', zone: 'sala1', x: 405, y: 619, joinsWith: ['T3', 'T1'] },

    // Sala 2 — three along the top, two below on the right
    { ...TABLE, id: 'T12', label: '12', zone: 'sala2', x: 800, y: 400, joinsWith: ['T11'] },
    { ...TABLE, id: 'T11', label: '11', zone: 'sala2', x: 930, y: 400, joinsWith: ['T12', 'T10', 'T8'] },
    { ...TABLE, id: 'T10', label: '10', zone: 'sala2', x: 1060, y: 400, joinsWith: ['T11', 'T9', 'T8'] },
    { ...TABLE, id: 'T8', label: '8', zone: 'sala2', x: 930, y: 555, joinsWith: ['T11', 'T9', 'T10'] },
    { ...TABLE, id: 'T9', label: '9', zone: 'sala2', x: 1060, y: 555, joinsWith: ['T10', 'T8'] },

    // Ogródek — four along the back, three in front
    { ...TABLE, id: 'T21', label: '21', zone: 'ogrodek', x: 545, y: 994, joinsWith: ['T22', 'T25'] },
    { ...TABLE, id: 'T22', label: '22', zone: 'ogrodek', x: 695, y: 994, joinsWith: ['T21', 'T23', 'T25', 'T26'] },
    { ...TABLE, id: 'T23', label: '23', zone: 'ogrodek', x: 845, y: 994, joinsWith: ['T22', 'T24', 'T26', 'T27'] },
    { ...TABLE, id: 'T24', label: '24', zone: 'ogrodek', x: 995, y: 994, joinsWith: ['T23', 'T27'] },
    { ...TABLE, id: 'T25', label: '25', zone: 'ogrodek', x: 620, y: 1124, joinsWith: ['T21', 'T22', 'T26'] },
    { ...TABLE, id: 'T26', label: '26', zone: 'ogrodek', x: 770, y: 1124, joinsWith: ['T25', 'T22', 'T23', 'T27'] },
    { ...TABLE, id: 'T27', label: '27', zone: 'ogrodek', x: 920, y: 1124, joinsWith: ['T26', 'T23', 'T24'] },
  ],
}

export const tableById = new Map(floorPlan.tables.map((table) => [table.id, table]))

export const zoneById = new Map(floorPlan.zones.map((zone) => [zone.id, zone]))

/**
 * Works out which tables seat a party if it starts from `primaryId`, pulling in
 * free neighbours until there are enough seats. Returns null when the party
 * cannot be seated there — the tables next to it are taken, or it is the only
 * one left and the party is too big for four.
 *
 * The order of `joinsWith` decides which neighbour is taken first, so the same
 * pick always produces the same group.
 */
export function resolveTableGroup(
  primaryId: string,
  partySize: number,
  isFree: (tableId: string) => boolean,
): string[] | null {
  const primary = tableById.get(primaryId)
  if (!primary || primary.disabled || !isFree(primary.id)) return null

  const group = [primary]
  const taken = new Set([primary.id])
  let seats = primary.seats

  while (seats < partySize) {
    const nextId = group
      .flatMap((table) => table.joinsWith ?? [])
      .find((id) => !taken.has(id) && isFree(id) && !tableById.get(id)?.disabled)
    if (!nextId) return null

    const next = tableById.get(nextId)
    if (!next) return null
    taken.add(nextId)
    group.push(next)
    seats += next.seats
  }

  return group.map((table) => table.id)
}

/** Seats offered by a group of tables. */
export function seatsOf(tableIds: string[]): number {
  return tableIds.reduce((total, id) => total + (tableById.get(id)?.seats ?? 0), 0)
}

/**
 * "21 + 22 + 23", the way the tables get read out on the phone. Sorted by
 * number rather than by the order they were picked up.
 */
export function formatTableLabels(tableIds: string[]): string {
  return tableIds
    .map((id) => tableById.get(id)?.label ?? id)
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))
    .join(' + ')
}
