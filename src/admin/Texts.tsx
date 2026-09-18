/**
 * The site's own wording, as far as it is safe to change from here.
 *
 * Only the pieces listed below can be rewritten; everything else on the site
 * stays as it was built, because a button that says nothing or a label with a
 * broken slot in it is a worse outcome than a sentence someone has to ask me
 * to change. A piece that carries a number or a date shows its slots, and the
 * field keeps them: {percent} has to stay {percent}.
 */
import { useState } from 'react'
import en from '@/i18n/locales/en.json'
import ko from '@/i18n/locales/ko.json'
import pl from '@/i18n/locales/pl.json'
import type { Editing } from './AdminPage'
import { useLocalCopy } from './AdminPage'
import { Message, Save } from './ui'
import styles from './admin.module.css'

const DICTIONARIES: Record<string, unknown> = { pl, en, ko }
const LOCALES: [string, string][] = [
  ['pl', 'Polish'],
  ['en', 'English'],
  ['ko', 'Korean'],
]

const GROUPS: { title: string; note?: string; keys: [string, string][] }[] = [
  {
    title: 'Home page',
    keys: [
      ['hero.tagline', 'Line under the name'],
      ['hero.lead', 'The paragraph beside the photographs'],
      ['home.about.title', 'About — heading'],
      ['home.about.body', 'About — text'],
      ['home.about.quote', 'About — the quote'],
      ['home.signature.title', 'Recommended — heading'],
      ['home.signature.subtitle', 'Recommended — line under it'],
      ['home.categories.title', 'Categories — heading'],
      ['home.categories.subtitle', 'Categories — line under it'],
      ['home.cta.title', 'Booking block — heading'],
      ['home.cta.body', 'Booking block — text'],
    ],
  },
  {
    title: 'Menu page',
    keys: [['menu.subtitle', 'The line under the word Menu']],
  },
  {
    title: 'Promotion',
    note: 'These carry slots the site fills in: {percent}, {dates}, {end}. Keep them as they are.',
    keys: [
      ['promo.ribbon.upcoming', 'Ribbon before it starts'],
      ['promo.ribbon.active', 'Ribbon while it runs'],
      ['promo.band.title', 'Block — heading before it starts'],
      ['promo.band.titleActive', 'Block — heading while it runs'],
      ['promo.band.body', 'Block — text before it starts'],
      ['promo.band.bodyActive', 'Block — text while it runs'],
    ],
  },
  {
    title: 'What search engines show',
    note: 'The title in a browser tab and the two lines under the address in Google.',
    keys: [
      ['meta.title', 'Home — title'],
      ['meta.description', 'Home — description'],
      ['meta.menuTitle', 'Menu — title'],
      ['meta.menuDescription', 'Menu — description'],
    ],
  },
]

const built = (locale: string, key: string): string => {
  const found = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' && part in node
          ? (node as Record<string, unknown>)[part]
          : undefined,
      DICTIONARIES[locale],
    )
  return typeof found === 'string' ? found : ''
}

const slots = (value: string) => value.match(/\{[a-z][a-zA-Z]*\}/g) ?? []

export function Texts({ editing }: { editing: Editing }) {
  const [copy, setCopy, dirty, undo] = useLocalCopy(editing.content.texts)
  const [failure, setFailure] = useState('')

  const set = (locale: string, key: string, value: string) => {
    const forLocale = { ...(copy[locale] ?? {}) }
    if (value.trim() === '') delete forLocale[key]
    else forLocale[key] = value
    setCopy({ ...copy, [locale]: forLocale })
  }

  // A rewritten line that lost a slot would print a hole on the page.
  const missing = (locale: string, key: string) => {
    const written = copy[locale]?.[key]
    if (!written) return ''
    const wanted = slots(built(locale, key) || built('en', key))
    const lost = wanted.filter((slot) => !written.includes(slot))
    return lost.length > 0 ? `still needs ${lost.join(' ')}` : ''
  }

  const commit = () => {
    setFailure('')
    editing.save('texts', copy).catch((error: unknown) => {
      setFailure(error instanceof Error ? error.message : String(error))
    })
  }

  const changed = LOCALES.reduce(
    (total, [locale]) => total + Object.keys(copy[locale] ?? {}).length,
    0,
  )

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Wording</h1>
        <span className={styles.rowSub}>
          {changed === 0 ? 'nothing rewritten' : `${changed} rewritten`}
        </span>
      </div>

      <p className={styles.note}>
        An empty field means the site keeps the sentence it was built with, which is what the grey
        text under each field shows. Dish names and descriptions are in Dishes, not here.
      </p>

      {failure && <Message kind="bad">{failure}</Message>}
      <Save
          dirty={dirty}
          saving={editing.saving}
          onSave={commit}
          onUndo={undo}
          pending={editing.pending.includes('texts')}
        />

      {GROUPS.map((group) => (
        <div key={group.title} className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>{group.title}</h2>
          </div>
          {group.note && <p className={styles.note}>{group.note}</p>}

          {group.keys.map(([key, label]) => (
            <div key={key} className={styles.field}>
              <span className={styles.label}>{label}</span>
              <div className={styles.langs}>
                {LOCALES.map(([locale, language]) => {
                  const lost = missing(locale, key)
                  return (
                    <div key={locale} className={styles.field}>
                      <textarea
                        className={styles.area}
                        style={{ minHeight: '3.5rem' }}
                        lang={locale}
                        value={copy[locale]?.[key] ?? ''}
                        placeholder={built(locale, key)}
                        onChange={(event) => set(locale, key, event.target.value)}
                      />
                      <span className={styles.rowSub}>
                        {language}
                        {lost && <strong className={styles.warnText}> · {lost}</strong>}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}
