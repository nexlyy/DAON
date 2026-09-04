import { restaurant } from '@/data/restaurant'
import { useI18n } from '@/i18n/useI18n'

type Kind = 'delivery' | 'pickup'

interface Props {
  kind: Kind
  className?: string
}

export function OrderLink({ kind, className }: Props) {
  const { t } = useI18n()

  return (
    <a
      className={['btn', `btn--${kind}`, className].filter(Boolean).join(' ')}
      href={restaurant.links[kind]}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t(`order.${kind}`)}
    </a>
  )
}
