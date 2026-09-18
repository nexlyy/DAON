/**
 * Talking to the admin side of the API.
 *
 * The session is a cookie the browser keeps and this code never sees. Every
 * write also carries the token the session was given when it signed in, which
 * is what stops a page on another site from posting here with that cookie.
 */
const BASE = `${(import.meta.env.VITE_BOOKING_API_URL as string | undefined) ?? '/api'}/admin`.replace(
  /([^:])\/\/+/g,
  '$1/',
)

export interface Dish {
  id: string
  number: string
  categoryId: string
  name: { en: string; pl?: string; ko?: string }
  description?: { en?: string; pl?: string; ko?: string }
  price: number
  photo?: string
  portion?: string
  serves?: string
  tags?: string[]
  allergens?: string[]
  featured?: boolean
  hidden?: boolean
}

export interface Category {
  id: string
  romanization: string
  name: { en: string; pl?: string; ko?: string }
  calligraphy: string
  sourcePages: number[]
}

export interface Content {
  menu: { dishes: Dish[] }
  categories: { categories: Category[] }
  allergens: { tracked: string[]; widespread: string[] }
  restaurant: {
    place: {
      name: string
      legalName: string
      address: { street: string; postalCode: string; city: string; country: string }
      phone: string
      email: string
      instagram: string
      currency: string
      googlePlaceId: string
      links: { delivery: string; pickup: string }
    }
    hours: Record<string, [string, string] | null>
    reservation: Record<string, number | number[]>
    legal: Record<string, string | number>
  }
  promo: {
    birthday: {
      id: string
      announceFrom: string
      from: string
      to: string
      percent: number
      timeZone: string
    } | null
  }

  /** Site wording the restaurant has rewritten, by locale and key. */
  texts: Record<string, Record<string, string>>
}

export type ContentFile = keyof Content

export interface State {
  user: string | null
  mustChange: boolean
  meta: { revision: number; updatedAt: string | null; updatedBy: string | null }
  pending: ContentFile[]
  canRender: boolean
  csrf?: string
  since?: string
  draft?: Content
  live?: Content
}

export class ApiError extends Error {
  status: number
  retryInMinutes?: number

  constructor(message: string, status: number, retryInMinutes?: number) {
    super(message)
    this.status = status
    this.retryInMinutes = retryInMinutes
  }
}

let csrf = ''

export const token = () => csrf

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(csrf && method !== 'GET' ? { 'X-Daon-Csrf': csrf } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('The server did not answer. Check the connection.', 0)
  }

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  const payload = (data ?? {}) as Record<string, unknown>
  if (typeof payload.csrf === 'string') csrf = payload.csrf

  if (!response.ok) {
    throw new ApiError(
      typeof payload.error === 'string' ? payload.error : `The server answered ${response.status}.`,
      response.status,
      typeof payload.retryInMinutes === 'number' ? payload.retryInMinutes : undefined,
    )
  }

  return data as T
}

/** Where a photograph is served from, whichever kind it is. */
export const photoUrl = (photo: string) =>
  photo.startsWith('u:') ? `/u/dishes/${photo.slice(2)}.webp` : `/images/dishes/${photo}.webp`

export const api = {
  signIn: (user: string, password: string) =>
    call<State>('POST', '/session', { user, password }),

  session: () => call<State>('GET', '/session'),

  signOut: () => call<{ ok: true }>('DELETE', '/session'),

  changePassword: (current: string, next: string) =>
    call<State>('PUT', '/password', { current, next }),

  content: () => call<State>('GET', '/content'),

  save: <K extends ContentFile>(file: K, value: Content[K], revision: number) =>
    call<State & { value: Content[K] }>('PUT', `/content/${file}`, { value, revision }),

  check: () => call<State & { pages: number; ms: number }>('POST', '/check'),

  publish: () =>
    call<State & { version: string; files: number; pages: number; ms: number }>('POST', '/publish'),

  history: () =>
    call<{ versions: { version: string; at: string | null; by: string | null }[] }>(
      'GET',
      '/history',
    ),

  restore: (version: string) => call<State & { draft: Content }>('POST', '/restore', { version }),

  /** The bytes go up as they are; the server checks what they really are. */
  uploadPhoto: async (dishId: string, blob: Blob) => {
    const response = await fetch(`${BASE}/photo/${encodeURIComponent(dishId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type || 'application/octet-stream', 'X-Daon-Csrf': token() },
      body: blob,
    })
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok) {
      throw new ApiError(
        typeof data.error === 'string' ? data.error : `The server answered ${response.status}.`,
        response.status,
      )
    }
    return data as unknown as State & { photo: string; resized: boolean }
  },

  photos: () => call<{ photos: { photo: string; bytes: number; avif: boolean }[] }>('GET', '/photos'),

  log: (limit = 100) =>
    call<{ entries: { at: string; what: string; user?: string; ip?: string }[] }>(
      'GET',
      `/log?limit=${limit}`,
    ),
}
