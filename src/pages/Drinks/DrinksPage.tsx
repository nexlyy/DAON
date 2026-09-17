import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useStuck } from '@/hooks/useStuck'
import type {
  Bilingual,
  DrinkGroup,
  DrinkItem,
  DrinkSection,
  DrinksMenu,
} from './types'
import styles from './DrinksPage.module.css'

type Status = 'loading' | 'ready' | 'missing' | 'error'

const bundleUrl = (key: string) => `/d/${encodeURIComponent(key)}/drinks.json`
const imageUrl = (key: string, photo: string, ext: string, tier?: 'sm' | 'xl') =>
  `/d/${encodeURIComponent(key)}/images/${tier ? `${tier}/` : ''}${photo}.${ext}`

const anchor = (id: string) => `drinks-${id}`

const fold = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l')

const textsOf = (value: unknown): string[] => {
  if (!value) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(textsOf)
  if (typeof value === 'object') return Object.values(value).flatMap(textsOf)
  return []
}

const itemTexts = (item: DrinkItem) =>
  textsOf([item.name, item.title, item.sub, item.desc, item.note, item.prices?.map((price) => price.label)])

function filterSection(section: DrinkSection, matches: (texts: string[]) => boolean) {
  if (matches(textsOf(section.title))) return section

  switch (section.layout) {
    case 'columns': {
      const groups = (section.groups ?? [])
        .map((group) =>
          matches(textsOf(group.title))
            ? group
            : { ...group, items: group.items.filter((item) => matches(itemTexts(item))) },
        )
        .filter((group) => group.items.length > 0)
      return groups.length > 0 ? { ...section, photo: undefined, groups } : null
    }
    case 'steps':
      return section.items?.some((item) => matches(itemTexts(item))) ? section : null
    default: {
      const items = (section.items ?? []).filter((item) => matches(itemTexts(item)))
      return items.length > 0 ? { ...section, items } : null
    }
  }
}

const countOf = (section: DrinkSection) =>
  section.layout === 'steps'
    ? 1
    : section.layout === 'columns'
      ? (section.groups ?? []).reduce((total, group) => total + group.items.length, 0)
      : (section.items ?? []).length

