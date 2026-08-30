import { useEffect, useRef } from 'react'
import { categories } from '@/data/menu/categories'
import { useI18n } from '@/i18n/useI18n'
import styles from './CategoryRail.module.css'

interface Props {
  active: string
  onChange: (id: string) => void
}

export function CategoryRail({ active, onChange }: Props) {
  const { t, resolve, locale } = useI18n()
  const railRef = useRef<HTMLDivElement>(null)

  // Keep the selected chip in view when the filter changes from elsewhere.
  useEffect(() => {
    const chip = railRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  return (
    <div className={styles.rail} ref={railRef} role="group" aria-label={t('menu.categoryJump')}>
      <button
        type="button"
        className={styles.chip}
        aria-pressed={active === 'all'}
        onClick={() => onChange('all')}
      >
        {t('menu.all')}
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={styles.chip}
          aria-pressed={active === category.id}
          onClick={() => onChange(category.id)}
        >
          {locale !== 'ko' && (
            <span className={styles.ko} lang="ko" aria-hidden="true">
              {category.ko}
            </span>
          )}
          {resolve(category.name)}
        </button>
      ))}
    </div>
  )
}
