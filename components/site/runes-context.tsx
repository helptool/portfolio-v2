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

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
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
  // Track whether localStorage has been hydrated. The very first persist
  // effect runs while `found` is still the initial empty Set — without
  // this guard we would clobber a returning visitor's saved runes back
  // to empty before the hydrate effect commits its readRunes() result.
  const hydratedRef = useRef(false)
  // Track the previous size so the persist effect can fire COMPLETE_EVENT
  // exactly once per honest 4→5 transition.
  const prevSizeRef = useRef(0)

  // Hydrate from localStorage on mount and listen for cross-tab updates.
  // We deliberately do NOT listen to the same-tab `RUNES_EVENT` here:
  // same-tab unlocks already flow through addRune → setFound, so adding
  // a self-listener would create a feedback loop (writeRunes dispatches
  // → listener fires → setFound(readRunes()) → fresh Set reference → all
  // useRunes() consumers re-render redundantly, twice in StrictMode).
  // The cross-tab `storage` event is the only legitimate input here.
  useEffect(() => {
    const initial = readRunes()
    setFound(initial)
    prevSizeRef.current = initial.size
    hydratedRef.current = true

    const onStorage = (e: StorageEvent) => {
      if (e.key === RUNES_STORAGE_KEY) setFound(readRunes())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Side-effect mirror :: persist + broadcast whenever `found` changes.
  // Pulled out of the addRune updater because React requires updaters to
  // be pure — a synchronous dispatchEvent inside the updater would fire
  // listeners mid-render, and StrictMode's double-invocation would
  // produce double localStorage writes + double event dispatches.
  useEffect(() => {
    if (!hydratedRef.current) return
    writeRunes(found)
    if (found.size === RUNE_IDS.length && prevSizeRef.current < RUNE_IDS.length) {
      try {
        window.dispatchEvent(new CustomEvent(COMPLETE_EVENT))
      } catch {}
    }
    prevSizeRef.current = found.size
  }, [found])

  const hasRune = useCallback((id: RuneId) => found.has(id), [found])

  const addRune = useCallback((id: RuneId) => {
    // Pure updater :: only mutates the Set. All side effects (localStorage,
    // event broadcasts) happen in the persist effect above.
    setFound((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
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
