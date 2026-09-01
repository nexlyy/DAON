import { floorPlan, resolveTableGroup, zoneById } from '@/data/tables/floorPlan'
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
  /**
   * Crops the drawing to one room. The whole plan is 1220 units wide; on a
   * phone that means either unreadable tables or sideways scrolling, so the
   * picker shows one room at a time instead.
   */
  focusZone?: string | null
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
  focusZone = null,
}: Props) {
  const { t } = useI18n()
  const { size, tables, fixtures, zones } = floorPlan

  const focus = focusZone ? zoneById.get(focusZone) : undefined
  const pad = 26
  const viewBox = focus
    ? `${focus.x - pad} ${focus.y - pad} ${focus.w + pad * 2} ${focus.h + pad * 2}`
    : `0 0 ${size.width} ${size.height}`

  return (
    <div className={styles.wrap} data-loading={loading || undefined}>
      <div className={styles.scroller}>
        <svg
          className={styles.plan}
          data-focused={focus ? '' : undefined}
          viewBox={viewBox}
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
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                className={styles.room}
                data-outdoor={zone.outdoor || undefined}
              />
              {/* Neighbouring rooms keep their walls for context but lose their
                  names, which would otherwise be sliced in half at the edge. */}
              {(!focus || focus.id === zone.id) && (
                <text x={zone.x + 18} y={zone.y + 34} className={styles.roomLabel}>
                  {t(`floorPlan.zones.${zone.labelKey}`)}
                </text>
              )}
            </g>
          ))}

          {fixtures.map((fixture) => {
            const inside =
              !focus ||
              (fixture.x > focus.x - pad &&
                fixture.x + fixture.w < focus.x + focus.w + pad &&
                fixture.y > focus.y - pad &&
                fixture.y + fixture.h < focus.y + focus.h + pad)
            return (
              <g
                key={fixture.id}
                className={styles.fixture}
                data-kind={fixture.kind}
                data-small={fixture.small || undefined}
              >
                <rect x={fixture.x} y={fixture.y} width={fixture.w} height={fixture.h} />
                {inside && (
                  <text x={fixture.x + fixture.w / 2} y={fixture.y + fixture.h / 2 + 6}>
                    {t(`floorPlan.fixtures.${fixture.labelKey}`)}
                  </text>
                )}
              </g>
            )
          })}

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
      transform={`translate(${table.x} ${table.y})`}
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
      <rect
        className={styles.hitArea}
        x={-half.w - 26}
        y={-half.h - 26}
        width={table.w + 52}
        height={table.h + 52}
      />
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

      <text className={styles.tableLabel} y="8">
        {table.label}
      </text>
    </g>
  )
}

/** Chairs on the sides the restaurant's plan puts them on. */
function Seats({ table }: { table: FloorTable }) {
  const seats: { x: number; y: number }[] = []
  const gap = 13
  const half = { w: table.w / 2, h: table.h / 2 }

  const place = (count: number, axis: 'x' | 'y', offset: number) => {
    for (let i = 0; i < count; i += 1) {
      const fraction = (i + 1) / (count + 1)
      if (axis === 'x') {
        seats.push({ x: -half.w + fraction * table.w, y: offset })
      } else {
        seats.push({ x: offset, y: -half.h + fraction * table.h })
      }
    }
  }

  place(table.seating.top ?? 0, 'x', -(half.h + gap))
  place(table.seating.bottom ?? 0, 'x', half.h + gap)
  place(table.seating.left ?? 0, 'y', -(half.w + gap))
  place(table.seating.right ?? 0, 'y', half.w + gap)

  return (
    <g className={styles.seats} aria-hidden="true">
      {seats.map((seat, index) => (
        <circle key={index} cx={seat.x} cy={seat.y} r="7" />
      ))}
    </g>
  )
}
