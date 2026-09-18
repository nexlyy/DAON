import type { ReactNode } from 'react'
import styles from './admin.module.css'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.rowSub}>{hint}</span>}
    </label>
  )
}

export function Text({
  label,
  value,
  onChange,
  hint,
  placeholder,
  lang,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  placeholder?: string
  lang?: string
  type?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        className={styles.input}
        type={type}
        value={value}
        lang={lang}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function Lines({
  label,
  value,
  onChange,
  hint,
  lang,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  lang?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={styles.area}
        value={value}
        lang={lang}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

export function Button({
  children,
  onClick,
  kind = 'plain',
  disabled,
  title,
}: {
  children: ReactNode
  onClick: () => void
  kind?: 'plain' | 'primary' | 'danger'
  disabled?: boolean
  title?: string
}) {
  const look = kind === 'primary' ? styles.primary : kind === 'danger' ? styles.danger : ''
  return (
    <button
      type="button"
      className={`${styles.button} ${look}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}

export function Message({ kind, children }: { kind: 'bad' | 'good' | 'info'; children: ReactNode }) {
  const look = kind === 'bad' ? styles.bad : kind === 'good' ? styles.good : styles.info
  return (
    <p className={`${styles.message} ${look}`} role={kind === 'bad' ? 'alert' : undefined}>
      {children}
    </p>
  )
}

/**
 * The save row. Saving writes a draft and nothing else, so when there is a
 * draft waiting this says so plainly: the one mistake worth designing against
 * is someone saving, seeing no change on the site, and assuming it broke.
 */
export function Save({
  dirty,
  saving,
  onSave,
  onUndo,
  pending = false,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onUndo: () => void
  pending?: boolean
}) {
  return (
    <div className={styles.tools}>
      <Button kind="primary" onClick={onSave} disabled={!dirty || saving}>
        {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
      </Button>
      <Button onClick={onUndo} disabled={!dirty || saving}>
        Undo changes
      </Button>
      {dirty && !saving && <span className={styles.rowSub}>not saved yet</span>}
      {!dirty && pending && (
        <span className={styles.waiting}>
          saved as a draft — press Publish, at the top, to put it on daon.pl
        </span>
      )}
    </div>
  )
}
