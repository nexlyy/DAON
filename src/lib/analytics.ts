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
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1'
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
