"use client"

import { useState, Fragment, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  Clock, CheckCircle2, XCircle, Ban, Calendar, AlertCircle, History, 
  Paperclip, ExternalLink, Pencil, Trash2, X, AlertTriangle, Save, RefreshCw 
} from "lucide-react"
import { cancelTimeOffRequest, editTimeOffRequest } from "@/app/actions/timeOffActions"
import { useTheme } from "@/app/Providers"
import { formatCreatedInfo, formatDateTimeShort, formatTimeStr12h, formatTime12h } from "@/lib/dateUtils"
import { useTranslation } from "@/lib/i18n/LanguageContext"

type TimeOffRequest = {
  id: string
  type: string
  startDate: Date | string
  endDate: Date | string
  reason: string
  status: string
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  createdById?: string | null
  createdBy?: { name?: string | null; email?: string | null } | null
  approvedAt?: Date | string | null
  approvedById?: string | null
  approvedBy?: { name?: string | null; email?: string | null } | null
  rejectedAt?: Date | string | null
  rejectedById?: string | null
  rejectedBy?: { name?: string | null; email?: string | null } | null
  documentUrl?: string | null
  documentName?: string | null
  affectsBonus?: boolean
  supervisorNote?: string | null
  absenceDate?: string | null
  hoursToMakeUp?: number | null
  makeupDate?: string | null
  makeupStartTime?: string | null
  makeupEndTime?: string | null
  specialType?: string | null
  exitTime?: string | null
  returnTime?: string | null
  hoursRequested?: number | null
  hoursApproved?: number | null
  hoursUsed?: number | null
}

function formatDisplayDate(dateVal: any, locale: string = "es") {
  if (!dateVal) return "N/A"
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return "N/A"
  const isUtcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
  return d.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", { timeZone: isUtcMidnight ? "UTC" : undefined })
}