export function DrinksPage() {
  const { t, locale, path } = useI18n()
  const { key = '' } = useParams()
  const [status, setStatus] = useState<Status>('loading')
  const [menu, setMenu] = useState<DrinksMenu | null>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  useDocumentMeta({
    title: t('drinks.metaTitle'),
    description: t('drinks.subtitle'),
    path: '/drinks',
    noindex: true,
  })

  const load = useCallback(() => {
    let cancelled = false
    setStatus('loading')

    fetch(bundleUrl(key), { headers: { accept: 'application/json' }, cache: 'no-cache' })
      .then((response) => {
        if (response.status === 404 || response.status === 403) return null
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<DrinksMenu>
      })
      .then((data) => {
        if (cancelled) return
        setMenu(data)
        setStatus(data ? 'ready' : 'missing')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(load, [load])

  const pick = useCallback(
    (value?: Bilingual | string) => {
      if (!value) return ''
      if (typeof value === 'string') return value
      if (locale === 'pl') return value.pl || value.en || ''
      return value.en || value.pl || ''
    },
    [locale],
  )

  const lines = useCallback(
    (value?: DrinkItem['desc']) => {
      if (!value) return []
      const chosen = locale === 'pl' ? value.pl ?? value.en : value.en ?? value.pl
      if (!chosen) return []
      return Array.isArray(chosen) ? chosen : [chosen]
    },
    [locale],
  )

  const needle = fold(deferredQuery.trim())
  const sections = useMemo(() => {
    const all = menu?.sections ?? []
    if (!needle) return all
    const stem = needle.length >= 5 && /[aeiouy]$/.test(needle) ? needle.slice(0, -1) : needle
    const matches = (texts: string[]) => texts.some((text) => fold(text).includes(stem))
    return all
      .map((section) => filterSection(section, matches))
      .filter((section): section is DrinkSection => section !== null)
  }, [menu, needle])

  const found = needle ? sections.reduce((total, section) => total + countOf(section), 0) : null

  if (status !== 'ready' || !menu) {
    return (
      <Notice
        status={status}
        onRetry={() => {
          load()
        }}
      />
    )
  }

  return (
    <>
      <Cover menu={menu} bundleKey={key} />

      <SectionRail sections={sections} pick={pick} query={query} onQuery={setQuery} />

      <div className="shell">
        {found !== null && (
          <p className={styles.results} aria-live="polite">
            {found > 0 ? t('drinks.results', { count: found }) : t('drinks.noResults', { query: query.trim() })}
            <button type="button" className={styles.resultsClear} onClick={() => setQuery('')}>
              {t('drinks.clear')}
            </button>
          </p>
        )}

        {sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            bundleKey={key}
            pick={pick}
            lines={lines}
          />
        ))}
      </div>

      <section className={`shell ${styles.foot}`}>
        <GoldDivider />
        <p className={styles.footNote}>{pick(menu.note)}</p>
        <p className={styles.footNote}>{t('drinks.footer')}</p>
        <Link className={styles.back} to={path('/')}>
          {t('drinks.back')}
        </Link>
      </section>
    </>
  )
}

function Notice({ status, onRetry }: { status: Status; onRetry: () => void }) {
  const { t, path } = useI18n()

  if (status === 'loading') {
    return (
      <section className={`shell ${styles.notice}`}>
        <p className={styles.noticeBody}>{t('drinks.loading')}</p>
      </section>
    )
  }

  const missing = status === 'missing'
  return (
    <section className={`shell ${styles.notice}`}>
      <h1 className={styles.noticeTitle}>
        {t(missing ? 'drinks.missingTitle' : 'drinks.errorTitle')}
      </h1>
      <p className={styles.noticeBody}>
        {t(missing ? 'drinks.missingBody' : 'drinks.errorBody')}
      </p>
      {!missing && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          {t('drinks.retry')}
        </button>
      )}
      <Link className={styles.back} to={path('/')}>
        {t('drinks.back')}
      </Link>
    </section>
  )
}

interface Shared {
  bundleKey: string
  pick: (value?: Bilingual | string) => string
}

function Cover({ menu, bundleKey }: { menu: DrinksMenu } & Pick<Shared, 'bundleKey'>) {
  const { t } = useI18n()

  return (
    <section className={styles.cover}>
      <Photo
        bundleKey={bundleKey}
        photo={menu.cover.photo}
        alt=""
        ratio={menu.cover.ratio}
        full={menu.cover.width}
        priority
      />
      <h1 className="visually-hidden">{t('drinks.title')}</h1>
    </section>
  )
}

function SectionRail({
  sections,
  pick,
  query,
  onQuery,
}: {
  sections: DrinkSection[]
  pick: Shared['pick']
  query: string
  onQuery: (value: string) => void
}) {
  const { t } = useI18n()
  const [sentinel, stuck] = useStuck<HTMLDivElement>()
  const railRef = useRef<HTMLElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const [more, setMore] = useState<'start' | 'end' | 'both' | undefined>()
  const [searching, setSearching] = useState(false)

  // Pictures load as they come into view, so the page keeps growing under a
  // long jump and a single scroll lands short. The target is corrected until it
  // stops moving, or until the reader takes over.
  const settling = useRef<(() => void) | null>(null)

  const scrollTo = useCallback((id: string, smooth = true) => {
    settling.current?.()

    const place = () => {
      const node = document.getElementById(anchor(id))
      const rail = railRef.current
      if (!node || !rail) return 0
      const off = node.getBoundingClientRect().top - rail.getBoundingClientRect().bottom - 12
      if (Math.abs(off) > 4) window.scrollTo({ top: window.scrollY + off, behavior: smooth ? 'smooth' : 'auto' })
      return off
    }

    place()

    let timer = 0
    const give = () => {
      window.clearTimeout(timer)
      settling.current = null
      for (const event of ['wheel', 'touchstart', 'keydown']) {
        window.removeEventListener(event, give)
      }
    }
    const until = Date.now() + 3000
    const again = () => {
      if (Date.now() > until) return give()
      if (Math.abs(place()) <= 4 && Date.now() > until - 2400) return give()
      timer = window.setTimeout(again, 250)
    }
    timer = window.setTimeout(again, 350)
    for (const event of ['wheel', 'touchstart', 'keydown']) {
      window.addEventListener(event, give, { passive: true })
    }
    settling.current = give
  }, [])

  useEffect(() => () => settling.current?.(), [])

  const measure = useCallback(() => {
    const chips = chipsRef.current
    if (!chips) return
    const before = chips.scrollLeft > 4
    const after = chips.scrollLeft + chips.clientWidth < chips.scrollWidth - 4
    setMore(before && after ? 'both' : before ? 'start' : after ? 'end' : undefined)
  }, [])

  useEffect(() => {
    const chips = chipsRef.current
    if (!chips) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(chips)
    return () => observer.disconnect()
  }, [measure, sections])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash.startsWith('drinks-')) return
    const id = hash.slice('drinks-'.length)
    if (!sections.some((section) => section.id === id)) return
    const frame = window.requestAnimationFrame(() => scrollTo(id, false))
    return () => window.cancelAnimationFrame(frame)

  }, [])

  useEffect(() => {
    let frame = 0
    const spy = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const line = (railRef.current?.getBoundingClientRect().bottom ?? 0) + 48
        let current = sections[0]?.id ?? ''
        for (const section of sections) {
          const node = document.getElementById(anchor(section.id))
          if (node && node.getBoundingClientRect().top <= line) current = section.id
        }
        setActive(current)
      })
    }
    spy()
    window.addEventListener('scroll', spy, { passive: true })
    window.addEventListener('resize', spy)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', spy)
      window.removeEventListener('resize', spy)
    }
  }, [sections])

  useEffect(() => {
    const chips = chipsRef.current
    const chip = chips?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!chips || !chip) return
    chips.scrollTo({
      left: chip.offsetLeft - (chips.clientWidth - chip.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }, [active])

  useEffect(() => {
    if (searching) inputRef.current?.focus()
  }, [searching])

  const jump = (id: string) => {
    setActive(id)
    scrollTo(id)
    window.history.replaceState(window.history.state, '', `#${anchor(id)}`)
  }

  const open = searching || query.length > 0

  return (
    <>
      <div ref={sentinel} aria-hidden="true" />
      <nav
        ref={railRef}
        className={styles.rail}
        aria-label={t('drinks.jump')}
        data-stuck={stuck || undefined}
        data-searching={open || undefined}
      >
        <div className={`shell ${styles.railInner}`}>
          <div className={styles.search} role="search">
            <button
              type="button"
              className={styles.searchToggle}
              aria-label={t('drinks.searchOpen')}
              aria-expanded={open}
              onClick={() => setSearching(true)}
            >
              <SearchIcon />
            </button>
            <label className={styles.searchField}>
              <span className="visually-hidden">{t('drinks.searchLabel')}</span>
              <SearchIcon />
              <input
                ref={inputRef}
                type="search"
                value={query}
                placeholder={t('drinks.searchPlaceholder')}
                enterKeyHint="search"
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    onQuery('')
                    setSearching(false)
                  }
                }}
              />
            </label>
            <button
              type="button"
              className={styles.searchClose}
              aria-label={t('drinks.searchClose')}
              onClick={() => {
                onQuery('')
                setSearching(false)
              }}
            >
              ×
            </button>
          </div>

          <div className={styles.chips} ref={chipsRef} data-more={more} onScroll={measure}>
            {sections.map((section) => (
              <a
                key={section.id}
                className={styles.railLink}
                href={`#${anchor(section.id)}`}
                aria-current={section.id === active || undefined}
                onClick={(event) => {
                  event.preventDefault()
                  jump(section.id)
                }}
              >
                {pick(section.title)}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="m13 13 4 4" />
      </g>
    </svg>
  )
}

function Section({
  section,
  bundleKey,
  pick,
  lines,
}: {
  section: DrinkSection
  lines: (value?: DrinkItem['desc']) => string[]
} & Shared) {
  const title = pick(section.title)
  const other = section.title.pl && section.title.en && section.title.pl !== title
    ? section.title.pl
    : undefined

  return (
    <section className={styles.section} id={anchor(section.id)}>
      <header className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {other && <p className={styles.sectionAlt}>{other}</p>}
        <GoldDivider className={styles.sectionRule} />
      </header>

      {section.layout === 'cards' && (
        <div className={styles.cards}>
          {section.items?.map((item, index) => (
            <Card
              key={pick(item.name) + index}
              item={item}
              index={index}
              bundleKey={bundleKey}
              pick={pick}
              lines={lines}
            />
          ))}
        </div>
      )}

      {section.layout === 'feature' && (
        <div className={styles.feature}>
          {section.photo && (
            <div className={styles.featureMedia}>
              <Photo
                bundleKey={bundleKey}
                photo={section.photo}
                alt={title}
                ratio={section.ratio}
              />
            </div>
          )}
          <ul className={styles.featureList}>
            {section.items?.map((item, index) => (
              <li className={styles.featureItem} key={pick(item.name) + index}>
                <div className={styles.rowHead}>
                  <h3 className={styles.itemName}>{pick(item.name)}</h3>
                  {item.price && (
                    <span className={styles.price}>
                      {item.volume && <em className={styles.volume}>{item.volume}</em>}
                      {item.price}
                    </span>
                  )}
                </div>
                {item.note && <p className={styles.itemNote}>{pick(item.note)}</p>}
                {lines(item.desc).map((line) => (
                  <p className={styles.itemDesc} key={line}>
                    {line}
                  </p>
                ))}
                {item.prices && (
                  <dl className={styles.priceGrid}>
                    {item.prices.map((entry) => (
                      <div className={styles.priceCell} key={entry.price}>
                        <dt>
                          {pick(entry.label)}
                          {entry.volume && <em className={styles.volume}>{entry.volume}</em>}
                        </dt>
                        <dd>{entry.price}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.layout === 'columns' && (
        <div className={styles.groups}>
          {section.photo && (
            <div className={styles.groupsMedia}>
              <Photo
                bundleKey={bundleKey}
                photo={section.photo}
                alt={title}
                ratio={section.ratio}
              />
            </div>
          )}
          {section.groups?.map((group) => (
            <Group
              key={pick(group.title)}
              group={group}
              bundleKey={bundleKey}
              pick={pick}
              lines={lines}
            />
          ))}
        </div>
      )}

      {section.layout === 'wines' && (
        <div className={styles.wines}>
          {section.photo && (
            <div className={styles.winesMedia}>
              <Photo
                bundleKey={bundleKey}
                photo={section.photo}
                alt={title}
                ratio={section.ratio}
              />
            </div>
          )}
          <table className={styles.wineTable}>
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">{title}</span>
                </th>
                {section.columns?.map((column) => (
                  <th scope="col" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.items?.map((item) => (
                <tr key={pick(item.name)}>
                  <th scope="row">
                    <span className={styles.itemName}>{pick(item.name)}</span>
                    {lines(item.desc).map((line) => (
                      <span className={styles.itemDesc} key={line}>
                        {line}
                      </span>
                    ))}
                  </th>
                  {item.values?.map((value, index) => (
                    <td key={`${value}-${index}`} data-label={section.columns?.[index]}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.layout === 'steps' && (
        <div className={styles.steps}>
          {section.photo && (
            <div className={styles.stepsMedia}>
              <Photo
                bundleKey={bundleKey}
                photo={section.photo}
                alt={title}
                ratio={section.ratio}
              />
            </div>
          )}
          {section.price && <p className={styles.stepsPrice}>{section.price}</p>}
          <ol className={styles.stepList}>
            {section.items?.map((item) => (
              <li className={styles.step} key={pick(item.title)}>
                <h3 className={styles.stepTitle}>
                  {item.step && <span className={styles.stepNumber}>{item.step}</span>}
                  {pick(item.title).replace(/^\d+\s+/, '')}
                </h3>
                {item.sub && <p className={styles.itemNote}>{pick(item.sub)}</p>}
                {lines(item.desc).map((line) => (
                  <p className={styles.itemDesc} key={line}>
                    {line}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function Group({
  group,
  bundleKey,
  pick,
  lines,
}: {
  group: DrinkGroup
  lines: (value?: DrinkItem['desc']) => string[]
} & Shared) {
  return (
    <section className={styles.group}>
      <h3 className={styles.groupTitle}>{pick(group.title)}</h3>
      {group.photo && (
        <div className={styles.groupMedia}>
          <Photo
            bundleKey={bundleKey}
            photo={group.photo}
            alt={pick(group.title)}
            ratio={group.ratio}
          />
        </div>
      )}
      <ul className={styles.rows}>
        {group.items.map((item, index) => (
          <li className={styles.row} key={pick(item.name) + item.volume + index}>
            <div className={styles.rowHead}>
              <span className={styles.itemName}>
                {pick(item.name)}
                {item.volume && <em className={styles.volume}>{item.volume}</em>}
              </span>
              <span className={styles.dots} aria-hidden="true" />
              <span className={styles.price}>{item.price}</span>
            </div>
            {lines(item.desc).map((line) => (
              <p className={styles.itemDesc} key={line}>
                {line}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Card({
  item,
  index,
  bundleKey,
  pick,
  lines,
}: {
  item: DrinkItem
  index: number
  lines: (value?: DrinkItem['desc']) => string[]
} & Shared) {
  const name = pick(item.name)

  return (
    <article className={styles.card} style={{ animationDelay: `${(index % 9) * 55}ms` }}>
      {item.photo && (
        <div className={styles.cardMedia}>
          <Photo
            bundleKey={bundleKey}
            photo={item.photo}
            alt={name}
            ratio={item.ratio}
            priority={index < 3}
          />
        </div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.rowHead}>
          <h3 className={styles.itemName}>{name}</h3>
          <span className={styles.price}>{item.price}</span>
        </div>
        {lines(item.desc).map((line) => (
          <p className={styles.itemDesc} key={line}>
            {line}
          </p>
        ))}
      </div>
    </article>
  )
}

function Photo({
  bundleKey,
  photo,
  alt,
  ratio = 1.5,
  priority = false,
  full,
}: {
  photo: string
  alt: string
  ratio?: number
  priority?: boolean

  full?: number
} & Pick<Shared, 'bundleKey'>) {
  const sizes = full ? '100vw' : '(max-width: 720px) 100vw, 420px'
  const width = full ?? 1000
  const height = Math.round(width / ratio)

  const set = (ext: string) =>
    [
      `${imageUrl(bundleKey, photo, ext, 'sm')} 360w`,
      `${imageUrl(bundleKey, photo, ext)} 1000w`,
      full ? `${imageUrl(bundleKey, photo, ext, 'xl')} ${full}w` : '',
    ]
      .filter(Boolean)
      .join(', ')

  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={imageUrl(bundleKey, photo, 'webp', full ? 'xl' : undefined)}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  )
}
