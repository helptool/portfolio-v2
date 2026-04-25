"use client"

import { useEffect } from "react"
import Lenis from "lenis"

export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    /* Lenis tuning notes ::
       - lerp 0.10 lands somewhere between "anchored" (0.08) and "floaty" (0.13).
         Feels more responsive on a normal mouse wheel without overshooting on
         heavy flicks.
       - wheelMultiplier 1.1 lifts the per-tick distance just enough that the
         page tracks finger/wheel input 1:1 instead of trailing slightly.
       - syncTouch=false :: keep native momentum on touch devices. Lenis on
         touch fights iOS rubber-band physics and feels worse than native.
       - gestureOrientation 'vertical' :: explicitly opt out of horizontal
         capture so the scroll-arc + arcade horizontal scrubbers get raw events. */
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp: 0.1,
      wheelMultiplier: 1.1,
      touchMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      gestureOrientation: "vertical",
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])
  return null
}
