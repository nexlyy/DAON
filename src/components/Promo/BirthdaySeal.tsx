import styles from './BirthdaySeal.module.css'

export function BirthdaySeal({ className }: { className?: string }) {
  return (
    <span className={[styles.seal, className].filter(Boolean).join(' ')} aria-hidden="true" lang="ko">
      <span className={styles.glyphs}>생일</span>
    </span>
  )
}
