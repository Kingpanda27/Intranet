"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calendar as CalendarIcon, CalendarDays, MapPin, X, ExternalLink, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/LanguageContext"
import { getLocalizedHolidayTitle } from "@/lib/holidayData"

export interface HolidayItem {
  id: string
  title: string
  description?: string | null
  startDate: string | Date
  endDate?: string | Date
  color?: string | null
  location?: string | null
}

function formatHolidayShortDate(dateInput?: string | Date | null, locale: string = "es"): string {
  if (!dateInput) return ""
  const monthsEs = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const months = locale === "en" ? monthsEn : monthsEs
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const day = parseInt(match[3], 10)
      const monthIndex = parseInt(match[2], 10) - 1
      return locale === "en" ? `${months[monthIndex]} ${day}` : `${day} ${months[monthIndex]}`
    }
  }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ""
  const day = d.getUTCDate()
  const monthIndex = d.getUTCMonth()
  return locale === "en" ? `${months[monthIndex]} ${day}` : `${day} ${months[monthIndex]}`
}

function getLocalizedHolidayLocation(location?: string | null, locale: string = "es"): string {
  if (!location) return locale === "en" ? "Official" : "Oficial"
  if (locale !== "en") return location
  const loc = location.toLowerCase().trim()
  if (loc.includes("república dominicana") || loc.includes("republica dominicana") || loc === "rd" || loc === "do") {
    return "Dominican Republic"
  }
  if (loc.includes("ee.uu") || loc.includes("estados unidos") || loc === "us" || loc === "usa") {
    return "United States"
  }
  return location
}

