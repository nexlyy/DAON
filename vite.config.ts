import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { hoursFor, restaurant, weekOrder } from './src/data/restaurant'

/** Routes that get their own index.html so Pages answers 200 instead of 404. */
const ROUTES = ['menu', 'reservation']

// GitHub Pages serves the site from /<repo>/, so the base path is configurable
// through BASE_PATH and defaults to the repository name.
const base = process.env.BASE_PATH ?? '/DAON/'

// GitHub Pages has no SPA rewrite rule. Known routes get a copy of the shell so
// they answer 200, and 404.html catches everything else — a typo in the URL then
// still loads the app, which renders its own not-found page.
function spaFallback() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const out = resolve(__dirname, 'dist')
      const shell = resolve(out, 'index.html')
      copyFileSync(shell, resolve(out, '404.html'))
      for (const route of ROUTES) {
        mkdirSync(resolve(out, route), { recursive: true })
        copyFileSync(shell, resolve(out, route, 'index.html'))
      }
    },
  }
}

/**
 * What Google is told about the restaurant. Built from `data/restaurant.ts` so
 * the address and the hours cannot drift from the ones on the page — an earlier
 * hand-written copy of this had the restaurant in the wrong city.
 */
function structuredData() {
  const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    description:
      'Korean restaurant in Katowice serving handmade ramen, Korean BBQ, hot pots and kimbap.',
    servesCuisine: 'Korean',
    priceRange: '35–450 PLN',
    currenciesAccepted: restaurant.currency,
    telephone: restaurant.phone,
    email: restaurant.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address.street,
      postalCode: restaurant.address.postalCode,
      addressLocality: restaurant.address.city,
      addressCountry: 'PL',
    },
    openingHoursSpecification: weekOrder
      .map((day) => ({ day, hours: hoursFor(day) }))
      .filter(({ hours }) => hours)
      .map(({ day, hours }) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${DAY_NAMES[day]}`,
        opens: hours![0],
        closes: hours![1],
      })),
    sameAs: [restaurant.links.instagram],
    hasMenu: 'https://daon.pl/menu/',
    acceptsReservations: 'True',
  }

  return {
    name: 'structured-data',
    transformIndexHtml(html: string) {
      return html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n    </script>`,
      )
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), structuredData(), spaFallback()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
  },
})
