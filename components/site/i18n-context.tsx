"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { LANGUAGES, lookup, type LangCode, type LanguageMeta } from "@/lib/i18n"

type Ctx = {
  lang: LangCode
  meta: LanguageMeta
  setLang: (l: LangCode) => void
  t: (key: string) => string
  languages: LanguageMeta[]
}

const I18nContext = createContext<Ctx | null>(null)

const STORAGE_KEY = "vaish.lang"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en")

  // Hydrate from localStorage once
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      setLangState(stored)
    }
  }, [])

  // Sync html lang attribute
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang)
    }
  }, [lang])

  const setLang = useCallback((l: LangCode) => {
    setLangState(l)
    if (typeof window !== "undefined") {
      try { localStorage.setItem(STORAGE_KEY, l) } catch {}
    }
  }, [])

  const meta = useMemo(
    () => LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0],
    [lang],
  )

  const t = useCallback((key: string) => lookup(lang, key), [lang])

  const value = useMemo<Ctx>(
    () => ({ lang, meta, setLang, t, languages: LANGUAGES }),
    [lang, meta, setLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const v = useContext(I18nContext)
  if (!v) throw new Error("useI18n must be used inside I18nProvider")
  return v
}

export function useT() {
  return useI18n().t
}