export function VacationList({ requests }: { requests: TimeOffRequest[] }) {
  const { t, locale } = useTranslation()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [editingReq, setEditingReq] = useState<TimeOffRequest | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCancel = async (id: string, isApproved: boolean) => {
    const confirmMessage = isApproved 
      ? (locale === "en" ? "This request was already APPROVED. Cancelling it will return the days to the employee's balance. Do you wish to continue?" : "Esta solicitud ya fue APROBADA. Al cancelarla, se devolverán los días al balance del empleado. ¿Deseas continuar?")
      : (locale === "en" ? "Are you sure you want to cancel this request?" : "¿Estás seguro de que deseas cancelar esta solicitud?")
    
    if (!confirm(confirmMessage)) return

    setCancellingId(id)
    const res = await cancelTimeOffRequest(id)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error || "Ocurrió un error al cancelar")
    }
    setCancellingId(null)
  }

  const getStatusStyle = (status: string) => {
    const isDark = theme === "dark"
    switch (status) {
      case "APPROVED": 
        return { 
          color: isDark ? "#34d399" : "#059669", 
          bg: isDark ? "rgba(52, 211, 153, 0.12)" : "rgba(5, 150, 105, 0.08)", 
          border: isDark ? "1px solid rgba(52, 211, 153, 0.2)" : "1px solid rgba(5, 150, 105, 0.15)", 
          icon: <CheckCircle2 size={13} /> 
        }
      case "REJECTED": 
        return { 
          color: isDark ? "#f87171" : "#dc2626", 
          bg: isDark ? "rgba(248, 113, 113, 0.12)" : "rgba(220, 38, 38, 0.08)", 
          border: isDark ? "1px solid rgba(248, 113, 113, 0.2)" : "1px solid rgba(220, 38, 38, 0.15)", 
          icon: <XCircle size={13} /> 
        }
      case "CANCELLED": 
        return { 
          color: isDark ? "#9ca3af" : "#4b5563", 
          bg: isDark ? "rgba(156, 163, 175, 0.12)" : "rgba(75, 85, 99, 0.08)", 
          border: isDark ? "1px solid rgba(156, 163, 175, 0.2)" : "1px solid rgba(75, 85, 99, 0.15)", 
          icon: <Ban size={13} /> 
        }
      case "COMPLETED":
        return { 
          color: isDark ? "#22d3ee" : "#0891b2", 
          bg: isDark ? "rgba(34, 211, 238, 0.12)" : "rgba(8, 145, 178, 0.08)", 
          border: isDark ? "1px solid rgba(34, 211, 238, 0.2)" : "1px solid rgba(8, 145, 178, 0.15)", 
          icon: <CheckCircle2 size={13} /> 
        }
      case "PENDING":
      default: 
        return { 
          color: isDark ? "#fb923c" : "#ea580c", 
          bg: isDark ? "rgba(251, 146, 60, 0.12)" : "rgba(234, 88, 12, 0.08)", 
          border: isDark ? "1px solid rgba(251, 146, 60, 0.2)" : "1px solid rgba(234, 88, 12, 0.15)", 
          icon: <Clock size={13} /> 
        }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED": return t("common.approved")
      case "REJECTED": return t("common.rejected")
      case "CANCELLED": return t("common.cancelled")
      case "COMPLETED": return t("common.approved")
      default: return t("common.pending")
    }
  }

  const getTypeBadgeStyle = (type: string) => {
    const isDark = theme === "dark"
    const getBadgeLabel = (typeKey: string, fallback: string) => {
      return t(`vacations.types.${typeKey}.label` as any) || fallback
    }
    switch (type) {
      case "VACATION":
        return { 
          bg: isDark ? "rgba(59, 130, 246, 0.18)" : "rgba(37, 99, 235, 0.1)", 
          color: isDark ? "#60a5fa" : "#2563eb", 
          text: getBadgeLabel("VACATION", "Vacaciones")
        }
      case "PERMISSION":
      case "SPECIAL":
        return { 
          bg: isDark ? "rgba(99, 102, 241, 0.18)" : "rgba(79, 70, 229, 0.1)", 
          color: isDark ? "#818cf8" : "#6366f1", 
          text: getBadgeLabel("SPECIAL", "Permiso Especial")
        }
      case "EARLY_LEAVE":
        return { 
          bg: isDark ? "rgba(245, 158, 11, 0.18)" : "rgba(217, 119, 6, 0.1)", 
          color: isDark ? "#fbbf24" : "#d97706", 
          text: getBadgeLabel("EARLY_LEAVE", "Salida Temprana")
        }
      case "LATE_ARRIVAL":
        return { 
          bg: isDark ? "rgba(249, 115, 22, 0.18)" : "rgba(234, 88, 12, 0.1)", 
          color: isDark ? "#fb923c" : "#ea580c", 
          text: getBadgeLabel("LATE_ARRIVAL", "Llegada Tarde")
        }
      case "HOURS_MAKEUP":
        return { 
          bg: isDark ? "rgba(20, 184, 166, 0.18)" : "rgba(13, 148, 136, 0.1)", 
          color: isDark ? "#2dd4bf" : "#14b8a6", 
          text: getBadgeLabel("HOURS_MAKEUP", "Repo. de Horas")
        }
      case "SICK_LEAVE":
        return { 
          bg: isDark ? "rgba(16, 185, 129, 0.18)" : "rgba(5, 150, 105, 0.1)", 
          color: isDark ? "#34d399" : "#10b981", 
          text: getBadgeLabel("MEDICAL_LEAVE", "Enfermedad")
        }
      case "MEDICAL_LEAVE":
        return { 
          bg: isDark ? "rgba(244, 63, 94, 0.18)" : "rgba(225, 29, 72, 0.1)", 
          color: isDark ? "#fb7185" : "#f43f5e", 
          text: getBadgeLabel("MEDICAL_LEAVE", "Licencia Médica")
        }
      case "MATERNITY_LEAVE":
      case "PATERNITY_LEAVE":
      case "MATERNITY_PATERNITY":
        return { 
          bg: isDark ? "rgba(236, 72, 153, 0.18)" : "rgba(219, 39, 119, 0.1)", 
          color: isDark ? "#f472b6" : "#ec4899", 
          text: getBadgeLabel("MATERNITY_LEAVE", "Maternidad / Paternidad")
        }
      case "BEREAVEMENT_LEAVE":
        return { 
          bg: isDark ? "rgba(139, 92, 246, 0.18)" : "rgba(124, 58, 237, 0.1)", 
          color: isDark ? "#a78bfa" : "#8b5cf6", 
          text: getBadgeLabel("BEREAVEMENT_LEAVE", "Fallecimiento / Duelo")
        }
      case "MARRIAGE_LEAVE":
        return { 
          bg: isDark ? "rgba(225, 29, 72, 0.18)" : "rgba(225, 29, 72, 0.1)", 
          color: isDark ? "#fb7185" : "#e11d48", 
          text: getBadgeLabel("MARRIAGE_LEAVE", "Licencia por Matrimonio")
        }
      case "REMOTE_INTERNET":
        return {
          bg: isDark ? "rgba(249, 115, 22, 0.18)" : "rgba(234, 88, 12, 0.1)",
          color: isDark ? "#fb923c" : "#f97316",
          text: getBadgeLabel("REMOTE_INTERNET", "Falla de Internet")
        }
      case "REMOTE_POWER":
        return {
          bg: isDark ? "rgba(234, 179, 8, 0.18)" : "rgba(202, 138, 4, 0.1)",
          color: isDark ? "#fde047" : "#eab308",
          text: getBadgeLabel("REMOTE_POWER", "Corte de Luz")
        }
      case "REMOTE_HARDWARE":
        return {
          bg: isDark ? "rgba(239, 68, 68, 0.18)" : "rgba(220, 38, 38, 0.1)",
          color: isDark ? "#f87171" : "#ef4444",
          text: getBadgeLabel("REMOTE_HARDWARE", "Avería Hardware / PC")
        }
      case "REMOTE_VPN":
        return {
          bg: isDark ? "rgba(168, 85, 247, 0.18)" : "rgba(147, 51, 234, 0.1)",
          color: isDark ? "#c084fc" : "#a855f7",
          text: getBadgeLabel("REMOTE_VPN", "Fallo VPN / Accesos")
        }
      default:
        return { bg: "hsl(var(--muted) / 0.5)", color: "hsl(var(--muted-foreground))", text: type }
    }
  }

  return (
    <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <History size={20} color="hsl(var(--primary))" />
        {t("vacations.historyTitle")}
      </h2>

      <div className="card glass animate-in" style={{ borderRadius: "1.25rem", border: "1px solid hsl(var(--border) / 0.8)", overflow: "hidden", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <AlertCircle size={36} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.3, marginBottom: "1rem" }} />
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))", fontSize: "0.95rem" }}>{t("vacations.list.emptyList")}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", width: "100%", minWidth: 0, WebkitOverflowScrolling: "touch" }}>
            <style>
              {`
                .hover-row:hover { background-color: hsl(var(--muted) / 0.15); }
              `}
            </style>
            <table style={{ width: "100%", minWidth: "680px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--muted) / 0.3)", color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "14%" }}>{t("vacations.list.colType")}</th>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "23%" }}>{t("vacations.list.colPeriod")}</th>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "20%" }}>{t("vacations.list.colDuration")}</th>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "23%" }}>{t("vacations.reasonLabel")}</th>
                  <th style={{ padding: "1rem 1rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "10%" }}>{t("vacations.list.colStatus")}</th>
                  <th style={{ padding: "1rem 1rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "10%", textAlign: "right" }}>{t("vacations.list.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => {
                  const style = getStatusStyle(req.status)
                  const typeStyle = getTypeBadgeStyle(req.type)

                  // Detalle de Fechas según el tipo
                  let datesRender = null
                  if (req.type === "HOURS_MAKEUP") {
                    datesRender = (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }} suppressHydrationWarning>
                        <div suppressHydrationWarning><strong>{t("dashboard.absence")}</strong> {formatDisplayDate(req.absenceDate, locale)}</div>
                        <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }} suppressHydrationWarning>
                          <strong style={{ color: "hsl(var(--primary))" }}>{t("dashboard.proposedMakeup")}</strong> {formatDisplayDate(req.makeupDate, locale)}<br/>
                          {req.makeupStartTime || "N/A"} - {req.makeupEndTime || "N/A"}
                        </div>
                      </div>
                    )
                  } else if ((req.type === "SPECIAL" || req.type === "PERMISSION") && (req.specialType === "HOURS" || req.exitTime || req.returnTime)) {
                    datesRender = (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }} suppressHydrationWarning>
                        <div suppressHydrationWarning>{formatDisplayDate(req.startDate, locale)}</div>
                        <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                          {t("common.schedule")}: {formatTimeStr12h(req.exitTime) || req.exitTime || "N/A"} - {formatTimeStr12h(req.returnTime) || req.returnTime || "N/A"}
                        </div>
                      </div>
                    )
                  } else {
                    datesRender = (
                      <div suppressHydrationWarning>
                        {req.type === "EARLY_LEAVE" ? (
                          <div style={{ display: "flex", flexDirection: "column" }} suppressHydrationWarning>
                            <span suppressHydrationWarning>{formatDisplayDate(req.startDate, locale)}</span>
                            <span style={{color: "hsl(var(--muted-foreground))", fontWeight: 500, fontSize: "0.75rem"}} suppressHydrationWarning>{t("feed.at")} {formatTimeStr12h(req.exitTime) || (req.startDate ? formatTime12h(req.startDate) : "N/A")}</span>
                          </div>
                        ) : req.type === "LATE_ARRIVAL" ? (
                          <div style={{ display: "flex", flexDirection: "column" }} suppressHydrationWarning>
                            <span suppressHydrationWarning>{formatDisplayDate(req.startDate, locale)}</span>
                            <span style={{color: "#f97316", fontWeight: 600, fontSize: "0.75rem"}} suppressHydrationWarning>{t("dashboard.arrivalAt")} {formatTimeStr12h(req.returnTime) || (req.startDate ? formatTime12h(req.startDate) : "N/A")}</span>
                            <span style={{
                              marginTop: "0.15rem",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              color: req.specialType === "PRE_APPROVED" ? "#10b981" : "#ef4444"
                            }}>
                              {req.specialType === "PRE_APPROVED" ? `✓ ${t("vacations.preApprovedBadge")}` : `✕ ${t("vacations.notPreApprovedBadge")}`}
                            </span>
                          </div>
                        ) : (
                          <span suppressHydrationWarning>
                            <span suppressHydrationWarning>{formatDisplayDate(req.startDate, locale)}</span>
                            <span style={{color: "hsl(var(--muted-foreground))", fontWeight: 500}}> {t("dashboard.to")} </span>
                            <span suppressHydrationWarning>{formatDisplayDate(req.endDate, locale)}</span>
                          </span>
                        )}
                      </div>
                    )
                  }

                  // Detalle de Duración en horas / días
                  let durationRender = null
                  if (req.type === "HOURS_MAKEUP") {
                    durationRender = (
                      <div>
                        <strong>{req.hoursToMakeUp || 0} {t("common.hours")}</strong> ({t("vacations.makeupHoursLabel")})
                      </div>
                    )
                  } else if (req.type === "SPECIAL" || req.type === "PERMISSION") {
                    const isHours = req.specialType === "HOURS"
                    const isHalf = req.specialType === "HALF"
                    durationRender = (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <div><strong>{isHours ? t("common.hours") : isHalf ? (t("common.schedule") || "Medio Día") : (locale === "en" ? "Full Day" : "Día Completo")}</strong></div>
                        {isHours && (
                          <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))" }}>
                            {t("vacations.requestedHours")}: {req.hoursRequested || 0} hrs<br/>
                            {t("vacations.approvedHours")}: {req.hoursApproved !== null ? `${req.hoursApproved} hrs` : t("common.pending")}<br/>
                            {t("vacations.realHours")}: {req.hoursUsed !== null ? `${req.hoursUsed} hrs` : t("common.pending")}
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    durationRender = (
                      <div>
                        <strong>{req.type === "EARLY_LEAVE" ? t("vacations.types.EARLY_LEAVE.label") : req.type === "LATE_ARRIVAL" ? t("vacations.types.LATE_ARRIVAL.label") : (req as any).requestedDays || 0}</strong> {req.type === "EARLY_LEAVE" || req.type === "LATE_ARRIVAL" ? "" : ((req as any).requestedDays === 1 ? (locale === "en" ? "day" : "día") : (locale === "en" ? "days" : "días"))}
                      </div>
                    )
                  }

                  return (
                    <Fragment key={req.id}>
                      <tr style={{ borderBottom: req.supervisorNote ? "none" : "1px solid hsl(var(--border) / 0.4)", transition: "background-color 0.2s" }} className={`stagger-item-${(idx % 5) + 1} hover-row`}>
                        {/* Tipo */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          <span style={{ 
                            fontSize: "0.7rem", 
                            padding: "0.3rem 0.75rem",
                            borderRadius: "9999px",
                            backgroundColor: typeStyle.bg,
                            color: typeStyle.color,
                            fontWeight: 700,
                            display: "inline-block",
                            whiteSpace: "nowrap"
                          }}>
                            {typeStyle.text}
                          </span>
                        </td>

                        {/* Fechas / Programación */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle", fontWeight: 600 }}>
                          {datesRender}
                          <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.35rem", fontWeight: 400, display: "flex", alignItems: "center", gap: "0.25rem" }} suppressHydrationWarning>
                            <Clock size={11} style={{ opacity: 0.7 }} />
                            <span suppressHydrationWarning>{formatCreatedInfo(req.createdAt, req.createdBy?.name)}</span>
                          </div>
                        </td>

                        {/* Duración / Horas */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          {durationRender}
                        </td>

                        {/* Motivo / Adjunto */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          <p style={{ margin: "0", fontSize: "0.8rem", color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                            {req.reason || <span style={{ fontStyle: "italic", opacity: 0.6, color: "hsl(var(--muted-foreground))" }}>Sin comentarios</span>}
                          </p>
                          {req.documentUrl && (
                            <div style={{ marginTop: "0.5rem" }}>
                              <a
                                href={`/api/attachments/${req.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontSize: "0.7rem",
                                  color: "hsl(var(--primary))",
                                  textDecoration: "none",
                                  fontWeight: 700,
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.375rem",
                                  backgroundColor: "hsl(var(--primary) / 0.08)",
                                  border: "1px solid hsl(var(--primary) / 0.15)",
                                  transition: "all 0.2s"
                                }}
                                title={req.documentName || "Ver adjunto"}
                              >
                                <Paperclip size={11} />
                                <span style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.documentName || "Ver adjunto"}</span>
                                <ExternalLink size={10} style={{ opacity: 0.7 }} />
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Estado */}
                        <td style={{ padding: "1rem 1rem", verticalAlign: "middle" }}>
                          <div style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "0.35rem", 
                            padding: "0.3rem 0.75rem", 
                            borderRadius: "9999px", 
                            fontSize: "0.75rem", 
                            fontWeight: 700,
                            color: style.color, 
                            backgroundColor: style.bg,
                            border: style.border,
                            whiteSpace: "nowrap"
                          }}>
                            {style.icon}
                            {getStatusText(req.status)}
                          </div>
                          {req.status === "APPROVED" && (
                            <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }} suppressHydrationWarning>
                              {t("dashboard.approvedBy")}: {formatDateTimeShort(req.approvedAt)} {req.approvedBy?.name ? `por ${req.approvedBy.name}` : ""}
                            </div>
                          )}
                          {req.status === "REJECTED" && (
                            <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }} suppressHydrationWarning>
                              {t("dashboard.rejectedBy")}: {formatDateTimeShort(req.rejectedAt)} {req.rejectedBy?.name ? `por ${req.rejectedBy.name}` : ""}
                            </div>
                          )}
                        </td>

                        {/* Acciones (Editar / Cancelar) */}
                        <td style={{ padding: "1rem 1rem", verticalAlign: "middle", textAlign: "right" }}>
                          {req.status !== "CANCELLED" ? (
                            <div style={{ display: "inline-flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                              {/* Botón Editar */}
                              <button
                                onClick={() => setEditingReq(req)}
                                className="btn btn-ghost"
                                style={{ padding: "0.35rem 0.5rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "hsl(var(--primary))" }}
                                title="Editar solicitud"
                              >
                                <Pencil size={14} />
                              </button>

                              {/* Botón Cancelar */}
                              <button
                                onClick={() => handleCancel(req.id, req.status === "APPROVED")}
                                disabled={cancellingId === req.id}
                                className="btn btn-ghost"
                                style={{ padding: "0.35rem 0.5rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#ef4444" }}
                                title="Cancelar solicitud"
                              >
                                {cancellingId === req.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>Sin acciones</span>
                          )}
                        </td>
                      </tr>

                      {/* Comentario del Supervisor y Bono */}
                      {(req.supervisorNote || req.status === "APPROVED") && (
                        <tr className={`stagger-item-${(idx % 5) + 1}`} style={{ borderBottom: "1px solid hsl(var(--border) / 0.4)" }}>
                          <td colSpan={6} style={{ padding: "0rem 1.5rem 1rem 1.5rem", verticalAlign: "middle" }}>
                            <div style={{ 
                              padding: "0.6rem 0.85rem", 
                              borderLeft: "3px solid hsl(var(--primary))", 
                              backgroundColor: "hsl(var(--primary) / 0.04)", 
                              borderRadius: "0 0.5rem 0.5rem 0", 
                              fontSize: "0.78rem",
                              color: "hsl(var(--foreground))",
                              lineHeight: "1.4",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "0.5rem"
                            }}>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <span style={{ fontWeight: 800, color: "hsl(var(--primary))", whiteSpace: "nowrap" }}>Comentario del Supervisor:</span>
                                <span style={{ fontStyle: "italic" }}>{req.supervisorNote || "Sin comentarios adicionales."}</span>
                              </div>

                              {req.status === "APPROVED" && (
                                <span style={{ 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  padding: "0.2rem 0.6rem", 
                                  borderRadius: "9999px", 
                                  fontSize: "0.7rem", 
                                  fontWeight: 700,
                                  color: req.affectsBonus ? "#ef4444" : "#10b981", 
                                  backgroundColor: req.affectsBonus ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                  border: req.affectsBonus ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid rgba(16, 185, 129, 0.15)",
                                  whiteSpace: "nowrap"
                                }}>
                                  {req.affectsBonus ? "⚠️ Afecta Bono" : "✅ No Afecta Bono"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL EDITAR SOLICITUD (PORTAL DIRECTO A BODY) ── */}
      {editingReq && mounted && createPortal(
        <EditRequestModal 
          req={editingReq} 
          onClose={() => setEditingReq(null)} 
          onSuccess={() => {
            setEditingReq(null)
            window.location.reload()
          }} 
        />,
        document.body
      )}
    </div>
  )
}

function EditRequestModal({ 
  req, 
  onClose, 
  onSuccess 
}: { 
  req: TimeOffRequest
  onClose: () => void
  onSuccess: () => void 
}) {
  const { t, locale } = useTranslation()
  const formatDateForInput = (d: Date | string) => {
    try {
      const dt = new Date(d)
      return dt.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  const [startDate, setStartDate] = useState(formatDateForInput(req.startDate))
  const [endDate, setEndDate] = useState(formatDateForInput(req.endDate))
  const [type, setType] = useState(req.type)
  const [reason, setReason] = useState(req.reason || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await editTimeOffRequest({
      requestId: req.id,
      startDate,
      endDate,
      type,
      reason
    })

    if (res.success) {
      onSuccess()
    } else {
      setError(res.error || "Error al actualizar la solicitud")
    }
    setLoading(false)
  }

  return (
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
        maxWidth: "520px",
        maxHeight: "90vh",
        overflowY: "auto",
        backgroundColor: "hsl(var(--surface))",
        borderRadius: "1.5rem",
        border: "1px solid hsl(var(--border))",
        padding: "1.75rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        position: "relative"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Pencil size={18} color="hsl(var(--primary))" />
            {locale === "en" ? "Edit Request" : "Editar Solicitud"}
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "0.4rem", borderRadius: "50%" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Advertencia de Estado */}
        <div style={{ 
          display: "flex", 
          gap: "0.65rem", 
          padding: "0.85rem 1rem", 
          backgroundColor: "rgba(245, 158, 11, 0.1)", 
          border: "1px solid rgba(245, 158, 11, 0.25)", 
          borderRadius: "0.85rem", 
          marginBottom: "1.25rem",
          color: "#d97706",
          fontSize: "0.8rem",
          lineHeight: 1.45
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
          <div>
            {locale === "en" ? (
              <><strong>Re-approval required:</strong> Saving changes to this request will return its status to <strong>&quot;Pending&quot;</strong> and will require review and approval from your supervisor again.</>
            ) : (
              <><strong>Re-aprobación requerida:</strong> Al guardar cambios en esta solicitud, su estado volverá a <strong>&quot;Pendiente&quot;</strong> y requerirá nuevamente la revisión y aprobación de tu supervisor.</>
            )}
          </div>
        </div>

        {error && (
          <div style={{ 
            padding: "0.75rem 1rem", 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid rgba(239, 68, 68, 0.25)", 
            borderRadius: "0.75rem", 
            marginBottom: "1rem",
            color: "#ef4444",
            fontSize: "0.82rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Tipo de Solicitud */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              {locale === "en" ? "Request Type / Time Off" : "Tipo de Permiso / Vacaciones"}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
            >
              <option value="VACATION">{t("vacations.types.VACATION.label")}</option>
              <option value="SPECIAL">{t("vacations.types.SPECIAL.label")}</option>
              <option value="EARLY_LEAVE">{t("vacations.types.EARLY_LEAVE.label")}</option>
              <option value="LATE_ARRIVAL">{t("vacations.types.LATE_ARRIVAL.label")}</option>
              <option value="HOURS_MAKEUP">{t("vacations.types.HOURS_MAKEUP.label")}</option>
              <option value="SICK_LEAVE">{t("vacations.types.SICK_LEAVE.label")}</option>
              <option value="MATERNITY_LEAVE">{t("vacations.types.MATERNITY_LEAVE.label")}</option>
              <option value="PATERNITY_LEAVE">{t("vacations.types.PATERNITY_LEAVE.label")}</option>
              <option value="BEREAVEMENT_LEAVE">{t("vacations.types.BEREAVEMENT_LEAVE.label")}</option>
              <option value="MARRIAGE_LEAVE">{t("vacations.types.MARRIAGE_LEAVE.label")}</option>
            </select>
          </div>

          {/* Rango de Fechas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                {t("vacations.form.startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="input-field"
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                {t("vacations.form.endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="input-field"
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              {locale === "en" ? "Reason or Justification" : "Motivo o Justificación"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="input-field"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              placeholder={locale === "en" ? "Explain in detail the reason for the request..." : "Explica detalladamente el motivo de la solicitud..."}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1, padding: "0.75rem", borderRadius: "0.75rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {locale === "en" ? "Save Changes" : "Guardar Cambios"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-surface"
              style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem" }}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
