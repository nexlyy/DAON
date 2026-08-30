import { useDeferredValue, useMemo, useState } from 'react'
import { categories } from '@/data/menu/categories'
import { dishes } from '@/data/menu/dishes'
import type { Dish } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { asset } from '@/lib/asset'
import { CategoryRail } from '@/components/Menu/CategoryRail'
import { DishCard } from '@/components/Menu/DishCard'
import { DishDialog } from '@/components/Menu/DishDialog'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import styles from './MenuPage.module.css'

export function MenuPage() {
  const { t, resolve, locale } = useI18n()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [openDish, setOpenDish] = useState<Dish | null>(null)
  const deferredQuery = useDeferredValue(query)

  useDocumentMeta({ title: t('meta.menuTitle'), description: t('meta.description') })

  const visible = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()

    const matches = (dish: Dish) => {
      if (category !== 'all' && dish.categoryId !== category) return false
      if (!needle) return true
      const haystack = [
        resolve(dish.name),
        resolve(dish.description),
        dish.no !== null ? String(dish.no) : '',
        ...(dish.options ?? []).map((option) => resolve(option.label)),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    }

    return dishes.filter(matches)
  }, [category, deferredQuery, resolve])

  const grouped = useMemo(
    () =>
      categories
        .map((entry) => ({
          category: entry,
          items: visible.filter((dish) => dish.categoryId === entry.id),
        }))
        .filter((group) => group.items.length > 0),
    [visible],
  )

  return (
    <>
      <section className={styles.head}>
        <div className="shell">
          <p className="eyebrow">{t('menu.eyebrow')}</p>
          <h1 className={styles.title}>{t('menu.title')}</h1>
          <p className={`lede ${styles.subtitle}`}>{t('menu.subtitle')}</p>
        </div>
      </section>

      <div className={styles.controls}>
        <div className={`shell ${styles.controlsInner}`}>
          <CategoryRail active={category} onChange={setCategory} />

          <div className={styles.searchRow}>
            <label className={styles.search}>
              <SearchIcon />
              <span className="visually-hidden">{t('menu.search')}</span>
              <input
                type="search"
                value={query}
                placeholder={t('menu.searchPlaceholder')}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button type="button" className={styles.clear} onClick={() => setQuery('')}>
                  {t('menu.clear')}
                </button>
              )}
            </label>
            <p className={styles.count} aria-live="polite">
              {t('menu.results', { count: visible.length })}
            </p>
          </div>
        </div>
      </div>

      <div className="shell">
        {grouped.length === 0 ? (
          <p className={styles.empty}>{t('menu.empty')}</p>
        ) : (
          grouped.map(({ category: entry, items }) => (
            <section className={styles.group} key={entry.id} id={`category-${entry.id}`}>
              <header className={styles.groupHead}>
                <img
                  className={styles.calligraphy}
                  src={asset(`images/titles/${entry.calligraphy}.webp`)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
                <div className={styles.groupText}>
                  <h2 className={styles.groupTitle}>{resolve(entry.name)}</h2>
                  <p className={styles.groupRoman}>
                    {locale !== 'ko' && (
                      <>
                        <span lang="ko">{entry.ko}</span>
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    {entry.romanization}
                  </p>
                </div>
                <GoldDivider className={styles.groupRule} />
              </header>

              <div className={styles.grid}>
                {items.map((dish, index) => (
                  <DishCard key={dish.id} dish={dish} index={index} onOpen={setOpenDish} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <DishDialog dish={openDish} onClose={() => setOpenDish(null)} />
    </>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <circle cx="8.6" cy="8.6" r="5.4" />
        <path d="M12.6 12.6L17 17" />
      </g>
    </svg>
  )
}
