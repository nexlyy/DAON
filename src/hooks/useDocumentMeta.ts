import { useEffect } from 'react'

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) element.setAttribute(attribute, value)
}

/**
 * Keeps the document title and the description/OG tags in step with the route
 * and the chosen language. Static hosting means there is no server render, so
 * crawlers that execute JavaScript pick these up on the client.
 */
export function useDocumentMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
  }, [title, description])
}
