"use client"

/* ---------------------------------------------------------------------------
 * EchoVault :: the celebration overlay that surfaces when all five runes
 * are held. Visually parallels the konami overlay so the meta-game reads
 * as a single cohesive arc — same backdrop, same dialog stagger, but with
 * all five glyphs lit and a longer narrative line.
 *
 * Trigger :: a `vaish:runes-complete` CustomEvent dispatched by
 * RunesProvider.addRune the moment the count flips 4→5. The provider
 * guards against double-fires on remount, so this overlay can listen
 * naively without book-keeping.
 *
 * Reduced motion :: skip the per-glyph stagger; everything fades in as
 * one block over 200ms.
 * ------------------------------------------------------------------------- */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { RUNES, RUNE_IDS } from "@/lib/runes"
import { useRunes } from "./runes-context"

const COMPLETE_EVENT = "vaish:runes-complete"

export function EchoVault() {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const { complete } = useRunes()

  useEffect(() => {
    const onComplete = () => setOpen(true)
    window.addEventListener(COMPLETE_EVENT, onComplete)
    return () => window.removeEventListener(COMPLETE_EVENT, onComplete)
  }, [])

  // Esc / click-out dismiss.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // Don't render anything until first unlock. Avoids paying the framer
  // mount cost on every page load.
  if (!complete && !open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="echo-vault"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.18 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[95] grid place-items-center bg-background/85 backdrop-blur-md"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label="All five runes ignited"
        >
          <motion.div
            initial={{ scale: 0.94, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            transition={{ duration: reduced ? 0.18 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[640px] rounded-md border border-primary/45 bg-background/90 p-10 shadow-[0_30px_120px_-30px_oklch(0.74_0.15_52/0.6)]"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-primary/85">
              echo vault · 5 / 5 ignited
            </div>
            <h2 className="font-display mt-4 text-balance text-3xl leading-tight text-foreground sm:text-4xl">
              You held the realm steady long enough to find every rune.
            </h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-foreground/70">
              Most people leave a portfolio in under thirty seconds. You stayed,
              clicked, listened, watched. The realm thanks you for that — quietly,
              the way it thanks anyone willing to look twice.
            </p>

            {/* Rune ledger :: each glyph paired with its line. Stagger applies
                only when reduced-motion is off; otherwise everything fades
                in as a block. */}
            <ul className="mt-7 space-y-3 border-t border-primary/15 pt-6 text-[13px] leading-relaxed">
              {RUNE_IDS.map((id, i) => (
                <motion.li
                  key={id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduced ? 0 : 0.18 + i * 0.08,
                    duration: 0.42,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-baseline gap-3 text-foreground/65"
                >
                  <span aria-hidden className="font-display text-2xl text-primary/90">
                    {RUNES[id].glyph}
                  </span>
                  <span className="flex-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary/70">
                      {RUNES[id].name}
                    </span>
                    <br />
                    <span className="text-foreground/55">{RUNES[id].line}</span>
                  </span>
                </motion.li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex items-center gap-2 border-b border-primary/55 pb-1 font-mono text-xs uppercase tracking-[0.28em] text-primary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
            >
              return to the realm
              <span aria-hidden>↳</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
