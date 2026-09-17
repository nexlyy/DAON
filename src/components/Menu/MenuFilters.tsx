import { useEffect } from 'react'
import type { Allergen } from '@/data/menu/allergens'
import { widespreadAllergens } from '@/data/menu/allergens'
import type { DishTag } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import { FlameIcon, LeafIcon } from './DishTags'
import styles from './MenuFilters.module.css'

export const FILTER_PANEL_ID = 'menu-filters'

interface ButtonProps {
  open: boolean
  active: number
  onToggle: () => void
}

export function FilterButton({ open, active, onToggle }: ButtonProps) {
  const { t } = useI18n()

  return (
    <button
      type="button"
      className={styles.button}
      aria-expanded={open}
      aria-controls={FILTER_PANEL_ID}
      data-active={active > 0 || undefined}
      onClick={onToggle}
    >
      <SlidersIcon />
      <span className={styles.buttonLabel}>{t('menu.filters.button')}</span>
      {active > 0 && (
        <span className={styles.badge}>
          <span aria-hidden="true">{active}</span>
          <span className="visually-hidden">{t('menu.filters.active', { count: active })}</span>
        </span>
      )}
    </button>
  )
}

interface PanelProps {
  tagOptions: DishTag[]
  allergenOptions: Allergen[]
  tags: DishTag[]
  without: Allergen[]
  countWithTag: (tag: DishTag) => number
  countWithout: (allergen: Allergen) => number
  onToggleTag: (tag: DishTag) => void
  onToggleWithout: (allergen: Allergen) => void
  onClear: () => void
  onClose: () => void
}

export function FilterPanel({
  tagOptions,
  allergenOptions,
  tags,
  without,
  countWithTag,
  countWithout,
  onToggleTag,
  onToggleWithout,
  onClear,
  onClose,
}: PanelProps) {
  const { t, locale } = useI18n()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const widespread = widespreadAllergens
    .map((allergen) => t(`allergens.names.${allergen}`))
    .map((name) => (locale === 'ko' ? name : name.toLocaleLowerCase(locale)))
    .join(', ')

  const active = tags.length + without.length

  return (
    <div className={styles.panel} id={FILTER_PANEL_ID} role="region" aria-label={t('menu.filters.button')}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('menu.filters.features')}</legend>
        <div className={styles.chips}>
          {tagOptions.map((tag) => {
            const on = tags.includes(tag)
            const count = countWithTag(tag)
            return (
              <button
                key={tag}
                type="button"
                className={styles.chip}
                data-tag={tag}
                aria-pressed={on}
                disabled={!on && count === 0}
                onClick={() => onToggleTag(tag)}
              >
                {tag === 'vegetarian' && <LeafIcon />}
                {tag === 'extraSpicy' && <FlameIcon />}
                {t(`tags.${tag}`)}
                <span className={styles.count}>{count}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('menu.filters.without')}</legend>
        <div className={styles.chips}>
          {allergenOptions.map((allergen) => {
            const on = without.includes(allergen)
            const count = countWithout(allergen)
            return (
              <button
                key={allergen}
                type="button"
                className={styles.chip}
                aria-pressed={on}
                disabled={!on && count === 0}
                onClick={() => onToggleWithout(allergen)}
              >
                {t(`menu.filters.no.${allergen}`)}
                <span className={styles.count}>{count}</span>
              </button>
            )
          })}
        </div>
        <p className={styles.note}>{t('menu.filters.note', { list: widespread })}</p>
      </fieldset>

      <div className={styles.actions}>
        {active > 0 && (
          <button type="button" className={styles.clear} onClick={onClear}>
            {t('menu.filters.clear')}
          </button>
        )}
        <button type="button" className={styles.done} onClick={onClose}>
          {t('menu.filters.done')}
        </button>
      </div>
    </div>
  )
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M3 5.5h8.5M15.5 5.5H17M3 14.5h2M9 14.5h8" />
        <circle cx="13.5" cy="5.5" r="2" />
        <circle cx="7" cy="14.5" r="2" />
      </g>
    </svg>
  )
}
