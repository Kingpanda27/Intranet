"use client"

import { useState } from "react"
import { Shield, Clock, User, Activity, FileText, Search, ChevronRight } from "lucide-react"

export function AuditLogViewer({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [selectedLog, setSelectedLog] = useState<any | null>(null)

  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter
    const term = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      (log.action?.toLowerCase().includes(term)) ||
      (log.userName?.toLowerCase().includes(term)) ||
      (log.target?.toLowerCase().includes(term)) ||
      (log.metadata?.toLowerCase().includes(term))
    return matchesAction && matchesSearch
  })

  const uniqueActions = ["ALL", ...Array.from(new Set(logs.map(l => l.action)))]

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción o destino..."
            className="input"
            style={{ width: "100%", paddingLeft: "2.75rem", borderRadius: "999px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
          {uniqueActions.map((act: any) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className="btn btn-surface hover-scale"
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: actionFilter === act ? "hsl(var(--primary))" : "hsl(var(--surface))",
                color: actionFilter === act ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {act === "ALL" ? "Todas las acciones" : act}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla / Lista de Logs */}
      <div className="card glass" style={{ overflow: "hidden", border: "1px solid hsl(var(--border) / 0.6)", borderRadius: "1rem" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.6)", backgroundColor: "hsl(var(--muted) / 0.3)" }}>
                <th style={{ padding: "1rem" }}>Fecha / Hora</th>
                <th style={{ padding: "1rem" }}>Acción</th>
                <th style={{ padding: "1rem" }}>Actor (Usuario)</th>
                <th style={{ padding: "1rem" }}>Destino / Afectado</th>
                <th style={{ padding: "1rem" }}>Resultado</th>
                <th style={{ padding: "1rem" }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: "1px solid hsl(var(--border) / 0.3)" }}>
                    <td style={{ padding: "0.85rem 1rem", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{
                        padding: "0.2rem 0.5rem", borderRadius: "0.4rem",
                        backgroundColor: log.action.includes("APPROVED") ? "rgba(16,185,129,0.12)" : log.action.includes("REJECTED") ? "rgba(239,68,68,0.12)" : "hsl(var(--primary) / 0.12)",
                        color: log.action.includes("APPROVED") ? "#10b981" : log.action.includes("REJECTED") ? "#ef4444" : "hsl(var(--primary))",
                        fontSize: "0.75rem", fontWeight: 700
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      {log.userName || log.actorUserId || "Sistema"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "hsl(var(--muted-foreground))" }}>
                      {log.target || log.targetUserId || "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: log.result === "SUCCESS" ? "#10b981" : log.result === "REJECTED" ? "#ef4444" : "#eab308" }}>
                        {log.result}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-surface"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderRadius: "0.4rem", cursor: "pointer" }}
                      >
                        Ver JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Log */}
      {selectedLog && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: "1rem"
        }}>
          <div className="card glass animate-in" style={{ width: "100%", maxWidth: "560px", padding: "2rem", borderRadius: "1.25rem", boxShadow: "var(--shadow-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Detalle de Registro de Auditoría</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div><b>ID:</b> <code>{selectedLog.id}</code></div>
              <div><b>Acción:</b> <code>{selectedLog.action}</code></div>
              <div><b>Fecha:</b> {new Date(selectedLog.createdAt).toLocaleString()}</div>
              <div><b>Actor:</b> {selectedLog.userName} ({selectedLog.actorUserId})</div>
              <div><b>Destino:</b> {selectedLog.target} ({selectedLog.targetUserId})</div>
              {selectedLog.oldValue && <div><b>Valor Anterior:</b> <code>{selectedLog.oldValue}</code></div>}
              {selectedLog.newValue && <div><b>Valor Nuevo:</b> <code>{selectedLog.newValue}</code></div>}
              
              <div style={{ marginTop: "0.5rem" }}>
                <b>Metadata:</b>
                <pre style={{
                  padding: "0.75rem", borderRadius: "0.5rem",
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "0.75rem", overflowX: "auto", marginTop: "0.35rem"
                }}>
                  {selectedLog.metadata ? JSON.stringify(JSON.parse(selectedLog.metadata), null, 2) : "Sin metadata adicional."}
                </pre>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn btn-primary"
                style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", cursor: "pointer" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
