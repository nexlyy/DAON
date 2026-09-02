/**
 * Everything about the restaurant itself, in one place: address, contacts,
 * opening hours and outbound links. Components read from here — no address or
 * phone number is written into a component.
 */

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** `null` means closed that day. */
export type DayHours = readonly [open: string, close: string] | null

const ADDRESS = {
  street: 'Dworcowa 8',
  postalCode: '40-012',
  city: 'Katowice',
  country: 'Poland',
} as const

/** One line, the way it goes on an envelope or into a maps search. */
const addressLine = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`

export const restaurant = {
  name: 'DAON',
  legalName: 'DAON Korean Restaurant',

  address: ADDRESS,
  addressLine,

  phone: '+48 728 550 310',
  phoneHref: 'tel:+48728550310',

  email: 'daonpolska@gmail.com',
  emailHref: 'mailto:daonpolska@gmail.com',

  instagram: 'daonpoland',

  currency: 'PLN',

  links: {
    instagram: 'https://instagram.com/daonpoland',
    /**
     * The Maps search API URL: it resolves the query to the restaurant on the
     * web, and hands off to the Google Maps app when one is installed.
     */
    maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `DAON Korean Restaurant, ${addressLine}`,
    )}`,
    /** Uber Eats, one link per fulfilment mode. */
    delivery:
      'https://www.ubereats.com/pl/store/daon-korean-restaurant/jlFDD3NOTNCqWPgfFwU3tg?rwg_token=AE37R_gRWMtqC00Da1og1yQG6oYZVQzwVjZPCPUHC1d_T3pnJKt8Dk8L0tXZseuKYVS22152LKPF3xbXOe3zqj0z6XjFVQnHgg%3D%3D',
    pickup:
      'https://www.ubereats.com/pl/store/daon-korean-restaurant/jlFDD3NOTNCqWPgfFwU3tg?diningMode=PICKUP&rwg_token=AE37R_j9KOOzYERTYNF96Quhhr98X90DyTFQmoCqnPO5G9ufWSKT4PRrSSbYh5rC74oF7bg-kxYGkoAe11aGqHbkeFPMw3r2BA%3D%3D',
  },
} as const

/**
 * Indexed the way `Date.getDay()` counts, Sunday first. Monday is closed, so
 * the calendar greys it out and no time slots are generated for it.
 */
export const openingHours: Readonly<Record<DayIndex, DayHours>> = {
  0: ['12:00', '21:00'], // Sunday
  1: null, //              Monday — closed
  2: ['13:00', '22:00'], // Tuesday
  3: ['13:00', '22:00'], // Wednesday
  4: ['13:00', '22:00'], // Thursday
  5: ['13:00', '23:00'], // Friday
  6: ['12:00', '23:00'], // Saturday
}

/** Monday first, the way Polish and Korean calendars read. */
export const weekOrder: DayIndex[] = [1, 2, 3, 4, 5, 6, 0]

export const hoursFor = (day: number): DayHours => openingHours[day as DayIndex] ?? null

export const reservation = {
  /** Slots are generated every N minutes between opening and last seating. */
  slotMinutes: 30,
  /** The kitchen stops seating this many minutes before closing. */
  lastSeatingBeforeClose: 90,
  /** How far ahead guests may book. */
  maxDaysAhead: 60,
  /** Party sizes offered as buttons; the last one opens a free input. */
  partySizes: [1, 2, 3, 4, 5, 6],
  /** Above this the guest is asked to call instead. */
  maxPartySize: 12,
} as const
