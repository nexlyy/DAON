/**
 * PLACEHOLDER LAYOUT.
 *
 * The real DAON floor plan has not been supplied yet. Everything the seat
 * picker draws comes from this file, so swapping in the real room means
 * editing the arrays below — no component changes.
 *
 * Coordinates live in the SVG user space defined by `size`; the component
 * scales that box to whatever width it is given, so you can work in whatever
 * unit is convenient (here: 1 unit ≈ 1 cm of a 10 × 6.8 m room).
 */

export type TableShape = 'round' | 'rect'

export interface FloorZone {
  id: string
  /** Translation key under `floorPlan.zones` in the locale files. */
  labelKey: string
}

export interface FloorTable {
  id: string
  /** Short label drawn inside the table. */
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
  /** Table is permanently out of service (renovation, staff table, …). */
  disabled?: boolean
  /** Draws a grill plate — Korean BBQ tables. */
  grill?: boolean
}

export type FixtureKind = 'wall' | 'bar' | 'kitchen' | 'entrance' | 'restroom' | 'window'

export interface FloorFixture {
  id: string
  kind: FixtureKind
  x: number
  y: number
  w: number
  h: number
  /** Translation key under `floorPlan.fixtures`; omit for plain walls. */
  labelKey?: string
}

export interface FloorPlan {
  size: { width: number; height: number }
  zones: FloorZone[]
  fixtures: FloorFixture[]
  tables: FloorTable[]
}

export const floorPlan: FloorPlan = {
  size: { width: 1000, height: 680 },

  zones: [
    { id: 'window', labelKey: 'window' },
    { id: 'hall', labelKey: 'hall' },
    { id: 'bbq', labelKey: 'bbq' },
    { id: 'private', labelKey: 'private' },
  ],

  fixtures: [
    { id: 'window-wall', kind: 'window', x: 60, y: 40, w: 620, h: 14, labelKey: 'window' },
    { id: 'kitchen', kind: 'kitchen', x: 700, y: 40, w: 240, h: 120, labelKey: 'kitchen' },
    { id: 'bar', kind: 'bar', x: 60, y: 596, w: 300, h: 44, labelKey: 'bar' },
    { id: 'entrance', kind: 'entrance', x: 430, y: 610, w: 150, h: 30, labelKey: 'entrance' },
    { id: 'restroom', kind: 'restroom', x: 840, y: 560, w: 100, h: 80, labelKey: 'restroom' },
  ],

  tables: [
    // Window bar — small tables looking onto the street
    { id: 'W1', label: '1', seats: 2, zone: 'window', shape: 'round', x: 130, y: 130, w: 84, h: 84 },
    { id: 'W2', label: '2', seats: 2, zone: 'window', shape: 'round', x: 270, y: 130, w: 84, h: 84 },
    { id: 'W3', label: '3', seats: 2, zone: 'window', shape: 'round', x: 410, y: 130, w: 84, h: 84 },
    { id: 'W4', label: '4', seats: 2, zone: 'window', shape: 'round', x: 550, y: 130, w: 84, h: 84 },

    // Main hall
    { id: 'H1', label: '5', seats: 4, zone: 'hall', shape: 'rect', x: 150, y: 300, w: 140, h: 92 },
    { id: 'H2', label: '6', seats: 4, zone: 'hall', shape: 'rect', x: 330, y: 300, w: 140, h: 92 },
    { id: 'H3', label: '7', seats: 4, zone: 'hall', shape: 'rect', x: 510, y: 300, w: 140, h: 92 },
    { id: 'H4', label: '8', seats: 6, zone: 'hall', shape: 'rect', x: 150, y: 450, w: 190, h: 92 },
    { id: 'H5', label: '9', seats: 6, zone: 'hall', shape: 'rect', x: 400, y: 450, w: 190, h: 92 },

    // Korean BBQ counter — tables with a built-in grill
    { id: 'B1', label: '10', seats: 4, zone: 'bbq', shape: 'rect', x: 820, y: 250, w: 150, h: 96, grill: true },
    { id: 'B2', label: '11', seats: 4, zone: 'bbq', shape: 'rect', x: 820, y: 370, w: 150, h: 96, grill: true },
    { id: 'B3', label: '12', seats: 4, zone: 'bbq', shape: 'rect', x: 820, y: 490, w: 150, h: 96, grill: true },

    // Private room
    { id: 'P1', label: '14', seats: 8, zone: 'private', shape: 'rect', x: 596, y: 470, w: 110, h: 200 },
  ],
}

export const tableById = new Map(floorPlan.tables.map((table) => [table.id, table]))

export const zoneById = new Map(floorPlan.zones.map((zone) => [zone.id, zone]))
