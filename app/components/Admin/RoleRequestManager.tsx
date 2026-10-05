"use client"

import { useState, useTransition } from "react"
import { approveRoleChangeRequest, rejectRoleChangeRequest } from "@/app/actions/roleRequestActions"
import { Check, X, Clock, AlertCircle, Shield, User, Filter, MessageSquare, ArrowRight } from "lucide-react"

export function RoleRequestManager({ 
  initialRequests,
  currentUserRole 
}: { 
  initialRequests: any[]
  currentUserRole: string 
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [statusFilter, setStatusFilter] = useState("PENDING")
  const [selectedReq, setSelectedReq] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)

  const isTech = currentUserRole === "TECHNOLOGY" || currentUserRole === "TECHNOLOGY_ADMIN" || currentUserRole === "IT_MANAGER"

  const filteredRequests = requests.filter(r => {
    if (statusFilter === "ALL") return true
    return r.status === statusFilter
  })

  const handleApprove = (id: string) => {
    startTransition(async () => {
      setMessage(null)
      const res = await approveRoleChangeRequest(id)
      if (res.success) {
        setMessage({ type: "success", text: "Solicitud aprobada y rol de usuario actualizado correctamente." })
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "APPROVED", reviewedAt: new Date().toISOString() } : r))
        setConfirmApproveId(null)
      } else {
        setMessage({ type: "error", text: res.error || "Error al aprobar la solicitud." })
      }
    })
  }

  const handleReject = () => {
    if (!selectedReq || !rejectionReason.trim()) {
      setMessage({ type: "error", text: "Debes ingresar un motivo para el rechazo." })
      return
    }

    startTransition(async () => {
      setMessage(null)
      const res = await rejectRoleChangeRequest({
        requestId: selectedReq.id,
        rejectionReason: rejectionReason.trim()
      })
      if (res.success) {
        setMessage({ type: "success", text: "Solicitud rechazada correctamente. El rol original del usuario se mantuvo intacto." })
        setRequests(prev => prev.map(r => r.id === selectedReq.id ? { ...r, status: "REJECTED", rejectionReason: rejectionReason.trim() } : r))
        setSelectedReq(null)
        setRejectionReason("")
      } else {
        setMessage({ type: "error", text: res.error || "Error al rechazar la solicitud." })
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING":
        return <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(234,179,8,0.15)", color: "#eab308", fontSize: "0.75rem", fontWeight: 700 }}>Pendiente</span>
      case "APPROVED":
        return <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: "0.75rem", fontWeight: 700 }}>Aprobada</span>
      case "REJECTED":
        return <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", fontSize: "0.75rem", fontWeight: 700 }}>Rechazada</span>
      default:
        return <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "hsl(var(--muted))", fontSize: "0.75rem" }}>{status}</span>
    }
  }

  return (
    <div>
      {/* Mensaje global */}
      {message && (
        <div style={{
          padding: "0.85rem 1.25rem",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
          fontWeight: 600,
          backgroundColor: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          color: message.type === "success" ? "#10b981" : "#ef4444",
          border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`
        }}>
          {message.text}
        </div>
      )}

      {/* Barra de Filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn btn-surface hover-scale"
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                backgroundColor: statusFilter === st ? "hsl(var(--primary))" : "hsl(var(--surface))",
                color: statusFilter === st ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                cursor: "pointer"
              }}
            >
              {st === "PENDING" ? "Pendientes" : st === "APPROVED" ? "Aprobadas" : st === "REJECTED" ? "Rechazadas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Solicitudes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredRequests.length === 0 ? (
          <div className="card glass" style={{ padding: "3rem 2rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
            No hay solicitudes con el estado seleccionado.
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="card glass animate-in" style={{ padding: "1.5rem", border: "1px solid hsl(var(--border) / 0.6)", borderRadius: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                
                {/* Info del usuario y cambio solicitado */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", fontWeight: 800
                  }}>
                    {req.user?.name?.charAt(0) || "U"}
                  </div>

                  <div>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem" }}>
                      {req.user?.name || "Usuario"}
                      <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", fontWeight: 400, marginLeft: "0.5rem" }}>
                        ({req.user?.email})
                      </span>
                    </h3>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      <span style={{ fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>{req.currentRole}</span>
                      <ArrowRight size={14} style={{ color: "hsl(var(--primary))" }} />
                      <span style={{ fontWeight: 800, color: "hsl(var(--primary))" }}>{req.requestedRole}</span>
                    </div>
                  </div>
                </div>

                {/* Badge de estado */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Motivo de la solicitud */}
              <div style={{ marginTop: "1.25rem", padding: "0.85rem 1rem", borderRadius: "0.6rem", backgroundColor: "hsl(var(--background) / 0.6)", border: "1px solid hsl(var(--border) / 0.4)", fontSize: "0.875rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Motivo de la solicitud
                </div>
                <div style={{ color: "hsl(var(--foreground))" }}>
                  "{req.reason}"
                </div>
              </div>

              {/* Si fue rechazada, mostrar motivo de rechazo */}
              {req.status === "REJECTED" && req.rejectionReason && (
                <div style={{ marginTop: "0.75rem", padding: "0.85rem 1rem", borderRadius: "0.6rem", backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", fontSize: "0.875rem", color: "#ef4444" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                    Motivo del Rechazo
                  </div>
                  <div>"{req.rejectionReason}"</div>
                </div>
              )}

              {/* Metadata de quién solicitó y fecha */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid hsl(var(--border) / 0.4)", fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  Solicitado por: <b>{req.requestedBy?.name || req.requestedBy?.email || "Supervisor"}</b> ({req.requestedBy?.role})
                  <span style={{ margin: "0 0.5rem" }}>•</span>
                  {new Date(req.createdAt).toLocaleString()}
                </div>

                {/* Acciones para Technology en solicitudes PENDING */}
                {isTech && req.status === "PENDING" && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {confirmApproveId === req.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#eab308", fontWeight: 600 }}>¿Confirmar aprobación?</span>
                        <button
                          type="button"
                          onClick={() => handleApprove(req.id)}
                          disabled={isPending}
                          style={{ padding: "0.35rem 0.75rem", borderRadius: "0.4rem", backgroundColor: "#10b981", color: "white", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
                        >
                          Sí, Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmApproveId(null)}
                          style={{ padding: "0.35rem 0.75rem", borderRadius: "0.4rem", backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmApproveId(req.id)}
                          disabled={isPending}
                          className="btn hover-scale"
                          style={{ padding: "0.4rem 0.85rem", borderRadius: "0.5rem", backgroundColor: "#10b981", color: "white", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <Check size={14} /> Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedReq(req)}
                          disabled={isPending}
                          className="btn hover-scale"
                          style={{ padding: "0.4rem 0.85rem", borderRadius: "0.5rem", backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <X size={14} /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para ingresar motivo de rechazo */}
      {selectedReq && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: "1rem"
        }}>
          <div className="card glass animate-in" style={{ width: "100%", maxWidth: "480px", padding: "2rem", borderRadius: "1.25rem", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "#ef4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <X size={20} /> Rechazar Solicitud de Rol
            </h3>
            <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginBottom: "1.25rem" }}>
              Indica la razón del rechazo para <b>{selectedReq.user?.name || selectedReq.user?.email}</b> (solicitado: <b>{selectedReq.requestedRole}</b>).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Motivo del rechazo (obligatorio):</label>
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ejemplo: No cumple con los requisitos del perfil o faltan aprobaciones de gerencia..."
                className="input"
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.6rem", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => { setSelectedReq(null); setRejectionReason(""); }}
                className="btn btn-surface"
                style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending || !rejectionReason.trim()}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", backgroundColor: "#ef4444", color: "white", border: "none", fontWeight: 700, cursor: (isPending || !rejectionReason.trim()) ? "not-allowed" : "pointer" }}
              >
                {isPending ? "Rechazando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
