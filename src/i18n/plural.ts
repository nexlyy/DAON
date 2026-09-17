import { LOCALE_META, type Locale } from './config'

export function guestsKey(locale: Locale, count: number) {
  if (count === 1) return 'reservation.guests.person'
  const form = new Intl.PluralRules(LOCALE_META[locale].htmlLang).select(count)
  return form === 'few' ? 'reservation.guests.few' : 'reservation.guests.people'
}
