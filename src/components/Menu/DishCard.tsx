import type { CSSProperties } from 'react'
import { DishPhoto } from '@/components/Media/DishPhoto'
import type { Dish } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import { DishTags } from './DishTags'
import styles from './DishCard.module.css'

interface Props {
  dish: Dish
  onOpen: (dish: Dish) => void
  /** Staggers the reveal animation across a grid. */
  index?: number
  /**
   * `auto` becomes a compact row on phones, which is what a 70-dish menu needs.
   * `card` keeps the photo-led card at every width — for the shelf on the home
   * page, where there are only six of them.
   */
  variant?: 'auto' | 'card'
}

export function DishCard({ dish, onOpen, index = 0, variant = 'auto' }: Props) {
  const { t, resolve, formatPrice } = useI18n()
  const name = resolve(dish.name)

  return (
    <article
      className={styles.card}
      data-variant={variant}
      style={{ '--delay': `${(index % 12) * 55}ms` } as CSSProperties}
    >
      <button type="button" className={styles.hit} onClick={() => onOpen(dish)}>
        <span className="visually-hidden">
          {name} — {t('menu.details')}
        </span>
      </button>

      <div className={styles.media}>
        {dish.photo ? (
          <DishPhoto className={styles.photo} photo={dish.photo} alt={name} />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span>DAON</span>
          </div>
        )}

        <span className={styles.number}>{dish.number}</span>
      </div>

      <div className={styles.body}>
        {/* The price sits over the photo on wide screens and beside the name on
            phones; one element, moved by CSS rather than duplicated. */}
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.price}>{formatPrice(dish.price)}</span>
        </div>
        {dish.description && <p className={styles.desc}>{resolve(dish.description)}</p>}

        <div className={styles.meta}>
          <DishTags dish={dish} />
          {dish.portion && <span className={styles.chip}>{dish.portion}</span>}
          {dish.serves && <span className={styles.chip}>{t('menu.serves', { count: dish.serves })}</span>}
        </div>
      </div>
    </article>
  )
}
