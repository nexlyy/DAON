/**
 * Every word the site says, in all three languages.
 *
 * Each field holds the sentence as it stands, so it can be edited rather than
 * retyped, and a field left exactly as the site was built stores nothing: the
 * page keeps using its own wording. A piece that carries a number or a date
 * keeps its slots — {percent} has to stay {percent} — and the field says so
 * when one goes missing.
 *
 * Dish names, prices and descriptions are not here; they are in Dishes.
 */
import { useMemo, useState } from 'react'
import en from '@/i18n/locales/en.json'
import ko from '@/i18n/locales/ko.json'
import pl from '@/i18n/locales/pl.json'
import type { Editing } from './AdminPage'
import { useLocalCopy } from './AdminPage'
import { Button, Message, Save } from './ui'
import styles from './admin.module.css'

const DICTIONARIES: Record<string, unknown> = { pl, en, ko }
const LOCALES: [string, string][] = [
  ['pl', 'Polish'],
  ['en', 'English'],
  ['ko', 'Korean'],
]

// What each part of the site is called here, in the order the groups appear.
const GROUPS: [string, string][] = [
  ['hero', 'Home — the top'],
  ['home', 'Home — the rest'],
  ['menu', 'Menu page'],
  ['promo', 'Promotion'],
  ['reservation', 'Booking form'],
  ['order', 'Ordering and delivery'],
  ['status', 'The open or closed badge'],
  ['tags', 'Labels on a dish'],
  ['allergens', 'Allergens'],
  ['floorPlan', 'The plan of the room'],
  ['nav', 'Navigation'],
  ['footer', 'Footer'],
  ['common', 'Buttons and small words'],
  ['drinks', 'Drinks page'],
  ['meta', 'What search engines show'],
  ['days', 'Day names'],
  ['months', 'Month names'],
]

const NOTES: Record<string, string> = {
  promo: 'These carry slots the site fills in: {percent}, {dates}, {end}. Keep them as they are.',
  meta: 'The title in a browser tab and the two lines under the address in Google.',
  drinks: 'The drinks list is not public yet, but its page reads these.',
  status: 'The badge that says when the kitchen closes today.',
}

// The ones worth a plain name rather than their path.
const LABELS: Record<string, string> = {
  'hero.tagline': 'Line under the name',
  'hero.lead': 'The paragraph beside the photographs',
  'home.about.title': 'About — heading',
  'home.about.body': 'About — text',
  'home.about.quote': 'About — the quote',
  'menu.subtitle': 'The line under the word Menu',
  'meta.title': 'Home — title',
  'meta.description': 'Home — description',
  'meta.menuTitle': 'Menu — title',
  'meta.menuDescription': 'Menu — description',
}

/**
 * Every key that holds a sentence. A list — the day names, the month names —
 * is read by position, so each position is a key of its own: days.long.3.
 */
const walk = (node: unknown, prefix = '', into: string[] = []): string[] => {
  if (Array.isArray(node)) {
    node.forEach((value, at) => {
      if (typeof value === 'string') into.push(`${prefix}.${at}`)
    })
    return into
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'string') into.push(path)
      else walk(value, path, into)
    }
  }
  return into
}

const POLISH = walk(pl)
const KEYS = POLISH.concat(walk(en).filter((key) => !POLISH.includes(key)))

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

