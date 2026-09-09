import { useEffect } from 'react'

const SITE = 'https://daon.pl'

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) element.setAttribute(attribute, value)
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
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)

    const url = `${SITE}${path}`
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
  }, [title, description, path])

  useEffect(() => {
    if (!noindex) return

    const tag = document.createElement('meta')
    tag.name = 'robots'
    tag.content = 'noindex, nofollow'
    document.head.append(tag)
    return () => tag.remove()
  }, [noindex])
}
