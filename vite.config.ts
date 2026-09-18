import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { injectContent, readContent } from './scripts/content.mjs'

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

function contentSnapshot() {
  const dir = resolve(__dirname, 'src/content')

  return {
    name: 'content-snapshot',
    transformIndexHtml(html: string) {
      return injectContent(html, readContent(dir))
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), contentSnapshot(), privateBundle()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  // The reservation form and the admin panel both talk to the API on the same
  // origin as the page, so the dev server has to look like the real one: a
  // cookie for /api/admin is not sent to a different port.
  server: {
    proxy: {
      '/api': {
        target: process.env.DAON_API ?? 'http://127.0.0.1:8787',
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
  },

  // The server renders the pages again after an edit in the admin, and it has
  // no node_modules of its own: react and the router travel inside the server
  // bundle rather than being required from beside it.
  ssr: {
    noExternal: true,
  },
})
