"use client"

import { useState, useEffect, useTransition } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, XCircle, User, Briefcase, Calendar, MessageSquare, Download, Clock, History, Trash2, Paperclip, ExternalLink, AlertCircle, Pencil, X, Save, RefreshCw } from "lucide-react"
import { getAllSupervisedRequests, updateRequestStatus, RequestStatus, deleteTimeOffRequest, editTimeOffRequest } from "@/app/actions/timeOffActions"
import Papa from "papaparse"
import { formatDateLong, formatDateShort, formatTime12h, formatDateTimeShort } from "@/lib/dateUtils"

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING")
  const [isPending, startTransition] = useTransition()
  const [editingReq, setEditingReq] = useState<any | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Modal state
  const [modalData, setModalData] = useState<{
    requestId: string
    employeeName: string
    status: RequestStatus
  } | null>(null)
  const [modalNote, setModalNote] = useState("")
  const [modalAffectsBonus, setModalAffectsBonus] = useState(false)

  // Estados adicionales de edición para el supervisor
  const [modalAbsenceDate, setModalAbsenceDate] = useState("")
  const [modalMakeupDate, setModalMakeupDate] = useState("")
  const [modalMakeupStartTime, setModalMakeupStartTime] = useState("")
  const [modalMakeupEndTime, setModalMakeupEndTime] = useState("")
  const [modalHoursApproved, setModalHoursApproved] = useState("")
  const [modalHoursUsed, setModalHoursUsed] = useState("")
  const [modalExitTime, setModalExitTime] = useState("")
  const [modalReturnTime, setModalReturnTime] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await getAllSupervisedRequests()
      setRequests(data)
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = (id: string, status: RequestStatus) => {
    const request = requests.find(r => r.id === id)
    if (!request) return

    setModalData({
      requestId: id,
      employeeName: request.user?.name || "Empleado",
      status
    })
    setModalNote("")
    setModalAffectsBonus(false)

    // Inicializar campos adicionales para el supervisor
    setModalAbsenceDate(request.absenceDate ? request.absenceDate.split('T')[0] : "")
    setModalMakeupDate(request.makeupDate ? request.makeupDate.split('T')[0] : "")
    setModalMakeupStartTime(request.makeupStartTime || "")
    setModalMakeupEndTime(request.makeupEndTime || "")
    setModalHoursApproved(request.hoursApproved !== null ? String(request.hoursApproved) : String(request.hoursToMakeUp || request.hoursRequested || ""))
    setModalHoursUsed(request.hoursUsed !== null ? String(request.hoursUsed) : "")
    setModalExitTime(request.exitTime || "")
    setModalReturnTime(request.returnTime || "")
  }

  const handleConfirmStatusUpdate = () => {
    if (!modalData) return
    const { requestId, status } = modalData
    const request = requests.find(r => r.id === requestId)
    if (!request) return

    setProcessingId(requestId)
    
    startTransition(async () => {
      try {
        const affectsBonus = status === "APPROVED" ? modalAffectsBonus : false

        const extraParams: any = {}
        if (request.type === "HOURS_MAKEUP") {
          extraParams.absenceDate = modalAbsenceDate || undefined
          extraParams.makeupDate = modalMakeupDate || undefined
          extraParams.makeupStartTime = modalMakeupStartTime || undefined
          extraParams.makeupEndTime = modalMakeupEndTime || undefined
          extraParams.hoursApproved = modalHoursApproved ? parseFloat(modalHoursApproved) : undefined
        } else if (request.type === "SPECIAL" && request.specialType === "HOURS") {
          extraParams.exitTime = modalExitTime || undefined
          extraParams.returnTime = modalReturnTime || undefined
          extraParams.hoursApproved = modalHoursApproved ? parseFloat(modalHoursApproved) : undefined
          extraParams.hoursUsed = modalHoursUsed ? parseFloat(modalHoursUsed) : undefined
        }

        const result = await updateRequestStatus(requestId, status, modalNote, affectsBonus, extraParams)
        if (result && result.success) {
          setRequests(prev => prev.map(r => r.id === requestId ? { 
            ...r, 
            status, 
            supervisorNote: modalNote, 
            affectsBonus,
            ...extraParams
          } : r))
          setModalData(null)
        } else {
          alert("Error al actualizar la solicitud: " + (result?.error || "Desconocido"))
        }
      } catch (e: any) {
        alert("Error: " + e.message)
      } finally {
        setProcessingId(null)
      }
    })
  }

  const handleDeleteRequest = (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este registro histórico? Esta acción no se puede deshacer.")) return
    setProcessingId(id)
    
    startTransition(async () => {
      try {
        const result = await deleteTimeOffRequest(id)
        if (result && result.success) {
          setRequests(prev => prev.filter(r => r.id !== id))
        } else {
          alert("Error al eliminar la solicitud: " + (result?.error || "Desconocido"))
        }
      } catch (e: any) {
        alert("Error de red o servidor: " + e.message)
      } finally {
        setProcessingId(null)
      }
    })
  }

  const handleExport = () => {
    try {
      const dataToExport = requests.map(r => ({
        Empleado: r.user?.name || "Desconocido",
        Email: r.user?.email || "Sin Email",
        Grupo: r.user?.project?.name || "Sin Grupo",
        Tipo: r.type === "VACATION" ? "Vacaciones" : 
              r.type === "PERMISSION" ? `Permiso Especial (${r.specialType === "HOURS" ? "Horas" : r.specialType === "HALF" ? "Medio Día" : "Día Completo"})` : 
              r.type === "SPECIAL" ? `Permiso Especial (${r.specialType === "HOURS" ? "Horas" : r.specialType === "HALF" ? "Medio Día" : "Día Completo"})` : 
              r.type === "HOURS_MAKEUP" ? "Reposición de Horas" : 
              r.type === "EARLY_LEAVE" ? "Salida Temprana" :
              r.type === "SICK_LEAVE" ? "Enfermedad" :
              r.type === "MEDICAL_LEAVE" ? "Licencia Médica" :
              r.type === "MATERNITY_LEAVE" ? "Maternidad" :
              r.type === "PATERNITY_LEAVE" ? "Paternidad" :
              r.type === "BEREAVEMENT_LEAVE" ? "Luto Familiar" : r.type,
        Inicio: r.type === "HOURS_MAKEUP" ? (r.absenceDate ? formatDateShort(r.absenceDate) : "") : formatDateShort(r.startDate) + (r.type === "EARLY_LEAVE" ? " " + formatTime12h(r.startDate) : ""),
        Fin: r.type === "HOURS_MAKEUP" ? (r.makeupDate ? formatDateShort(r.makeupDate) : "") : formatDateShort(r.endDate),
        Creado_Por: r.createdBy?.name || r.user?.name || "No disponible",
        Fecha_Creacion: formatDateShort(r.createdAt),
        Hora_Creacion: formatTime12h(r.createdAt),
        Horas_Solicitadas: r.type === "HOURS_MAKEUP" ? (r.hoursToMakeUp || 0) : (r.hoursRequested || 0),
        Horas_Aprobadas: r.hoursApproved !== null && r.hoursApproved !== undefined ? r.hoursApproved : "",
        Horas_Utilizadas: r.hoursUsed !== null && r.hoursUsed !== undefined ? r.hoursUsed : "",
        Estado: r.status === "PENDING" ? "Pendiente" : r.status === "APPROVED" ? "Aprobada" : r.status === "REJECTED" ? "Rechazada" : r.status,
        Fecha_Aprobacion_Rechazo: r.status === "APPROVED" ? formatDateTimeShort(r.approvedAt) : r.status === "REJECTED" ? formatDateTimeShort(r.rejectedAt) : "—",
        Procesado_Por: r.status === "APPROVED" ? (r.approvedBy?.name || "—") : r.status === "REJECTED" ? (r.rejectedBy?.name || "—") : "—",
        Impacto_Bono: r.status === "APPROVED" ? (r.affectsBonus ? "Afecta Bono" : "No Afecta Bono") : "—",
        Motivo: r.reason || "",
        Nota_Supervisor: r.supervisorNote || ""
      }))
      
      const csv = "\uFEFF" + Papa.unparse(dataToExport) // BOM for UTF-8 Excel support
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Reporte_Ausencias_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      console.error("Error exporting CSV:", e)
      alert("Error al generar el archivo CSV: " + e.message)
    }
  }

  const pendingRequests = requests.filter(r => r.status === "PENDING")
  const historyRequests = requests.filter(r => r.status !== "PENDING")
  const displayedRequests = activeTab === "PENDING" ? pendingRequests : historyRequests

  // Métricas
  const approvedRequests = requests.filter(r => r.status === "APPROVED")
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const approvedThisMonth = approvedRequests.filter(r => {
    const d = new Date(r.startDate)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const affectsBonusCount = approvedThisMonth.filter(r => r.affectsBonus === true).length
  const noImpactCount = approvedThisMonth.filter(r => r.affectsBonus !== true).length

  if (loading) return <div style={{ padding: "2rem" }}>Cargando solicitudes...</div>

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Panel de Aprobaciones</h1>
        
        <button type="button" onClick={handleExport} className="btn btn-surface" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
          <Download size={16} />
          Exportar Reporte (CSV)
        </button>
      </div>

      {/* Métricas rápidas de bonos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="card glass hover-scale" style={{ padding: "1.25rem", borderRadius: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.2s" }}>
          <div style={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.1 }}>{affectsBonusCount}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>
              Permisos que afectan bono <span style={{ fontSize: "0.7rem", fontWeight: 500, textTransform: "none", color: "hsl(var(--primary))" }}>este mes</span>
            </div>
          </div>
        </div>

        <div className="card glass hover-scale" style={{ padding: "1.25rem", borderRadius: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.2s" }}>
          <div style={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.1 }}>{noImpactCount}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>
              Permisos sin impacto <span style={{ fontSize: "0.7rem", fontWeight: 500, textTransform: "none", color: "hsl(var(--primary))" }}>este mes</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid hsl(var(--border))", paddingBottom: "1px" }}>
        <button 
          type="button"
          onClick={() => setActiveTab("PENDING")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "PENDING" ? "2px solid hsl(var(--primary))" : "2px solid transparent",
            color: activeTab === "PENDING" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            fontWeight: activeTab === "PENDING" ? 600 : 400,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
        >
          <Clock size={16} />
          Pendientes ({pendingRequests.length})
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "HISTORY" ? "2px solid hsl(var(--primary))" : "2px solid transparent",
            color: activeTab === "HISTORY" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            fontWeight: activeTab === "HISTORY" ? 600 : 400,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
        >
          <History size={16} />
          Historial ({historyRequests.length})
        </button>
      </div>
      
      {displayedRequests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", background: "hsl(var(--surface) / 0.5)" }}>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>No hay solicitudes en esta sección.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {displayedRequests.map((request) => (
            <div key={request.id} className="card animate-in" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1.5rem", alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    backgroundColor: "hsl(var(--primary) / 0.1)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "hsl(var(--primary))",
                    fontWeight: 700
                  }}>
                    {request.user.name?.[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>{request.user.name}</h3>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
                      {request.user.email} • {request.user.project?.name || "Sin Proyecto"}
                    </p>
                  </div>
                </div>

                {/* Bloque Discreto de Información de la Solicitud */}
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "1.25rem", 
                  fontSize: "0.78rem", 
                  color: "hsl(var(--muted-foreground))", 
                  marginBottom: "1rem", 
                  padding: "0.5rem 0.85rem", 
                  backgroundColor: "hsl(var(--muted) / 0.25)", 
                  borderRadius: "0.5rem", 
                  border: "1px solid hsl(var(--border) / 0.4)" 
                }}>
                  <div><strong style={{ color: "hsl(var(--foreground))" }}>Creada por:</strong> {request.createdBy?.name || request.user?.name || "No disponible"}</div>
                  <div><strong style={{ color: "hsl(var(--foreground))" }}>Fecha de creación:</strong> {formatDateLong(request.createdAt)}</div>
                  <div><strong style={{ color: "hsl(var(--foreground))" }}>Hora de creación:</strong> {formatTime12h(request.createdAt)}</div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Briefcase size={16} color="hsl(var(--muted-foreground))" />
                    <span style={{ fontWeight: 600 }}>
                      {request.type === "VACATION" ? "Vacaciones" : 
                       request.type === "PERMISSION" ? `Permiso Especial (${request.specialType === "HOURS" ? "Horas" : request.specialType === "HALF" ? "Medio Día" : "Día Completo"})` : 
                       request.type === "SPECIAL" ? `Permiso Especial (${request.specialType === "HOURS" ? "Horas" : request.specialType === "HALF" ? "Medio Día" : "Día Completo"})` : 
                       request.type === "HOURS_MAKEUP" ? "Reposición de Horas" : 
                       request.type === "EARLY_LEAVE" ? "Salida Temprana" :
                       request.type === "SICK_LEAVE" ? "Enfermedad" :
                       request.type === "MEDICAL_LEAVE" ? "Licencia Médica" :
                       request.type === "MATERNITY_LEAVE" ? "Maternidad" :
                       request.type === "PATERNITY_LEAVE" ? "Paternidad" :
                       request.type === "BEREAVEMENT_LEAVE" ? "Luto Familiar" : request.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Calendar size={16} color="hsl(var(--muted-foreground))" />
                    <span>
                      {request.type === "HOURS_MAKEUP" ? (
                        <>
                          Ausencia: {request.absenceDate ? new Date(request.absenceDate).toLocaleDateString("es-ES") : "N/A"} | Propuesta Reposición: {request.makeupDate ? new Date(request.makeupDate).toLocaleDateString("es-ES") : "N/A"} de {request.makeupStartTime || "N/A"} a {request.makeupEndTime || "N/A"}
                        </>
                      ) : request.type === "SPECIAL" && request.specialType === "HOURS" ? (
                        <>
                          Fecha: {new Date(request.startDate).toLocaleDateString("es-ES")} | Horario: de {request.exitTime || "N/A"} a {request.returnTime || "N/A"}
                        </>
                      ) : request.type === "EARLY_LEAVE" ? (
                        <>
                          {new Date(request.startDate).toLocaleDateString()} a las {new Date(request.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : (
                        <>
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Horas solicitadas, aprobadas y reales */}
                  {(request.type === "HOURS_MAKEUP" || (request.type === "SPECIAL" && request.specialType === "HOURS")) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Clock size={16} color="hsl(var(--primary))" />
                      <span style={{ fontSize: "0.8rem", color: "hsl(var(--primary))", fontWeight: 700 }}>
                        {request.type === "HOURS_MAKEUP" ? (
                          <>A reponer: {request.hoursToMakeUp || 0} hrs | Aprobadas: {request.hoursApproved !== null ? `${request.hoursApproved} hrs` : "Pendiente"}</>
                        ) : (
                          <>Solicitadas: {request.hoursRequested || 0} hrs | Aprobadas: {request.hoursApproved !== null ? `${request.hoursApproved} hrs` : "Pendiente"} | Reales: {request.hoursUsed !== null ? `${request.hoursUsed} hrs` : "Pendiente"}</>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {request.reason && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "hsl(var(--muted) / 0.5)", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", color: "hsl(var(--muted-foreground))" }}>
                      <MessageSquare size={14} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Motivo</span>
                    </div>
                    {request.reason}
                  </div>
                )}

                {request.documentUrl && (
                  <div style={{ marginTop: "1.25rem" }}>
                    <a
                      href={request.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.75rem",
                        color: "hsl(var(--primary))",
                        textDecoration: "none",
                        fontWeight: 700,
                        padding: "0.35rem 0.75rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "hsl(var(--primary) / 0.06)",
                        border: "1px solid hsl(var(--primary) / 0.12)",
                        transition: "all 0.2s"
                      }}
                      title={request.documentName || "Ver adjunto"}
                    >
                      <Paperclip size={13} />
                      <span>Ver Documento Adjunto</span>
                      <ExternalLink size={11} style={{ opacity: 0.7 }} />
                    </a>
                  </div>
                )}
                
                {request.supervisorNote && activeTab === "HISTORY" && (
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderLeft: "3px solid hsl(var(--primary))", backgroundColor: "hsl(var(--primary) / 0.05)", borderRadius: "0 0.5rem 0.5rem 0", fontSize: "0.875rem" }}>
                    <span style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem", color: "hsl(var(--primary))" }}>Nota del Supervisor:</span>
                    {request.supervisorNote}
                  </div>
                )}
              </div>

              {activeTab === "PENDING" ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={() => handleStatusUpdate(request.id, "APPROVED")}
                    disabled={processingId === request.id}
                    className="btn btn-primary" 
                    style={{ backgroundColor: "#10b981", borderColor: "#10b981", height: "fit-content" }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Aprobar</span>
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(request.id, "REJECTED")}
                    disabled={processingId === request.id}
                    className="btn btn-surface" 
                    style={{ color: "#ef4444", height: "fit-content" }}
                  >
                    <XCircle size={16} />
                    <span>Denegar</span>
                  </button>
                  <button 
                    onClick={() => setEditingReq(request)}
                    disabled={processingId === request.id}
                    className="btn btn-surface" 
                    style={{ color: "hsl(var(--primary))", height: "fit-content" }}
                    title="Editar solicitud"
                  >
                    <Pencil size={16} />
                    <span>Editar</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end", justifyContent: "space-between", height: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    <span style={{ 
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      padding: "0.35rem 0.85rem", borderRadius: "9999px", fontSize: "0.80rem", fontWeight: 700,
                      backgroundColor: request.status === "APPROVED" ? "#10b98120" : "#ef444420", 
                      color: request.status === "APPROVED" ? "#10b981" : "#ef4444"
                    }}>
                      {request.status === "APPROVED" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {request.status === "APPROVED" ? "Aprobada" : "Rechazada"}
                    </span>
                    {request.status === "APPROVED" && (
                      <span style={{ 
                        display: "inline-flex", alignItems: "center", gap: "0.35rem",
                        padding: "0.35rem 0.85rem", borderRadius: "9999px", fontSize: "0.80rem", fontWeight: 700,
                        backgroundColor: request.affectsBonus ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)", 
                        color: request.affectsBonus ? "#ef4444" : "#10b981",
                        border: request.affectsBonus ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)"
                      }}>
                        {request.affectsBonus ? "Afecta Bono" : "No Afecta Bono"}
                      </span>
                    )}
                    <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", textAlign: "right", marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <div>Creada el {formatDateTimeShort(request.createdAt)}</div>
                      {request.status === "APPROVED" && (
                        <div>
                          Aprobada: <strong>{formatDateTimeShort(request.approvedAt)}</strong>{request.approvedBy?.name ? ` por ${request.approvedBy.name}` : ""}
                        </div>
                      )}
                      {request.status === "REJECTED" && (
                        <div>
                          Rechazada: <strong>{formatDateTimeShort(request.rejectedAt)}</strong>{request.rejectedBy?.name ? ` por ${request.rejectedBy.name}` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "auto" }}>
                    <button 
                      type="button"
                      onClick={() => setEditingReq(request)}
                      disabled={processingId === request.id}
                      className="btn btn-ghost" 
                      title="Editar solicitud"
                      style={{ padding: "0.4rem", color: "hsl(var(--primary))" }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteRequest(request.id)}
                      disabled={processingId === request.id}
                      className="btn btn-ghost" 
                      title="Limpiar registro del historial"
                      style={{ padding: "0.4rem", color: "hsl(0 70% 55%)" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de decisión (Aprobar / Rechazar) */}
      {modalData && (
        <div 
          className="animate-in fade-in" 
          style={{ 
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" 
          }}
          onClick={(e) => { if(e.target === e.currentTarget) setModalData(null) }}
        >
          <div 
            className="animate-in zoom-in-95 card glass" 
            style={{ 
              backgroundColor: "hsl(var(--background))", width: "100%", maxWidth: "480px", 
              borderRadius: "24px", display: "flex", flexDirection: "column",
              boxShadow: "0 24px 48px rgba(0,0,0,0.2)", overflow: "hidden", border: "1px solid hsl(var(--border))"
            }}
          >
            {/* Header */}
            <div style={{ padding: "1.5rem", borderBottom: "1px solid hsl(var(--border)/0.5)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "hsl(var(--surface))" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {modalData.status === "APPROVED" ? (
                  <>
                    <CheckCircle2 size={20} color="#10b981" />
                    Aprobar Solicitud
                  </>
                ) : (
                  <>
                    <XCircle size={20} color="#ef4444" />
                    Denegar Solicitud
                  </>
                )}
              </h2>
              <button onClick={() => setModalData(null)} className="btn btn-ghost" style={{ padding: "0.25rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))", minWidth: "auto" }}>
                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>&times;</span>
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "hsl(var(--foreground))" }}>
                ¿Estás seguro de que deseas {modalData.status === "APPROVED" ? "aprobar" : "denegar"} la solicitud de <strong>{modalData.employeeName}</strong>?
              </p>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))" }}>
                  Nota o Comentario (Opcional)
                </label>
                <textarea 
                  value={modalNote} 
                  onChange={(e) => setModalNote(e.target.value)} 
                  placeholder={modalData.status === "APPROVED" ? "Agrega alguna instrucción o felicitación..." : "Explica el motivo del rechazo..."} 
                  className="input" 
                  style={{ width: "100%", height: "80px", borderRadius: "12px", resize: "none", padding: "0.75rem", fontSize: "0.9rem", border: "1px solid hsl(var(--border))" }}
                />
              </div>

              {/* Campos interactivos de Horas y Reposiciones para el Supervisor */}
              {modalData.status === "APPROVED" && (() => {
                const request = requests.find(r => r.id === modalData.requestId)
                if (!request) return null

                if (request.type === "HOURS_MAKEUP") {
                  return (
                    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid hsl(var(--border)/0.5)", padding: "1rem", borderRadius: "14px", backgroundColor: "hsl(var(--surface))" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--primary))", textTransform: "uppercase" }}>Ajuste de Reposición de Horas</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Fecha Ausencia</label>
                          <input type="date" className="input" value={modalAbsenceDate} onChange={(e) => setModalAbsenceDate(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Fecha Reposición</label>
                          <input type="date" className="input" value={modalMakeupDate} onChange={(e) => setModalMakeupDate(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Hora Inicio</label>
                          <input type="time" className="input" value={modalMakeupStartTime} onChange={(e) => setModalMakeupStartTime(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Hora Fin</label>
                          <input type="time" className="input" value={modalMakeupEndTime} onChange={(e) => setModalMakeupEndTime(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Horas Aprobadas</label>
                          <input type="number" step="0.5" className="input" value={modalHoursApproved} onChange={(e) => setModalHoursApproved(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                      </div>
                    </div>
                  )
                }

                if (request.type === "SPECIAL" && request.specialType === "HOURS") {
                  return (
                    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid hsl(var(--border)/0.5)", padding: "1rem", borderRadius: "14px", backgroundColor: "hsl(var(--surface))" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--primary))", textTransform: "uppercase" }}>Ajuste de Horas del Permiso</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Hora Inicio</label>
                          <input type="time" className="input" value={modalExitTime} onChange={(e) => setModalExitTime(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Hora Final</label>
                          <input type="time" className="input" value={modalReturnTime} onChange={(e) => setModalReturnTime(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Horas Aprobadas</label>
                          <input type="number" step="0.5" className="input" value={modalHoursApproved} onChange={(e) => setModalHoursApproved(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Horas Utilizadas</label>
                          <input type="number" step="0.5" className="input" value={modalHoursUsed} onChange={(e) => setModalHoursUsed(e.target.value)} style={{ padding: "0.4rem", fontSize: "0.8rem", borderRadius: "6px" }} />
                        </div>
                      </div>
                    </div>
                  )
                }

                return null
              })()}

              {/* Bonus affects option only if approving */}
              {modalData.status === "APPROVED" && (
                <div style={{ borderTop: "1px solid hsl(var(--border)/0.5)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.25rem", color: "hsl(var(--foreground))" }}>
                    Impacto en bono
                  </label>
                  <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", lineHeight: "1.3" }}>
                    Esta opción indica si el permiso debe ser tomado en cuenta para el cálculo del bono del empleado.
                  </p>
                  
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}>
                      <input 
                        type="radio" 
                        name="affectsBonus" 
                        checked={!modalAffectsBonus} 
                        onChange={() => setModalAffectsBonus(false)} 
                        style={{ cursor: "pointer", accentColor: "hsl(var(--primary))", width: "16px", height: "16px" }}
                      />
                      No afecta bono
                    </label>
                    
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}>
                      <input 
                        type="radio" 
                        name="affectsBonus" 
                        checked={modalAffectsBonus} 
                        onChange={() => setModalAffectsBonus(true)} 
                        style={{ cursor: "pointer", accentColor: "hsl(var(--primary))", width: "16px", height: "16px" }}
                      />
                      Sí afecta bono
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid hsl(var(--border)/0.5)", display: "flex", justifyContent: "flex-end", gap: "0.75rem", backgroundColor: "hsl(var(--surface))" }}>
              <button 
                type="button" 
                onClick={() => setModalData(null)} 
                disabled={processingId !== null} 
                className="btn btn-surface" 
                style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", borderRadius: "10px" }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmStatusUpdate} 
                disabled={processingId !== null} 
                className="btn" 
                style={{ 
                  backgroundColor: modalData.status === "APPROVED" ? "#10b981" : "#ef4444", 
                  color: "#fff", 
                  fontSize: "0.85rem", 
                  padding: "0.5rem 1rem", 
                  borderRadius: "10px", 
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                {processingId !== null ? "Procesando..." : (modalData.status === "APPROVED" ? "Confirmar Aprobación" : "Confirmar Rechazo")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Solicitud para Supervisores / Managers */}
      {editingReq && mounted && createPortal(
        <EditAdminRequestModal
          request={editingReq}
          onClose={() => setEditingReq(null)}
          onSuccess={() => {
            setEditingReq(null)
            fetchRequests()
          }}
        />,
        document.body
      )}
    </div>
  )
}

function EditAdminRequestModal({ 
  request, 
  onClose, 
  onSuccess 
}: { 
  request: any
  onClose: () => void
  onSuccess: () => void 
}) {
  const formatDateForInput = (d: any) => {
    try {
      const dt = new Date(d)
      return dt.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  const [startDate, setStartDate] = useState(formatDateForInput(request.startDate))
  const [endDate, setEndDate] = useState(formatDateForInput(request.endDate))
  const [type, setType] = useState(request.type)
  const [reason, setReason] = useState(request.reason || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await editTimeOffRequest({
      requestId: request.id,
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
            Editar Solicitud ({request.user?.name || "Empleado"})
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "0.4rem", borderRadius: "50%" }}
          >
            <X size={20} />
          </button>
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
