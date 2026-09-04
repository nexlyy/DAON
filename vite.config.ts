import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { hoursFor, restaurant, weekOrder } from './src/data/restaurant'

const ROUTES = ['menu', 'reservation', 'about', 'contact']

const base = process.env.BASE_PATH ?? '/DAON/'

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
    hasMenu: 'https://daon.pl/menu',
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
