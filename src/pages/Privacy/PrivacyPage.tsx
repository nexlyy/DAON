import { Fragment } from 'react'
import content from '@/content/privacy.json'
import { controllerName, legal, reservation, restaurant } from '@/data/restaurant'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useI18n } from '@/i18n/useI18n'
import styles from './PrivacyPage.module.css'

interface PolicySection {
  heading: string
  paragraphs?: string[]
  items?: string[]
  after?: string[]
}

interface Policy {
  title: string
  lead: string
  updated: string
  sections: PolicySection[]
}

export function PrivacyPage() {
  const { t, locale, formatDate } = useI18n()
  const policy = (content as Record<string, Policy>)[locale] ?? content.pl

  useDocumentMeta({
    title: t('meta.privacyTitle'),
    description: t('meta.privacyDescription'),
    path: '/privacy',
  })

  const values: Record<string, string> = {
    controller: controllerName(),
    address: legal.address,
    krs: legal.krs,
    nip: legal.nip,
    regon: legal.regon,
    restaurantAddress: `${restaurant.address.street}, ${restaurant.address.postalCode} ${restaurant.address.city}`,
    email: restaurant.email,
    phone: restaurant.phone,
    retentionDays: String(reservation.retentionDays),
    backupDays: String(legal.backupDays),
    logDays: String(legal.serverLogDays),
    updated: formatDate(new Date(`${legal.policyUpdated}T12:00:00`), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }

  const fill = (text: string) =>
    text.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match)

  return (
    <article className={`shell shell--narrow ${styles.page}`}>
      <header className={styles.head}>
        <h1 className={styles.title}>{policy.title}</h1>
        <p className={styles.lead}>{fill(policy.lead)}</p>
        <p className={styles.updated}>{fill(policy.updated)}</p>
      </header>

      {policy.sections.map((section, index) => (
        <section className={styles.section} key={section.heading}>
          <h2 className={styles.heading}>
            <span className={styles.number}>{index + 1}.</span> {section.heading}
          </h2>
          {section.paragraphs?.map((text) => (
            <p key={text}>{fill(text)}</p>
          ))}
          {section.items && (
            <ul className={styles.list}>
              {section.items.map((text) => (
                <li key={text}>{fill(text)}</li>
              ))}
            </ul>
          )}
          {section.after?.map((text) => (
            <Fragment key={text}>
              <p>{fill(text)}</p>
            </Fragment>
          ))}
        </section>
      ))}
    </article>
  )
}
