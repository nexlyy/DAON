import { useEffect, useRef } from 'react'

/**
 * Adds `is-visible` the first time an element scrolls into view, which is what
 * the `.reveal` animation in global.css hangs off. Elements are unobserved once
 * revealed so nothing keeps running behind the page.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (!('IntersectionObserver' in window)) {
      node.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const target = entry.target as HTMLElement
          target.style.animationDelay = `${delayMs}ms`
          target.classList.add('is-visible')
          observer.unobserve(target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [delayMs])

  return ref
}
