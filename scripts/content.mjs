/**
 * Reads the restaurant's own content — the dishes, the categories, the hours,
 * the promotion — and puts a copy of it inside a page.
 *
 * Three places need this and none of them can import the other's code: the dev
 * server (vite.config.ts), the prerender that writes the built pages, and the
 * API on the server, which renders the pages again after someone edits
 * something in the admin. So it lives here, in plain JavaScript, with no
 * dependencies.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FILES = {
  dishes: 'menu.json',
  categories: 'categories.json',
  allergens: 'allergens.json',
  restaurant: 'restaurant.json',
  promo: 'promo.json',
}

const read = (dir, file) => JSON.parse(readFileSync(resolve(dir, file), 'utf8'))

/** The snapshot as the page will carry it. */
export function readContent(dir) {
  const menu = read(dir, FILES.dishes)
  const categories = read(dir, FILES.categories)
  return {
    dishes: menu.dishes,
    categories: categories.categories,
    allergens: read(dir, FILES.allergens),
    restaurant: read(dir, FILES.restaurant),
    promo: read(dir, FILES.promo),
  }
}

/**
 * A dish description is allowed to contain anything a cook would write,
 * including the five characters that would end this script element early, so
 * they leave as escapes. Inside a JavaScript string they mean the same thing.
 */
const serialize = (snapshot) =>
  JSON.stringify(snapshot)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

const SNAPSHOT = /<script>window\.__DAON__=[\s\S]*?<\/script>/

export function injectContent(html, snapshot) {
  const tag = `<script>window.__DAON__=${serialize(snapshot)}</script>`
  if (!SNAPSHOT.test(html)) throw new Error('index.html has no window.__DAON__ placeholder')
  return html.replace(SNAPSHOT, () => tag)
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const WEEK = [1, 2, 3, 4, 5, 6, 0]

const SITE = 'https://daon.pl'

/**
 * What Google reads: the address, the phone number, the hours and the price
 * range. It is built from the same content as the page, so a price or an hour
 * changed in the admin changes here too.
 */
export function structuredData(snapshot) {
  const { place, hours, legal } = snapshot.restaurant
  const prices = snapshot.dishes.map((dish) => dish.price)
  const names = [place.legalName, 'Daon', '다온', 'Даон']
  const addressLine = `${place.address.street}, ${place.address.postalCode} ${place.address.city}, ${place.address.country}`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Restaurant',
        '@id': `${SITE}/#restaurant`,
        name: place.name,
        alternateName: names,
        legalName: legal.companyName,
        taxID: legal.nip,
        url: `${SITE}/`,
        image: `${SITE}/og-image.jpg`,
        logo: `${SITE}/favicon-512.png`,
        description:
          'Korean restaurant in Katowice, Dworcowa 8, serving handmade ramen, Korean BBQ, hot pots and kimbap.',
        servesCuisine: 'Korean',
        priceRange: `${Math.min(...prices)}–${Math.max(...prices)} ${place.currency}`,
        currenciesAccepted: place.currency,
        telephone: place.phone,
        email: place.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: place.address.street,
          postalCode: place.address.postalCode,
          addressLocality: place.address.city,
          addressCountry: 'PL',
        },
        openingHoursSpecification: WEEK.map((day) => ({ day, span: hours[String(day)] }))
          .filter(({ span }) => span)
          .map(({ day, span }) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: `https://schema.org/${DAY_NAMES[day]}`,
            opens: span[0],
            closes: span[1],
          })),
        sameAs: [`https://instagram.com/${place.instagram}`],
        hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `Daon Koreańska Restauracja, ${addressLine}`,
        )}&query_place_id=${place.googlePlaceId}`,
        hasMenu: `${SITE}/menu`,
        acceptsReservations: `${SITE}/reservation`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: place.name,
        alternateName: names,
        inLanguage: ['en', 'pl', 'ko'],
        publisher: { '@id': `${SITE}/#restaurant` },
      },
    ],
  }
}

export function injectStructuredData(html, snapshot) {
  return html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    () =>
      `<script type="application/ld+json">\n${JSON.stringify(structuredData(snapshot), null, 2)}\n    </script>`,
  )
}
