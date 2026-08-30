import type { CSSProperties } from 'react'
import { dishFromPrice } from '@/data/menu/dishes'
import type { Dish } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import { asset } from '@/lib/asset'
import { DishTags } from './DishTags'
import styles from './DishCard.module.css'

interface Props {
  dish: Dish
  onOpen: (dish: Dish) => void
  /** Staggers the reveal animation across a grid. */
  index?: number
}

export function DishCard({ dish, onOpen, index = 0 }: Props) {
  const { t, resolve, formatPrice } = useI18n()
  const name = resolve(dish.name)
  const hasOptions = Boolean(dish.options?.length)

  return (
    <article className={styles.card} style={{ '--delay': `${(index % 12) * 55}ms` } as CSSProperties}>
      <button type="button" className={styles.hit} onClick={() => onOpen(dish)}>
        <span className="visually-hidden">
          {name} — {t('menu.details')}
        </span>
      </button>

      <div className={styles.media}>
        {dish.photo ? (
          <img
            className={styles.photo}
            src={asset(`images/dishes/${dish.photo}.webp`)}
            alt={name}
            width={760}
            height={760}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span>DAON</span>
          </div>
        )}

        {dish.no !== null && <span className={styles.number}>{String(dish.no).padStart(2, '0')}</span>}

        <span className={styles.price}>
          {hasOptions && <span className={styles.priceFrom}>{t('menu.from')}</span>}
          {formatPrice(dishFromPrice(dish))}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
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
