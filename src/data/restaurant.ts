export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DayHours = readonly [open: string, close: string] | null

const ADDRESS = {
  street: 'Dworcowa 8',
  postalCode: '40-012',
  city: 'Katowice',
  country: 'Poland',
} as const

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
    
    maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `DAON Korean Restaurant, ${addressLine}`,
    )}`,
    
    delivery:
      'https://www.ubereats.com/pl/store/daon-korean-restaurant/jlFDD3NOTNCqWPgfFwU3tg?diningMode=DELIVERY&rwg_token=AE37R_gRWMtqC00Da1og1yQG6oYZVQzwVjZPCPUHC1d_T3pnJKt8Dk8L0tXZseuKYVS22152LKPF3xbXOe3zqj0z6XjFVQnHgg%3D%3D',
    pickup:
      'https://www.ubereats.com/pl/store/daon-korean-restaurant/jlFDD3NOTNCqWPgfFwU3tg?diningMode=PICKUP&rwg_token=AE37R_gRWMtqC00Da1og1yQG6oYZVQzwVjZPCPUHC1d_T3pnJKt8Dk8L0tXZseuKYVS22152LKPF3xbXOe3zqj0z6XjFVQnHgg%3D%3D',
  },
} as const

export const openingHours: Readonly<Record<DayIndex, DayHours>> = {
  0: ['12:00', '21:00'], // Sunday
  1: null, //              Monday — closed
  2: ['13:00', '22:00'], // Tuesday
  3: ['13:00', '22:00'], // Wednesday
  4: ['13:00', '22:00'], // Thursday
  5: ['13:00', '23:00'], // Friday
  6: ['12:00', '23:00'], // Saturday
}

export const weekOrder: DayIndex[] = [1, 2, 3, 4, 5, 6, 0]

export const hoursFor = (day: number): DayHours => openingHours[day as DayIndex] ?? null

export const reservation = {
  
  slotMinutes: 30,
  
  lastSeatingBeforeClose: 90,
  
  maxDaysAhead: 60,
  
  partySizes: [1, 2, 3, 4, 5, 6],
  
  maxPartySize: 12,
} as const
