import { useState } from 'react'
import type { Editing } from './AdminPage'
import { useLocalCopy } from './AdminPage'
import { Button, Check, Message, Save, Text } from './ui'
import styles from './admin.module.css'

const DAYS: [string, string][] = [
  ['1', 'Monday'],
  ['2', 'Tuesday'],
  ['3', 'Wednesday'],
  ['4', 'Thursday'],
  ['5', 'Friday'],
  ['6', 'Saturday'],
  ['0', 'Sunday'],
]

export function Restaurant({ editing }: { editing: Editing }) {
  const [copy, setCopy, dirty, undo] = useLocalCopy(editing.content.restaurant)
  const [failure, setFailure] = useState('')
  const [advanced, setAdvanced] = useState(false)

  const place = copy.place
  const setPlace = (next: Partial<typeof place>) => setCopy({ ...copy, place: { ...place, ...next } })

  const setHours = (day: string, span: [string, string] | null) =>
    setCopy({ ...copy, hours: { ...copy.hours, [day]: span } })

  const commit = () => {
    setFailure('')
    editing.save('restaurant', copy).catch((error: unknown) => {
      setFailure(error instanceof Error ? error.message : String(error))
    })
  }

  const rules = copy.reservation as Record<string, number | number[]>
  const setRule = (key: string, value: number | number[]) =>
    setCopy({ ...copy, reservation: { ...rules, [key]: value } })

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Hours & place</h1>
      </div>

      {failure && <Message kind="bad">{failure}</Message>}
      <Save dirty={dirty} saving={editing.saving} onSave={commit} onUndo={undo} />

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Opening hours</h2>
          <span className={styles.rowSub}>
            the page, the badge that says when we close, and the booking form all read these
          </span>
        </div>
        <div className={styles.hours}>
          {DAYS.map(([day, label]) => {
            const span = copy.hours[day]
            return (
              <div key={day} className={styles.hoursRow}>
                <span className={styles.hoursDay}>{label}</span>
                <input
                  className={styles.input}
                  type="time"
                  value={span?.[0] ?? ''}
                  disabled={!span}
                  onChange={(event) => setHours(day, [event.target.value, span?.[1] ?? '22:00'])}
                />
                <input
                  className={styles.input}
                  type="time"
                  value={span?.[1] ?? ''}
                  disabled={!span}
                  onChange={(event) => setHours(day, [span?.[0] ?? '13:00', event.target.value])}
                />
                <Check
                  label="Closed"
                  checked={!span}
                  onChange={(closed) => setHours(day, closed ? null : ['13:00', '22:00'])}
                />
              </div>
            )
          })}
        </div>
        <p className={styles.note}>
          A single day off is set in the bot with /close, not here — this is the week as it usually
          runs.
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>How to reach us</h2>
        </div>
        <div className={styles.row}>
          <Text label="Phone" value={place.phone} onChange={(value) => setPlace({ phone: value })} />
          <Text label="Email" value={place.email} onChange={(value) => setPlace({ email: value })} />
          <Text
            label="Instagram"
            value={place.instagram}
            onChange={(value) => setPlace({ instagram: value.replace(/^@/, '') })}
            hint="The name only, without the @."
          />
        </div>
        <div className={styles.row}>
          <Text label="Street" value={place.address.street} onChange={(value) => setPlace({ address: { ...place.address, street: value } })} />
          <Text label="Postal code" value={place.address.postalCode} onChange={(value) => setPlace({ address: { ...place.address, postalCode: value } })} />
          <Text label="City" value={place.address.city} onChange={(value) => setPlace({ address: { ...place.address, city: value } })} />
          <Text label="Country" value={place.address.country} onChange={(value) => setPlace({ address: { ...place.address, country: value } })} />
        </div>
        <div className={styles.row}>
          <Text
            label="Uber Eats — delivery"
            value={place.links.delivery}
            onChange={(value) => setPlace({ links: { ...place.links, delivery: value } })}
          />
          <Text
            label="Uber Eats — pickup"
            value={place.links.pickup}
            onChange={(value) => setPlace({ links: { ...place.links, pickup: value } })}
          />
        </div>
      </div>

      <div className={styles.tools}>
        <Button onClick={() => setAdvanced(!advanced)}>
          {advanced ? 'Hide the rest' : 'Booking rules and company details'}
        </Button>
      </div>

      {advanced && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Booking rules</h2>
              <span className={styles.rowSub}>changing these changes what the form offers</span>
            </div>
            <div className={styles.row}>
              <Text
                label="Minutes between times"
                value={String(rules.slotMinutes ?? 30)}
                onChange={(value) => setRule('slotMinutes', Number(value) || 30)}
              />
              <Text
                label="Last seating before closing (minutes)"
                value={String(rules.lastSeatingBeforeClose ?? 90)}
                onChange={(value) => setRule('lastSeatingBeforeClose', Number(value) || 90)}
              />
              <Text
                label="A table is held for (minutes)"
                value={String(rules.holdMinutes ?? 90)}
                onChange={(value) => setRule('holdMinutes', Number(value) || 90)}
              />
              <Text
                label="Bookings open this many days ahead"
                value={String(rules.maxDaysAhead ?? 60)}
                onChange={(value) => setRule('maxDaysAhead', Number(value) || 60)}
              />
              <Text
                label="Party sizes on the form"
                value={(rules.partySizes as number[]).join(', ')}
                onChange={(value) =>
                  setRule(
                    'partySizes',
                    value
                      .split(/[,\s]+/)
                      .map((one) => Number(one))
                      .filter((one) => Number.isFinite(one) && one > 0),
                  )
                }
              />
              <Text
                label="Largest party by phone"
                value={String(rules.maxPartySize ?? 12)}
                onChange={(value) => setRule('maxPartySize', Number(value) || 12)}
              />
              <Text
                label="Bookings are deleted after (days)"
                value={String(rules.retentionDays ?? 30)}
                onChange={(value) => setRule('retentionDays', Number(value) || 30)}
                hint="The privacy policy states this number."
              />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Company details</h2>
              <span className={styles.rowSub}>printed in the footer and the privacy policy</span>
            </div>
            <Message kind="info">
              These are the registered details of the company. Change them only from a document that
              says so.
            </Message>
            <div className={styles.row}>
              {(
                [
                  ['companyName', 'Company'],
                  ['address', 'Registered address'],
                  ['krs', 'KRS'],
                  ['nip', 'NIP'],
                  ['regon', 'REGON'],
                  ['shareCapital', 'Share capital'],
                  ['policyUpdated', 'Privacy policy updated'],
                ] as [string, string][]
              ).map(([key, label]) => (
                <Text
                  key={key}
                  label={label}
                  value={String(copy.legal[key] ?? '')}
                  onChange={(value) => setCopy({ ...copy, legal: { ...copy.legal, [key]: value } })}
                />
              ))}
            </div>
            <Text
              label="Court"
              value={String(copy.legal.court ?? '')}
              onChange={(value) => setCopy({ ...copy, legal: { ...copy.legal, court: value } })}
            />
          </div>
        </>
      )}
    </>
  )
}
