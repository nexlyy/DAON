import { formatTableLabels, tableById, zoneById } from '@/data/tables/floorPlan'
import pl from '@/i18n/locales/pl.json'
import type { Booking } from './types'

const endpoint = import.meta.env.VITE_BOOKING_NOTIFY_URL as string | undefined
const secret = import.meta.env.VITE_BOOKING_NOTIFY_SECRET as string | undefined

/** The restaurant reads Polish, whatever language the guest booked in. */
function zoneName(tableIds: string[]): string {
  const zoneId = tableById.get(tableIds[0] ?? '')?.zone
  const key = zoneId ? zoneById.get(zoneId)?.labelKey : undefined
  const zones = pl.floorPlan.zones as Record<string, string>
  return key ? (zones[key] ?? '') : ''
}

/**
 * Tells the restaurant a table has been booked.
 *
 * The site is a static build and cannot hold a bot token, so the message goes
 * out through the small service in `server/`, which is the only thing that
 * knows it. Nothing here is allowed to fail loudly: the guest's booking is
 * already confirmed, and a notifier that is down is the restaurant's problem to
 * see in its logs, not the guest's to see on screen.
 */
export function notifyRestaurant(booking: Booking): void {
  if (!endpoint) return

  const payload = {
    reference: booking.reference,
    date: booking.date,
    time: booking.time,
    partySize: booking.partySize,
    tables: formatTableLabels(booking.tableIds),
    zone: zoneName(booking.tableIds),
    name: booking.name,
    phone: booking.phone,
    notes: booking.notes ?? '',
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['X-Daon-Secret'] = secret

  void fetch(`${endpoint.replace(/\/$/, '')}/bookings/notify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Deliberately silent — see above.
  })
}
