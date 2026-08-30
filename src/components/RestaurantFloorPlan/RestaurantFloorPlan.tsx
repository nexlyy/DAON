import { useMemo } from 'react'
import { floorPlan } from '@/data/tables/floorPlan'
import type { FloorTable } from '@/data/tables/floorPlan'
import type { TableAvailability } from '@/services/booking'
import { useI18n } from '@/i18n/useI18n'
import styles from './RestaurantFloorPlan.module.css'

/** What the picker draws for one table, after party size is taken into account. */
export type TableState = TableAvailability | 'selected' | 'tooSmall'

interface Props {
  status: Record<string, TableAvailability>
  selectedId: string | null
  partySize: number
  onSelect: (table: FloorTable) => void
  loading?: boolean
}

export function tableState(
  table: FloorTable,
  status: Record<string, TableAvailability>,
  selectedId: string | null,
  partySize: number,
): TableState {
  if (selectedId === table.id) return 'selected'
  const raw = status[table.id] ?? 'available'
  if (raw !== 'available') return raw
  return table.seats < partySize ? 'tooSmall' : 'available'
}

export function RestaurantFloorPlan({
  status,
  selectedId,
  partySize,
  onSelect,
  loading = false,
}: Props) {
  const { t } = useI18n()
  const { size, tables, fixtures, zones } = floorPlan

  // Zone outlines are derived from the tables they hold, so adding a table to a
  // zone is enough — no second set of coordinates to keep in sync.
  const zoneBoxes = useMemo(() => {
    const pad = 34
    return zones
      .map((zone) => {
        const members = tables.filter((table) => table.zone === zone.id)
        if (!members.length) return null
        const xs = members.flatMap((tbl) => [tbl.x - tbl.w / 2, tbl.x + tbl.w / 2])
        const ys = members.flatMap((tbl) => [tbl.y - tbl.h / 2, tbl.y + tbl.h / 2])
        const x = Math.min(...xs) - pad
        const y = Math.min(...ys) - pad
        return {
          id: zone.id,
          labelKey: zone.labelKey,
          x,
          y,
          w: Math.max(...xs) - x + pad,
          h: Math.max(...ys) - y + pad,
        }
      })
      .filter((zone): zone is NonNullable<typeof zone> => zone !== null)
  }, [tables, zones])

  return (
    <div className={styles.wrap} data-loading={loading || undefined}>
      <div className={styles.scroller}>
        <svg
          className={styles.plan}
          viewBox={`0 0 ${size.width} ${size.height}`}
          role="group"
          aria-label={t('floorPlan.title')}
        >
          <defs>
            <pattern id="daon-hatch" width="7" height="7" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="7" stroke="var(--clay)" strokeWidth="1" opacity="0.4" />
            </pattern>
          </defs>

          <rect
            x="14"
            y="14"
            width={size.width - 28}
            height={size.height - 28}
            rx="18"
            className={styles.room}
          />

          {zoneBoxes.map((zone) => (
            <g key={zone.id}>
              <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="16" className={styles.zone} />
              <text x={zone.x + 12} y={zone.y + 22} className={styles.zoneLabel}>
                {t(`floorPlan.zones.${zone.labelKey}`)}
              </text>
            </g>
          ))}

          {fixtures.map((fixture) => (
            <g key={fixture.id} className={styles.fixture} data-kind={fixture.kind}>
              <rect x={fixture.x} y={fixture.y} width={fixture.w} height={fixture.h} rx="8" />
              {fixture.labelKey && (
                <text x={fixture.x + fixture.w / 2} y={fixture.y + fixture.h / 2 + 4}>
                  {t(`floorPlan.fixtures.${fixture.labelKey}`)}
                </text>
              )}
            </g>
          ))}

          {tables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              state={tableState(table, status, selectedId, partySize)}
              partySize={partySize}
              onSelect={onSelect}
            />
          ))}
        </svg>
      </div>

      <p className={styles.hint}>{t('reservation.table.hint')}</p>
      <p className={styles.note}>{t('floorPlan.placeholder')}</p>
    </div>
  )
}

function TableNode({
  table,
  state,
  partySize,
  onSelect,
}: {
  table: FloorTable
  state: TableState
  partySize: number
  onSelect: (table: FloorTable) => void
}) {
  const { t } = useI18n()
  const selectable = state === 'available' || state === 'selected'
  const half = { w: table.w / 2, h: table.h / 2 }

  const label = [
    t('reservation.table.tableLabel', { label: table.label }),
    state === 'tooSmall'
      ? t('reservation.table.tooSmall', { seats: table.seats, guests: partySize })
      : `${t('reservation.table.seats', { count: table.seats })}, ${t(
          `reservation.table.legend.${state}`,
        )}`,
  ].join(', ')

  return (
    <g
      className={styles.table}
      data-state={state}
      data-selectable={selectable || undefined}
      transform={`translate(${table.x} ${table.y})${table.rotation ? ` rotate(${table.rotation})` : ''}`}
      role="button"
      tabIndex={selectable ? 0 : -1}
      aria-disabled={!selectable}
      aria-pressed={state === 'selected'}
      aria-label={label}
      onClick={() => selectable && onSelect(table)}
      onKeyDown={(event) => {
        if (!selectable) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(table)
        }
      }}
    >
      <Seats table={table} />

      {table.shape === 'round' ? (
        <circle className={styles.body} r={half.w} />
      ) : (
        <rect className={styles.body} x={-half.w} y={-half.h} width={table.w} height={table.h} rx="12" />
      )}

      {table.grill && (
        <rect
          className={styles.grill}
          x={-half.w * 0.42}
          y={-half.h * 0.46}
          width={table.w * 0.42}
          height={table.h * 0.46}
          rx="6"
        />
      )}

      <text className={styles.tableLabel} y="5">
        {table.label}
      </text>

      {state === 'selected' && (
        <circle className={styles.ring} r={Math.max(half.w, half.h) + 13} fill="none" />
      )}
    </g>
  )
}

/** Chairs drawn around the table, evenly split between the long sides. */
function Seats({ table }: { table: FloorTable }) {
  const seats: { x: number; y: number }[] = []

  if (table.shape === 'round') {
    const radius = table.w / 2 + 13
    for (let i = 0; i < table.seats; i += 1) {
      const angle = (i / table.seats) * Math.PI * 2 - Math.PI / 2
      seats.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
    }
  } else {
    const horizontal = table.w >= table.h
    const perSide = Math.ceil(table.seats / 2)
    for (let i = 0; i < table.seats; i += 1) {
      const side = i < perSide ? -1 : 1
      const indexOnSide = i < perSide ? i : i - perSide
      const countOnSide = i < perSide ? perSide : table.seats - perSide
      const t = (indexOnSide + 1) / (countOnSide + 1)
      if (horizontal) {
        seats.push({ x: -table.w / 2 + t * table.w, y: side * (table.h / 2 + 12) })
      } else {
        seats.push({ x: side * (table.w / 2 + 12), y: -table.h / 2 + t * table.h })
      }
    }
  }

  return (
    <g className={styles.seats} aria-hidden="true">
      {seats.map((seat, index) => (
        <circle key={index} cx={seat.x} cy={seat.y} r="6.5" />
      ))}
    </g>
  )
}
