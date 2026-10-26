"use client"

import React, { useState, useTransition } from "react"
import { 
  Shield, 
  Clock, 
  User, 
  Activity, 
  FileText, 
  Search, 
  ChevronRight, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar, 
  Eye, 
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Layers, 
  Settings, 
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  SlidersHorizontal,
  X
} from "lucide-react"
import { getAuditLogs, GetAuditLogsParams } from "@/app/actions/auditActions"

interface AuditLogViewerProps {
  initialData: {
    logs: any[]
    totalCount: number
    stats: {
      total: number
      today: number
      alerts: number
      uniqueActionsCount: number
      topActions: { action: string; count: number }[]
    }
    availableActions: string[]
  }
  currentUser?: any
}

export function AuditLogViewer({ initialData, currentUser }: AuditLogViewerProps) {
  const [data, setData] = useState(initialData)
  const [logs, setLogs] = useState(initialData.logs)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [selectedAction, setSelectedAction] = useState<string>("ALL")
  const [selectedResult, setSelectedResult] = useState<string>("ALL")
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table")
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const categories = [
    { id: "ALL", label: "Todos los eventos", icon: Activity, color: "hsl(var(--primary))" },
    { id: "USERS", label: "Usuarios", icon: User, color: "#3b82f6" },
    { id: "GROUPS", label: "Grupos y Equipos", icon: Users, color: "#8b5cf6" },
    { id: "ROLES", label: "Roles y Permisos", icon: ShieldCheck, color: "#10b981" },
    { id: "TIMEOFF", label: "Tiempo Libre", icon: Calendar, color: "#06b6d4" },
    { id: "CALENDAR", label: "Calendario", icon: Clock, color: "#ec4899" },
    { id: "CONFIG", label: "Configuración TI", icon: Settings, color: "#f59e0b" },
    { id: "SECURITY", label: "Alertas y Rechazos", icon: ShieldAlert, color: "#ef4444" }
  ]

  // Recargar datos desde el servidor con los filtros actuales
  const handleServerFetch = (overrideParams?: Partial<GetAuditLogsParams>) => {
    startTransition(async () => {
      try {
        const params: GetAuditLogsParams = {
          action: overrideParams?.action !== undefined ? overrideParams.action : selectedAction,
          category: overrideParams?.category !== undefined ? overrideParams.category : selectedCategory,
          search: overrideParams?.search !== undefined ? overrideParams.search : searchTerm,
          result: overrideParams?.result !== undefined ? overrideParams.result : selectedResult,
          dateRange: overrideParams?.dateRange !== undefined ? overrideParams.dateRange : selectedDateRange,
          limit: 200,
          ...overrideParams
        }
        const result = await getAuditLogs(params)
        setData(result)
        setLogs(result.logs)
        setCurrentPage(1)
      } catch (err) {
        console.error("Error al actualizar logs:", err)
      }
    })
  }

  // Filtrado local en cliente para respuesta inmediata
  const filteredLogs = logs.filter(log => {
    // Categoría
    if (selectedCategory !== "ALL") {
      const act = log.action.toUpperCase()
      if (selectedCategory === "USERS" && !act.startsWith("USER")) return false
      if (selectedCategory === "GROUPS" && !act.startsWith("GROUP")) return false
      if (selectedCategory === "ROLES" && !act.startsWith("ROLE")) return false
      if (selectedCategory === "TIMEOFF" && !act.includes("TIME_OFF") && !act.includes("VACATION")) return false
      if (selectedCategory === "CALENDAR" && !act.includes("EVENT") && !act.includes("CALENDAR")) return false
      if (selectedCategory === "CONFIG" && !act.includes("CONFIG") && !act.includes("API")) return false
      if (selectedCategory === "SECURITY" && log.result !== "FAILED" && log.result !== "REJECTED" && !act.includes("AUTH")) return false
    }

    // Acción específica
    if (selectedAction !== "ALL" && log.action !== selectedAction) {
      return false
    }

    // Resultado
    if (selectedResult !== "ALL" && log.result !== selectedResult) {
      return false
    }

    // Texto de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const inAction = log.action?.toLowerCase().includes(term)
      const inUser = log.userName?.toLowerCase().includes(term)
      const inTarget = log.target?.toLowerCase().includes(term)
      const inMeta = log.metadata?.toLowerCase().includes(term)
      const inOld = log.oldValue?.toLowerCase().includes(term)
      const inNew = log.newValue?.toLowerCase().includes(term)
      if (!inAction && !inUser && !inTarget && !inMeta && !inOld && !inNew) return false
    }

    return true
  })

  // Paginación
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ["ID", "Fecha", "Acción", "Usuario Actor", "Destino", "Resultado", "Metadata"]
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString("es-DO"),
      l.action,
      l.userName || "Sistema",
      l.target || "—",
      l.result,
      l.metadata ? `"${l.metadata.replace(/"/g, '""')}"` : ""
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportar a JSON
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2))
    const link = document.createElement("a")
    link.setAttribute("href", dataStr)
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Helper para badges y colores
  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase()
    if (act.startsWith("USER_DELETED") || act.startsWith("GROUP_DELETED") || act.includes("REJECT")) {
      return { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "rgba(239, 68, 68, 0.25)" }
    }
    if (act.startsWith("USER_CREATED") || act.startsWith("GROUP_CREATED") || act.includes("APPROV")) {
      return { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.25)" }
    }
    if (act.startsWith("USER_") || act.includes("ROLE")) {
      return { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.25)" }
    }
    if (act.startsWith("GROUP_")) {
      return { bg: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", border: "rgba(139, 92, 246, 0.25)" }
    }
    if (act.includes("TIME_OFF") || act.includes("VACATION") || act.includes("CALENDAR") || act.includes("EVENT")) {
      return { bg: "rgba(6, 182, 212, 0.12)", color: "#06b6d4", border: "rgba(6, 182, 212, 0.25)" }
    }
    return { bg: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))", border: "hsl(var(--primary) / 0.25)" }
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case "SUCCESS":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700, color: "#10b981", padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(16, 185, 129, 0.12)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            Éxito
          </span>
        )
      case "REJECTED":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(239, 68, 68, 0.12)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
            Rechazado
          </span>
        )
      case "FAILED":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700, color: "#f43f5e", padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(244, 63, 94, 0.12)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f43f5e" }} />
            Fallido
          </span>
        )
      case "WARNING":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(245, 158, 11, 0.12)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
            Alerta
          </span>
        )
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "hsl(var(--muted) / 0.5)" }}>
            {result}
          </span>
        )
    }
  }

  // Lista única de acciones combinadas (de la base de datos + registros actuales)
  const allUniqueActions = Array.from(new Set([
    ...(data.availableActions || []),
    ...logs.map(l => l.action)
  ])).sort()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      
      {/* 1. Header con estilo premium & Live Indicators */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "1.25rem",
        background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.7) 100%)",
        border: "1px solid hsl(var(--border) / 0.7)",
        borderRadius: "1.25rem",
        padding: "1.75rem 2rem",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Glow de fondo decorativo */}
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "220px",
          height: "220px",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }} />

        <div style={{ zIndex: 1, maxWidth: "700px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{
              padding: "0.6rem",
              borderRadius: "0.85rem",
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.1) 100%)",
              border: "1px solid hsl(var(--primary) / 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <ShieldCheck size={26} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Centro de Auditoría & Trazabilidad
                </h1>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "999px"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                  Activo
                </span>
              </div>
              <p style={{ color: "hsl(var(--muted-foreground))", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
                Registro inmutable de altas, bajas, asignaciones de grupos, roles y modificaciones operativas.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales: Exportar y Recargar */}
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap", zIndex: 1 }}>
          <button
            onClick={() => handleServerFetch()}
            disabled={isPending}
            className="btn btn-surface hover-scale"
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "0.75rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              cursor: isPending ? "not-allowed" : "pointer",
              border: "1px solid hsl(var(--border))"
            }}
            title="Recargar logs"
          >
            <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
            <span>{isPending ? "Actualizando..." : "Sincronizar"}</span>
          </button>

          <button
            onClick={exportToCSV}
            className="btn btn-surface hover-scale"
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "0.75rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              cursor: "pointer",
              border: "1px solid hsl(var(--border))"
            }}
          >
            <Download size={16} />
            <span>CSV</span>
          </button>

          <button
            onClick={exportToJSON}
            className="btn btn-surface hover-scale"
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "0.75rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              cursor: "pointer",
              border: "1px solid hsl(var(--border))"
            }}
          >
            <FileText size={16} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards con Glassmorphism y Gradientes */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.25rem"
      }}>
        {/* Card 1: Total Eventos */}
        <div className="card glass hover-scale" style={{
          padding: "1.4rem",
          borderRadius: "1rem",
          border: "1px solid hsl(var(--border) / 0.7)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, hsl(var(--primary)), #3b82f6)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
              Total de Eventos
            </span>
            <div style={{ padding: "0.45rem", borderRadius: "0.5rem", backgroundColor: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
              <Database size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            {data.stats?.total?.toLocaleString() || logs.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginTop: "0.35rem" }}>
            {filteredLogs.length} en la vista actual
          </div>
        </div>

        {/* Card 2: Eventos de Hoy */}
        <div className="card glass hover-scale" style={{
          padding: "1.4rem",
          borderRadius: "1rem",
          border: "1px solid hsl(var(--border) / 0.7)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #10b981, #06b6d4)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
              Actividad de Hoy
            </span>
            <div style={{ padding: "0.45rem", borderRadius: "0.5rem", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#10b981" }}>
            {data.stats?.today || 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginTop: "0.35rem" }}>
            Eventos generados en las últimas 24 horas
          </div>
        </div>

        {/* Card 3: Alertas & Rechazos */}
        <div className="card glass hover-scale" style={{
          padding: "1.4rem",
          borderRadius: "1rem",
          border: "1px solid hsl(var(--border) / 0.7)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #ef4444, #f59e0b)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
              Alertas / Rechazos
            </span>
            <div style={{ padding: "0.45rem", borderRadius: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: (data.stats?.alerts || 0) > 0 ? "#ef4444" : "inherit" }}>
            {data.stats?.alerts || 0}
          </div>
          <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginTop: "0.35rem" }}>
            Solicitudes rechazadas o incidentes
          </div>
        </div>

        {/* Card 4: Acciones Monitoreadas */}
        <div className="card glass hover-scale" style={{
          padding: "1.4rem",
          borderRadius: "1rem",
          border: "1px solid hsl(var(--border) / 0.7)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
              Tipos de Acciones
            </span>
            <div style={{ padding: "0.45rem", borderRadius: "0.5rem", backgroundColor: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            {allUniqueActions.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginTop: "0.35rem" }}>
            Operaciones auditadas automáticamente
          </div>
        </div>
      </div>

      {/* 3. Pestañas de Categoría */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        paddingBottom: "0.25rem",
        scrollbarWidth: "thin"
      }}>
        {categories.map(cat => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                setCurrentPage(1)
              }}
              className="btn hover-scale"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.1rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? cat.color : "hsl(var(--card))",
                color: isSelected ? "#ffffff" : "hsl(var(--foreground))",
                border: isSelected ? `1px solid ${cat.color}` : "1px solid hsl(var(--border) / 0.7)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? `0 4px 14px ${cat.color}40` : "none"
              }}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* 4. Barra de Filtros Inteligente */}
      <div className="card glass" style={{
        padding: "1.25rem 1.5rem",
        borderRadius: "1rem",
        border: "1px solid hsl(var(--border) / 0.7)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          
          {/* Input de Búsqueda rápida */}
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={18} style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "hsl(var(--muted-foreground))",
              pointerEvents: "none"
            }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por usuario, acción, target o valor modificado..."
              className="input"
              style={{
                width: "100%",
                paddingLeft: "2.75rem",
                paddingRight: searchTerm ? "2.5rem" : "1rem",
                borderRadius: "0.75rem",
                height: "42px",
                fontSize: "0.875rem"
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "hsl(var(--muted-foreground))"
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Selector de Acción Específica */}
          <div style={{ flex: "1 1 240px", minWidth: "220px" }}>
            <select
              value={selectedAction}
              onChange={(e) => {
                const act = e.target.value
                setSelectedAction(act)
                setCurrentPage(1)
                handleServerFetch({ action: act })
              }}
              className="input"
              style={{
                width: "100%",
                height: "42px",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0 1rem"
              }}
            >
              <option value="ALL">🔍 Todas las acciones específicas</option>
              {allUniqueActions.map(act => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Resultado / Estado */}
          <div style={{ minWidth: "150px" }}>
            <select
              value={selectedResult}
              onChange={(e) => {
                setSelectedResult(e.target.value)
                setCurrentPage(1)
              }}
              className="input"
              style={{
                width: "100%",
                height: "42px",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0 1rem"
              }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="SUCCESS">✅ Solo Éxitos</option>
              <option value="REJECTED">🚫 Solo Rechazados</option>
              <option value="FAILED">❌ Solo Fallidos</option>
              <option value="WARNING">⚠️ Solo Alertas</option>
            </select>
          </div>

          {/* Selector de Rango de Fecha */}
          <div style={{ minWidth: "160px" }}>
            <select
              value={selectedDateRange}
              onChange={(e) => {
                const range = e.target.value
                setSelectedDateRange(range)
                setCurrentPage(1)
                handleServerFetch({ dateRange: range })
              }}
              className="input"
              style={{
                width: "100%",
                height: "42px",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0 1rem"
              }}
            >
              <option value="all">📅 Todo el tiempo</option>
              <option value="today">☀️ Solo Hoy</option>
              <option value="7d">🗓️ Últimos 7 días</option>
              <option value="30d">📆 Últimos 30 días</option>
            </select>
          </div>

          {/* Toggle de Vista: Tabla o Línea de Tiempo */}
          <div style={{
            display: "inline-flex",
            backgroundColor: "hsl(var(--muted) / 0.5)",
            padding: "0.25rem",
            borderRadius: "0.75rem",
            border: "1px solid hsl(var(--border) / 0.5)"
          }}>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: viewMode === "table" ? "hsl(var(--background))" : "transparent",
                color: viewMode === "table" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                border: "none",
                cursor: "pointer",
                boxShadow: viewMode === "table" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              Tabla
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: viewMode === "timeline" ? "hsl(var(--background))" : "transparent",
                color: viewMode === "timeline" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                border: "none",
                cursor: "pointer",
                boxShadow: viewMode === "timeline" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              Línea de Tiempo
            </button>
          </div>

        </div>

        {/* Resumen de filtros activos */}
        {(searchTerm || selectedAction !== "ALL" || selectedCategory !== "ALL" || selectedResult !== "ALL" || selectedDateRange !== "all") && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", fontSize: "0.8rem", paddingTop: "0.5rem", borderTop: "1px solid hsl(var(--border) / 0.4)" }}>
            <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>Filtros activos:</span>
            {selectedCategory !== "ALL" && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", fontWeight: 600 }}>
                Categoría: {categories.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
            {selectedAction !== "ALL" && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", fontWeight: 600 }}>
                Acción: {selectedAction}
              </span>
            )}
            {selectedResult !== "ALL" && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 600 }}>
                Resultado: {selectedResult}
              </span>
            )}
            {selectedDateRange !== "all" && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "rgba(6, 182, 212, 0.15)", color: "#06b6d4", fontWeight: 600 }}>
                Rango: {selectedDateRange === "today" ? "Hoy" : selectedDateRange}
              </span>
            )}
            {searchTerm && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", fontWeight: 600 }}>
                Búsqueda: &quot;{searchTerm}&quot;
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedAction("ALL")
                setSelectedCategory("ALL")
                setSelectedResult("ALL")
                setSelectedDateRange("all")
                handleServerFetch({ action: "ALL", category: "ALL", search: "", result: "ALL", dateRange: "all" })
              }}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                marginLeft: "auto"
              }}
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}
      </div>

      {/* 5. Vista de Datos: TABLA o LÍNEA DE TIEMPO */}
      {viewMode === "table" ? (
        <div className="card glass" style={{
          overflow: "hidden",
          borderRadius: "1.25rem",
          border: "1px solid hsl(var(--border) / 0.7)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{
                  borderBottom: "1px solid hsl(var(--border) / 0.7)",
                  backgroundColor: "hsl(var(--muted) / 0.4)",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  color: "hsl(var(--muted-foreground))"
                }}>
                  <th style={{ padding: "1.1rem 1.25rem" }}>Fecha / Hora</th>
                  <th style={{ padding: "1.1rem 1.25rem" }}>Acción Auditada</th>
                  <th style={{ padding: "1.1rem 1.25rem" }}>Usuario Actor</th>
                  <th style={{ padding: "1.1rem 1.25rem" }}>Destino / Afectado</th>
                  <th style={{ padding: "1.1rem 1.25rem" }}>Resultado</th>
                  <th style={{ padding: "1.1rem 1.25rem", textAlign: "right" }}>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "4rem 2rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "hsl(var(--muted-foreground))" }}>
                        <div style={{ padding: "1.25rem", borderRadius: "50%", backgroundColor: "hsl(var(--muted) / 0.5)" }}>
                          <Search size={36} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "1.1rem", color: "hsl(var(--foreground))" }}>
                            No se encontraron registros de auditoría
                          </h4>
                          <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.875rem" }}>
                            Prueba ajustando los términos de búsqueda o los filtros de módulo y fecha.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log, idx) => {
                    const badge = getActionBadgeStyle(log.action)
                    const dateObj = new Date(log.createdAt)
                    return (
                      <tr 
                        key={log.id} 
                        style={{
                          borderBottom: "1px solid hsl(var(--border) / 0.35)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "hsl(var(--muted) / 0.15)",
                          transition: "background-color 0.15s ease"
                        }}
                        className="table-row-hover"
                      >
                        {/* Fecha */}
                        <td style={{ padding: "1rem 1.25rem", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                              {dateObj.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                              {dateObj.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                          </div>
                        </td>

                        {/* Acción */}
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "0.5rem",
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            letterSpacing: "-0.01em"
                          }}>
                            {log.action}
                          </span>
                        </td>

                        {/* Usuario Actor */}
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: "hsl(var(--primary) / 0.15)",
                              color: "hsl(var(--primary))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700
                            }}>
                              {(log.userName || "S").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                {log.userName || "Sistema"}
                              </span>
                              {log.actorUserId && (
                                <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}>
                                  {log.actorUserId.substring(0, 10)}...
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Destino */}
                        <td style={{ padding: "1rem 1.25rem", color: "hsl(var(--foreground))" }}>
                          {log.target ? (
                            <span style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.4rem",
                              backgroundColor: "hsl(var(--muted) / 0.5)",
                              fontSize: "0.82rem",
                              wordBreak: "break-word"
                            }}>
                              {log.target}
                            </span>
                          ) : (
                            <span style={{ color: "hsl(var(--muted-foreground))" }}>—</span>
                          )}
                        </td>

                        {/* Resultado */}
                        <td style={{ padding: "1rem 1.25rem" }}>
                          {getResultBadge(log.result)}
                        </td>

                        {/* Botón Ver Detalle */}
                        <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="btn btn-surface hover-scale"
                            style={{
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.78rem",
                              borderRadius: "0.5rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              cursor: "pointer",
                              border: "1px solid hsl(var(--border) / 0.8)"
                            }}
                          >
                            <Eye size={14} />
                            <span>Inspeccionar</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA LÍNEA DE TIEMPO (TIMELINE) */
        <div style={{ position: "relative", padding: "1rem 0 1rem 1.5rem" }}>
          {/* Línea vertical conectora */}
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "2rem",
            width: "2px",
            backgroundColor: "hsl(var(--border))"
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {paginatedLogs.length === 0 ? (
              <div className="card glass" style={{ padding: "3rem", textAlign: "center", borderRadius: "1rem" }}>
                No hay eventos para mostrar en la línea de tiempo.
              </div>
            ) : (
              paginatedLogs.map((log) => {
                const badge = getActionBadgeStyle(log.action)
                const dateObj = new Date(log.createdAt)
                return (
                  <div key={log.id} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", position: "relative" }}>
                    {/* Nodo de la línea de tiempo */}
                    <div style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: badge.color,
                      border: "3px solid hsl(var(--background))",
                      boxShadow: `0 0 10px ${badge.color}`,
                      marginTop: "1.25rem",
                      zIndex: 2,
                      flexShrink: 0
                    }} />

                    {/* Tarjeta de Evento */}
                    <div className="card glass hover-scale" style={{
                      flex: 1,
                      padding: "1.25rem 1.5rem",
                      borderRadius: "1rem",
                      border: "1px solid hsl(var(--border) / 0.7)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{
                            padding: "0.25rem 0.65rem",
                            borderRadius: "0.5rem",
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            fontFamily: "monospace"
                          }}>
                            {log.action}
                          </span>
                          {getResultBadge(log.result)}
                        </div>

                        <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                          {dateObj.toLocaleString("es-DO")}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.9rem", margin: "0.5rem 0", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.78rem" }}>Actor: </span>
                          <b>{log.userName || "Sistema"}</b>
                        </div>
                        {log.target && (
                          <div>
                            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.78rem" }}>Destino: </span>
                            <span style={{ fontWeight: 600 }}>{log.target}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-surface"
                          style={{
                            padding: "0.3rem 0.75rem",
                            fontSize: "0.75rem",
                            borderRadius: "0.4rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            cursor: "pointer"
                          }}
                        >
                          <Eye size={12} />
                          <span>Ver Payload & Metadata</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 6. Paginador */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
            Mostrando página <b>{currentPage}</b> de <b>{totalPages}</b> ({filteredLogs.length} eventos filtrados)
          </span>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-surface"
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              Anterior
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: currentPage === p ? 700 : 500,
                    backgroundColor: currentPage === p ? "hsl(var(--primary))" : "hsl(var(--card))",
                    color: currentPage === p ? "#fff" : "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                    cursor: "pointer"
                  }}
                >
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-surface"
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                fontSize: "0.85rem",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* 7. Modal Inspector de Registro de Auditoría */}
      {selectedLog && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1.25rem"
        }}>
          <div className="card glass animate-in" style={{
            width: "100%",
            maxWidth: "680px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "2rem",
            borderRadius: "1.5rem",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
            border: "1px solid hsl(var(--border) / 0.8)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            {/* Header del Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    ...getActionBadgeStyle(selectedLog.action)
                  }}>
                    {selectedLog.action}
                  </span>
                  {getResultBadge(selectedLog.result)}
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                  Detalle del Evento de Auditoría
                </h3>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: "hsl(var(--muted) / 0.5)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "hsl(var(--foreground))"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid de Propiedades */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "0.85rem",
              backgroundColor: "hsl(var(--muted) / 0.25)",
              padding: "1.25rem",
              borderRadius: "1rem",
              border: "1px solid hsl(var(--border) / 0.5)",
              fontSize: "0.85rem"
            }}>
              <div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", fontWeight: 600 }}>ID DEL EVENTO</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                  <code style={{ fontSize: "0.78rem" }}>{selectedLog.id}</code>
                  <button
                    onClick={() => copyToClipboard(selectedLog.id, selectedLog.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem" }}
                    title="Copiar ID"
                  >
                    {copiedId === selectedLog.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", fontWeight: 600 }}>FECHA Y HORA</div>
                <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                  {new Date(selectedLog.createdAt).toLocaleString("es-DO")}
                </div>
              </div>

              <div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", fontWeight: 600 }}>USUARIO ACTOR</div>
                <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                  {selectedLog.userName || "Sistema"}
                  {selectedLog.actorUserId && (
                    <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                      ID: {selectedLog.actorUserId}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem", fontWeight: 600 }}>DESTINO / OBJETIVO</div>
                <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                  {selectedLog.target || "—"}
                  {selectedLog.targetUserId && (
                    <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                      Target ID: {selectedLog.targetUserId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Visualizador de Diff (si existen oldValue y newValue) */}
            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <SlidersHorizontal size={16} />
                  <span>Comparativa de Cambios (Antes vs. Después)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{
                    padding: "0.85rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)"
                  }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.35rem" }}>
                      VALOR ANTERIOR
                    </div>
                    <pre style={{ margin: 0, fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {selectedLog.oldValue || "Ninguno"}
                    </pre>
                  </div>

                  <div style={{
                    padding: "0.85rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)"
                  }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10b981", marginBottom: "0.35rem" }}>
                      VALOR NUEVO
                    </div>
                    <pre style={{ margin: 0, fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {selectedLog.newValue || "Ninguno"}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata JSON Inspector */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Metadata / Carga Útil (Payload)</span>
                {selectedLog.metadata && (
                  <button
                    onClick={() => copyToClipboard(selectedLog.metadata, "meta")}
                    className="btn btn-surface"
                    style={{
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                      borderRadius: "0.4rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      cursor: "pointer"
                    }}
                  >
                    {copiedId === "meta" ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copiedId === "meta" ? "Copiado!" : "Copiar JSON"}</span>
                  </button>
                )}
              </div>

              <div style={{
                borderRadius: "0.75rem",
                overflow: "hidden",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--background))"
              }}>
                <pre style={{
                  padding: "1rem",
                  margin: 0,
                  fontSize: "0.78rem",
                  fontFamily: "monospace",
                  overflowX: "auto",
                  maxHeight: "220px"
                }}>
                  {selectedLog.metadata ? (
                    (() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)
                      } catch {
                        return selectedLog.metadata
                      }
                    })()
                  ) : (
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>Sin metadata adicional registrada.</span>
                  )}
                </pre>
              </div>
            </div>

            {/* Botón de Cierre */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn btn-primary"
                style={{
                  padding: "0.6rem 1.5rem",
                  borderRadius: "0.75rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer"
                }}
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
