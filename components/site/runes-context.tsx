"use client"

/* ---------------------------------------------------------------------------
 * RunesProvider :: lightweight context wrapping the five-rune meta-game.
 * Each trigger across the site calls `addRune(id)` and the provider keeps
 * a Set in state + persists to localStorage. When all five are held the
 * provider dispatches `vaish:runes-complete` once per session, which the
 * EchoVault component listens for to surface its reveal.
 *
 * Why a provider, not just hooks
 *   The LiveStatus counter, the hidden triggers, and the completion overlay
 *   all need to share a single source of truth. Without a provider they'd
 *   each maintain their own snapshot and risk drift after late-stage
 *   unlocks (e.g. konami in tab A, manifesto click in tab B). Providers
 *   subscribe to the same `runes-changed` event and re-read storage.
 * ------------------------------------------------------------------------- */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  RUNES_EVENT,
  RUNES_STORAGE_KEY,
  RUNE_IDS,
  readRunes,
  writeRunes,
  type RuneId,
} from "@/lib/runes"

type Ctx = {
  found: Set<RuneId>
  total: number
  count: number
  complete: boolean
  hasRune: (id: RuneId) => boolean
  addRune: (id: RuneId) => void
}

const RunesContext = createContext<Ctx | null>(null)

const COMPLETE_EVENT = "vaish:runes-complete"

export function RunesProvider({ children }: { children: React.ReactNode }) {
  const [found, setFound] = useState<Set<RuneId>>(() => new Set())

  // Hydrate from localStorage on mount and listen for cross-tab updates.
  useEffect(() => {
    setFound(readRunes())

    const onChange = () => setFound(readRunes())
    const onStorage = (e: StorageEvent) => {
      if (e.key === RUNES_STORAGE_KEY) onChange()
    }
    window.addEventListener(RUNES_EVENT, onChange)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(RUNES_EVENT, onChange)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const hasRune = useCallback((id: RuneId) => found.has(id), [found])

  const addRune = useCallback((id: RuneId) => {
    setFound((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      writeRunes(next)
      // If this unlock just completed the set, fire the celebration event.
      // Guarded against double-fires :: only dispatches when count flips
      // from 4→5, not on subsequent re-mounts.
      if (next.size === RUNE_IDS.length && prev.size < RUNE_IDS.length) {
        try {
          window.dispatchEvent(new CustomEvent(COMPLETE_EVENT))
        } catch {}
      }
      return next
    })
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      found,
      total: RUNE_IDS.length,
      count: found.size,
      complete: found.size === RUNE_IDS.length,
      hasRune,
      addRune,
    }),
    [found, hasRune, addRune],
  )

  return <RunesContext.Provider value={value}>{children}</RunesContext.Provider>
}

export function useRunes() {
  const v = useContext(RunesContext)
  if (!v) throw new Error("useRunes must be used inside RunesProvider")
  return v
}
