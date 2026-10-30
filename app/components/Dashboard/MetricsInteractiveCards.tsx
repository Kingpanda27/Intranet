"use client"

import { useState, useEffect } from "react"
import { Users, UserX, Calendar, Award, FileText, X, Search, ChevronRight, Download, Clock } from "lucide-react"
import { 
  getHomeMetrics, 
  getActiveEmployeesDetails, 
  getAbsentEmployeesDetails, 
  getEventsThisWeekDetails, 
  getRecognitionsThisMonthDetails,
  getRecentDocsDetails 
} from "@/app/actions/homeActions"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/LanguageContext"

type ModalType = "ACTIVE" | "ABSENT" | "EVENTS" | "RECOGNITIONS" | "DOCS" | null

const ABSENCE_TYPES: Record<string, { label: string, color: string, icon: string }> = {
  VACATION: { label: "Vacaciones", color: "#3b82f6", icon: "🔵" },
  SICK: { label: "Enfermedad", color: "#ef4444", icon: "🔴" },
  SICK_LEAVE: { label: "Enfermedad", color: "#ef4444", icon: "🔴" },
  MEDICAL: { label: "Licencia Médica", color: "#a855f7", icon: "🟣" },
  MEDICAL_LEAVE: { label: "Licencia Médica", color: "#a855f7", icon: "🟣" },
  PATERNITY: { label: "Licencia por Paternidad", color: "#0ea5e9", icon: "🩵" },
  PATERNITY_LEAVE: { label: "Licencia por Paternidad", color: "#0ea5e9", icon: "🩵" },
  MATERNITY: { label: "Licencia por Maternidad", color: "#d946ef", icon: "💜" },
  MATERNITY_LEAVE: { label: "Licencia por Maternidad", color: "#d946ef", icon: "💜" },
  MATERNITY_PATERNITY: { label: "Maternidad / Paternidad", color: "#d946ef", icon: "💜" },
  BEREAVEMENT: { label: "Fallecimiento Familiar", color: "#1f2937", icon: "⚫" },
  BEREAVEMENT_LEAVE: { label: "Fallecimiento Familiar", color: "#1f2937", icon: "⚫" },
  MARRIAGE: { label: "Licencia por Matrimonio", color: "#e11d48", icon: "💍" },
  MARRIAGE_LEAVE: { label: "Licencia por Matrimonio", color: "#e11d48", icon: "💍" },
  PERMISSION: { label: "Permiso", color: "#f59e0b", icon: "🟡" },
  EARLY_LEAVE: { label: "Salida Temprana", color: "#eab308", icon: "🟡" },
  LATE_ARRIVAL: { label: "Llegada Tarde", color: "#f97316", icon: "🟠" }
}

function formatLastSeen(lastSeenDate?: Date | string | null, isEn?: boolean): { text: string; isOnline: boolean } {
  if (!lastSeenDate) return { text: isEn ? "Not seen today" : "No visto hoy", isOnline: false }
  const d = new Date(lastSeenDate)
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 5) return { text: isEn ? "Online now" : "En línea ahora", isOnline: true }
  if (diffMins < 60) return { text: isEn ? `${diffMins}m ago` : `Hace ${diffMins} min`, isOnline: false }
  const hours = Math.floor(diffMins / 60)
  if (hours < 24) return { text: isEn ? `${hours}h ago` : `Hace ${hours} h`, isOnline: false }
  return { text: d.toLocaleDateString(isEn ? "en-US" : "es-ES", { hour: "2-digit", minute: "2-digit" }), isOnline: false }
}

