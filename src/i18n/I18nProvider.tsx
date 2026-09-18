import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import en from './locales/en.json'
import pl from './locales/pl.json'
import ko from './locales/ko.json'
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  ROOT_LOCALE,
  localePath,
  splitLocale,
  type Locale,
} from './config'
import { readStoredLocale, storeLocale } from './detect'
import { site } from '@/content/site'

type Dictionary = typeof en
type Params = Record<string, string | number>

const dictionaries: Record<Locale, Dictionary> = {
  en,
  pl: pl as Dictionary,
  ko: ko as Dictionary,
}

export type Translatable = { en: string } & Partial<Record<Locale, string>>

export interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void

  switching: boolean
  t: (key: string, params?: Params) => string

  list: (key: string) => string[]

  resolve: (text: Translatable | undefined) => string
  formatPrice: (amount: number) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string

  path: (to: string) => string

  page: string
}

export const I18nContext = createContext<I18nValue | null>(null)

function lookup(dictionary: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) {
      return (node as Record<string, unknown>)[part]
    }
    return undefined
  }, dictionary)
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/**
 * Wording the restaurant has changed in the admin panel wins over the wording
 * the site was built with. Only whole strings can be overridden, so a key with
 * a count or a name in it keeps working the way the page expects.
 */
const overridden = (locale: Locale, key: string): string | undefined => {
  const value = site.texts?.[locale]?.[key]
  return typeof value === 'string' && value !== '' ? value : undefined
}

export function translate(locale: Locale, key: string, params?: Params): string {
  const found =
    overridden(locale, key) ??
    lookup(dictionaries[locale], key) ??
    overridden(DEFAULT_LOCALE, key) ??
    lookup(dictionaries[DEFAULT_LOCALE], key)
  return typeof found === 'string' ? interpolate(found, params) : key
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { locale, page } = splitLocale(location.pathname)
  const [switching, setSwitching] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const where = useRef({ locale, page, search: location.search, hash: location.hash })
  where.current = { locale, page, search: location.search, hash: location.hash }

  useEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].htmlLang
  }, [locale])

  useEffect(() => {
    const stored = readStoredLocale()
    const { locale: shown, page: current, search, hash } = where.current
    if (stored && stored !== ROOT_LOCALE && shown === ROOT_LOCALE) {
      navigate(`${localePath(stored, current)}${search}${hash}`, { replace: true })
    }
  }, [navigate])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const setLocale = useCallback(
    (next: Locale) => {
      storeLocale(next)
      const { locale: shown, page: current, search, hash } = where.current
      if (shown === next) return
      navigate(`${localePath(next, current)}${search}${hash}`)
      setSwitching(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setSwitching(false), 320)
    },
    [navigate],
  )

  const value = useMemo<I18nValue>(() => {
    const dictionary = dictionaries[locale]

    const t = (key: string, params?: Params) => translate(locale, key, params)

    const list = (key: string) => {
      const found = lookup(dictionary, key) ?? lookup(dictionaries[DEFAULT_LOCALE], key)
      return Array.isArray(found) ? (found as string[]) : []
    }

    const resolve = (text: Translatable | undefined) => {
      if (!text) return ''
      return text[locale] ?? text.en
    }

    const formatPrice = (amount: number) => {
      const number = new Intl.NumberFormat(LOCALE_META[locale].htmlLang, {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
      })
      return `${number.format(amount)} PLN`
    }

    const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(LOCALE_META[locale].htmlLang, options).format(date)

    const path = (to: string) => localePath(locale, to)

    return { locale, setLocale, switching, t, list, resolve, formatPrice, formatDate, path, page }
  }, [locale, setLocale, switching, page])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
