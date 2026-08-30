import type { Dish } from '@/data/menu/types'
import { useI18n } from '@/i18n/useI18n'
import styles from './DishTags.module.css'

export function DishTags({ dish }: { dish: Dish }) {
  const { t } = useI18n()
  if (!dish.tags?.length) return null

  return (
    <>
      {dish.tags.map((tag) => (
        <span key={tag} className={styles.tag} data-tag={tag}>
          {tag === 'vegetarian' && <LeafIcon />}
          {tag === 'extraSpicy' && <FlameIcon />}
          {t(`tags.${tag}`)}
        </span>
      ))}
    </>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M13.6 2.4C9.7 2 4.4 3 2.9 7.2c-.9 2.4-.1 4.6 1.2 5.7l1.5-3.6.7.3-1.5 3.7c1.7.5 3.9.1 5.4-1.3 3.1-2.8 3.7-7.3 3.4-9.6Z"
      />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M8.6.9c.5 2.3-.6 3.6-1.8 4.8C5.4 7 4 8.4 4 10.5A4.3 4.3 0 0 0 8.3 15a4.3 4.3 0 0 0 4.3-4.5c0-2.8-2-4.3-2.6-6.4-.3 1-1 1.7-1.7 2.3.6-1.9.7-3.7.3-5.5Z"
      />
    </svg>
  )
}
