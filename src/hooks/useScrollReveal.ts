import { useEffect, useRef, useState } from 'react'

export function useScrollReveal<T extends HTMLElement>(reducedMotion: boolean) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [reducedMotion])

  return { ref, visible }
}
