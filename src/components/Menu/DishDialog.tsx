import { useEffect, useRef } from 'react'
import { categoryById } from '@/data/menu/categories'
import type { Dish } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { asset } from '@/lib/asset'
import { GoldDivider } from '@/components/Ornament/GoldDivider'
import { DishTags } from './DishTags'
import styles from './DishDialog.module.css'

interface Props {
  dish: Dish | null
  onClose: () => void
}

export function DishDialog({ dish, onClose }: Props) {
  const { t, resolve, formatPrice, locale } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useLockBodyScroll(Boolean(dish))

  useEffect(() => {
    if (!dish) return

    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      // Keep focus inside the dialog while it is open.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dish, onClose])

  if (!dish) return null

  const name = resolve(dish.name)
  const category = categoryById.get(dish.categoryId)

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
          <span className="visually-hidden">{t('menu.close')}</span>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M4 4l12 12M16 4L4 16" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>

        <div className={styles.media}>
          {dish.photo ? (
            <img
              src={asset(`images/dishes/${dish.photo}.webp`)}
              alt={name}
              width={760}
              height={760}
              decoding="async"
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              DAON
            </div>
          )}
          {category && (
            <img
              className={styles.calligraphy}
              src={asset(`images/titles/${category.calligraphy}.webp`)}
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.head}>
            {category && (
              <p className={styles.category}>
                {locale !== 'ko' && <span lang="ko">{category.ko}</span>}
                <span className={styles.categoryRoman}>{resolve(category.name)}</span>
              </p>
            )}
            <h2 className={styles.title} id="dish-dialog-title">
              {name}
            </h2>
            {dish.no !== null && <p className={styles.no}>{t('menu.itemNo', { no: dish.no })}</p>}
          </div>

          <GoldDivider className={styles.divider} />

          {dish.description && <p className={styles.desc}>{resolve(dish.description)}</p>}

          {dish.options?.length ? (
            <div className={styles.options}>
              <p className={styles.optionsTitle}>{t('menu.options')}</p>
              <ul className={styles.optionList}>
                {dish.options.map((option) => (
                  <li key={option.no} className={styles.option}>
                    <span className={styles.optionNo}>{String(option.no).padStart(2, '0')}</span>
                    <span className={styles.optionLabel}>{resolve(option.label)}</span>
                    <span className={styles.optionDots} aria-hidden="true" />
                    <span className={styles.optionPrice}>{formatPrice(option.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            dish.price !== undefined && (
              <p className={styles.singlePrice}>{formatPrice(dish.price)}</p>
            )
          )}

          <div className={styles.meta}>
            <DishTags dish={dish} />
            {dish.portion && (
              <span className={styles.chip}>
                {t('menu.portion')} · {dish.portion}
              </span>
            )}
            {dish.serves && (
              <span className={styles.chip}>{t('menu.serves', { count: dish.serves })}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
