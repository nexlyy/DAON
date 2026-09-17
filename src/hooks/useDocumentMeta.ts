import { useEffect } from 'react'
import { LOCALES, LOCALE_META, ROOT_LOCALE, localePath } from '@/i18n/config'
import { useI18n } from '@/i18n/useI18n'

const SITE = 'https://daon.pl'

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) element.setAttribute(attribute, value)
}

function setAlternate(hreflang: string, href: string | null) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`)
  if (!href) {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.rel = 'alternate'
    link.hreflang = hreflang
    document.head.append(link)
  }
  link.href = href
}

export function useDocumentMeta({
  title,
  description,
  path = '/',
  noindex = false,
}: {
  title: string
  description: string

  path?: string

  noindex?: boolean
}) {
  const { locale } = useI18n()

  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[property="og:locale"]', 'content', LOCALE_META[locale].og)

    const url = `${SITE}${localePath(locale, path)}`
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)

    for (const code of LOCALES) setAlternate(code, noindex ? null : `${SITE}${localePath(code, path)}`)
    setAlternate('x-default', noindex ? null : `${SITE}${localePath(ROOT_LOCALE, path)}`)
  }, [title, description, path, locale, noindex])

  useEffect(() => {
    if (!noindex) return

    const tag = document.createElement('meta')
    tag.name = 'robots'
    tag.content = 'noindex, nofollow'
    document.head.append(tag)
    return () => tag.remove()
  }, [noindex])
}
