"use client"

import { TrendingUp, Gift, Zap, Hash, Star, CalendarX, Award, Calendar, Cake, Briefcase, Activity, Plane, FileText } from "lucide-react"
import { useTranslation } from "@/lib/i18n/LanguageContext"
import { getLocalizedHolidayTitle } from "@/lib/holidayData"

function getEventBadgeDate(dateVal: Date | string, isHoliday?: boolean, precalculatedMonth?: string, precalculatedDay?: number, locale: string = "es") {
  if (precalculatedMonth && precalculatedDay !== undefined) {
    return { month: precalculatedMonth, day: precalculatedDay }
  }
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return { month: "", day: "" }
  
  // Si es un feriado o evento a medianoche UTC (00:00:00Z),
  // se debe leer con UTC para evitar desfase de -1 día por zona horaria local (ej. UTC-4 / UTC-5).
  const isUtcMidnight = isHoliday || (d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
  
  const month = d.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", { 
    month: "short", 
    timeZone: isUtcMidnight ? "UTC" : undefined 
  }).replace(".", "")
  
  const day = isUtcMidnight ? d.getUTCDate() : d.getDate()
  return { month, day }
}

function formatDateSafe(dateVal: Date | string, options?: Intl.DateTimeFormatOptions, locale: string = "es") {
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return ""
  const isUtcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
  return d.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
    ...(options || { day: "numeric", month: "short" }),
    timeZone: isUtcMidnight ? "UTC" : undefined
  })
}

