import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [more, setMore] = useState<'start' | 'end' | 'both' | undefined>()

  const measure = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const before = rail.scrollLeft > 4
    const after = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4
    setMore(before && after ? 'both' : before ? 'start' : after ? 'end' : undefined)
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [measure, locale])

  useEffect(() => {
    const chip = railRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  return (
    <div
      className={styles.rail}
      ref={railRef}
      role="group"
      aria-label={t('menu.categoryJump')}
      data-more={more}
      onScroll={measure}
    >
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
