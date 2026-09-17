import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Calligraphy } from '@/components/Media/Calligraphy'
import { categories } from '@/data/menu/categories'
import { dishAllergens, dishes } from '@/data/menu/dishes'
import type { Dish, DishTag } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useStuck } from '@/hooks/useStuck'
import { CategoryRail } from '@/components/Menu/CategoryRail'
import { FilterButton, FilterPanel } from '@/components/Menu/MenuFilters'
import { DishCard } from '@/components/Menu/DishCard'
import { DishDialog } from '@/components/Menu/DishDialog'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { allergenNumbers, widespreadAllergens } from '@/data/menu/allergens'
import type { Allergen } from '@/data/menu/allergens'
import { MenuPromoNotice } from '@/components/Promo/BirthdayBand'
import styles from './MenuPage.module.css'

const TAG_ORDER: DishTag[] = ['vegetarian', 'extraSpicy', 'mildAvailable', 'sharing']
const tagOptions = TAG_ORDER.filter((tag) => dishes.some((dish) => dish.tags?.includes(tag)))
const allergenOptions = (Object.keys(allergenNumbers) as Allergen[]).filter(
  (allergen) => !widespreadAllergens.includes(allergen),
)
const allergensOf = new Map(dishes.map((dish) => [dish.id, new Set(dishAllergens(dish))]))

interface Filters {
  tags: DishTag[]
  without: Allergen[]
}

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

export function MenuPage() {
  const { t, resolve, locale } = useI18n()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({ tags: [], without: [] })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const closeFilters = useCallback(() => setFiltersOpen(false), [])
  const clearFilters = useCallback(() => setFilters({ tags: [], without: [] }), [])
  const [openDish, setOpenDish] = useState<Dish | null>(null)
  
  const closeDish = useCallback(() => setOpenDish(null), [])
  const deferredQuery = useDeferredValue(query)
  const [sentinel, stuck] = useStuck<HTMLDivElement>()

  useDocumentMeta({
    title: t('meta.menuTitle'),
    description: t('meta.menuDescription'),
    path: '/menu',
  })

  const matching = useCallback(
    (applied: Filters) => {
      const needle = deferredQuery.trim().toLowerCase()

      return dishes.filter((dish: Dish) => {
        if (category !== 'all' && dish.categoryId !== category) return false
        if (!applied.tags.every((tag) => dish.tags?.includes(tag))) return false
        const contains = allergensOf.get(dish.id)
        if (applied.without.some((allergen) => contains?.has(allergen))) return false
        if (!needle) return true
        const haystack = [resolve(dish.name), resolve(dish.description), dish.number]
          .join(' ')
          .toLowerCase()
        return haystack.includes(needle)
      })
    },
    [category, deferredQuery, resolve],
  )

  const visible = useMemo(() => matching(filters), [matching, filters])
  const activeFilters = filters.tags.length + filters.without.length

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
          <MenuPromoNotice />
        </div>
      </section>

      <div ref={sentinel} aria-hidden="true" />
      <div className={styles.controls} data-stuck={stuck || undefined}>
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
            <FilterButton
              open={filtersOpen}
              active={activeFilters}
              onToggle={() => setFiltersOpen((open) => !open)}
            />
            <p className={styles.count} aria-live="polite">
              {t('menu.results', { count: visible.length })}
            </p>
          </div>
        </div>

        {filtersOpen && (
          <FilterPanel
            tagOptions={tagOptions}
            allergenOptions={allergenOptions}
            tags={filters.tags}
            without={filters.without}
            countWithTag={(tag) =>
              matching({ ...filters, tags: filters.tags.includes(tag) ? filters.tags : [...filters.tags, tag] })
                .length
            }
            countWithout={(allergen) =>
              matching({
                ...filters,
                without: filters.without.includes(allergen) ? filters.without : [...filters.without, allergen],
              }).length
            }
            onToggleTag={(tag) => setFilters((current) => ({ ...current, tags: toggle(current.tags, tag) }))}
            onToggleWithout={(allergen) =>
              setFilters((current) => ({ ...current, without: toggle(current.without, allergen) }))
            }
            onClear={clearFilters}
            onClose={closeFilters}
          />
        )}
      </div>

      <div className="shell">
        {grouped.length === 0 ? (
          <div className={styles.empty}>
            <p>{t(activeFilters > 0 ? 'menu.filters.empty' : 'menu.empty')}</p>
            {activeFilters > 0 && (
              <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                {t('menu.filters.clear')}
              </button>
            )}
          </div>
        ) : (
          grouped.map(({ category: entry, items }) => (
            <section className={styles.group} key={entry.id} id={`category-${entry.id}`}>
              <header className={styles.groupHead}>
                <Calligraphy className={styles.calligraphy} name={entry.calligraphy} />
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

      <section className={`shell ${styles.allergy}`} aria-labelledby="allergy-title">
        <GoldDivider />
        <h2 className={styles.allergyTitle} id="allergy-title">
          {t('allergens.title')}
        </h2>
        <p className={styles.allergyLead}>{t('allergens.lead')}</p>
        <p className={styles.allergyNote}>
          <span>{t('allergens.widespread')}:</span>{' '}
          {widespreadAllergens.map((allergen) => t(`allergens.names.${allergen}`)).join(' · ')}
        </p>
        <p className={styles.allergyBody}>{t('allergens.body')}</p>
      </section>

      <DishDialog dish={openDish} onClose={closeDish} />
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
