import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { injectContent, injectStructuredData, readContent } from './content.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Building the site uses all the defaults. The server passes its own paths:
// it renders the pages again after an edit in the admin, from the content it
// holds, without a checkout or a toolchain.
const dist = process.env.DAON_DIST ? resolve(process.env.DAON_DIST) : resolve(root, 'dist')
const ssr = process.env.DAON_SSR ? resolve(process.env.DAON_SSR) : resolve(root, 'dist-ssr')
const content = process.env.DAON_CONTENT
  ? resolve(process.env.DAON_CONTENT)
  : resolve(root, 'src/content')
const locales = process.env.DAON_LOCALES
  ? resolve(process.env.DAON_LOCALES)
  : resolve(root, 'src/i18n/locales')
const templateFile = process.env.DAON_TEMPLATE
  ? resolve(process.env.DAON_TEMPLATE)
  : resolve(dist, 'index.html')
const SITE = 'https://daon.pl'

const LOCALES = [
  { code: 'pl', prefix: '', og: 'pl_PL' },
  { code: 'en', prefix: '/en', og: 'en_GB' },
  { code: 'ko', prefix: '/ko', og: 'ko_KR' },
]
const ROOT = LOCALES[0]

const snapshot = readContent(content)

// The page modules read the menu at import time, so the snapshot has to be in
// place before the server bundle is loaded.
globalThis.__DAON__ = snapshot

const { render } = await import(pathToFileURL(resolve(ssr, 'entry-server.js')).href)

// index.html as vite left it, before the first page is written over it. The
// copy goes next to the server bundle, which is what the server renders from.
const template = readFileSync(templateFile, 'utf8')
mkdirSync(ssr, { recursive: true })
writeFileSync(resolve(ssr, 'template.html'), template)

/**
 * The title and the description a search engine reads. They come from the
 * dictionaries, and whatever the restaurant has rewritten in the admin panel
 * is laid over the top: `meta.title` there replaces `title` here.
 */
const metaOf = (code) => {
  const built = JSON.parse(readFileSync(resolve(locales, `${code}.json`), 'utf8')).meta
  const changed = snapshot.texts?.[code] ?? {}
  const out = { ...built }
  for (const [key, value] of Object.entries(changed)) {
    if (key.startsWith('meta.') && typeof value === 'string' && value !== '') {
      out[key.slice('meta.'.length)] = value
    }
  }
  return out
}

const localized = (locale, path) => (locale.prefix ? (path === '/' ? locale.prefix : `${locale.prefix}${path}`) : path)
const fileFor = (locale, file) => (locale.prefix ? `${locale.prefix.slice(1)}/${file}` : file)

const PAGES = [
  { path: '/', file: 'index.html', canonical: '/', title: 'title', description: 'description' },
  { path: '/menu', file: 'menu/index.html', canonical: '/menu', title: 'menuTitle', description: 'menuDescription' },
  {
    path: '/reservation',
    file: 'reservation/index.html',
    canonical: '/reservation',
    title: 'reservationTitle',
    description: 'reservationDescription',
  },
  { path: '/privacy', file: 'privacy/index.html', canonical: '/privacy', title: 'privacyTitle', description: 'privacyDescription' },
  { path: '/about', file: 'about/index.html', canonical: '/', title: 'title', description: 'description' },
  { path: '/contact', file: 'contact/index.html', canonical: '/', title: 'title', description: 'description' },
]

const pages = [
  ...LOCALES.flatMap((locale) =>
    PAGES.map((entry) => ({
      locale,
      url: localized(locale, entry.path),
      file: fileFor(locale, entry.file),
      canonical: entry.canonical,
      listed: entry.canonical === entry.path,
      title: metaOf(locale.code)[entry.title],
      description: metaOf(locale.code)[entry.description],
    })),
  ),
  { locale: ROOT, url: '/404', file: '404.html', title: metaOf('pl').notFoundTitle, description: metaOf('pl').description, noindex: true },
  { locale: ROOT, url: null, file: 'shell.html', title: metaOf('pl').title, description: metaOf('pl').description, noindex: true },
]

