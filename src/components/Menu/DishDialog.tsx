import { useEffect, useRef } from 'react'
import { Calligraphy } from '@/components/Media/Calligraphy'
import { DishPhoto } from '@/components/Media/DishPhoto'
import { categoryById } from '@/data/menu/categories'
import { dishAllergens } from '@/data/menu/dishes'
import type { Dish } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
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

    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

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
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      opener?.focus?.()
    }
  }, [dish, onClose])

  if (!dish) return null

  const name = resolve(dish.name)
  const category = categoryById.get(dish.categoryId)
  const allergens = dishAllergens(dish)

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
            <DishPhoto
              photo={dish.photo}
              alt={name}
              sizes="(max-width: 720px) 100vw, 420px"
              priority
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              DAON
            </div>
          )}
          {category && (
            <Calligraphy className={styles.calligraphy} name={category.calligraphy} />
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
            <p className={styles.no}>{t('menu.itemNo', { no: dish.number })}</p>
          </div>

          <GoldDivider className={styles.divider} />

          {dish.description && <p className={styles.desc}>{resolve(dish.description)}</p>}

          <p className={styles.singlePrice}>{formatPrice(dish.price)}</p>

          {allergens.length > 0 && (
            <p className={styles.allergens}>
              <span className={styles.allergensLabel}>{t('allergens.contains')}</span>
              {allergens.map((allergen) => t(`allergens.names.${allergen}`)).join(' · ')}
            </p>
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
