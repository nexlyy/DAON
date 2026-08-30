import { floorPlan, resolveTableGroup } from '@/data/tables/floorPlan'
import type { FloorTable } from '@/data/tables/floorPlan'
import type { TableAvailability } from '@/services/booking'
import { useI18n } from '@/i18n/useI18n'
import styles from './RestaurantFloorPlan.module.css'

/** What the picker draws for one table, once party size is taken into account. */
export type TableState = TableAvailability | 'selected' | 'noJoin'

interface Props {
  status: Record<string, TableAvailability>
  selectedIds: string[]
  partySize: number
  onSelect: (table: FloorTable) => void
  loading?: boolean
}

const isFreeIn = (status: Record<string, TableAvailability>) => (id: string) =>
  (status[id] ?? 'available') === 'available'

export function tableState(
  table: FloorTable,
  status: Record<string, TableAvailability>,
  selectedIds: string[],
  partySize: number,
): TableState {
  if (selectedIds.includes(table.id)) return 'selected'

  const raw = status[table.id] ?? 'available'
  if (raw !== 'available') return raw

  // A free table is only offerable when the party actually fits there — for
  // more than four that means enough free neighbours to push against it.
  return resolveTableGroup(table.id, partySize, isFreeIn(status)) ? 'available' : 'noJoin'
}

export function RestaurantFloorPlan({
  status,
  selectedIds,
  partySize,
  onSelect,
  loading = false,
}: Props) {
  const { t } = useI18n()
  const { size, tables, fixtures, zones } = floorPlan

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

          {zones.map((zone) => (
            <g key={zone.id}>
              <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} className={styles.room} />
              <text x={zone.x + 18} y={zone.y + 34} className={styles.roomLabel}>
                {t(`floorPlan.zones.${zone.labelKey}`)}
              </text>
            </g>
          ))}

          {fixtures.map((fixture) => (
            <g key={fixture.id} className={styles.fixture} data-kind={fixture.kind}>
              <rect x={fixture.x} y={fixture.y} width={fixture.w} height={fixture.h} />
              <text x={fixture.x + fixture.w / 2} y={fixture.y + fixture.h / 2 + 7}>
                {t(`floorPlan.fixtures.${fixture.labelKey}`)}
              </text>
            </g>
          ))}

          {tables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              state={tableState(table, status, selectedIds, partySize)}
              partySize={partySize}
              onSelect={onSelect}
            />
          ))}
        </svg>
      </div>

      <p className={styles.hint}>{t('reservation.table.hint')}</p>
      <p className={styles.note}>{t('floorPlan.joinNote')}</p>
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
    state === 'noJoin'
      ? t('reservation.table.noJoin', { guests: partySize })
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
        <rect
          className={styles.body}
          x={-half.w}
          y={-half.h}
          width={table.w}
          height={table.h}
          rx="10"
        />
      )}

      <text className={styles.tableLabel} y="9">
        {table.label}
      </text>

      {state === 'selected' && (
        <circle className={styles.ring} r={Math.max(half.w, half.h) + 15} fill="none" />
      )}
    </g>
  )
}

/**
 * Chairs around the table, shared between the four sides in proportion to the
 * side lengths — a square four-top gets one per side, a long six-top two along
 * each long side and one at each end.
 */
function Seats({ table }: { table: FloorTable }) {
  const seats: { x: number; y: number }[] = []
  const gap = 15

  if (table.shape === 'round') {
    const radius = table.w / 2 + gap
    for (let i = 0; i < table.seats; i += 1) {
      const angle = (i / table.seats) * Math.PI * 2 - Math.PI / 2
      seats.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
    }
  } else {
    const perimeter = 2 * (table.w + table.h)
    const perHorizontal = Math.round((table.seats * table.w) / perimeter)
    const perVertical = Math.round((table.seats - perHorizontal * 2) / 2)
    const sides = [
      { count: perHorizontal, axis: 'x' as const, offset: -(table.h / 2 + gap) },
      { count: perHorizontal, axis: 'x' as const, offset: table.h / 2 + gap },
      { count: perVertical, axis: 'y' as const, offset: -(table.w / 2 + gap) },
      {
        count: table.seats - perHorizontal * 2 - perVertical,
        axis: 'y' as const,
        offset: table.w / 2 + gap,
      },
    ]

    for (const side of sides) {
      for (let i = 0; i < side.count; i += 1) {
        const fraction = (i + 1) / (side.count + 1)
        if (side.axis === 'x') {
          seats.push({ x: -table.w / 2 + fraction * table.w, y: side.offset })
        } else {
          seats.push({ x: side.offset, y: -table.h / 2 + fraction * table.h })
        }
      }
    }
  }

  return (
    <g className={styles.seats} aria-hidden="true">
      {seats.map((seat, index) => (
        <circle key={index} cx={seat.x} cy={seat.y} r="8" />
      ))}
    </g>
  )
}
