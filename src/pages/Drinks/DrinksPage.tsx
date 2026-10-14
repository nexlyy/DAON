import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DrinkPhoto } from '@/components/Media/DrinkPhoto'
import { MenuSwitch } from '@/components/Menu/MenuSwitch'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { Vine } from '@/components/Ornament/Vine'
import { drinksMenu, pickText } from '@/data/drinks'
import type { Bilingual, DrinkGroup, DrinkItem, DrinkPrice, DrinkSection, DrinkStep } from '@/data/drinks'
import { translate } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useStuck } from '@/hooks/useStuck'
import styles from './DrinksPage.module.css'

type Pick = (value?: Bilingual | string) => string
type Lines = (value?: Bilingual | DrinkStep['desc']) => string[]

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
  textsOf([item.name, item.desc, item.note, item.prices?.map((price) => [price.label, price.amount])])

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
      return section.steps?.some((step) => matches(textsOf([step.title, step.sub, step.desc]))) ? section : null
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

/**
 * Shots of soju are one cell on the printed menu with three prices in it: the
 * entries that share a label and a volume are set together again here.
 */
function priceCells(prices: DrinkPrice[]) {
  const cells: { key: string; label?: Bilingual; volume?: string; entries: DrinkPrice[] }[] = []
  for (const entry of prices) {
    const key = `${entry.label?.en ?? entry.label?.pl ?? ''}|${entry.volume ?? ''}`
    const last = cells[cells.length - 1]
    if (last && last.key === key) last.entries.push(entry)
    else cells.push({ key, label: entry.label, volume: entry.volume, entries: [entry] })
  }
  return cells
}

export function DrinksPage() {
  const { t, locale, path } = useI18n()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  useDocumentMeta({
    title: t('meta.drinksTitle'),
    description: t('meta.drinksDescription'),
    path: '/drinks',
  })

  const pick = useCallback<Pick>((value) => pickText(locale, value), [locale])

  const lines = useCallback<Lines>(
    (value) => {
      if (!value) return []
      const chosen = locale === 'pl' ? value.pl ?? value.en : value.en ?? value.pl
      if (!chosen) return []
      return Array.isArray(chosen) ? chosen : [chosen]
    },
    [locale],
  )

  const needle = fold(deferredQuery.trim())
  const sections = useMemo(() => {
    const all = drinksMenu.sections
    if (!needle) return all
    const stem = needle.length >= 5 && /[aeiouy]$/.test(needle) ? needle.slice(0, -1) : needle
    const matches = (texts: string[]) => texts.some((text) => fold(text).includes(stem))
    return all
      .map((section) => filterSection(section, matches))
      .filter((section): section is DrinkSection => section !== null)
  }, [needle])

  const found = needle ? sections.reduce((total, section) => total + countOf(section), 0) : null

  return (
    <>
      <Masthead />

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
          <Section key={section.id} section={section} pick={pick} lines={lines} />
        ))}
      </div>

      <section className={`shell ${styles.foot}`}>
        <GoldDivider />
        {drinksMenu.note && <p className={styles.footNote}>{pick(drinksMenu.note)}</p>}
        <p className={styles.footNote}>{t('drinks.footer')}</p>
        <Link className={styles.back} to={path('/reservation')}>
          {t('drinks.book')}
        </Link>
      </section>
    </>
  )
}

function Masthead() {
  const { t, locale } = useI18n()
  const stamp = translate(locale === 'ko' ? 'en' : 'ko', 'drinks.title')

  return (
    <header className={styles.masthead}>
      <div className={styles.frame} aria-hidden="true" />
      <Vine className={styles.vine} />
      <Rings />

      <div className={`shell ${styles.mastheadInner}`}>
        <p className={`eyebrow eyebrow--center ${styles.eyebrow}`}>{t('hero.eyebrow')}</p>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t('drinks.title')}</h1>
          <span className={styles.stamp} aria-hidden="true">
            {stamp}
          </span>
        </div>

        <GoldDivider className={styles.rule} />
        <p className={`lede ${styles.lede}`}>{t('drinks.lede')}</p>
        <MenuSwitch />
      </div>
    </header>
  )
}

// The mark a cold glass leaves on a paper menu.
function Rings() {
  return (
    <svg className={styles.rings} viewBox="0 0 520 300" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor">
        <circle cx="132" cy="150" r="118" strokeWidth="2.4" opacity="0.5" />
        <circle cx="132" cy="150" r="109" strokeWidth="0.9" opacity="0.32" />
        <circle cx="366" cy="96" r="74" strokeWidth="2" opacity="0.38" />
        <circle cx="366" cy="96" r="67" strokeWidth="0.8" opacity="0.24" />
        <circle cx="300" cy="238" r="46" strokeWidth="1.6" opacity="0.3" />
      </g>
    </svg>
  )
}

