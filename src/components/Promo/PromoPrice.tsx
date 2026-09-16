import { useI18n } from '@/i18n/useI18n'
import { usePromo } from '@/promo/usePromo'
import styles from './PromoPrice.module.css'

interface Props {
  amount: number
  align?: 'start' | 'end'
}

export function PromoPrice({ amount, align = 'end' }: Props) {
  const { t, formatPrice } = useI18n()
  const { phase, sale, datesShort } = usePromo()

  if (phase === 'active') {
    return (
      <span className={styles.stack} data-align={align}>
        <s className={styles.was}>
          <span className="visually-hidden">{t('promo.price.was')}: </span>
          {formatPrice(amount)}
        </s>
        <span className={styles.now}>
          <span className="visually-hidden">{t('promo.price.now')}: </span>
          {formatPrice(sale(amount))}
        </span>
      </span>
    )
  }

  if (phase === 'upcoming') {
    return (
      <span className={styles.stack} data-align={align}>
        <span>{formatPrice(amount)}</span>
        <span className={styles.soon}>
          {datesShort} · {formatPrice(sale(amount))}
        </span>
      </span>
    )
  }

  return <>{formatPrice(amount)}</>
}
