import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// GitHub Pages serves the site from /<repo>/, so the base path is configurable
// through BASE_PATH and defaults to the repository name.
const base = process.env.BASE_PATH ?? '/DAON/'

// GitHub Pages has no SPA rewrite rule. Shipping index.html as 404.html makes
// deep links (/menu, /reservation) load the app instead of the Pages 404 page.
function spaFallback() {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const out = resolve(__dirname, 'dist')
      copyFileSync(resolve(out, 'index.html'), resolve(out, '404.html'))
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
