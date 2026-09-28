import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DishPhoto } from '@/components/Media/DishPhoto'
import { FlameIcon, LeafIcon } from '@/components/Menu/DishTags'
import { categories } from '@/data/menu/categories'
import { dishes } from '@/data/menu/dishes'
import type { Dish } from '@/data/menu/types'
import { restaurant } from '@/data/restaurant'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { countKey, guestsKey } from '@/i18n/plural'
import { useI18n } from '@/i18n/useI18n'
import { MAX_PER_DISH, MAX_TOTAL, pickedDishes, totalOf, type Picks } from './picks'
import styles from './PreorderDialog.module.css'

export type Done = 'sent' | 'changed' | 'removed'

interface Props {
  booking: { reference: string; date: string; time: string; partySize: number }
  picks: Picks
  notes: string
  hasSaved: boolean
  deadline: string
  saving: boolean
  error: string | null
  done: Done | null
  onQuantity: (id: string, quantity: number) => void
  onNotes: (notes: string) => void
  onSubmit: () => void
  onClose: () => void
}

// Polish "ł" has no accent to strip, so it is folded by hand.
const fold = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').toLowerCase().trim()

const shown = categories.filter((category) => dishes.some((dish) => dish.categoryId === category.id))

export function PreorderDialog({
  booking,
  picks,
  notes,
  hasSaved,
  deadline,
  saving,
  error,
  done,
  onQuantity,
  onNotes,
  onSubmit,
  onClose,
}: Props) {
  const { t, resolve, formatDate, formatPrice, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [view, setView] = useState<'menu' | 'review'>('menu')
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useLockBodyScroll(true)

  // Escape closes, Tab stays inside, and focus goes back where it came from.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!saving) onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [
        ...(panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ].filter((element) => element.offsetParent !== null)
      if (focusable.length === 0) return
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
      opener?.focus?.({ preventScroll: true })
    }
  }, [onClose, saving])

  const needle = fold(query)
  const found = useMemo(() => {
    if (!needle) return dishes.filter((dish) => category === 'all' || dish.categoryId === category)
    const digits = /^\d+$/.test(needle) ? needle : null
    return dishes.filter((dish) =>
      digits
        ? dish.number === digits.padStart(2, '0') || dish.number.startsWith(digits)
        : [dish.name.en, dish.name.pl, dish.name.ko].some((name) => name && fold(name).includes(needle)),
    )
  }, [needle, category])

  const groups = useMemo(
    () =>
      shown
        .map((one) => ({ category: one, dishes: found.filter((dish) => dish.categoryId === one.id) }))
        .filter((group) => group.dishes.length > 0),
    [found],
  )

  const picked = pickedDishes(picks)
  const count = picked.reduce((sum, { quantity }) => sum + quantity, 0)
  const total = totalOf(picks)
  const dishesLabel = t(countKey(locale, count, 'reservation.preorder.dishes'), { count })

  const pickCategory = (id: string) => {
    setCategory(id)
    setQuery('')
    listRef.current?.scrollTo({ top: 0 })
  }

  const when = [
    formatDate(new Date(`${booking.date}T00:00:00`), { weekday: 'long', day: 'numeric', month: 'long' }),
    booking.time,
    `${booking.partySize} ${t(guestsKey(locale, booking.partySize))}`,
  ].join(' · ')

  const submitLabel = saving
    ? t('reservation.preorder.sending')
    : count === 0 && hasSaved
      ? t('reservation.preorder.remove')
      : t(hasSaved ? 'reservation.preorder.save' : 'reservation.preorder.send')

  const content = (
    <div className={styles.overlay} role="presentation" onClick={() => !saving && onClose()}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preorder-title"
        data-view={view}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <div>
            <h2 className={styles.title} id="preorder-title">
              {t('reservation.preorder.title')}
            </h2>
            <p className={styles.when}>{when}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} disabled={saving}>
            <span className="visually-hidden">{t('reservation.preorder.close')}</span>
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M4 4l12 12M16 4L4 16" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </header>

        {done ? (
          <Finished done={done} reference={booking.reference} onClose={onClose} />
        ) : (
          <div className={styles.body}>
            <section className={styles.menu} aria-label={t('reservation.preorder.menu')}>
              <div className={styles.tools}>
                <label className={styles.search}>
                  <span className="visually-hidden">{t('reservation.preorder.searchLabel')}</span>
                  <SearchIcon />
                  <input
                    type="search"
                    value={query}
                    data-autofocus
                    placeholder={t('reservation.preorder.search')}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      listRef.current?.scrollTo({ top: 0 })
                    }}
                  />
                </label>
                <div className={styles.chips} role="group" aria-label={t('reservation.preorder.categories')}>
                  <button
                    type="button"
                    className={styles.chip}
                    aria-pressed={!needle && category === 'all'}
                    onClick={() => pickCategory('all')}
                  >
                    {t('reservation.preorder.all')}
                  </button>
                  {shown.map((one) => (
                    <button
                      key={one.id}
                      type="button"
                      className={styles.chip}
                      aria-pressed={!needle && category === one.id}
                      onClick={() => pickCategory(one.id)}
                    >
                      {resolve(one.name)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.list} ref={listRef}>
                {groups.length === 0 && <p className={styles.nothing}>{t('reservation.preorder.noResults')}</p>}
                {groups.map((group) => (
                  <div key={group.category.id} className={styles.group}>
                    <p className={styles.groupName}>
                      {resolve(group.category.name)}
                      {locale !== 'ko' && <span lang="ko">{group.category.ko}</span>}
                    </p>
                    {group.dishes.map((dish) => (
                      <DishRow
                        key={dish.id}
                        dish={dish}
                        quantity={picks[dish.id] ?? 0}
                        full={count >= MAX_TOTAL}
                        onQuantity={onQuantity}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className={styles.bar}>
                <p className={styles.barSum}>
                  {count > 0 ? (
                    <>
                      <strong>{formatPrice(total)}</strong>
                      <span>{dishesLabel}</span>
                    </>
                  ) : (
                    <span>{t('reservation.preorder.nothingYet')}</span>
                  )}
                </p>
                <button
                  type="button"
                  className="btn"
                  disabled={count === 0 && !hasSaved}
                  onClick={() => setView('review')}
                >
                  {t('reservation.preorder.review')}
                </button>
              </div>
            </section>

            <section className={styles.order} aria-labelledby="preorder-yours">
              <div className={styles.orderScroll}>
                <button type="button" className={styles.backToMenu} onClick={() => setView('menu')}>
                  ← {t('reservation.preorder.backToMenu')}
                </button>
                <h3 className={styles.orderTitle} id="preorder-yours">
                  {t('reservation.preorder.yours')}
                </h3>

                {picked.length === 0 ? (
                  <p className={styles.empty}>
                    {t(hasSaved ? 'reservation.preorder.emptyRemove' : 'reservation.preorder.empty')}
                  </p>
                ) : (
                  <ul className={styles.lines}>
                    {picked.map(({ dish, quantity }) => (
                      <li key={dish.id} className={styles.line}>
                        <span className={styles.lineName}>
                          <span className={styles.lineNo}>{dish.number}</span>
                          {resolve(dish.name)}
                        </span>
                        <span className={styles.linePrice}>{formatPrice(dish.price * quantity)}</span>
                        <Stepper
                          name={resolve(dish.name)}
                          quantity={quantity}
                          full={count >= MAX_TOTAL}
                          onChange={(next) => onQuantity(dish.id, next)}
                          compact
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {picked.length > 0 && (
                  <label className={styles.notes}>
                    <span>{t('reservation.preorder.notes')}</span>
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={notes}
                      placeholder={t('reservation.preorder.notesPlaceholder')}
                      onChange={(event) => onNotes(event.target.value)}
                    />
                    <small>{t('reservation.preorder.notesConsent')}</small>
                  </label>
                )}
              </div>

              <div className={styles.orderFoot}>
                {picked.length > 0 && (
                  <p className={styles.total}>
                    <span>{t('reservation.preorder.total')}</span>
                    <strong>{formatPrice(total)}</strong>
                  </p>
                )}
                <p className={styles.fine}>{t('reservation.preorder.payLater')}</p>
                <p className={styles.fine}>
                  {t('reservation.preorder.until', { deadline, phone: restaurant.phone })}
                </p>
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  className={`btn ${count === 0 && hasSaved ? 'btn--ghost' : ''} ${styles.submit}`}
                  disabled={saving || (count === 0 && !hasSaved)}
                  onClick={onSubmit}
                >
                  {submitLabel}
                </button>
              </div>
            </section>
          </div>
        )}

        <p className="visually-hidden" aria-live="polite">
          {count > 0 ? `${dishesLabel} · ${formatPrice(total)}` : ''}
        </p>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

function DishRow({
  dish,
  quantity,
  full,
  onQuantity,
}: {
  dish: Dish
  quantity: number
  full: boolean
  onQuantity: (id: string, quantity: number) => void
}) {
  const { t, resolve, formatPrice } = useI18n()
  const name = resolve(dish.name)
  const meta = [
    dish.portion,
    dish.serves ? t('menu.serves', { count: dish.serves }) : null,
  ].filter(Boolean)

  return (
    <div className={styles.row} data-picked={quantity > 0 || undefined}>
      <div className={styles.thumb} aria-hidden="true">
        {dish.photo ? <DishPhoto photo={dish.photo} alt="" sizes="64px" /> : <span>{dish.number}</span>}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>
          <span className={styles.no}>{dish.number}</span>
          {name}
        </p>
        {(meta.length > 0 || dish.tags?.length) && (
          <p className={styles.meta}>
            {dish.tags?.includes('vegetarian') && (
              <span className={styles.tag} title={t('tags.vegetarian')}>
                <LeafIcon />
                <span className="visually-hidden">{t('tags.vegetarian')}</span>
              </span>
            )}
            {dish.tags?.includes('extraSpicy') && (
              <span className={styles.tag} data-hot title={t('tags.extraSpicy')}>
                <FlameIcon />
                <span className="visually-hidden">{t('tags.extraSpicy')}</span>
              </span>
            )}
            {meta.join(' · ')}
          </p>
        )}
      </div>
      <div className={styles.side}>
        <span className={styles.price}>{formatPrice(dish.price)}</span>
        <Stepper name={name} quantity={quantity} full={full} onChange={(next) => onQuantity(dish.id, next)} />
      </div>
    </div>
  )
}

/**
 * Minus, count, plus. All three stay in the page when the count is nought,
 * only hidden, so the plus the guest just pressed keeps the focus.
 */
function Stepper({
  name,
  quantity,
  full,
  onChange,
  compact = false,
}: {
  name: string
  quantity: number
  full: boolean
  onChange: (quantity: number) => void
  compact?: boolean
}) {
  const { t } = useI18n()
  return (
    <span className={styles.stepper} data-picked={quantity > 0 || undefined} data-compact={compact || undefined}>
      <button
        type="button"
        className={styles.step}
        hidden={quantity === 0}
        aria-label={t('reservation.preorder.less', { name })}
        onClick={() => onChange(quantity - 1)}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <span className={styles.count} hidden={quantity === 0}>
        {quantity}
      </span>
      <button
        type="button"
        className={styles.step}
        disabled={quantity >= MAX_PER_DISH || full}
        aria-label={t('reservation.preorder.add', { name })}
        onClick={() => onChange(quantity + 1)}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M3.5 8h9M8 3.5v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  )
}

function Finished({ done, reference, onClose }: { done: Done; reference: string; onClose: () => void }) {
  const { t } = useI18n()
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => buttonRef.current?.focus({ preventScroll: true }), [])
  return (
    <div className={styles.done}>
      <span className={styles.seal} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 12.5l4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className={styles.doneTitle}>{t(`reservation.preorder.${done}Title`)}</h3>
      <p className={styles.doneBody}>
        {t(done === 'removed' ? 'reservation.preorder.removedBody' : 'reservation.preorder.sentBody', { reference })}
      </p>
      <button type="button" className="btn" ref={buttonRef} onClick={onClose}>
        {t('reservation.preorder.done')}
      </button>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.6 12.6 17 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
