import { useState } from 'react'
import type { Editing } from './AdminPage'
import { useLocalCopy } from './AdminPage'
import { Button, Message, Save, Text } from './ui'
import styles from './admin.module.css'

const today = () => new Date().toISOString().slice(0, 10)

export function Promotion({ editing }: { editing: Editing }) {
  const [copy, setCopy, dirty, undo] = useLocalCopy(editing.content.promo)
  const [failure, setFailure] = useState('')

  const promo = copy.birthday

  const commit = () => {
    setFailure('')
    editing.save('promo', copy).catch((error: unknown) => {
      setFailure(error instanceof Error ? error.message : String(error))
    })
  }

  const set = (next: Partial<NonNullable<typeof promo>>) =>
    setCopy({ birthday: promo ? { ...promo, ...next } : null })

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Promotion</h1>
      </div>

      {failure && <Message kind="bad">{failure}</Message>}
      <Save
          dirty={dirty}
          saving={editing.saving}
          onSave={commit}
          onUndo={undo}
          pending={editing.pending.includes('promo')}
        />

      {!promo && (
        <div className={styles.card}>
          <p className={styles.note}>No promotion is running.</p>
          <div className={styles.tools}>
            <Button
              onClick={() =>
                setCopy({
                  birthday: {
                    id: `promo-${today()}`,
                    announceFrom: today(),
                    from: today(),
                    to: today(),
                    percent: 10,
                    timeZone: 'Europe/Warsaw',
                  },
                })
              }
            >
              Start one
            </Button>
          </div>
        </div>
      )}

      {promo && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>The discount on the site</h2>
            <Button kind="danger" onClick={() => setCopy({ birthday: null })}>
              Take it down
            </Button>
          </div>

          <Message kind="info">
            The wording on the site — that it is for eating in, and not for drinks or Uber Eats —
            lives with the other site texts. This page sets the dates and the size of the discount.
          </Message>

          <div className={styles.row}>
            <Text
              label="Announced from"
              type="date"
              value={promo.announceFrom}
              onChange={(value) => set({ announceFrom: value })}
              hint="The ribbon appears on this day."
            />
            <Text
              label="First day"
              type="date"
              value={promo.from}
              onChange={(value) => set({ from: value })}
            />
            <Text
              label="Last day"
              type="date"
              value={promo.to}
              onChange={(value) => set({ to: value })}
              hint="It stops showing the morning after this day."
            />
            <Text
              label="Percent off"
              value={String(promo.percent)}
              onChange={(value) => set({ percent: Number(value) || 0 })}
            />
          </div>

          <p className={styles.note}>
            Name inside the site: <code>{promo.id}</code>. It is never shown to a guest; changing it
            makes the site treat this as a different promotion.
          </p>
        </div>
      )}
    </>
  )
}
