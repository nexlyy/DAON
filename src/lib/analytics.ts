const API = (import.meta.env.VITE_BOOKING_API_URL as string | undefined)?.replace(/\/$/, '')

export type TrackEvent =
  | 'view'
  | 'delivery'
  | 'pickup'
  | 'call'
  | 'directions'
  | 'instagram'
  | 'book_start'

function optedOut() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  // A preview of unpublished changes is the restaurant looking at itself, not
  // a guest, and would only muddy the numbers.
  const preview = (window as Window & { __DAON_PREVIEW__?: boolean }).__DAON_PREVIEW__ === true
  return preview || nav.globalPrivacyControl === true || nav.doNotTrack === '1'
}

let referrerSent = false

export function track(event: TrackEvent, details: { page?: string; locale?: string } = {}) {
  if (!API || typeof window === 'undefined' || optedOut()) return

  const params = new URLSearchParams({ e: event })
  if (details.page) params.set('p', details.page)
  if (details.locale) params.set('l', details.locale)

  if (event === 'view' && !referrerSent) {
    referrerSent = true
    try {
      if (document.referrer) params.set('r', new URL(document.referrer).hostname)
    } catch {
    }
  }

  fetch(`${API}/hit?${params}`, { method: 'GET', keepalive: true, credentials: 'omit' }).catch(() => {})
}
