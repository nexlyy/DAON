import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

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

export default defineConfig({
  base,
  plugins: [react(), spaFallback()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 2048,
  },
})