function SectionRail({
  sections,
  pick,
  query,
  onQuery,
}: {
  sections: DrinkSection[]
  pick: Pick
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

function Section({ section, pick, lines }: { section: DrinkSection; pick: Pick; lines: Lines }) {
  const { formatPrice } = useI18n()
  const title = pick(section.title)
  const other = section.title.pl && section.title.en && section.title.pl !== title
    ? section.title.pl
    : undefined
  const volumes = (section.columns ?? []).slice(0, -1)
  const abvLabel = (section.columns ?? []).at(-1)

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
            <Card key={item.id} item={item} index={index} pick={pick} lines={lines} />
          ))}
        </div>
      )}

      {section.layout === 'feature' && (
        <div className={styles.feature}>
          {section.photo && (
            <div className={styles.featureMedia}>
              <DrinkPhoto photo={section.photo} alt={title} ratio={section.ratio} />
            </div>
          )}
          <ul className={styles.featureList}>
            {section.items?.map((item) => (
              <li className={styles.featureItem} key={item.id}>
                <div className={styles.rowHead}>
                  <h3 className={styles.itemName}>{pick(item.name)}</h3>
                  {typeof item.price === 'number' && (
                    <span className={styles.price}>
                      {item.volume && <em className={styles.volume}>{item.volume}</em>}
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>
                {item.note && <p className={styles.itemNote}>{pick(item.note)}</p>}
                {lines(item.desc).map((line) => (
                  <p className={styles.itemDesc} key={line}>
                    {line}
                  </p>
                ))}
                {item.prices && item.prices.length > 0 && (
                  <dl className={styles.priceGrid}>
                    {priceCells(item.prices).map((cell) => (
                      <div className={styles.priceCell} key={cell.key}>
                        <dt>
                          {pick(cell.label)}
                          {cell.volume && <em className={styles.volume}>{cell.volume}</em>}
                        </dt>
                        <dd>
                          {cell.entries
                            .map((entry) =>
                              entry.amount ? `${entry.amount} – ${formatPrice(entry.price)}` : formatPrice(entry.price),
                            )
                            .join(' · ')}
                        </dd>
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
              <DrinkPhoto photo={section.photo} alt={title} ratio={section.ratio} />
            </div>
          )}
          {section.groups?.map((group) => (
            <Group key={pick(group.title)} group={group} pick={pick} lines={lines} />
          ))}
        </div>
      )}

      {section.layout === 'wines' && (
        <div className={styles.wines}>
          {section.photo && (
            <div className={styles.winesMedia}>
              <DrinkPhoto photo={section.photo} alt={title} ratio={section.ratio} />
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
                <tr key={item.id}>
                  <th scope="row">
                    <span className={styles.itemName}>{pick(item.name)}</span>
                    {lines(item.desc).map((line) => (
                      <span className={styles.itemDesc} key={line}>
                        {line}
                      </span>
                    ))}
                  </th>
                  {volumes.map((column, index) => {
                    const entry = item.prices?.find((price) => price.volume === column) ?? item.prices?.[index]
                    return (
                      <td key={column} data-label={column}>
                        {entry ? formatPrice(entry.price) : '—'}
                      </td>
                    )
                  })}
                  {abvLabel && <td data-label={abvLabel}>{item.abv ?? '—'}</td>}
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
              <DrinkPhoto photo={section.photo} alt={title} ratio={section.ratio} />
            </div>
          )}
          {typeof section.price === 'number' && <p className={styles.stepsPrice}>{formatPrice(section.price)}</p>}
          <ol className={styles.stepList}>
            {section.steps?.map((step, index) => (
              <li className={styles.step} key={step.step ?? index}>
                <h3 className={styles.stepTitle}>
                  {step.step && <span className={styles.stepNumber}>{step.step}</span>}
                  {pick(step.title).replace(/^\d+\s+/, '')}
                </h3>
                {step.sub && <p className={styles.itemNote}>{pick(step.sub)}</p>}
                {lines(step.desc).map((line) => (
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

function Group({ group, pick, lines }: { group: DrinkGroup; pick: Pick; lines: Lines }) {
  const { formatPrice } = useI18n()
  return (
    <section className={styles.group}>
      <h3 className={styles.groupTitle}>{pick(group.title)}</h3>
      {group.photo && (
        <div className={styles.groupMedia}>
          <DrinkPhoto photo={group.photo} alt={pick(group.title)} ratio={group.ratio} />
        </div>
      )}
      <ul className={styles.rows}>
        {group.items.map((item) => (
          <li className={styles.row} key={item.id}>
            <div className={styles.rowHead}>
              <span className={styles.itemName}>
                {pick(item.name)}
                {item.volume && <em className={styles.volume}>{item.volume}</em>}
              </span>
              <span className={styles.dots} aria-hidden="true" />
              <span className={styles.price}>
                {typeof item.price === 'number'
                  ? formatPrice(item.price)
                  : (item.prices ?? [])
                      .map((entry) => [entry.volume, formatPrice(entry.price)].filter(Boolean).join(' '))
                      .join(' · ')}
              </span>
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

function Card({ item, index, pick, lines }: { item: DrinkItem; index: number; pick: Pick; lines: Lines }) {
  const { formatPrice } = useI18n()
  const name = pick(item.name)

  return (
    <article className={styles.card} style={{ animationDelay: `${(index % 9) * 55}ms` }}>
      {item.photo && (
        <div className={styles.cardMedia}>
          <DrinkPhoto photo={item.photo} alt={name} ratio={item.ratio} priority={index < 3} />
        </div>
      )}
      <div className={styles.cardBody}>
        <div className={styles.rowHead}>
          <h3 className={styles.itemName}>{name}</h3>
          {typeof item.price === 'number' && <span className={styles.price}>{formatPrice(item.price)}</span>}
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