const nameOf = (key: string) => {
  if (LABELS[key]) return LABELS[key]
  const parts = key.split('.').slice(1)
  const last = parts[parts.length - 1]
  // A position in a list reads better as "#4" than as "3".
  if (/^\d+$/.test(last)) parts[parts.length - 1] = `#${Number(last) + 1}`
  return parts
    .join(' · ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (first) => first.toUpperCase())
}

const slots = (value: string) => value.match(/\{[a-z][a-zA-Z]*\}/g) ?? []

const fold = (value: string) => value.toLowerCase()

export function Texts({ editing }: { editing: Editing }) {
  const [copy, setCopy, dirty, undo] = useLocalCopy(editing.content.texts)
  const [failure, setFailure] = useState('')
  const [query, setQuery] = useState('')
  const [opened, setOpened] = useState<string[]>([GROUPS[0][0]])

  const groups = useMemo(() => {
    const known = GROUPS.map(([id]) => id)
    const rest = [...new Set(KEYS.map((key) => key.split('.')[0]))].filter(
      (id) => !known.includes(id),
    )
    return [...GROUPS, ...rest.map((id) => [id, id] as [string, string])].map(([id, title]) => ({
      id,
      title,
      keys: KEYS.filter((key) => key.split('.')[0] === id),
    }))
  }, [])

  const needle = fold(query.trim())
  const matches = (key: string) =>
    !needle ||
    fold(key).includes(needle) ||
    LOCALES.some(
      ([locale]) =>
        fold(copy[locale]?.[key] ?? built(locale, key)).includes(needle) ||
        fold(nameOf(key)).includes(needle),
    )

  const changedIn = (keys: string[]) =>
    keys.filter((key) => LOCALES.some(([locale]) => copy[locale]?.[key] !== undefined)).length

  const total = LOCALES.reduce((count, [locale]) => count + Object.keys(copy[locale] ?? {}).length, 0)

  const set = (locale: string, key: string, value: string) => {
    const forLocale = { ...(copy[locale] ?? {}) }
    // A field put back exactly as it was stores nothing, so the site simply
    // keeps its own wording.
    if (value.trim() === '' || value === built(locale, key)) delete forLocale[key]
    else forLocale[key] = value
    setCopy({ ...copy, [locale]: forLocale })
  }

  const missing = (locale: string, key: string) => {
    const written = copy[locale]?.[key]
    if (!written) return ''
    const wanted = slots(built(locale, key) || built('en', key))
    const lost = wanted.filter((slot) => !written.includes(slot))
    return lost.length > 0 ? `needs ${lost.join(' ')}` : ''
  }

  const commit = () => {
    setFailure('')
    editing.save('texts', copy).catch((error: unknown) => {
      setFailure(error instanceof Error ? error.message : String(error))
    })
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Wording</h1>
        <span className={styles.rowSub}>
          {KEYS.length} pieces of wording · {total === 0 ? 'none changed' : `${total} changed`}
        </span>
      </div>

      <p className={styles.note}>
        Each field holds the sentence the site says now — edit it and it changes. Empty a field, or
        press Restore, and the site goes back to its own wording. Dish names and descriptions are in
        Dishes.
      </p>

      {failure && <Message kind="bad">{failure}</Message>}

      <div className={styles.tools}>
        <input
          className={styles.input}
          style={{ maxWidth: '20rem' }}
          type="search"
          value={query}
          placeholder="Search the wording, in any language"
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button onClick={() => setOpened(groups.map((group) => group.id))}>Open all</Button>
        <Button onClick={() => setOpened([])}>Close all</Button>
      </div>

      <Save
        dirty={dirty}
        saving={editing.saving}
        onSave={commit}
        onUndo={undo}
        pending={editing.pending.includes('texts')}
      />

      {groups.map((group) => {
        const keys = group.keys.filter(matches)
        if (keys.length === 0) return null
        const open = needle !== '' || opened.includes(group.id)
        const changed = changedIn(group.keys)

        return (
          <div key={group.id} className={styles.card}>
            <div className={styles.cardHead}>
              <button
                type="button"
                className={styles.cardTitle}
                onClick={() =>
                  setOpened((was) =>
                    was.includes(group.id)
                      ? was.filter((one) => one !== group.id)
                      : [...was, group.id],
                  )
                }
              >
                {open ? '▾' : '▸'} {group.title}
              </button>
              <span className={styles.rowSub}>
                {keys.length} {keys.length === 1 ? 'piece' : 'pieces'}
                {changed > 0 && ` · ${changed} changed`}
              </span>
            </div>

            {open && NOTES[group.id] && <p className={styles.note}>{NOTES[group.id]}</p>}

            {open &&
              keys.map((key) => (
                <div key={key} className={styles.field}>
                  <span className={styles.label}>
                    {nameOf(key)} <span className={styles.keyName}>{key}</span>
                  </span>
                  <div className={styles.langs}>
                    {LOCALES.map(([locale, language]) => {
                      const changedHere = copy[locale]?.[key] !== undefined
                      const lost = missing(locale, key)
                      return (
                        <div key={locale} className={styles.field}>
                          <textarea
                            className={styles.area}
                            style={{ minHeight: '3.5rem' }}
                            lang={locale}
                            value={copy[locale]?.[key] ?? built(locale, key)}
                            placeholder={built('en', key)}
                            onChange={(event) => set(locale, key, event.target.value)}
                          />
                          <span className={styles.rowSub}>
                            {language}
                            {changedHere && ' · changed'}
                            {lost && <strong className={styles.warnText}> · {lost}</strong>}
                            {changedHere && (
                              <button
                                type="button"
                                className={styles.restore}
                                onClick={() => set(locale, key, built(locale, key))}
                              >
                                Restore
                              </button>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )
      })}

      <Save
        dirty={dirty}
        saving={editing.saving}
        onSave={commit}
        onUndo={undo}
        pending={editing.pending.includes('texts')}
      />
    </>
  )
}
