import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { dishes } from './src/data/menu/dishes'
import { hoursFor, legal, restaurant, weekOrder } from './src/data/restaurant'

const requested = process.env.BASE_PATH ?? '/'

const base = /^\/[\w./-]*$/.test(requested) ? requested : '/'

if (base !== requested) {
  console.warn(`BASE_PATH was "${requested}"; building for "/" instead.`)
}

const TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

function privateBundle() {
  const root = resolve(__dirname, 'private/site')
  const keyFile = resolve(__dirname, 'private/key.txt')

  return {
    name: 'private-bundle',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const match = /^\/d\/([^/]+)\/([\w./-]+)$/.exec((req.url ?? '').split('?')[0])
        if (!match) return next()

        const key = existsSync(keyFile) ? readFileSync(keyFile, 'utf8').trim() : ''
        if (key && match[1] !== key) return next()

        const file = resolve(root, match[2])
        if (!file.startsWith(root) || !existsSync(file)) return next()

        res.setHeader('content-type', TYPES[extname(file)] ?? 'application/octet-stream')
        res.setHeader('x-robots-tag', 'noindex, nofollow')
        createReadStream(file).pipe(res)
      })
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

  const SITE = 'https://daon.pl'
  const prices = dishes.map((dish) => dish.price)
  const names = [restaurant.legalName, 'Daon', '다온', 'Даон']

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Restaurant',
        '@id': `${SITE}/#restaurant`,
        name: restaurant.name,
        alternateName: names,
        legalName: legal.companyName,
        taxID: legal.nip,
        url: `${SITE}/`,
        image: `${SITE}/og-image.jpg`,
        logo: `${SITE}/favicon-512.png`,
        description:
          'Korean restaurant in Katowice, Dworcowa 8, serving handmade ramen, Korean BBQ, hot pots and kimbap.',
        servesCuisine: 'Korean',
        priceRange: `${Math.min(...prices)}–${Math.max(...prices)} ${restaurant.currency}`,
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
        hasMenu: `${SITE}/menu`,
        acceptsReservations: `${SITE}/reservation`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: restaurant.name,
        alternateName: names,
        inLanguage: ['en', 'pl', 'ko'],
        publisher: { '@id': `${SITE}/#restaurant` },
      },
    ],
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
  plugins: [react(), structuredData(), privateBundle()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
  },
})
