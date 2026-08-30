/**
 * Resolves a path inside /public against the deployment base. GitHub Pages
 * serves the site from /DAON/, so hard-coded absolute paths would 404 there.
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}
