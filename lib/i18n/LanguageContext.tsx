"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Locale, TranslationKey, LanguageContextType } from "./types"
import { translate } from "./dictionaries"

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const COOKIE_NAME = "intranet_locale"
const STORAGE_KEY = "intranet_locale"

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "es"

  // 1. Intentar leer desde cookie
  try {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${COOKIE_NAME})=([^;]*)`))
    if (match && (match[3] === "es" || match[3] === "en")) {
      return match[3] as Locale
    }
  } catch (e) {
    // Cookie read failed
  }

  // 2. Intentar leer desde localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "es" || saved === "en") {
      return saved as Locale
    }
  } catch (e) {
    // Storage read failed
  }

  return "es"
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>("es")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getInitialLocale()
    setLocaleState(initial)
    if (typeof document !== "undefined") {
      document.documentElement.lang = initial
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale
      document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      try {
        localStorage.setItem(STORAGE_KEY, newLocale)
      } catch (e) {}
      router.refresh()
    }
  }, [router])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return translate(locale, key, params)
    },
    [locale]
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}

export function useLanguage() {
  return useTranslation()
}

