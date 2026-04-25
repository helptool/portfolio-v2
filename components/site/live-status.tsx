"use client"

/* ---------------------------------------------------------------------------
 * LiveStatus :: subtle "what I'm working on" block. Lives at the bottom
 * of the page, near the footer. Reads from lib/status.ts so the value
 * can change without a deploy (well — a re-deploy, but it's a tiny diff).
 *
 * Subtle by design :: small mono caption + one bullet line. No heading.
 * Visitors who don't notice it are fine; visitors who do, notice.
 *
 * Konami flag :: if the user typed the konami code, we surface a small
 * "rune found" badge alongside.
 * ------------------------------------------------------------------------- */

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { liveStatus } from "@/lib/status"

export function LiveStatus() {
  const [konami, setKonami] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      setKonami(localStorage.getItem("vaish.konami") === "1")
    } catch {
      /* private mode */
    }
    // Listen for late-stage konami unlocks while user is on the page.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "vaish.konami" && e.newValue === "1") setKonami(true)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-[1600px] px-5 pb-6 pt-10 md:px-10"
    >
      <div className="flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">
        <div className="flex items-center gap-3">
          <span aria-hidden className="block h-[6px] w-[6px] animate-pulse rounded-full bg-primary/80" />
          <span>// signal — currently</span>
          <span className="text-foreground/65 normal-case tracking-[0.04em]">
            {liveStatus.building}
          </span>
          {konami && (
            <span className="rounded-full border border-primary/55 px-2 py-[2px] text-primary tracking-[0.22em]">
              ◆ rune
            </span>
          )}
        </div>
        {liveStatus.where && (
          <div className="pl-[18px] normal-case tracking-[0.04em] text-foreground/45">
            {liveStatus.where}
            {liveStatus.listening ? ` · listening to ${liveStatus.listening}` : null}
          </div>
        )}
      </div>
    </motion.div>
  )
}
