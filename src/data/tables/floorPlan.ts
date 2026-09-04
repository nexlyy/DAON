/**
 * The DAON floor plan, following the restaurant's own drawing.
 *
 * Sala 1 and Sala 2 sit either side of Środek, with the bar and kitchen above
 * and the entrance below; the Ogródek is a separate terrace. Table numbers,
 * the room each one is in, and how the chairs sit around it are the
 * restaurant's; positions are placed on a grid so the drawing reads cleanly.
 *
 * Every table seats four. Larger parties are seated by pushing tables
 * together, which is what `joinsWith` describes: the tables staff can actually
 * push against this one.
 *
 * Everything the seat picker draws comes from this file. Moving a table is a
 * coordinate change here and nothing else.
 */

export type TableShape = 'round' | 'rect'

/** Which sides of a table the chairs stand on. */
export type SeatSide = 'top' | 'bottom' | 'left' | 'right'

export interface FloorZone {
  id: string
  /** Translation key under `floorPlan.zones` in the locale files. */
  labelKey: string
  x: number
  y: number
  w: number
  h: number
  /** Drawn as an outdoor terrace rather than an indoor room. */
  outdoor?: boolean
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
  /**
   * Chairs per side, as drawn on the restaurant's plan — the tables against a
   * wall seat guests on the two long sides, the ones standing free in the room
   * have chairs above and below.
   */
  seating: Partial<Record<SeatSide, number>>
  /** Table is out of service (renovation, staff table, …). */
  disabled?: boolean
  /** Tables that can be pushed together with this one, in preferred order. */
  joinsWith?: string[]
}

export type FixtureKind = 'kitchen' | 'bar' | 'entrance' | 'utility'

export interface FloorFixture {
  id: string
  kind: FixtureKind
  /** Translation key under `floorPlan.fixtures`. */
  labelKey: string
  x: number
  y: number
  w: number
  h: number
  /** Drawn quietly — the till, the appetiser counter, the toilets. */
  small?: boolean
}

export interface FloorPlan {
  size: { width: number; height: number }
  zones: FloorZone[]
  fixtures: FloorFixture[]
  tables: FloorTable[]
}

/** Every table is a four-top of the same size. */
const TABLE = { seats: 4, shape: 'rect' as const, w: 84, h: 62 }

/** Chairs left and right — tables lined up against a wall. */
const SIDES = { left: 2, right: 2 }
/** Chairs above and below — tables standing free in the room. */
const ENDS = { top: 2, bottom: 2 }

export const floorPlan: FloorPlan = {
  size: { width: 1240, height: 1180 },

  zones: [
    { id: 'sala1', labelKey: 'sala1', x: 40, y: 250, w: 430, h: 400 },
    { id: 'srodek', labelKey: 'srodek', x: 470, y: 250, w: 250, h: 400 },
    { id: 'sala2', labelKey: 'sala2', x: 720, y: 250, w: 480, h: 400 },
    { id: 'ogrodek', labelKey: 'ogrodek', x: 300, y: 830, w: 640, h: 320, outdoor: true },
  ],

  fixtures: [
    { id: 'kitchen', kind: 'kitchen', labelKey: 'kitchen', x: 500, y: 20, w: 270, h: 160 },
    { id: 'bar', kind: 'bar', labelKey: 'bar', x: 200, y: 180, w: 430, h: 70 },
    { id: 'till', kind: 'utility', labelKey: 'till', x: 448, y: 196, w: 112, h: 38, small: true },
    { id: 'starters', kind: 'utility', labelKey: 'starters', x: 530, y: 370, w: 130, h: 170 },
    { id: 'entrance', kind: 'entrance', labelKey: 'entrance', x: 470, y: 650, w: 250, h: 130 },
    { id: 'wc-men', kind: 'utility', labelKey: 'wcMen', x: 1046, y: 282, w: 136, h: 62, small: true },
    { id: 'wc-women', kind: 'utility', labelKey: 'wcWomen', x: 722, y: 650, w: 136, h: 96, small: true },
  ],

  tables: [
    // Sala 1 — 7, 6 and 5 stand against the left wall, chairs either side
    { ...TABLE, id: 'T7', label: '7', zone: 'sala1', x: 128, y: 320, seating: SIDES, joinsWith: ['T6'] },
    { ...TABLE, id: 'T6', label: '6', zone: 'sala1', x: 128, y: 450, seating: SIDES, joinsWith: ['T7', 'T5', 'T4'] },
    { ...TABLE, id: 'T5', label: '5', zone: 'sala1', x: 128, y: 580, seating: SIDES, joinsWith: ['T6', 'T3'] },

    // 4/1 over 3/2 stand free in the room, chairs above and below
    { ...TABLE, id: 'T4', label: '4', zone: 'sala1', x: 288, y: 470, seating: ENDS, joinsWith: ['T3', 'T1', 'T6'] },
    { ...TABLE, id: 'T1', label: '1', zone: 'sala1', x: 404, y: 470, seating: ENDS, joinsWith: ['T4', 'T2'] },
    { ...TABLE, id: 'T3', label: '3', zone: 'sala1', x: 288, y: 588, seating: ENDS, joinsWith: ['T4', 'T2', 'T5'] },
    { ...TABLE, id: 'T2', label: '2', zone: 'sala1', x: 404, y: 588, seating: ENDS, joinsWith: ['T1', 'T3'] },

    // Sala 2 — 12, 11 and 10 step down across the room
    { ...TABLE, id: 'T12', label: '12', zone: 'sala2', x: 812, y: 452, seating: ENDS, joinsWith: ['T11'] },
    { ...TABLE, id: 'T11', label: '11', zone: 'sala2', x: 928, y: 512, seating: ENDS, joinsWith: ['T12', 'T10'] },
    { ...TABLE, id: 'T10', label: '10', zone: 'sala2', x: 1044, y: 512, seating: ENDS, joinsWith: ['T11', 'T8', 'T9'] },

    // 8 and 9 sit against the right wall, one above the other
    { ...TABLE, id: 'T8', label: '8', zone: 'sala2', x: 1130, y: 452, seating: SIDES, joinsWith: ['T9', 'T10'] },
    { ...TABLE, id: 'T9', label: '9', zone: 'sala2', x: 1130, y: 578, seating: SIDES, joinsWith: ['T8', 'T10'] },

    // Ogródek — four along the back, three in front, chairs either side.
    //
    // The back row can be pushed together; the front three cannot be joined to
    // anything, so a party of more than four is never seated at 25, 26 or 27.
    { ...TABLE, id: 'T21', label: '21', zone: 'ogrodek', x: 400, y: 910, seating: SIDES, joinsWith: ['T22'] },
    { ...TABLE, id: 'T22', label: '22', zone: 'ogrodek', x: 550, y: 910, seating: SIDES, joinsWith: ['T21', 'T23'] },
    { ...TABLE, id: 'T23', label: '23', zone: 'ogrodek', x: 700, y: 910, seating: SIDES, joinsWith: ['T22', 'T24'] },
    { ...TABLE, id: 'T24', label: '24', zone: 'ogrodek', x: 850, y: 910, seating: SIDES, joinsWith: ['T23'] },
    { ...TABLE, id: 'T25', label: '25', zone: 'ogrodek', x: 460, y: 1070, seating: SIDES },
    { ...TABLE, id: 'T26', label: '26', zone: 'ogrodek', x: 620, y: 1070, seating: SIDES },
    { ...TABLE, id: 'T27', label: '27', zone: 'ogrodek', x: 780, y: 1070, seating: SIDES },
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
