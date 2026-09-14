import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { gsap } from 'gsap'
import './Masonry.css'

type AnimateFrom = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'random'

export type MasonryItem = {
  id: string
  height: number
  content: ReactNode
}

type MasonryProps = {
  items: MasonryItem[]
  ease?: string
  duration?: number
  stagger?: number
  animateFrom?: AnimateFrom
  scaleOnHover?: boolean
  hoverScale?: number
  blurToFocus?: boolean
}

type GridItem = MasonryItem & { x: number; y: number; w: number; h: number }

function useMedia(queries: string[], values: number[], defaultValue: number): number {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue
    const index = queries.findIndex((q) => window.matchMedia(q).matches)
    return index === -1 ? defaultValue : (values[index] ?? defaultValue)
  }

  const [value, setValue] = useState(get)

  useEffect(() => {
    const handler = () => setValue(get)
    const lists = queries.map((q) => window.matchMedia(q))
    lists.forEach((mql) => mql.addEventListener('change', handler))
    return () => lists.forEach((mql) => mql.removeEventListener('change', handler))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries])

  return value
}

function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return [ref, size] as const
}

function Masonry({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.97,
  blurToFocus = true,
}: MasonryProps) {
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [3, 3, 2, 1],
    1,
  )

  const [containerRef, { width }] = useMeasure<HTMLDivElement>()

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return { x: item.x, y: item.y }

    let direction = animateFrom
    if (direction === 'random') {
      const directions: AnimateFrom[] = ['top', 'bottom', 'left', 'right']
      direction = directions[Math.floor(Math.random() * directions.length)]
    }

    switch (direction) {
      case 'top':
        return { x: item.x, y: -200 }
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 200 }
      case 'left':
        return { x: -200, y: item.y }
      case 'right':
        return { x: window.innerWidth + 200, y: item.y }
      case 'center':
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        }
      default:
        return { x: item.x, y: item.y + 100 }
    }
  }

  const { grid, containerHeight } = useMemo<{ grid: GridItem[]; containerHeight: number }>(() => {
    if (!width) return { grid: [], containerHeight: 0 }

    const colHeights = new Array(columns).fill(0)
    const columnWidth = width / columns

    const placed = items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights))
      const x = columnWidth * col
      const height = child.height
      const y = colHeights[col]

      colHeights[col] += height

      return { ...child, x, y, w: columnWidth, h: height }
    })

    return { grid: placed, containerHeight: Math.max(...colHeights, 0) }
  }, [columns, items, width])

  const hasMounted = useRef(false)

  useLayoutEffect(() => {
    if (!width) return

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`
      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      }

      if (!hasMounted.current) {
        const initialPos = getInitialPosition(item)
        const initialState = {
          opacity: 0,
          x: initialPos.x,
          y: initialPos.y,
          width: item.w,
          height: item.h,
          ...(blurToFocus && { filter: 'blur(10px)' }),
        }

        gsap.fromTo(selector, initialState, {
          opacity: 1,
          ...animationProps,
          ...(blurToFocus && { filter: 'blur(0px)' }),
          duration: 0.8,
          ease: 'power3.out',
          delay: index * stagger,
        })
      } else {
        gsap.to(selector, {
          ...animationProps,
          duration,
          ease,
          overwrite: 'auto',
        })
      }
    })

    hasMounted.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, width, stagger, animateFrom, blurToFocus, duration, ease])

  const handleMouseEnter = (item: GridItem) => {
    if (!scaleOnHover) return
    gsap.to(`[data-key="${item.id}"]`, {
      scale: hoverScale,
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  const handleMouseLeave = (item: GridItem) => {
    if (!scaleOnHover) return
    gsap.to(`[data-key="${item.id}"]`, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  return (
    <div
      ref={containerRef}
      className="masonry-list"
      style={{ height: containerHeight || undefined }}
    >
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          className="masonry-item-wrapper"
          onMouseEnter={() => handleMouseEnter(item)}
          onMouseLeave={() => handleMouseLeave(item)}
        >
          <div className="masonry-item-content">{item.content}</div>
        </div>
      ))}
    </div>
  )
}

export default Masonry
