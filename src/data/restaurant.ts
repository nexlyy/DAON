/**
 * Facts taken from the printed menu (phone, Instagram handle, currency) sit
 * next to placeholders that still need confirming from the restaurant. Every
 * placeholder is marked `PLACEHOLDER` so it is obvious what is not yet real.
 */
export const restaurant = {
  name: 'DAON',
  legalName: 'DAON Korean Restaurant',
  /** From the menu footer, printed on every page. */
  phone: '+48 728 550 310',
  phoneHref: 'tel:+48728550310',
  /** From the Instagram QR caption in the menu footer. */
  instagram: 'daonpoland',
  instagramUrl: 'https://instagram.com/daonpoland',
  address: {
    /** PLACEHOLDER — the street address has not been supplied yet. */
    street: null as string | null,
    city: 'Warszawa',
    country: 'Polska',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=DAON+Korean+Restaurant',
  },
  /** PLACEHOLDER — no e-mail address was supplied. */
  email: 'kontakt@daon.pl',
  currency: 'PLN',
} as const

/**
 * PLACEHOLDER — opening hours have not been supplied. They drive the
 * reservation time slots, so replace them together with `reservation` below.
 */
export const openingHours = [
  { day: 1, open: '12:00', close: '22:00' },
  { day: 2, open: '12:00', close: '22:00' },
  { day: 3, open: '12:00', close: '22:00' },
  { day: 4, open: '12:00', close: '22:00' },
  { day: 5, open: '12:00', close: '23:00' },
  { day: 6, open: '12:00', close: '23:00' },
  { day: 0, open: '12:00', close: '21:00' },
] as const

export const reservation = {
  /** Slots are generated every N minutes between opening and last seating. */
  slotMinutes: 30,
  /** Kitchen stops seating this many minutes before closing. */
  lastSeatingBeforeClose: 90,
  /** How far ahead guests may book. */
  maxDaysAhead: 60,
  /** Party sizes offered as buttons; the last one opens a free input. */
  partySizes: [1, 2, 3, 4, 5, 6],
  /** Above this the guest is asked to call instead. */
  maxPartySize: 12,
} as const
