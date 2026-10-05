"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calendar as CalendarIcon, CalendarDays, MapPin, X, ExternalLink, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export interface HolidayItem {
  id: string
  title: string
  description?: string | null
  startDate: string | Date
  endDate?: string | Date
  color?: string | null
  location?: string | null
}

export function UpcomingHolidayCard({ upcomingHolidays = [] }: { upcomingHolidays: HolidayItem[] }) {
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
        title={nextHoliday ? "Haz clic para ver más detalles del feriado" : undefined}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Próximo Feriado
          </div>
          {nextHoliday && (
            <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "999px", backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <Sparkles size={10} /> Ver detalles
            </span>
          )}
        </div>

        {nextHoliday ? (
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "hsl(var(--primary))", lineHeight: 1.1 }}>
              {new Date(nextHoliday.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
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
              {nextHoliday.title}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", marginTop: "0.5rem" }}>
            Sin feriados próximos
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
                  Feriado Oficial No Laborable
                </span>
                <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                  {selectedHoliday.title}
                </h3>
              </div>
            </div>

            {/* Detalle de fecha y lugar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", backgroundColor: "hsl(var(--muted) / 0.3)", borderRadius: "1rem", border: "1px solid hsl(var(--border) / 0.5)", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                <CalendarIcon size={18} color="hsl(var(--primary))" />
                <span>
                  {new Date(selectedHoliday.startDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </span>
              </div>
              {selectedHoliday.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
                  <MapPin size={16} />
                  <span>Cobertura: {selectedHoliday.location}</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            {selectedHoliday.description && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Información sobre este feriado:
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
                <ExternalLink size={16} /> Ver en el Calendario
              </button>
              <button 
                onClick={() => setSelectedHoliday(null)}
                className="btn btn-surface"
                style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem" }}
              >
                Cerrar
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
          Próximos Feriados
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
                title="Haz clic para ver más detalles"
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
                    {new Date(h.startDate).toLocaleString('es-ES', { month: 'short', timeZone: 'UTC' })}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}>
                    {new Date(h.startDate).getUTCDate()}
                  </div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.2, marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h.title}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, textTransform: "uppercase" }}>
                    No laborable • {h.location || "Oficial"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>No hay feriados próximos registrados.</p>
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
                  Feriado Oficial No Laborable
                </span>
                <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                  {selectedHoliday.title}
                </h3>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", backgroundColor: "hsl(var(--muted) / 0.3)", borderRadius: "1rem", border: "1px solid hsl(var(--border) / 0.5)", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                <CalendarIcon size={18} color="hsl(var(--primary))" />
                <span>
                  {new Date(selectedHoliday.startDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </span>
              </div>
              {selectedHoliday.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
                  <MapPin size={16} />
                  <span>Cobertura: {selectedHoliday.location}</span>
                </div>
              )}
            </div>

            {selectedHoliday.description && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Información sobre este feriado:
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
                <ExternalLink size={16} /> Ver en el Calendario
              </button>
              <button 
                onClick={() => setSelectedHoliday(null)}
                className="btn btn-surface"
                style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
