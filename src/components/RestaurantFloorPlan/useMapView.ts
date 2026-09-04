import { useCallback, useEffect, useRef, useState } from 'react'

export interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

interface Options {
  width: number
  height: number

  maxZoom?: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function useMapView({ width, height, maxZoom = 4 }: Options) {
  const fitted: ViewBox = { x: 0, y: 0, w: width, h: height }
  const [view, setView] = useState<ViewBox>(fitted)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ distance: number; view: ViewBox; centre: { x: number; y: number } } | null>(
    null,
  )
  const drag = useRef<{ x: number; y: number; view: ViewBox } | null>(null)

  const moved = useRef(false)

  const zoomed = view.w < width - 1

  const settle = useCallback(
    (next: ViewBox): ViewBox => {
      const w = clamp(next.w, width / maxZoom, width)
      const h = w * (height / width)
      const slack = 40
      return {
        w,
        h,
        x: clamp(next.x, -slack, width - w + slack),
        y: clamp(next.y, -slack, height - h + slack),
      }
    },
    [width, height, maxZoom],
  )

  const reset = useCallback(() => setView(fitted), [width, height])

  const zoomAt = useCallback(
    (factor: number, focus?: { x: number; y: number }) =>
      setView((current) => {
        const w = clamp(current.w / factor, width / maxZoom, width)
        const h = w * (height / width)
        const point = focus ?? { x: current.x + current.w / 2, y: current.y + current.h / 2 }
        const ratio = w / current.w
        return settle({
          w,
          h,
          x: point.x - (point.x - current.x) * ratio,
          y: point.y - (point.y - current.y) * ratio,
        })
      }),
    [width, height, maxZoom, settle],
  )

  const focusOn = useCallback(
    (box: { x: number; y: number; w: number; h: number }, pad = 120) => {
      setView((current) => {
        const wanted = Math.max(box.w + pad * 2, width / maxZoom)
        const w = clamp(Math.max(wanted, current.w < width ? current.w : wanted), width / maxZoom, width)
        const h = w * (height / width)
        return settle({
          w,
          h,
          x: box.x + box.w / 2 - w / 2,
          y: box.y + box.h / 2 - h / 2,
        })
      })
    },
    [width, height, maxZoom, settle],
  )

  const toPlan = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      return {
        x: view.x + ((clientX - rect.left) / rect.width) * view.w,
        y: view.y + ((clientY - rect.top) / rect.height) * view.h,
      }
    },
    [view],
  )

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    moved.current = false

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        view,
        centre: toPlan((a.x + b.x) / 2, (a.y + b.y) / 2),
      }
      drag.current = null
      return
    }

    if (zoomed) {
      drag.current = { x: event.clientX, y: event.clientY, view }
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const factor = distance / pinch.current.distance
      if (Math.abs(distance - pinch.current.distance) > 4) moved.current = true
      const start = pinch.current.view
      const w = clamp(start.w / factor, width / maxZoom, width)
      const h = w * (height / width)
      const point = pinch.current.centre
      const ratio = w / start.w
      setView(
        settle({
          w,
          h,
          x: point.x - (point.x - start.x) * ratio,
          y: point.y - (point.y - start.y) * ratio,
        }),
      )
      return
    }

    const from = drag.current
    if (!from) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = ((event.clientX - from.x) / rect.width) * from.view.w
    const dy = ((event.clientY - from.y) / rect.height) * from.view.h
    if (Math.hypot(event.clientX - from.x, event.clientY - from.y) > 6) moved.current = true
    setView(settle({ ...from.view, x: from.view.x - dx, y: from.view.y - dy }))
  }

  const endPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) drag.current = null
  }

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaY) < 2) return
      event.preventDefault()
      const focus = toPlan(event.clientX, event.clientY)
      zoomAt(event.deltaY < 0 ? 1.18 : 1 / 1.18, focus)
    }

    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [toPlan, zoomAt])

  return {
    svgRef,
    view,
    zoomed,

    wasDragged: () => moved.current,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerLeave: endPointer,
    },
    zoomIn: () => zoomAt(1.5),
    zoomOut: () => zoomAt(1 / 1.5),
    reset,
    focusOn,
  }
}
