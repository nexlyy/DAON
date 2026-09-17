import { site } from '@/content/site'

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DayHours = readonly [open: string, close: string] | null

const { place, hours } = site.restaurant

const addressLine = `${place.address.street}, ${place.address.postalCode} ${place.address.city}, ${place.address.country}`

export const restaurant = {
  name: place.name,
  legalName: place.legalName,

  address: place.address,
  addressLine,

  phone: place.phone,
  phoneHref: `tel:${place.phone.replace(/\s/g, '')}`,

  email: place.email,
  emailHref: `mailto:${place.email}`,

  instagram: place.instagram,

  currency: place.currency,

  links: {
    instagram: `https://instagram.com/${place.instagram}`,

    // Both addresses are built from the Google place id, so the map and the
    // review form can never end up pointing at two different restaurants.
    maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `Daon Koreańska Restauracja, ${addressLine}`,
    )}&query_place_id=${place.googlePlaceId}`,

    review: `https://search.google.com/local/writereview?placeid=${place.googlePlaceId}`,

    delivery: place.links.delivery,
    pickup: place.links.pickup,
  },
}

export const openingHours: Readonly<Record<DayIndex, DayHours>> = Object.fromEntries(
  Object.entries(hours).map(([day, span]) => [Number(day), span as DayHours]),
) as Record<DayIndex, DayHours>

export const weekOrder: DayIndex[] = [1, 2, 3, 4, 5, 6, 0]

export const hoursFor = (day: number): DayHours => openingHours[day as DayIndex] ?? null

export const reservation = site.restaurant.reservation

export const legal = site.restaurant.legal

export const controllerName = () => legal.companyName

export const companyLine = () =>
  [
    `${legal.companyName}, ${legal.address}`,
    legal.court,
    `KRS ${legal.krs}`,
    `NIP ${legal.nip}`,
    `REGON ${legal.regon}`,
    `Kapitał zakładowy ${legal.shareCapital}`,
  ].join(' · ')