export function UpcomingHolidayCard({ upcomingHolidays = [] }: { upcomingHolidays: HolidayItem[] }) {
  const { t, locale } = useTranslation()
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayItem | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const nextHoliday = upcomingHolidays[0]

  return (
    <>
      {/* ── CARD MÉTRICA PRINCIPAL (PRÓXIMO FERIADO) ── */}
      <div 
        onClick={() => nextHoliday && setSelectedHoliday(nextHoliday)}
        className="card glass hover-scale" 
        style={{ 
          padding: "1.25rem", 
          borderRadius: "1rem", 
          border: "1px solid hsl(var(--primary) / 0.2)", 
          display: "flex", 
          flexDirection: "column",
          cursor: nextHoliday ? "pointer" : "default",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        title={nextHoliday ? (locale === "en" ? "Click to view holiday details" : "Haz clic para ver más detalles del feriado") : undefined}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {t("vacations.nextHoliday")}
          </div>
          {nextHoliday && (
            <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "999px", backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <Sparkles size={10} /> {t("common.details")}
            </span>
          )}
        </div>

        {nextHoliday ? (
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "hsl(var(--primary))", lineHeight: 1.1 }}>
              {formatHolidayShortDate(nextHoliday.startDate, locale)}
            </div>
            <div style={{ 
              fontSize: "0.85rem", 
              color: "hsl(var(--foreground))", 
              marginTop: "0.35rem", 
              fontWeight: 700,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}>
              {getLocalizedHolidayTitle(nextHoliday.title, locale)}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginTop: "0.5rem" }}>
            {t("vacations.noUpcomingHolidays")}
          </div>
        )}
      </div>

      {/* ── MODAL DE DETALLES DEL FERIADO (PORTAL DIRECTO A BODY) ── */}
      {selectedHoliday && mounted && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem"
        }}>
          <div className="card glass animate-in zoom-in-95" style={{
            width: "100%",
            maxWidth: "480px",
            maxHeight: "90vh",
            overflowY: "auto",
            backgroundColor: "hsl(var(--surface))",
            borderRadius: "1.5rem",
            border: "1px solid hsl(var(--border))",
            padding: "1.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            position: "relative"
          }}>
            {/* Botón Cerrar */}
            <button 
              onClick={() => setSelectedHoliday(null)}
              className="btn btn-ghost"
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", padding: "0.4rem", borderRadius: "50%" }}
            >
              <X size={20} />
            </button>

            {/* Header del Modal */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
              <div style={{ 
                width: "48px", height: "48px", borderRadius: "12px", 
                backgroundColor: selectedHoliday.color ? `${selectedHoliday.color}20` : "hsl(var(--primary) / 0.15)",
                color: selectedHoliday.color || "hsl(var(--primary))",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <CalendarDays size={26} />
              </div>
              <div>
                <span style={{ 
                  fontSize: "0.68rem", 
                  fontWeight: 800, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.06em",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "4px",
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))"
                }}>
                  {locale === "en" ? "Official Non-working Holiday" : "Feriado Oficial No Laborable"}
                </span>
                <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                  {getLocalizedHolidayTitle(selectedHoliday.title, locale)}
                </h3>
              </div>
            </div>

            {/* Detalle de fecha y lugar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", backgroundColor: "hsl(var(--muted) / 0.3)", borderRadius: "1rem", border: "1px solid hsl(var(--border) / 0.5)", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                <CalendarIcon size={18} color="hsl(var(--primary))" />
                <span>
                  {new Date(selectedHoliday.startDate).toLocaleDateString(locale === "en" ? 'en-US' : 'es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </span>
              </div>
              {selectedHoliday.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
                  <MapPin size={16} />
                  <span>{locale === "en" ? "Coverage: " : "Cobertura: "}{getLocalizedHolidayLocation(selectedHoliday.location, locale)}</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            {selectedHoliday.description && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  {locale === "en" ? "Information regarding this holiday:" : "Información sobre este feriado:"}
                </label>
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5, color: "hsl(var(--foreground))" }}>
                  {selectedHoliday.description}
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button 
                onClick={() => { setSelectedHoliday(null); router.push("/calendar"); }}
                className="btn btn-primary"
                style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                <ExternalLink size={16} /> {t("vacations.viewInCalendar")}
              </button>
              <button 
                onClick={() => setSelectedHoliday(null)}
                className="btn btn-surface"
                style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem" }}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export function UpcomingHolidaysSidebarWidget({ upcomingHolidays = [] }: { upcomingHolidays: HolidayItem[] }) {
  const { t, locale } = useTranslation()
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayItem | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div className="card glass" style={{ padding: "1.5rem", borderRadius: "1.25rem", border: "1px solid hsl(var(--border))" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarIcon size={18} color="hsl(var(--primary))" />
          {t("vacations.holidaySidebarTitle")}
        </h3>
        {upcomingHolidays.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {upcomingHolidays.map((h) => (
              <div 
                key={h.id} 
                onClick={() => setSelectedHoliday(h)}
                className="hover-scale"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.85rem", 
                  padding: "0.75rem", 
                  backgroundColor: "hsl(var(--muted) / 0.3)", 
                  borderRadius: "0.75rem", 
                  border: "1px solid hsl(var(--border) / 0.5)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title={locale === "en" ? "Click to view more details" : "Haz clic para ver más detalles"}
              >
                <div style={{ 
                  backgroundColor: h.color ? `${h.color}15` : "hsl(var(--primary) / 0.1)", 
                  color: h.color || "hsl(var(--primary))", 
                  padding: "0.4rem", 
                  borderRadius: "0.5rem", 
                  textAlign: "center", 
                  minWidth: "3.5rem" 
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase" }}>
                    {new Date(h.startDate).toLocaleString(locale === "en" ? 'en-US' : 'es-ES', { month: 'short', timeZone: 'UTC' })}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}>
                    {new Date(h.startDate).getUTCDate()}
                  </div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.2, marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {getLocalizedHolidayTitle(h.title, locale)}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, textTransform: "uppercase" }}>
                    {locale === "en" ? "Non-working · " : "No laborable · "}{getLocalizedHolidayLocation(h.location, locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>{locale === "en" ? "No upcoming holidays registered." : "No hay feriados próximos registrados."}</p>
        )}
      </div>

      {/* MODAL DETALLES AL HACER CLIC EN SIDEBAR (PORTAL DIRECTO A BODY) */}
      {selectedHoliday && mounted && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem"
        }}>
          <div className="card glass animate-in zoom-in-95" style={{
            width: "100%",
            maxWidth: "480px",
            maxHeight: "90vh",
            overflowY: "auto",
            backgroundColor: "hsl(var(--surface))",
            borderRadius: "1.5rem",
            border: "1px solid hsl(var(--border))",
            padding: "1.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            position: "relative"
          }}>
            <button 
              onClick={() => setSelectedHoliday(null)}
              className="btn btn-ghost"
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", padding: "0.4rem", borderRadius: "50%" }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
              <div style={{ 
                width: "48px", height: "48px", borderRadius: "12px", 
                backgroundColor: selectedHoliday.color ? `${selectedHoliday.color}20` : "hsl(var(--primary) / 0.15)",
                color: selectedHoliday.color || "hsl(var(--primary))",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <CalendarDays size={26} />
              </div>
              <div>
                <span style={{ 
                  fontSize: "0.68rem", 
                  fontWeight: 800, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.06em",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "4px",
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))"
                }}>
                  {locale === "en" ? "Official Non-working Holiday" : "Feriado Oficial No Laborable"}
                </span>
                <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                  {getLocalizedHolidayTitle(selectedHoliday.title, locale)}
                </h3>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", backgroundColor: "hsl(var(--muted) / 0.3)", borderRadius: "1rem", border: "1px solid hsl(var(--border) / 0.5)", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                <CalendarIcon size={18} color="hsl(var(--primary))" />
                <span>
                  {new Date(selectedHoliday.startDate).toLocaleDateString(locale === "en" ? 'en-US' : 'es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </span>
              </div>
              {selectedHoliday.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
                  <MapPin size={16} />
                  <span>{locale === "en" ? "Coverage: " : "Cobertura: "}{getLocalizedHolidayLocation(selectedHoliday.location, locale)}</span>
                </div>
              )}
            </div>

            {selectedHoliday.description && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  {locale === "en" ? "Information regarding this holiday:" : "Información sobre este feriado:"}
                </label>
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5, color: "hsl(var(--foreground))" }}>
                  {selectedHoliday.description}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button 
                onClick={() => { setSelectedHoliday(null); router.push("/calendar"); }}
                className="btn btn-primary"
                style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                <ExternalLink size={16} /> {t("vacations.viewInCalendar")}
              </button>
              <button 
                onClick={() => setSelectedHoliday(null)}
                className="btn btn-surface"
                style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem" }}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
