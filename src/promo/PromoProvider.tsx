import { createContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { birthdayPromo } from '@/data/promotions'
import { LOCALE_META } from '@/i18n/config'
import { useI18n } from '@/i18n/useI18n'

export type PromoPhase = 'upcoming' | 'active'

export interface PromoValue {
  id: string
  phase: PromoPhase | null
  percent: number
  dates: string
  datesShort: string
  end: string
  price: (amount: number) => number
  sale: (amount: number) => number
}

export const PromoContext = createContext<PromoValue | null>(null)

const dayIn = (timeZone: string, now: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

export function phaseOn(now: Date): PromoPhase | null {
  const today = dayIn(birthdayPromo.timeZone, now)
  if (today < birthdayPromo.announceFrom || today > birthdayPromo.to) return null
  return today < birthdayPromo.from ? 'upcoming' : 'active'
}

export const salePrice = (amount: number) =>
  Math.round((Math.round(amount * 100) * (100 - birthdayPromo.percent)) / 100) / 100

function readPhase(): PromoPhase | null {
  if (typeof window === 'undefined') return null
  if (import.meta.env.DEV) {
    const forced = new URLSearchParams(window.location.search).get('promo')
    if (forced === 'upcoming' || forced === 'active') return forced
    if (forced === 'off') return null
  }
  return phaseOn(new Date())
}

const noon = (iso: string) => new Date(`${iso}T12:00:00Z`)

export function PromoProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n()
  const [phase, setPhase] = useState<PromoPhase | null>(readPhase)

  useEffect(() => {
    const update = () => setPhase(readPhase())
    const timer = window.setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  const value = useMemo<PromoValue>(() => {
    const lang = LOCALE_META[locale].htmlLang
    const from = noon(birthdayPromo.from)
    const to = noon(birthdayPromo.to)
    const long = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' })
    const short = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' })

    return {
      id: birthdayPromo.id,
      phase,
      percent: birthdayPromo.percent,
      dates: long.formatRange(from, to),
      datesShort: short.formatRange(from, to),
      end: long.format(to),
      price: (amount) => (phase === 'active' ? salePrice(amount) : amount),
      sale: salePrice,
    }
  }, [locale, phase])

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>
}
