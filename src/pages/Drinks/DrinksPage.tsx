import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import type {
  Bilingual,
  DrinkGroup,
  DrinkItem,
  DrinkSection,
  DrinksMenu,
} from './types'
import styles from './DrinksPage.module.css'

type Status = 'loading' | 'ready' | 'missing' | 'error'

// The whole menu lives behind the link: nothing about the drinks is in the site
// bundle, and the key in the address is what fetches it.
const bundleUrl = (key: string) => `/d/${encodeURIComponent(key)}/drinks.json`
const imageUrl = (key: string, photo: string, ext: string, small = false) =>
  `/d/${encodeURIComponent(key)}/images/${small ? 'sm/' : ''}${photo}.${ext}`

export function DrinksPage() {
  const { t, locale } = useI18n()
  const { key = '' } = useParams()
  const [status, setStatus] = useState<Status>('loading')
  const [menu, setMenu] = useState<DrinksMenu | null>(null)

  useDocumentMeta({
    title: t('drinks.metaTitle'),
    description: t('drinks.subtitle'),
    path: '/drinks',
    noindex: true,
  })

  const load = useCallback(() => {
    let cancelled = false
    setStatus('loading')

    fetch(bundleUrl(key), { headers: { accept: 'application/json' } })
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

  // Polish is printed in the menu itself; Korean is not, so it reads the
  // English line rather than a translation nobody has written.
  const pick = useCallback(
    (value?: Bilingual) => {
      if (!value) return ''
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

  const sections = menu?.sections ?? []

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

      <SectionRail sections={sections} pick={pick} />

      <div className="shell">
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
        <Link className={styles.back} to="/">
          {t('drinks.back')}
        </Link>
      </section>
    </>
  )
}

function Notice({ status, onRetry }: { status: Status; onRetry: () => void }) {
  const { t } = useI18n()

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
      <Link className={styles.back} to="/">
        {t('drinks.back')}
      </Link>
    </section>
  )
}

interface Shared {
  bundleKey: string
  pick: (value?: Bilingual) => string
}

function Cover({ menu, bundleKey }: { menu: DrinksMenu } & Pick<Shared, 'bundleKey'>) {
  const { t } = useI18n()

  return (
    <section className={styles.cover}>
      <Photo bundleKey={bundleKey} photo={menu.cover} alt="" ratio={1.417} priority />
      <h1 className="visually-hidden">{t('drinks.title')}</h1>
      <div className={styles.coverText}>
        <p className={`eyebrow ${styles.coverEyebrow}`}>{t('drinks.eyebrow')}</p>
        <p className={styles.coverLede}>{t('drinks.subtitle')}</p>
      </div>
    </section>
  )
}

function SectionRail({
  sections,
  pick,
}: {
  sections: DrinkSection[]
  pick: (value?: Bilingual) => string
}) {
  const { t } = useI18n()

  return (
    <nav className={styles.rail} aria-label={t('drinks.jump')}>
      <div className={`shell ${styles.railInner}`}>
        {sections.map((section) => (
          <a key={section.id} className={styles.railLink} href={`#drinks-${section.id}`}>
            {pick(section.title)}
          </a>
        ))}
      </div>
    </nav>
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
    <section className={styles.section} id={`drinks-${section.id}`}>
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
                {item.note && <p className={styles.itemNote}>{item.note}</p>}
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
}: {
  photo: string
  alt: string
  ratio?: number
  priority?: boolean
} & Pick<Shared, 'bundleKey'>) {
  const width = 720
  const height = Math.round(width / ratio)
  const set = (ext: string) =>
    `${imageUrl(bundleKey, photo, ext, true)} 360w, ${imageUrl(bundleKey, photo, ext)} 720w`

  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes="(max-width: 720px) 100vw, 420px" />
      <source type="image/webp" srcSet={set('webp')} sizes="(max-width: 720px) 100vw, 420px" />
      <img
        src={imageUrl(bundleKey, photo, 'webp')}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  )
}