export function MetricsInteractiveCards({ metrics: initialMetrics }: { metrics: any }) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const isEn = locale === "en"
  const dateLocale = isEn ? "en-US" : "es-ES"
  const [currentMetrics, setCurrentMetrics] = useState(initialMetrics)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const getAbsenceTypeInfo = (type: string) => {
    const normalizedType = type === "SICK" ? "SICK_LEAVE" 
      : type === "MEDICAL" ? "MEDICAL_LEAVE" 
      : type === "PATERNITY" ? "PATERNITY_LEAVE" 
      : type === "MATERNITY" ? "MATERNITY_LEAVE" 
      : type === "BEREAVEMENT" ? "BEREAVEMENT_LEAVE" 
      : type;
    
    const translated = t(`vacations.types.${normalizedType}.label` as any);
    const fallback = ABSENCE_TYPES[type]?.label || ABSENCE_TYPES[normalizedType]?.label || type;
    const label = (translated && !translated.startsWith("vacations.types.")) ? translated : fallback;
    const color = ABSENCE_TYPES[type]?.color || ABSENCE_TYPES[normalizedType]?.color || "#3b82f6";
    const icon = ABSENCE_TYPES[type]?.icon || ABSENCE_TYPES[normalizedType]?.icon || "🔵";
    
    return { label, color, icon };
  }

  // Auto-refresh métricas en tiempo real cada 30 segundos
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const updated = await getHomeMetrics()
        setCurrentMetrics(updated)
      } catch (e) {
        console.error("Error refreshing home metrics:", e)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const openModal = async (type: ModalType) => {
    setActiveModal(type)
    setLoading(true)
    setData(null)
    setSearchQuery("")
    
    try {
      if (type === "ACTIVE") setData(await getActiveEmployeesDetails())
      else if (type === "ABSENT") setData(await getAbsentEmployeesDetails())
      else if (type === "EVENTS") setData(await getEventsThisWeekDetails())
      else if (type === "RECOGNITIONS") setData(await getRecognitionsThisMonthDetails())
      else if (type === "DOCS") setData(await getRecentDocsDetails())
    } catch (e) {
      console.error("Error loading modal details:", e)
    } finally {
      setLoading(false)
    }
  }

  // Tecla ESC para cerrar modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [])

  const filteredActive = activeModal === "ACTIVE" && data ? data.filter((u: any) => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  return (
    <>
      <div className="animate-in slide-in-bottom-sm" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { id: "ACTIVE", label: t("metrics.activeToday"), value: currentMetrics?.activeEmployees ?? 0, icon: Users, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
          { id: "ABSENT", label: t("metrics.absentToday"), value: currentMetrics?.absentEmployees ?? 0, icon: UserX, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
          { id: "EVENTS", label: t("metrics.eventsWeek"), value: currentMetrics?.eventsThisWeek ?? 0, icon: Calendar, color: "hsl(340 80% 60%)", bg: "hsla(340, 80%, 60%, 0.1)" },
          { id: "RECOGNITIONS", label: t("metrics.kudosMonth"), value: currentMetrics?.recognitionsThisMonth ?? 0, icon: Award, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
          { id: "DOCS", label: t("metrics.newDocs"), value: currentMetrics?.newDocsThisMonth ?? 0, icon: FileText, color: "hsl(var(--primary))", bg: "hsl(var(--primary)/0.1)" }
        ].map((stat, i) => (
          <div 
            key={i} 
            className="card glass hover-scale" 
            title={`Ver detalles de ${stat.label}`}
            onClick={() => openModal(stat.id as ModalType)}
            style={{ 
              padding: "1.25rem", borderRadius: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", 
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", cursor: "pointer", position: "relative" 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 24px -10px ${stat.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <stat.icon size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div 
          className="animate-in fade-in" 
          style={{ 
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" 
          }}
          onClick={(e) => { if(e.target === e.currentTarget) setActiveModal(null) }}
        >
          <div 
            className="animate-in zoom-in-95" 
            style={{ 
              backgroundColor: "hsl(var(--background))", width: "100%", maxWidth: "620px", 
              maxHeight: "88vh", borderRadius: "24px", display: "flex", flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.95)", overflow: "hidden",
              border: "1px solid hsl(var(--border) / 0.8)"
            }}
          >
            {/* Header */}
            <div style={{ padding: "1.5rem", borderBottom: "1px solid hsl(var(--border)/0.5)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "hsl(var(--surface))" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {activeModal === "ACTIVE" && <><Users color="#10b981" size={22} /> {t("metrics.modalActiveTitle")}</>}
                {activeModal === "ABSENT" && <><UserX color="#ef4444" size={22} /> {t("metrics.modalAbsentTitle")}</>}
                {activeModal === "EVENTS" && <><Calendar color="hsl(340 80% 60%)" size={22} /> {t("metrics.modalEventsTitle")}</>}
                {activeModal === "RECOGNITIONS" && <><Award color="#f59e0b" size={22} /> {t("metrics.modalKudosTitle")}</>}
                {activeModal === "DOCS" && <><FileText color="hsl(var(--primary))" size={22} /> {t("metrics.modalDocsTitle")}</>}
              </h2>
              <button onClick={() => setActiveModal(null)} className="btn btn-ghost" style={{ padding: "0.5rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))" }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, backgroundColor: "hsl(var(--background))" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
                  {t("metrics.loadingDetails") || (isEn ? "Loading details..." : "Cargando detalles...")}
                </div>
              ) : (
                <>
                  {/* ACTIVOS HOY */}
                  {activeModal === "ACTIVE" && data && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
                        <input 
                          type="text" 
                          placeholder={t("metrics.searchEmployees")} 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input"
                          style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "12px" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {filteredActive.length > 0 ? filteredActive.map((u: any) => {
                          const status = formatLastSeen(u.lastSeen, isEn)
                          return (
                            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: "1px solid hsl(var(--border)/0.5)" }}>
                              <div style={{ position: "relative" }}>
                                {u.image ? (
                                  <img src={u.image} alt={u.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                                ) : (
                                  <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem" }}>
                                    {u.name?.charAt(0) || "U"}
                                  </div>
                                )}
                                <div style={{ 
                                  position: "absolute", bottom: -2, right: -2, width: 14, height: 14, 
                                  borderRadius: "50%", backgroundColor: status.isOnline ? "#10b981" : "#94a3b8", 
                                  border: "2px solid hsl(var(--background))" 
                                }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                                <div style={{ fontSize: "0.825rem", color: "hsl(var(--muted-foreground))" }}>
                                  {u.position || "Sin cargo"} {u.department ? `• ${u.department}` : ""}
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <span style={{ 
                                  fontSize: "0.75rem", fontWeight: 700, 
                                  backgroundColor: status.isOnline ? "rgba(16, 185, 129, 0.15)" : "hsl(var(--muted) / 0.5)", 
                                  color: status.isOnline ? "#10b981" : "hsl(var(--muted-foreground))", 
                                  padding: "0.25rem 0.6rem", borderRadius: "9999px" 
                                }}>
                                  {status.text}
                                </span>
                              </div>
                            </div>
                          )
                        }) : (
                          <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--muted-foreground))" }}>
                            {t("metrics.noActiveFound") || (isEn ? "No matching active employees found." : "No se encontraron empleados activos coincidentes.")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AUSENTES */}
                  {activeModal === "ABSENT" && data && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {data.length > 0 ? data.map((req: any) => {
                        const typeInfo = getAbsenceTypeInfo(req.type);
                        return (
                          <div key={req.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: `1px solid ${typeInfo.color}30` }}>
                            {req.user.image ? (
                              <img src={req.user.image} alt={req.user.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "hsl(var(--muted))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                                {req.user.name?.charAt(0) || "U"}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "1rem" }}>{req.user.name}</div>
                              <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem", color: typeInfo.color, fontWeight: 600 }}>
                                {typeInfo.icon} {typeInfo.label}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>
                                {new Date(req.startDate).toLocaleDateString(dateLocale)} - {new Date(req.endDate).toLocaleDateString(dateLocale)}
                              </div>
                            </div>
                          </div>
                        )
                      }) : (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                          <UserX size={48} color="hsl(var(--muted-foreground)/0.3)" style={{ margin: "0 auto 1rem auto" }} />
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                            {t("metrics.noAbsencesScheduled") || (isEn ? "No scheduled absences today" : "No hay ausencias programadas hoy")}
                          </h3>
                          <p style={{ color: "hsl(var(--muted-foreground))" }}>
                            {t("metrics.allTeamAvailable") || (isEn ? "The whole team is present." : "Todo el equipo está disponible.")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EVENTOS SEMANA */}
                  {activeModal === "EVENTS" && data && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {data.length > 0 ? (
                        <>
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {data.map((ev: any) => {
                              const d = new Date(ev.startDate)
                              const isUtcMidnight = ev.type === 'HOLIDAY' || (d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
                              const month = d.toLocaleDateString("es-ES", { month: "short", timeZone: isUtcMidnight ? "UTC" : undefined }).replace(".", "")
                              const day = isUtcMidnight ? d.getUTCDate() : d.getDate()
                              return (
                                <div key={ev.id} style={{ display: "flex", gap: "1rem", padding: "1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: "1px solid hsl(var(--border)/0.5)" }}>
                                  <div style={{ 
                                    backgroundColor: "hsla(340, 80%, 60%, 0.1)", color: "hsl(340 80% 60%)", 
                                    width: 60, height: 60, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 800 
                                  }}>
                                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>{month}</span>
                                    <span style={{ fontSize: "1.25rem" }}>{day}</span>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{ev.title}</div>
                                    <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
                                      <span suppressHydrationWarning>{isUtcMidnight ? "Todo el día" : d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
                                      {ev.location && <span>• {ev.location}</span>}
                                    </div>
                                    {ev.description && <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "hsl(var(--foreground))" }}>{ev.description}</p>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <button onClick={() => router.push("/calendar")} className="btn btn-primary" style={{ width: "100%", padding: "1rem", borderRadius: "16px", marginTop: "1rem" }}>
                            Ver Calendario Completo
                          </button>
                        </>
                      ) : (
                        <div style={{ textAlign: "center", padding: "3rem" }}>
                          <Calendar size={48} color="hsl(var(--muted-foreground)/0.3)" style={{ margin: "0 auto 1rem auto" }} />
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>No hay eventos esta semana</h3>
                          <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem" }}>El calendario de esta semana se encuentra despejado.</p>
                          <button onClick={() => router.push("/calendar")} className="btn btn-surface">Ir al Calendario</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RECONOCIMIENTOS */}
                  {activeModal === "RECOGNITIONS" && data && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                      {data.top3.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))", marginBottom: "1rem", fontWeight: 800 }}>Top 3 más reconocidos</h3>
                          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                            {data.top3.map((t: any, i: number) => (
                              <div key={t.user.id} style={{ flex: "1", minWidth: "120px", padding: "1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: `1px solid ${i === 0 ? '#f59e0b' : 'hsl(var(--border)/0.5)'}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
                                {i === 0 && <Award size={24} color="#f59e0b" style={{ position: "absolute", top: -12, right: -12, background: "hsl(var(--surface))", borderRadius: "50%" }} />}
                                {t.user.image ? (
                                  <img src={t.user.image} alt={t.user.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", marginBottom: "0.5rem" }} />
                                ) : (
                                  <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>{t.user.name?.charAt(0)}</div>
                                )}
                                <div style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>{t.user.name}</div>
                                <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>{t.count} rec.</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))", marginBottom: "1rem", fontWeight: 800 }}>Historial del mes</h3>
                        {data.list.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {data.list.map((rec: any) => (
                              <div key={rec.id} style={{ padding: "1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: "1px solid hsl(var(--border)/0.3)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                  <div style={{ fontSize: "1.5rem" }}>{rec.icon || "🏆"}</div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Reconocimiento a {rec.receiver.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>Otorgado por {rec.sender.name} • {new Date(rec.createdAt).toLocaleDateString("es-ES")}</div>
                                  </div>
                                </div>
                                <p style={{ fontSize: "0.85rem", margin: 0 }}>"{rec.reason}"</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--muted-foreground))" }}>No se han otorgado reconocimientos este mes.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* NUEVOS DOCS */}
                  {activeModal === "DOCS" && data && (() => {
                    const newDocs = Array.isArray(data) ? [] : (data.newDocs || [])
                    const allDocs = Array.isArray(data) ? data : (data.allDocs || [])
                    const hasNewDocs = newDocs.length > 0
                    const hasAnyDocs = allDocs.length > 0
                    const dateLocale = locale === "en" ? "en-US" : "es-DO"

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        {hasNewDocs ? (
                          <div>
                            <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--primary))", marginBottom: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <FileText size={16} /> {t("documents.modal.newThisMonth", { count: newDocs.length })}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              {newDocs.map((doc: any) => (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: "1px solid hsl(var(--border)/0.5)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: "10px", backgroundColor: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <FileText size={20} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                                      <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                                        {doc.category || t("documents.categories.general")} • {new Date(doc.createdAt).toLocaleDateString(dateLocale)}
                                      </div>
                                    </div>
                                  </div>
                                  {(doc.url || doc.fileUrl) && (
                                    <a href={doc.url || doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "0.4rem 0.85rem", borderRadius: "8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                                      <Download size={14} /> {t("documents.card.open")}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "1.25rem 1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: "1px dashed hsl(var(--border))" }}>
                            <p style={{ margin: 0, fontWeight: 600, color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" }}>
                              {t("documents.modal.noNewThisMonth")}
                            </p>
                          </div>
                        )}

                        {hasAnyDocs ? (
                          <div>
                            <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))", marginBottom: "0.75rem", fontWeight: 800 }}>
                              {t("documents.modal.repositoryDocs", { count: allDocs.length })}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              {allDocs.map((doc: any) => (
                                <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem", backgroundColor: "hsl(var(--surface))", borderRadius: "16px", border: "1px solid hsl(var(--border)/0.5)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: "10px", backgroundColor: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <FileText size={20} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                                      <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                                        {doc.category || t("documents.categories.general")} • {new Date(doc.createdAt).toLocaleDateString(dateLocale)}
                                      </div>
                                    </div>
                                  </div>
                                  {(doc.url || doc.fileUrl) && (
                                    <a href={doc.url || doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "0.4rem 0.85rem", borderRadius: "8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                                      <Download size={14} /> {t("documents.card.open")}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                            <FileText size={48} color="hsl(var(--muted-foreground)/0.3)" style={{ margin: "0 auto 1rem auto" }} />
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>{t("documents.modal.noDocsAvailable")}</h3>
                            <p style={{ color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>{t("documents.filters.noDocsFound")}</p>
                          </div>
                        )}

                        <button onClick={() => router.push("/knowledge-base")} className="btn btn-primary" style={{ width: "100%", padding: "1rem", borderRadius: "16px", marginTop: "0.25rem" }}>
                          {t("documents.modal.goToCenter")}
                        </button>
                      </div>
                    )
                  })()}

                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