const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function swap(html, pattern, replacement, label) {
  const found = html.match(pattern)
  if (!found || found.length !== 1) throw new Error(`${label}: expected one match in the template`)
  return html.replace(pattern, replacement)
}

function page({ locale, url, title, description, canonical, noindex }) {
  if (!title || !description) throw new Error(`${locale.code} ${url}: missing title or description`)
  let html = template
  html = swap(html, /<html lang="[^"]*"/g, `<html lang="${locale.code}"`, 'html lang')
  html = swap(html, /<title>[^<]*<\/title>/g, `<title>${escape(title)}</title>`, 'title')
  for (const [attribute, name, value] of [
    ['name', 'description', description],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
  ]) {
    html = swap(
      html,
      new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*/>`, 'g'),
      `<meta ${attribute}="${name}" content="${escape(value)}" />`,
      name,
    )
  }

  html = swap(
    html,
    /<meta property="og:locale" content="[^"]*" \/>(\s*<meta property="og:locale:alternate" content="[^"]*" \/>)*/g,
    [
      `<meta property="og:locale" content="${locale.og}" />`,
      ...LOCALES.filter((other) => other !== locale).map(
        (other) => `<meta property="og:locale:alternate" content="${other.og}" />`,
      ),
    ].join('\n    '),
    'og:locale',
  )

  if (canonical) {
    const href = `${SITE}${localized(locale, canonical)}`
    const alternates = [
      ...LOCALES.map((other) => `<link rel="alternate" hreflang="${other.code}" href="${SITE}${localized(other, canonical)}" />`),
      `<link rel="alternate" hreflang="x-default" href="${SITE}${localized(ROOT, canonical)}" />`,
    ].join('\n    ')
    html = swap(html, /<link rel="canonical" href="[^"]*" \/>/g, `<link rel="canonical" href="${href}" />\n    ${alternates}`, 'canonical')
    html = swap(html, /<meta property="og:url" content="[^"]*" \/>/g, `<meta property="og:url" content="${href}" />`, 'og:url')
  } else {
    html = swap(html, /\s*<link rel="canonical" href="[^"]*" \/>/g, '', 'canonical')
  }

  if (noindex) {
    html = html.replace('</title>', '</title>\n    <meta name="robots" content="noindex" />')
  }

  html = injectContent(html, snapshot)
  html = injectStructuredData(html, snapshot)

  if (url) {
    const body = render(url)
    if (!body) throw new Error(`${url} rendered nothing`)
    html = swap(html, /<div id="root"><\/div>/g, `<div id="root">${body}</div>`, 'root')
  }

  return html
}

for (const entry of pages) {
  const target = resolve(dist, entry.file)
  mkdirSync(dirname(target), { recursive: true })
  const html = page(entry)
  writeFileSync(target, html)
  console.log(`  ${entry.file.padEnd(28)} ${String(Math.round(html.length / 1024)).padStart(4)} KB`)
}

const today = new Date().toISOString().slice(0, 10)
const listed = PAGES.filter((entry) => entry.canonical === entry.path)
const urls = listed.flatMap((entry) =>
  LOCALES.map((locale) =>
    [
      '  <url>',
      `    <loc>${SITE}${localized(locale, entry.path)}</loc>`,
      ...LOCALES.map(
        (other) =>
          `    <xhtml:link rel="alternate" hreflang="${other.code}" href="${SITE}${localized(other, entry.path)}" />`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${localized(ROOT, entry.path)}" />`,
      `    <lastmod>${today}</lastmod>`,
      '  </url>',
    ].join('\n'),
  ),
)
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n'),
)
console.log(`  sitemap.xml                  ${urls.length} addresses`)

