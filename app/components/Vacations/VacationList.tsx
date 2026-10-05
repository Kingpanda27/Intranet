"use client"

import { useState, Fragment, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  Clock, CheckCircle2, XCircle, Ban, Calendar, AlertCircle, History, 
  Paperclip, ExternalLink, Pencil, Trash2, X, AlertTriangle, Save, RefreshCw 
} from "lucide-react"
import { cancelTimeOffRequest, editTimeOffRequest } from "@/app/actions/timeOffActions"
import { useTheme } from "@/app/Providers"
import { formatCreatedInfo, formatDateTimeShort } from "@/lib/dateUtils"

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

export function VacationList({ requests }: { requests: TimeOffRequest[] }) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [editingReq, setEditingReq] = useState<TimeOffRequest | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCancel = async (id: string, isApproved: boolean) => {
    const confirmMessage = isApproved 
      ? "Esta solicitud ya fue APROBADA. Al cancelarla, se devolverán los días al balance del empleado. ¿Deseas continuar?"
      : "¿Estás seguro de que deseas cancelar esta solicitud?"
    
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
      case "APPROVED": return "Aprobada"
      case "REJECTED": return "Rechazada"
      case "CANCELLED": return "Cancelada"
      case "COMPLETED": return "Completada"
      default: return "Pendiente"
    }
  }

  const getTypeBadgeStyle = (type: string) => {
    const isDark = theme === "dark"
    switch (type) {
      case "VACATION":
        return { 
          bg: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.1)", 
          color: isDark ? "#60a5fa" : "#2563eb", 
          text: "Vacaciones" 
        }
      case "SICK_LEAVE":
        return { 
          bg: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(220, 38, 38, 0.1)", 
          color: isDark ? "#f87171" : "#dc2626", 
          text: "Licencia Médica" 
        }
      case "EARLY_LEAVE":
        return { 
          bg: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(217, 119, 6, 0.1)", 
          color: isDark ? "#fbbf24" : "#d97706", 
          text: "Salida Temprana" 
        }
      case "HOURS_MAKEUP":
        return { 
          bg: isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(147, 51, 234, 0.1)", 
          color: isDark ? "#c084fc" : "#9333ea", 
          text: "Repo. de Horas" 
        }
      case "SPECIAL":
      case "PERMISSION":
        return { 
          bg: isDark ? "rgba(14, 165, 233, 0.15)" : "rgba(3, 105, 161, 0.1)", 
          color: isDark ? "#38bdf8" : "#0284c7", 
          text: "Permiso Especial" 
        }
      case "MATERNITY_LEAVE":
        return { 
          bg: isDark ? "rgba(236, 72, 153, 0.15)" : "rgba(219, 39, 119, 0.1)", 
          color: isDark ? "#f472b6" : "#db2777", 
          text: "Maternidad" 
        }
      case "PATERNITY_LEAVE":
        return { 
          bg: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(79, 70, 229, 0.1)", 
          color: isDark ? "#818cf8" : "#4f46e5", 
          text: "Paternidad" 
        }
      case "BEREAVEMENT_LEAVE":
        return { 
          bg: isDark ? "rgba(156, 163, 175, 0.12)" : "rgba(55, 65, 81, 0.08)", 
          color: isDark ? "#9ca3af" : "#374151", 
          text: "Luto Familiar" 
        }
      default:
        return { bg: "hsl(var(--muted) / 0.5)", color: "hsl(var(--muted-foreground))", text: type }
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <History size={20} color="hsl(var(--primary))" />
        Historial de Solicitudes
      </h2>

      <div className="card glass animate-in" style={{ borderRadius: "1.25rem", border: "1px solid hsl(var(--border) / 0.8)", overflow: "hidden" }}>
        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <AlertCircle size={36} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.3, marginBottom: "1rem" }} />
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))", fontSize: "0.95rem" }}>No has realizado ninguna solicitud de vacaciones o permisos aún.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <style>
              {`
                .hover-row:hover { background-color: hsl(var(--muted) / 0.15); }
              `}
            </style>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--muted) / 0.3)", color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "14%" }}>Tipo</th>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "23%" }}>Fechas / Programación</th>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "20%" }}>Duración / Horas</th>
                  <th style={{ padding: "1rem 1.25rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "23%" }}>Motivo / Adjunto</th>
                  <th style={{ padding: "1rem 1rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "10%" }}>Estado</th>
                  <th style={{ padding: "1rem 1rem", fontWeight: 700, borderBottom: "1px solid hsl(var(--border) / 0.5)", width: "10%", textAlign: "right" }}>Acciones</th>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div><strong>Ausencia:</strong> {req.absenceDate ? new Date(req.absenceDate).toLocaleDateString("es-ES") : "N/A"}</div>
                        <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                          <strong style={{ color: "hsl(var(--primary))" }}>Repone:</strong> {req.makeupDate ? new Date(req.makeupDate).toLocaleDateString("es-ES") : "N/A"}<br/>
                          de {req.makeupStartTime || "N/A"} a {req.makeupEndTime || "N/A"}
                        </div>
                      </div>
                    )
                  } else if (req.type === "SPECIAL" && req.specialType === "HOURS") {
                    datesRender = (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <div>{new Date(req.startDate).toLocaleDateString("es-ES")}</div>
                        <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                          Rango: de {req.exitTime || "N/A"} a {req.returnTime || "N/A"}
                        </div>
                      </div>
                    )
                  } else {
                    datesRender = (
                      <div>
                        {req.type === "EARLY_LEAVE" ? (
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span>{new Date(req.startDate).toLocaleDateString("es-ES")}</span>
                            <span style={{color: "hsl(var(--muted-foreground))", fontWeight: 500, fontSize: "0.75rem"}}>a las {new Date(req.startDate).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <span>
                            {new Date(req.startDate).toLocaleDateString("es-ES")} <span style={{color: "hsl(var(--muted-foreground))", fontWeight: 500}}>al</span> {new Date(req.endDate).toLocaleDateString("es-ES")}
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
                        <strong>{req.hoursToMakeUp || 0} horas</strong> a reponer
                      </div>
                    )
                  } else if (req.type === "SPECIAL" || req.type === "PERMISSION") {
                    const isHours = req.specialType === "HOURS"
                    const isHalf = req.specialType === "HALF"
                    durationRender = (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <div>Modalidad: <strong>{isHours ? "Por Horas" : isHalf ? "Medio Día" : "Día Completo"}</strong></div>
                        {isHours && (
                          <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))" }}>
                            Solicitadas: {req.hoursRequested || 0} hrs<br/>
                            Aprobadas: {req.hoursApproved !== null ? `${req.hoursApproved} hrs` : "Pendiente"}<br/>
                            Utilizadas: {req.hoursUsed !== null ? `${req.hoursUsed} hrs` : "Pendiente"}
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    durationRender = (
                      <div>
                        <strong>{req.type === "EARLY_LEAVE" ? "1" : (req as any).requestedDays || 0}</strong> {(req as any).requestedDays === 1 || req.type === "EARLY_LEAVE" ? "día" : "días"}
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
                          <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.35rem", fontWeight: 400, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Clock size={11} style={{ opacity: 0.7 }} />
                            <span>{formatCreatedInfo(req.createdAt, req.createdBy?.name)}</span>
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
                                href={req.documentUrl}
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
                            <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                              Aprobada: {formatDateTimeShort(req.approvedAt)} {req.approvedBy?.name ? `por ${req.approvedBy.name}` : ""}
                            </div>
                          )}
                          {req.status === "REJECTED" && (
                            <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                              Rechazada: {formatDateTimeShort(req.rejectedAt)} {req.rejectedBy?.name ? `por ${req.rejectedBy.name}` : ""}
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
            Editar Solicitud
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
            <strong>Re-aprobación requerida:</strong> Al guardar cambios en esta solicitud, su estado volverá a <strong>"Pendiente"</strong> y requerirá nuevamente la revisión y aprobación de tu supervisor.
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
              Tipo de Permiso / Vacaciones
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
            >
              <option value="VACATION">Vacaciones</option>
              <option value="SPECIAL">Permiso Especial / Personal</option>
              <option value="EARLY_LEAVE">Salida Temprana</option>
              <option value="HOURS_MAKEUP">Reposición de Horas</option>
              <option value="SICK_LEAVE">Licencia Médica</option>
              <option value="MATERNITY_LEAVE">Licencia de Maternidad</option>
              <option value="PATERNITY_LEAVE">Licencia de Paternidad</option>
              <option value="BEREAVEMENT_LEAVE">Luto Familiar</option>
            </select>
          </div>

          {/* Rango de Fechas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                Fecha Inicial
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
                Fecha Final
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
              Motivo o Justificación
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="input-field"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              placeholder="Explica detalladamente el motivo de la solicitud..."
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
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-surface"
              style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
