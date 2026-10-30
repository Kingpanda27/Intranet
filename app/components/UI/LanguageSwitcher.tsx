"use client"

import React, { useState, useRef, useEffect } from "react"
import { Globe, Check, ChevronDown } from "lucide-react"
import { useTranslation } from "@/lib/i18n/LanguageContext"
import { Locale } from "@/lib/i18n/types"

const LANGUAGES: { code: Locale; label: string; flag: string; nativeName: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸", nativeName: "Español (ES)" },
  { code: "en", label: "English", flag: "🇺🇸", nativeName: "English (EN)" }
]

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Botón Principal Glassmorphism */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn hover-scale"
        title={t("topbar.switchLanguage")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          padding: compact ? "0.35rem 0.65rem" : "0.45rem 0.75rem",
          borderRadius: "999px",
          backgroundColor: isOpen ? "hsl(var(--surface-hover))" : "hsl(var(--surface) / 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: isOpen ? "1px solid hsl(var(--primary) / 0.5)" : "1px solid hsl(var(--border) / 0.6)",
          color: "hsl(var(--foreground))",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          height: "38px",
          boxShadow: isOpen ? "0 4px 16px -2px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.04)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          userSelect: "none"
        }}
      >
        <Globe size={15} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
        <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>{currentLang.flag}</span>
        <span style={{ letterSpacing: "0.04em", textTransform: "uppercase" }}>{currentLang.code}</span>
        <ChevronDown 
          size={12} 
          style={{ 
            color: "hsl(var(--muted-foreground))", 
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease"
          }} 
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          className="card animate-in zoom-in-95"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: "175px",
            padding: "0.4rem",
            backgroundColor: "hsl(var(--surface) / 0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid hsl(var(--border) / 0.8)",
            borderRadius: "0.875rem",
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem"
          }}
        >
          <div style={{ 
            fontSize: "0.68rem", 
            fontWeight: 800, 
            textTransform: "uppercase", 
            letterSpacing: "0.06em", 
            color: "hsl(var(--muted-foreground))",
            padding: "0.35rem 0.6rem 0.2rem" 
          }}>
            {t("topbar.language")}
          </div>

          {LANGUAGES.map(lang => {
            const isSelected = lang.code === locale
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code)
                  setIsOpen(false)
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.55rem 0.65rem",
                  borderRadius: "0.55rem",
                  border: isSelected ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid transparent",
                  backgroundColor: isSelected ? "hsl(var(--primary) / 0.12)" : "transparent",
                  color: isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                  fontSize: "0.82rem",
                  fontWeight: isSelected ? 750 : 550,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "hsl(var(--surface-hover))"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1rem" }}>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check size={14} style={{ color: "hsl(var(--primary))" }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

