"use client"

/* ---------------------------------------------------------------------------
 * ScrollWeight :: ramps font-weight from `min` toward `max` based on scroll
 * velocity. At rest, weight settles back to `min` over ~600ms. Bodoni Moda
 * is a variable font with weights 400..900, so this reads as the type
 * "thickening when shoved" — extremely subtle, only noticeable when
 * scrolling. Reduced motion :: weight stays at `min` forever.
 *
 * Why scroll velocity, not scroll position
 *   Position-based weight feels arbitrary; velocity-based reads as a
 *   physical reaction to the user's input — the type is being *pushed*.
 * ------------------------------------------------------------------------- */

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion"
import { useEffect } from "react"
import type { JSX } from "react"

type Props = {
  children: React.ReactNode
  className?: string
  /** Min font weight. Default 400. */
  min?: number
  /** Max font weight at peak velocity. Default 900. */
  max?: number
  /** Pixels-per-frame velocity that maps to `max`. Default 80. */
  threshold?: number
  /** HTML tag. Default span. */
  as?: "span" | "h1" | "h2" | "div" | "p"
}

export function ScrollWeight({
  children,
  className,
  min = 400,
  max = 900,
  threshold = 80,
  as = "span",
}: Props) {
  const reduced = useReducedMotion()
  const weight = useMotionValue(min)
  const smoothed = useSpring(weight, { stiffness: 130, damping: 22, mass: 0.4 })
  // Variable-font axis. `wght` reads continuous values in Bodoni Moda's
  // 400..900 supported range. Using fontVariationSettings is more robust
  // than fontWeight (which some browsers round to nearest 100).
  const variation = useMotionTemplate`"wght" ${smoothed}`

  useEffect(() => {
    if (reduced) return
    let last = window.scrollY
    let lastTime = performance.now()
    let raf = 0
    const decay = () => {
      // Settle back to min when nothing's happening.
      const cur = weight.get()
      if (cur > min + 0.5) {
        weight.set(cur + (min - cur) * 0.08)
        raf = requestAnimationFrame(decay)
      } else {
        weight.set(min)
        raf = 0
      }
    }
    const onScroll = () => {
      const now = performance.now()
      const dy = window.scrollY - last
      const dt = Math.max(1, now - lastTime)
      const v = Math.abs(dy) / (dt / 16) // pixels-per-frame at 60fps
      const target = Math.min(1, v / threshold)
      const next = min + (max - min) * target
      weight.set(Math.max(weight.get(), next))
      last = window.scrollY
      lastTime = now
      if (!raf) raf = requestAnimationFrame(decay)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced, min, max, threshold, weight])

  if (reduced) {
    const Tag = as as keyof JSX.IntrinsicElements
    return <Tag className={className} style={{ fontWeight: min }}>{children}</Tag>
  }

  const MotionTag = motion[as as "span"] as typeof motion.span
  return (
    <MotionTag className={className} style={{ fontVariationSettings: variation as unknown as string }}>
      {children}
    </MotionTag>
  )
}
