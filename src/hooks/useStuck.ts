import { useEffect, useRef, useState } from 'react'

export function useStuck<T extends HTMLElement = HTMLDivElement>() {
  const sentinel = useRef<T>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const node = sentinel.current
    if (!node) return

    const check = () => setStuck(node.getBoundingClientRect().top < 0)
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return [sentinel, stuck] as const
}