export function RightPanel({ 
  absentEmployees = [], 
  recognitions = [], 
  upcomingEvents = [],
  todaysBirthdays = [],
  upcomingAbsences = [],
  corporateActivity = { posts: 0, docs: 0, recs: 0, requests: 0 },
  personalSummary = { vacationBalance: 0, nextAbsence: null, recognitions: 0 }
}: { 
  absentEmployees?: any[], 
  recognitions?: any[], 
  upcomingEvents?: any[],
  todaysBirthdays?: any[],
  upcomingAbsences?: any[],
  corporateActivity?: any,
  personalSummary?: any
}) {
  const { t, locale } = useTranslation()

  const quickLinks = [
    { key: "policies", label: t("rightPanel.policies") },
    { key: "benefits", label: t("rightPanel.benefits") },
    { key: "itSupport", label: t("rightPanel.itSupport") },
    { key: "directory", label: t("rightPanel.directory") }
  ]

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "1.5rem"
    }}>
      {/* Absent Employees Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <CalendarX size={20} color="hsl(var(--primary))" /> 
          {t("rightPanel.absentToday")}
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {absentEmployees.length === 0 ? (
            <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", opacity: 0.8, textAlign: "center", padding: "1rem 0" }}>
              {t("rightPanel.noAbsencesToday")}
            </div>
          ) : (
            absentEmployees.map((emp) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: "50%", 
                  backgroundColor: "hsl(var(--muted))", 
                  color: emp.currentStatus.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", fontWeight: 800, overflow: "hidden"
                }}>
                  {emp.image ? (
                    <img src={emp.image} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    emp.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: emp.currentStatus.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: emp.currentStatus.color }} />
                    {emp.currentStatus.label}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recognitions Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Award size={20} color="hsl(var(--primary))" /> 
          {t("rightPanel.recentRecognitions")}
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recognitions.length === 0 ? (
            <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", opacity: 0.8, textAlign: "center", padding: "1rem 0" }}>
              {t("rightPanel.noRecognitions")}
            </div>
          ) : (
            recognitions.map(rec => (
              <div key={rec.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.75rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Star size={14} color="#f59e0b" />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{rec.receiver.name}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                  {t("metrics.reason")}: <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>{rec.type.replace('_', ' ')}</span>
                  <br />{t("metrics.kudosBy")}: {rec.sender.name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Events Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDelay: "150ms",
        animationDuration: "500ms",
        animationFillMode: "backwards",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Calendar size={20} color="hsl(340 80% 60%)" /> 
          {t("rightPanel.upcomingEvents")}
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {upcomingEvents.length === 0 ? (
            <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", opacity: 0.8, textAlign: "center", padding: "1rem 0" }}>
              {t("rightPanel.noUpcomingEvents")}
            </div>
          ) : (
            upcomingEvents.map((ev, i) => {
              const { month, day } = getEventBadgeDate(ev.date, ev.isHoliday, ev.month, ev.day, locale)
              return (
                <div key={`${ev.id}-${i}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.5rem", borderBottom: i === upcomingEvents.length - 1 ? 'none' : "1px dashed hsl(var(--border))" }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: "8px", 
                    backgroundColor: ev.isHoliday ? "hsl(340 80% 60% / 0.15)" : "hsl(var(--primary)/0.15)",
                    color: ev.isHoliday ? "hsl(340 80% 60%)" : "hsl(var(--primary))",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, lineHeight: 1
                  }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                      {month}
                    </span>
                    <span style={{ fontSize: "1rem" }}>
                      {day}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                      {ev.isHoliday ? getLocalizedHolidayTitle(ev.title, locale) : ev.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                      {ev.isHoliday ? t("rightPanel.holidayBadge") : t("rightPanel.companyEvent")}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Today's Birthdays Widget */}
      {todaysBirthdays.length > 0 && (
        <div className="card glass animate-in fade-in zoom-in-95" style={{ 
          padding: "1.5rem", 
          border: "1px solid hsl(var(--border)/0.5)",
          borderRadius: "20px",
          backgroundColor: "hsla(340, 80%, 60%, 0.05)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
          animationDuration: "500ms",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "hsl(340 80% 60%)" }}>
            <Cake size={20} /> 
            {t("rightPanel.birthdays")}
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {todaysBirthdays.map((emp) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", backgroundColor: "hsl(var(--surface))", borderRadius: "12px", border: "1px solid hsl(340 80% 60% / 0.2)" }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: "50%", 
                  backgroundColor: "hsl(340 80% 60% / 0.2)", color: "hsl(340 80% 60%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem", fontWeight: 800, overflow: "hidden", flexShrink: 0
                }}>
                  {emp.image ? (
                    <img src={emp.image} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    emp.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                    {t("rightPanel.specialDay")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Absences Widget */}
      {upcomingAbsences.length > 0 && (
        <div className="card glass animate-in fade-in zoom-in-95" style={{ 
          padding: "1.5rem", 
          border: "1px solid hsl(var(--border)/0.5)",
          borderRadius: "20px",
          backgroundColor: "hsl(var(--surface))",
          boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
          animationDuration: "500ms",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Plane size={20} color="hsl(var(--primary))" /> 
            {t("rightPanel.upcomingVacations")}
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {upcomingAbsences.map((req) => (
              <div key={req.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: "50%", 
                  backgroundColor: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.85rem", fontWeight: 800, overflow: "hidden", flexShrink: 0
                }}>
                  {req.user.image ? (
                    <img src={req.user.image} alt={req.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    req.user.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {req.user.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }} suppressHydrationWarning>
                    {formatDateSafe(req.startDate, undefined, locale)} - {formatDateSafe(req.endDate, undefined, locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corporate Activity Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Activity size={20} color="#10b981" /> 
          {t("rightPanel.activity7Days")}
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.posts}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>Posts</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.docs}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>{t("home.documents")}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.requests}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>{t("vacations.historyTitle")}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.recs}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>{t("social.kudos")}</div>
          </div>
        </div>
      </div>

      {/* My Summary Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Briefcase size={20} color="hsl(var(--primary))" /> 
          {t("rightPanel.mySummary")}
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.5rem" }}><Calendar size={14} /> {t("rightPanel.vacationDays")}</span>
            <span style={{ fontSize: "1rem", fontWeight: 800 }}>{personalSummary.vacationBalance}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.5rem" }}><Award size={14} /> {t("rightPanel.kudos")}</span>
            <span style={{ fontSize: "1rem", fontWeight: 800 }}>{personalSummary.recognitions}</span>
          </div>
          {personalSummary.nextAbsence && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "hsl(var(--primary)/0.1)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.85rem", color: "hsl(var(--primary))", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}><Plane size={14} /> {t("rightPanel.nextAbsence")}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "hsl(var(--primary))" }} suppressHydrationWarning>{new Date(personalSummary.nextAbsence.startDate).toLocaleDateString(locale === "en" ? "en-US" : "es-ES", { day: "numeric", month: "short" })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        animationDelay: "300ms",
        animationDuration: "500ms",
        animationFillMode: "backwards",
        background: "linear-gradient(145deg, hsl(var(--surface)), hsl(var(--primary)/0.03))",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Zap size={20} color="hsl(45 90% 50%)" /> 
          {t("rightPanel.quickLinks")}
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {quickLinks.map((item, i) => (
            <button key={i} style={{ 
              fontSize: "0.8rem", fontWeight: 600, padding: "0.5rem 0.85rem", 
              borderRadius: "12px", 
              backgroundColor: "hsl(var(--muted)/0.4)",
              color: "hsl(var(--foreground))", cursor: "pointer",
              border: "1px solid transparent",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--primary)/0.1)";
              e.currentTarget.style.color = "hsl(var(--primary))";
              e.currentTarget.style.borderColor = "hsl(var(--primary)/0.2)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px hsl(var(--primary)/0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--muted)/0.4)";
              e.currentTarget.style.color = "hsl(var(--foreground))";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
            }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ textAlign: "center", fontSize: "0.75rem", color: "hsl(var(--muted-foreground)/0.6)", marginTop: "0.5rem", opacity: 0.8 }}>
        {t("rightPanel.copyright")}<br/>
        {t("rightPanel.privacyTerms")}
      </div>
    </div>
  )
}
