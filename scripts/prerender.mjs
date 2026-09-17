import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const ssr = resolve(root, 'dist-ssr')
const SITE = 'https://daon.pl'

const { render } = await import(pathToFileURL(resolve(ssr, 'entry-server.js')).href)
const { meta } = JSON.parse(readFileSync(resolve(root, 'src/i18n/locales/en.json'), 'utf8'))
const template = readFileSync(resolve(dist, 'index.html'), 'utf8')

const pages = [
  { url: '/', file: 'index.html', canonical: '/', title: meta.title, description: meta.description },
  {
    url: '/menu',
    file: 'menu/index.html',
    canonical: '/menu',
    title: meta.menuTitle,
    description: meta.menuDescription,
  },
  {
    url: '/reservation',
    file: 'reservation/index.html',
    canonical: '/reservation',
    title: meta.reservationTitle,
    description: meta.reservationDescription,
  },
  {
    url: '/privacy',
    file: 'privacy/index.html',
    canonical: '/privacy',
    title: meta.privacyTitle,
    description: meta.privacyDescription,
  },
  { url: '/about', file: 'about/index.html', canonical: '/', title: meta.title, description: meta.description },
  { url: '/contact', file: 'contact/index.html', canonical: '/', title: meta.title, description: meta.description },
  { url: '/404', file: '404.html', title: meta.notFoundTitle, description: meta.description, noindex: true },
  { url: null, file: 'shell.html', title: meta.title, description: meta.description, noindex: true },
]

const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function swap(html, pattern, replacement, label) {
  const found = html.match(pattern)
  if (!found || found.length !== 1) throw new Error(`${label}: expected one match in the template`)
  return html.replace(pattern, replacement)
}

function page({ url, title, description, canonical, noindex }) {
  let html = template
  html = swap(html, /<title>[^<]*<\/title>/g, `<title>${escape(title)}</title>`, 'title')
  html = swap(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/g,
    `<meta name="description" content="${escape(description)}" />`,
    'description',
  )
  html = swap(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/g,
    `<meta property="og:title" content="${escape(title)}" />`,
    'og:title',
  )
  html = swap(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/g,
    `<meta property="og:description" content="${escape(description)}" />`,
    'og:description',
  )
  html = swap(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/g,
    `<meta name="twitter:title" content="${escape(title)}" />`,
    'twitter:title',
  )
  html = swap(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/g,
    `<meta name="twitter:description" content="${escape(description)}" />`,
    'twitter:description',
  )

  if (canonical) {
    html = swap(html, /<link rel="canonical" href="[^"]*" \/>/g, `<link rel="canonical" href="${SITE}${canonical}" />`, 'canonical')
    html = swap(html, /<meta property="og:url" content="[^"]*" \/>/g, `<meta property="og:url" content="${SITE}${canonical}" />`, 'og:url')
  } else {
    html = swap(html, /\s*<link rel="canonical" href="[^"]*" \/>/g, '', 'canonical')
  }

  if (noindex) {
    html = html.replace('</title>', '</title>\n    <meta name="robots" content="noindex" />')
  }

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
  console.log(`  ${entry.file.padEnd(24)} ${String(Math.round(html.length / 1024)).padStart(4)} KB`)
}

const today = new Date().toISOString().slice(0, 10)
const listed = pages.filter((entry) => entry.canonical && entry.canonical === entry.url)
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...listed.map((entry) => `  <url>\n    <loc>${SITE}${entry.canonical}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`),
    '</urlset>',
    '',
  ].join('\n'),
)
console.log(`  sitemap.xml              ${listed.length} addresses`)

rmSync(ssr, { recursive: true, force: true })
