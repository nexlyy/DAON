import { useEffect, useImperativeHandle } from 'react'
import type { Ref } from 'react'
import { floorPlan, resolveTableGroup, tableById } from '@/data/tables/floorPlan'
import type { FloorTable } from '@/data/tables/floorPlan'
import type { TableAvailability } from '@/services/booking'
import { useI18n } from '@/i18n/useI18n'
import { useMapView } from './useMapView'
import styles from './RestaurantFloorPlan.module.css'

/** Lets the step around the plan bring a table into view. */
export interface FloorPlanHandle {
  focusTable: (id: string) => void
}

/** What the picker draws for one table, once party size is taken into account. */
export type TableState = TableAvailability | 'selected' | 'noJoin'

interface Props {
  status: Record<string, TableAvailability>
  selectedIds: string[]
  partySize: number
  onSelect: (table: FloorTable) => void
  loading?: boolean
  handleRef?: Ref<FloorPlanHandle>
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
  handleRef,
}: Props) {
  const { t } = useI18n()
  const { size, tables, fixtures, zones } = floorPlan
  const map = useMapView({ width: size.width, height: size.height })

  useImperativeHandle(handleRef, () => ({
    focusTable: (id: string) => {
      const table = tableById.get(id)
      if (!table) return
      map.focusOn({
        x: table.x - table.w / 2,
        y: table.y - table.h / 2,
        w: table.w,
        h: table.h,
      })
    },
  }))

  // Choosing a table from the list moves the map to it, so the guest can see
  // where in the room they have just been put.
  const selectedKey = selectedIds.join(',')
  useEffect(() => {
    if (!map.zoomed || selectedIds.length === 0) return
    const seats = selectedIds
      .map((id) => tableById.get(id))
      .filter((table): table is FloorTable => Boolean(table))
    if (seats.length === 0) return
    const x0 = Math.min(...seats.map((seat) => seat.x - seat.w / 2))
    const y0 = Math.min(...seats.map((seat) => seat.y - seat.h / 2))
    const x1 = Math.max(...seats.map((seat) => seat.x + seat.w / 2))
    const y1 = Math.max(...seats.map((seat) => seat.y + seat.h / 2))
    map.focusOn({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])

  const { view } = map

  return (
    <div className={styles.wrap} data-loading={loading || undefined}>
      <div className={styles.stage}>
        <svg
          ref={map.svgRef}
          className={styles.plan}
          data-zoomed={map.zoomed || undefined}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          role="group"
          aria-label={t('floorPlan.title')}
          {...map.handlers}
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
              <text x={zone.x + 18} y={zone.y + 34} className={styles.roomLabel}>
                {t(`floorPlan.zones.${zone.labelKey}`)}
              </text>
            </g>
          ))}

          {fixtures.map((fixture) => (
            <g
              key={fixture.id}
              className={styles.fixture}
              data-kind={fixture.kind}
              data-small={fixture.small || undefined}
            >
              <rect x={fixture.x} y={fixture.y} width={fixture.w} height={fixture.h} />
              <text x={fixture.x + fixture.w / 2} y={fixture.y + fixture.h / 2 + 6}>
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
              onSelect={(picked) => {
                // A drag across the map ends on a table as often as not; that
                // should move the view, not book a seat.
                if (map.wasDragged()) return
                onSelect(picked)
              }}
            />
          ))}
        </svg>

        <div className={styles.zoom} role="group" aria-label={t('floorPlan.zoom.label')}>
          <button type="button" onClick={map.zoomIn} aria-label={t('floorPlan.zoom.in')}>
            +
          </button>
          <button type="button" onClick={map.zoomOut} aria-label={t('floorPlan.zoom.out')}>
            −
          </button>
          <button
            type="button"
            onClick={map.reset}
            disabled={!map.zoomed}
            aria-label={t('floorPlan.zoom.reset')}
          >
            <FitIcon />
          </button>
        </div>
      </div>

      <p className={styles.note}>
        {t('floorPlan.joinNote')} {t('floorPlan.zoom.hint')}
      </p>
    </div>
  )
}

function FitIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
      <path
        d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
