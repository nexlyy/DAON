import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import en from './locales/en.json'
import pl from './locales/pl.json'
import ko from './locales/ko.json'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from './config'
import { resolveInitialLocale, storeLocale } from './detect'

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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale())
  const [switching, setSwitching] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const current = useRef(locale)

  useEffect(() => {
    current.current = locale
    document.documentElement.lang = LOCALE_META[locale].htmlLang
  }, [locale])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const setLocale = useCallback((next: Locale) => {
    if (current.current === next) return
    current.current = next

    storeLocale(next)
    setLocaleState(next)
    setSwitching(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setSwitching(false), 320)
  }, [])

  const value = useMemo<I18nValue>(() => {
    const dictionary = dictionaries[locale]

    const t = (key: string, params?: Params) => {
      const found = lookup(dictionary, key) ?? lookup(dictionaries[DEFAULT_LOCALE], key)
      return typeof found === 'string' ? interpolate(found, params) : key
    }

    const list = (key: string) => {
      const found = lookup(dictionary, key) ?? lookup(dictionaries[DEFAULT_LOCALE], key)
      return Array.isArray(found) ? (found as string[]) : []
    }

    const resolve = (text: Translatable | undefined) => {
      if (!text) return ''
      return text[locale] ?? text.en
    }

    const formatPrice = (amount: number) =>
      
      `${new Intl.NumberFormat(LOCALE_META[locale].htmlLang).format(amount)} PLN`

    const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(LOCALE_META[locale].htmlLang, options).format(date)

    return { locale, setLocale, switching, t, list, resolve, formatPrice, formatDate }
  }, [locale, setLocale, switching])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
