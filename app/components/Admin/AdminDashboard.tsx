"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, XCircle, User, Briefcase, Calendar, MessageSquare, Download, Clock, History, Trash2, Paperclip, ExternalLink, AlertCircle, Pencil, X, Save, RefreshCw, Users, ChevronDown, ChevronUp, Search, Layers, LayoutGrid, ListFilter, Shield, Sparkles, Filter, FileSpreadsheet } from "lucide-react"
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
  const [showExportModal, setShowExportModal] = useState(false)

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

  // Estados para agrupación por grupos y filtrado interactivo
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL")
  const [viewMode, setViewMode] = useState<"GROUPS" | "LIST">("GROUPS")
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

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

  // Grupos únicos disponibles extraídos de las solicitudes del supervisor
  const availableGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string | null; icon: string | null }>()
    let hasUnassigned = false

    requests.forEach(r => {
      const proj = r.user?.project
      if (proj && proj.id) {
        if (!map.has(proj.id)) {
          map.set(proj.id, {
            id: proj.id,
            name: proj.name || "Sin nombre",
            color: proj.color || "#6366f1",
            icon: proj.icon || "Users"
          })
        }
      } else {
        hasUnassigned = true
      }
    })

    const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    if (hasUnassigned) {
      list.push({
        id: "unassigned",
        name: "Sin Grupo Asignado",
        color: "#94a3b8",
        icon: "UserX"
      })
    }
    return list
  }, [requests])

  // Años disponibles en base a los registros existentes
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>()
    const currentY = new Date().getFullYear()
    yearsSet.add(currentY)

    requests.forEach(r => {
      const dStr = r.startDate || r.absenceDate || r.createdAt
      if (dStr) {
        const d = new Date(dStr)
        if (!isNaN(d.getTime())) {
          yearsSet.add(d.getFullYear())
        }
      }
    })

    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [requests])

  const pendingRequests = requests.filter(r => r.status === "PENDING")
  const historyRequests = requests.filter(r => r.status !== "PENDING")
  const currentTabRequests = activeTab === "PENDING" ? pendingRequests : historyRequests

  // Filtrado reactivo por término de búsqueda (nombre, email, grupo, motivo, tipo)
  const filteredRequests = currentTabRequests.filter(r => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const name = (r.user?.name || "").toLowerCase()
    const email = (r.user?.email || "").toLowerCase()
    const groupName = (r.user?.project?.name || "Sin Grupo Asignado").toLowerCase()
    const reason = (r.reason || "").toLowerCase()
    const type = (r.type || "").toLowerCase()
    return name.includes(q) || email.includes(q) || groupName.includes(q) || reason.includes(q) || type.includes(q)
  })

  // Agrupación dinámica por grupos creados en Gestión de Grupos (Project)
  const groupsMap = new Map<string, {
    groupId: string
    groupName: string
    groupColor: string
    groupIcon?: string
    groupImage?: string | null
    requests: any[]
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    uniqueEmployeesCount: number
  }>()

  filteredRequests.forEach(req => {
    const project = req.user?.project
    const groupId = project?.id || "unassigned"
    const groupName = project?.name || "Sin Grupo Asignado"
    const groupColor = project?.color || "#ff6a00"
    const groupIcon = project?.icon || "Users"
    const groupImage = project?.image

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        groupId,
        groupName,
        groupColor,
        groupIcon,
        groupImage,
        requests: [],
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        uniqueEmployeesCount: 0
      })
    }

    const bucket = groupsMap.get(groupId)!
    bucket.requests.push(req)
    if (req.status === "PENDING") bucket.pendingCount++
    else if (req.status === "APPROVED") bucket.approvedCount++
    else if (req.status === "REJECTED") bucket.rejectedCount++
  })

  groupsMap.forEach(b => {
    const uids = new Set(b.requests.map(r => r.user?.id || r.userId))
    b.uniqueEmployeesCount = uids.size
  })

  // Todos los grupos en la pestaña activa ordenados (los que tienen más pendientes primero)
  const allGroupsInTab = Array.from(groupsMap.values()).sort((a, b) => {
    if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount
    return a.groupName.localeCompare(b.groupName)
  })

  // Grupos filtrados según el chip seleccionado
  const visibleGroups = selectedGroupFilter === "ALL" 
    ? allGroupsInTab 
    : allGroupsInTab.filter(g => g.groupId === selectedGroupFilter)

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const areAllCollapsed = visibleGroups.length > 0 && visibleGroups.every(g => Boolean(collapsedGroups[g.groupId]))

  const toggleCollapseAll = () => {
    if (areAllCollapsed) {
      setCollapsedGroups({})
    } else {
      const all: Record<string, boolean> = {}
      visibleGroups.forEach(g => {
        all[g.groupId] = true
      })
      setCollapsedGroups(all)
    }
  }

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
        
        <button 
          type="button" 
          onClick={() => setShowExportModal(true)} 
          className="btn btn-surface hover-scale" 
          style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.9rem", fontWeight: 700 }}
          title="Personalizar período por mes y filtrar por grupo para exportar CSV"
        >
          <FileSpreadsheet size={17} style={{ color: "hsl(var(--primary))" }} />
          Exportar Reporte (CSV)
          <ChevronDown size={14} style={{ opacity: 0.7 }} />
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
      
      {/* Barra de Herramientas y Filtros por Grupo */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {/* Búsqueda predictiva */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "440px" }}>
            <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
            <input
              className="input"
              placeholder="Buscar por empleado, motivo, tipo o grupo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: "0.85rem", paddingLeft: "2.5rem", paddingRight: searchQuery ? "2.2rem" : "1rem", borderRadius: "999px", width: "100%" }}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")} 
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", padding: "2px" }}
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controles de vista: Alternar modo y Colapso */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {viewMode === "GROUPS" && visibleGroups.length > 0 && (
              <button 
                type="button" 
                onClick={toggleCollapseAll}
                className="btn btn-surface hover-scale"
                style={{ fontSize: "0.78rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: "999px" }}
                title={areAllCollapsed ? "Expandir todos los recuadros de grupos" : "Colapsar todos los recuadros de grupos"}
              >
                <Layers size={14} />
                {areAllCollapsed ? "Expandir Grupos" : "Colapsar Grupos"}
              </button>
            )}

            <div style={{ display: "flex", backgroundColor: "hsl(var(--surface))", padding: "3px", borderRadius: "999px", border: "1px solid hsl(var(--border))" }}>
              <button
                type="button"
                onClick={() => setViewMode("GROUPS")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: viewMode === "GROUPS" ? "hsl(var(--primary))" : "transparent",
                  color: viewMode === "GROUPS" ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  transition: "all 0.2s"
                }}
              >
                <LayoutGrid size={13} />
                Vista por Grupos
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: viewMode === "LIST" ? "hsl(var(--primary))" : "transparent",
                  color: viewMode === "LIST" ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  transition: "all 0.2s"
                }}
              >
                <ListFilter size={13} />
                Vista Lista
              </button>
            </div>
          </div>
        </div>

        {/* Chips Horizontales de Selección de Grupo */}
        {allGroupsInTab.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.35rem", width: "100%", scrollbarWidth: "thin" }}>
            <button
              type="button"
              onClick={() => setSelectedGroupFilter("ALL")}
              className="btn hover-scale"
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: 700,
                backgroundColor: selectedGroupFilter === "ALL" ? "hsl(var(--primary))" : "hsl(var(--surface))",
                color: selectedGroupFilter === "ALL" ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <Users size={13} />
              Todos los Grupos ({filteredRequests.length})
            </button>

            {allGroupsInTab.map(g => {
              const isSelected = selectedGroupFilter === g.groupId
              return (
                <button
                  key={g.groupId}
                  type="button"
                  onClick={() => setSelectedGroupFilter(isSelected ? "ALL" : g.groupId)}
                  className="btn hover-scale"
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 550,
                    backgroundColor: isSelected ? (g.groupColor || "hsl(var(--primary))") : "hsl(var(--surface))",
                    color: isSelected ? "#fff" : "hsl(var(--foreground))",
                    border: `1px solid ${isSelected ? (g.groupColor || "hsl(var(--primary))") : "hsl(var(--border))"}`,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ 
                    width: 9, 
                    height: 9, 
                    borderRadius: "50%", 
                    backgroundColor: isSelected ? "#fff" : (g.groupColor || "hsl(var(--primary))"),
                    boxShadow: isSelected ? "none" : `0 0 6px ${g.groupColor || "hsl(var(--primary))"}` 
                  }} />
                  <span>{g.groupName}</span>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    padding: "0.1rem 0.45rem", 
                    borderRadius: "999px", 
                    backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "hsl(var(--muted) / 0.5)",
                    fontWeight: 800
                  }}>
                    {g.requests.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Visualización de Solicitudes (Por Grupos o Lista) */}
      {filteredRequests.length === 0 ? (
        <div className="card glass animate-in" style={{ textAlign: "center", padding: "4rem 2rem", background: "hsl(var(--surface) / 0.5)", borderRadius: "1.25rem", border: "1px dashed hsl(var(--border))" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Briefcase size={22} />
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>No hay solicitudes disponibles</h3>
          <p style={{ color: "hsl(var(--muted-foreground))", margin: 0, fontSize: "0.875rem" }}>
            {searchQuery 
              ? `No se encontraron resultados que coincidan con "${searchQuery}".` 
              : activeTab === "PENDING" ? "No tienes solicitudes pendientes por revisar en tus grupos a cargo." : "No hay registros históricos de solicitudes en esta sección."}
          </p>
        </div>
      ) : viewMode === "GROUPS" ? (
        /* VISTA DIVIDIDA POR GRUPOS: Cada grupo tiene su recuadro contenedor */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {visibleGroups.map(group => {
            const isCollapsed = Boolean(collapsedGroups[group.groupId])
            const groupColor = group.groupColor || "hsl(var(--primary))"

            return (
              <div
                key={group.groupId}
                className="card glass animate-in"
                style={{
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  border: `1px solid ${groupColor}40`,
                  backgroundColor: "hsl(var(--surface) / 0.45)",
                  boxShadow: `0 10px 32px -10px ${groupColor}25`,
                  padding: 0,
                  transition: "all 0.25s ease"
                }}
              >
                {/* Encabezado del Recuadro de Grupo */}
                <div 
                  onClick={() => toggleGroupCollapse(group.groupId)}
                  style={{
                    padding: "1.1rem 1.5rem",
                    borderBottom: isCollapsed ? "none" : `1px solid ${groupColor}30`,
                    background: `linear-gradient(90deg, ${groupColor}15 0%, transparent 80%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    cursor: "pointer",
                    userSelect: "none",
                    flexWrap: "wrap"
                  }}
                  title="Haz clic para colapsar o expandir las solicitudes de este grupo"
                >
                  {/* Identidad del Grupo */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: "220px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      backgroundColor: `${groupColor}22`,
                      color: groupColor,
                      border: `1.5px solid ${groupColor}55`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${groupColor}25`
                    }}>
                      {group.groupImage ? (
                        <img src={group.groupImage} alt={group.groupName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                      ) : (
                        <Users size={22} style={{ color: groupColor }} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>
                          {group.groupName}
                        </h3>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 750,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "999px",
                          backgroundColor: `${groupColor}20`,
                          color: groupColor,
                          border: `1px solid ${groupColor}40`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem"
                        }}>
                          <Users size={12} />
                          {group.uniqueEmployeesCount} colaborador{group.uniqueEmployeesCount !== 1 ? "es" : ""}
                        </span>
                      </div>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                        {group.requests.length} solicitud{group.requests.length !== 1 ? "es" : ""} en este recuadro de grupo
                      </p>
                    </div>
                  </div>

                  {/* Resumen de Estado del Grupo y Botón de Colapso */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {activeTab === "PENDING" ? (
                      <span style={{
                        padding: "0.35rem 0.8rem",
                        borderRadius: "999px",
                        fontSize: "0.78rem",
                        fontWeight: 750,
                        backgroundColor: "rgba(245, 158, 11, 0.16)",
                        color: "#f59e0b",
                        border: "1px solid rgba(245, 158, 11, 0.35)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem"
                      }}>
                        <Clock size={13} />
                        {group.pendingCount} pendiente{group.pendingCount !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {group.approvedCount > 0 && (
                          <span style={{
                            padding: "0.3rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            color: "#10b981",
                            border: "1px solid rgba(16, 185, 129, 0.3)"
                          }}>
                            ✓ {group.approvedCount} aprobada{group.approvedCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {group.rejectedCount > 0 && (
                          <span style={{
                            padding: "0.3rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)"
                          }}>
                            ✕ {group.rejectedCount} rechazada{group.rejectedCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: "50%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      backgroundColor: "hsl(var(--surface))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--muted-foreground))"
                    }}>
                      {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                    </div>
                  </div>
                </div>

                {/* Contenido del Recuadro: Solicitudes de los miembros de este grupo */}
                {!isCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {group.requests.map((request, idx) => (
                      <div 
                        key={request.id}
                        style={{
                          borderTop: idx > 0 ? "1px solid hsl(var(--border) / 0.45)" : "none",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "hsl(var(--surface) / 0.25)"
                        }}
                      >
                        <RequestCardItem
                          request={request}
                          activeTab={activeTab}
                          processingId={processingId}
                          onApprove={(id) => handleStatusUpdate(id, "APPROVED")}
                          onReject={(id) => handleStatusUpdate(id, "REJECTED")}
                          onEdit={(req) => setEditingReq(req)}
                          onDelete={(id) => handleDeleteRequest(id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* VISTA LISTA PLANA (Alternativa unificada) */
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredRequests.map((request) => (
            <div 
              key={request.id} 
              className="card glass animate-in" 
              style={{ borderRadius: "1.25rem", padding: 0, overflow: "hidden" }}
            >
              <RequestCardItem
                request={request}
                activeTab={activeTab}
                processingId={processingId}
                onApprove={(id) => handleStatusUpdate(id, "APPROVED")}
                onReject={(id) => handleStatusUpdate(id, "REJECTED")}
                onEdit={(req) => setEditingReq(req)}
                onDelete={(id) => handleDeleteRequest(id)}
              />
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

      {/* Modal para Exportar Reporte Personalizado (CSV) */}
      {showExportModal && mounted && createPortal(
        <ExportReportModal
          initialGroup={selectedGroupFilter}
          requests={requests}
          availableGroups={availableGroups}
          availableYears={availableYears}
          onClose={() => setShowExportModal(false)}
        />,
        document.body
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

// Opciones de Meses para Exportación
const MONTHS_OPTIONS = [
  { value: "ALL", label: "Todos los meses (Año completo)" },
  { value: "0", label: "Enero" },
  { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" },
  { value: "5", label: "Junio" },
  { value: "6", label: "Julio" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Septiembre" },
  { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" },
  { value: "11", label: "Diciembre" }
]

// Parser seguro de año y mes sin desfase por zona horaria
function parseYearMonth(dateInput: Date | string | number | null | undefined): { year: number, month: number } | null {
  if (!dateInput) return null
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})/)
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1 // 0-indexed
      }
    }
  }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return null
  return {
    year: d.getFullYear(),
    month: d.getMonth()
  }
}

// Formateo legible de tipos de solicitudes
function formatTypeReadable(r: any): string {
  switch (r.type) {
    case "VACATION":
      return "Vacaciones"
    case "PERMISSION":
    case "SPECIAL": {
      const spec = r.specialType === "HOURS" ? "Horas" : r.specialType === "HALF" ? "Medio Día" : "Día Completo"
      return `Permiso Especial (${spec})`
    }
    case "HOURS_MAKEUP":
      return "Reposición de Horas"
    case "EARLY_LEAVE":
      return "Salida Temprana"
    case "SICK_LEAVE":
      return "Enfermedad Común"
    case "MEDICAL_LEAVE":
      return "Licencia Médica"
    case "MATERNITY_LEAVE":
    case "MATERNITY":
      return "Maternidad"
    case "PATERNITY_LEAVE":
    case "PATERNITY":
      return "Paternidad"
    case "BEREAVEMENT_LEAVE":
    case "BEREAVEMENT":
      return "Luto Familiar"
    case "REMOTE_INTERNET":
      return "Incidencia: Falla de Internet (Remoto)"
    case "REMOTE_POWER":
      return "Incidencia: Falla Eléctrica (Remoto)"
    case "REMOTE_HARDWARE":
      return "Incidencia: Falla de Hardware / PC (Remoto)"
    case "REMOTE_VPN":
      return "Incidencia: Problema de VPN / Red (Remoto)"
    default:
      return r.type || "Permiso"
  }
}

function ExportReportModal({
  initialGroup,
  requests,
  availableGroups,
  availableYears,
  onClose
}: {
  initialGroup: string
  requests: any[]
  availableGroups: Array<{ id: string; name: string; color: string | null; icon: string | null }>
  availableYears: number[]
  onClose: () => void
}) {
  const [exportGroup, setExportGroup] = useState<string>(initialGroup || "ALL")
  const [exportMonth, setExportMonth] = useState<string>(() => String(new Date().getMonth()))
  const [exportYear, setExportYear] = useState<string>(() => String(new Date().getFullYear()))
  const [exportStatus, setExportStatus] = useState<string>("ALL")

  // Filtrado reactivo de datos para el reporte
  const filteredData = useMemo(() => {
    return requests.filter(r => {
      // 1. Filtrar por Grupo
      if (exportGroup !== "ALL") {
        if (exportGroup === "unassigned") {
          if (r.user?.project?.id) return false
        } else {
          if (r.user?.project?.id !== exportGroup) return false
        }
      }

      // 2. Filtrar por Estado
      if (exportStatus !== "ALL") {
        if (r.status !== exportStatus) return false
      }

      // 3. Filtrar por Fecha (Año y Mes)
      if (exportYear !== "ALL" || exportMonth !== "ALL") {
        const ymStart = parseYearMonth(r.startDate || r.absenceDate || r.createdAt)
        const ymEnd = r.endDate ? parseYearMonth(r.endDate) : null

        const matchesStart = ymStart ? (
          (exportYear === "ALL" || ymStart.year === Number(exportYear)) &&
          (exportMonth === "ALL" || ymStart.month === Number(exportMonth))
        ) : false

        const matchesEnd = ymEnd ? (
          (exportYear === "ALL" || ymEnd.year === Number(exportYear)) &&
          (exportMonth === "ALL" || ymEnd.month === Number(exportMonth))
        ) : false

        if (!matchesStart && !matchesEnd) return false
      }

      return true
    })
  }, [requests, exportGroup, exportStatus, exportMonth, exportYear])

  // Generador de nombre de archivo descriptivo
  const generateFileName = () => {
    const parts = ["Reporte_Permisos"]

    if (exportGroup === "ALL") {
      parts.push("Todos_Los_Grupos")
    } else if (exportGroup === "unassigned") {
      parts.push("Sin_Grupo")
    } else {
      const grp = availableGroups.find(g => g.id === exportGroup)
      const cleanName = (grp?.name || "Grupo")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
      parts.push(cleanName)
    }

    if (exportMonth !== "ALL") {
      const monthObj = MONTHS_OPTIONS.find(m => m.value === exportMonth)
      const cleanMonth = (monthObj?.label || "Mes")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
      parts.push(cleanMonth)
    }

    if (exportYear !== "ALL") {
      parts.push(exportYear)
    } else if (exportMonth === "ALL") {
      parts.push("Historico")
    }

    if (exportStatus !== "ALL") {
      parts.push(exportStatus.toLowerCase())
    }

    return `${parts.join("_")}.csv`
  }

  const handleDownloadCSV = () => {
    try {
      if (filteredData.length === 0) {
        alert("No hay solicitudes que coincidan con los filtros seleccionados.")
        return
      }

      const rows = filteredData.map(r => ({
        "Colaborador": r.user?.name || "Desconocido",
        "Correo Electronico": r.user?.email || "Sin Email",
        "Rol / Cargo": r.user?.role || "USER",
        "Grupo / Campana": r.user?.project?.name || "Sin Grupo Asignado",
        "Tipo de Solicitud": formatTypeReadable(r),
        "Fecha Inicio / Ausencia": r.type === "HOURS_MAKEUP" 
          ? (r.absenceDate ? formatDateShort(r.absenceDate) : "") 
          : formatDateShort(r.startDate) + (r.type === "EARLY_LEAVE" ? " " + formatTime12h(r.startDate) : ""),
        "Fecha Fin / Reposicion": r.type === "HOURS_MAKEUP" 
          ? (r.makeupDate ? formatDateShort(r.makeupDate) : "") 
          : formatDateShort(r.endDate),
        "Horario / Turno": r.type === "HOURS_MAKEUP"
          ? `${r.makeupStartTime || "—"} a ${r.makeupEndTime || "—"}`
          : (r.type === "SPECIAL" && r.specialType === "HOURS")
            ? `${r.exitTime || "—"} a ${r.returnTime || "—"}`
            : (r.type === "EARLY_LEAVE")
              ? `Salida: ${formatTime12h(r.startDate)}`
              : "Jornada completa",
        "Horas Solicitadas": r.type === "HOURS_MAKEUP" ? (r.hoursToMakeUp || 0) : (r.hoursRequested || 0),
        "Horas Aprobadas": r.hoursApproved !== null && r.hoursApproved !== undefined ? r.hoursApproved : "",
        "Horas Utilizadas": r.hoursUsed !== null && r.hoursUsed !== undefined ? r.hoursUsed : "",
        "Estado": r.status === "PENDING" ? "Pendiente" : r.status === "APPROVED" ? "Aprobada" : r.status === "REJECTED" ? "Rechazada" : r.status,
        "Impacto en Bono": r.status === "APPROVED" ? (r.affectsBonus ? "Afecta Bono" : "No Afecta Bono") : "—",
        "Motivo": r.reason || "",
        "Nota de Supervisor": r.supervisorNote || "",
        "Registrado Por": r.createdBy?.name || r.user?.name || "No disponible",
        "Fecha de Registro": formatDateShort(r.createdAt),
        "Hora de Registro": formatTime12h(r.createdAt),
        "Fecha de Resolucion": r.status === "APPROVED" ? formatDateTimeShort(r.approvedAt) : r.status === "REJECTED" ? formatDateTimeShort(r.rejectedAt) : "—",
        "Resolucion Por": r.status === "APPROVED" ? (r.approvedBy?.name || "—") : r.status === "REJECTED" ? (r.rejectedBy?.name || "—") : "—",
        "Tiene Adjunto": r.documentUrl ? "Si" : "No",
        "Enlace Adjunto": r.documentUrl || ""
      }))

      const csv = "\uFEFF" + Papa.unparse(rows)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", generateFileName())
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      onClose()
    } catch (e: any) {
      console.error("Error al exportar CSV:", e)
      alert("Error al generar el archivo CSV: " + e.message)
    }
  }

  const approvedCount = filteredData.filter(r => r.status === "APPROVED").length
  const pendingCount = filteredData.filter(r => r.status === "PENDING").length
  const rejectedCount = filteredData.filter(r => r.status === "REJECTED").length

  return (
    <div 
      className="animate-in fade-in" 
      style={{ 
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" 
      }}
      onClick={(e) => { if(e.target === e.currentTarget) onClose() }}
    >
      <div 
        className="animate-in zoom-in-95 card glass" 
        style={{ 
          backgroundColor: "hsl(var(--background))", width: "100%", maxWidth: "560px", 
          borderRadius: "20px", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)", overflow: "hidden", border: "1px solid hsl(var(--border))"
        }}
      >
        {/* Header del Modal */}
        <div style={{ 
          padding: "1.25rem 1.5rem", 
          borderBottom: "1px solid hsl(var(--border)/0.5)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          backgroundColor: "hsl(var(--surface))" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "hsl(var(--primary) / 0.12)",
              color: "hsl(var(--primary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "hsl(var(--foreground))" }}>
                Exportar Reporte (CSV)
              </h2>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                Filtra por grupo y selecciona el mes deseado
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="btn btn-ghost" 
            style={{ padding: "0.35rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))", minWidth: "auto" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "75vh", overflowY: "auto" }}>
          
          {/* 1. Selector de Grupo / Campaña */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 750, marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--foreground))" }}>
              <Users size={14} style={{ color: "hsl(var(--primary))" }} />
              Grupo / Campaña a Exportar
            </label>
            <select
              value={exportGroup}
              onChange={(e) => setExportGroup(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 600, backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
            >
              <option value="ALL">🌐 Todos los grupos y campañas ({requests.length} solicitudes en total)</option>
              {availableGroups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.id === "unassigned" ? "👤" : "👥"} {g.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.3rem", display: "block" }}>
              {exportGroup === "ALL" 
                ? "Se incluirán solicitudes de todos los grupos y equipos."
                : `Solo se incluirán solicitudes de colaboradores pertenecientes a este grupo.`
              }
            </span>
          </div>

          {/* 2. Selector de Período (Mes y Año) */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 750, marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--foreground))" }}>
              <Calendar size={14} style={{ color: "hsl(var(--primary))" }} />
              Mes y Año del Reporte
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}>
                  Mes
                </label>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
                >
                  {MONTHS_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}>
                  Año
                </label>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
                >
                  <option value="ALL">Todos los años</option>
                  {availableYears.map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accesos Rápidos de Período */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.55rem" }}>
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  setExportMonth(String(now.getMonth()))
                  setExportYear(String(now.getFullYear()))
                }}
                className="btn btn-ghost hover-scale"
                style={{ padding: "0.2rem 0.55rem", fontSize: "0.72rem", borderRadius: "6px", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              >
                ⚡ Mes Actual
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date()
                  d.setMonth(d.getMonth() - 1)
                  setExportMonth(String(d.getMonth()))
                  setExportYear(String(d.getFullYear()))
                }}
                className="btn btn-ghost hover-scale"
                style={{ padding: "0.2rem 0.55rem", fontSize: "0.72rem", borderRadius: "6px", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              >
                ⏪ Mes Anterior
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportMonth("ALL")
                  setExportYear(String(new Date().getFullYear()))
                }}
                className="btn btn-ghost hover-scale"
                style={{ padding: "0.2rem 0.55rem", fontSize: "0.72rem", borderRadius: "6px", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              >
                📅 Todo el Año ({new Date().getFullYear()})
              </button>
              <button
                type="button"
                onClick={() => {
                  setExportMonth("ALL")
                  setExportYear("ALL")
                }}
                className="btn btn-ghost hover-scale"
                style={{ padding: "0.2rem 0.55rem", fontSize: "0.72rem", borderRadius: "6px", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}
              >
                🌐 Todo el Histórico
              </button>
            </div>
          </div>

          {/* 3. Selector de Estado de Solicitud */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 750, marginBottom: "0.45rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "hsl(var(--foreground))" }}>
              <Filter size={14} style={{ color: "hsl(var(--primary))" }} />
              Estado de la Solicitud
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem" }}>
              {[
                { id: "ALL", label: "Todas" },
                { id: "APPROVED", label: "Aprobadas" },
                { id: "PENDING", label: "Pendientes" },
                { id: "REJECTED", label: "Rechazadas" }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setExportStatus(st.id)}
                  style={{
                    padding: "0.45rem 0.5rem",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "1px solid",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backgroundColor: exportStatus === st.id ? "hsl(var(--primary))" : "hsl(var(--surface))",
                    color: exportStatus === st.id ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                    borderColor: exportStatus === st.id ? "hsl(var(--primary))" : "hsl(var(--border))"
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Resumen en Vivo */}
          <div style={{
            backgroundColor: "hsl(var(--surface))",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid hsl(var(--border))",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 750, color: "hsl(var(--foreground))" }}>
                Resumen de Exportación
              </span>
              <span style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                backgroundColor: filteredData.length > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: filteredData.length > 0 ? "#10b981" : "#ef4444"
              }}>
                {filteredData.length} {filteredData.length === 1 ? "registro encontrado" : "registros encontrados"}
              </span>
            </div>

            {filteredData.length > 0 ? (
              <>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.72rem", color: "hsl(var(--muted-foreground))" }}>
                  <span>✓ Aprobadas: <strong>{approvedCount}</strong></span>
                  <span>•</span>
                  <span>⏳ Pendientes: <strong>{pendingCount}</strong></span>
                  <span>•</span>
                  <span>✕ Rechazadas: <strong>{rejectedCount}</strong></span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>
                  Archivo de salida: <code style={{ color: "hsl(var(--primary))", fontWeight: 700 }}>{generateFileName()}</code>
                </div>
              </>
            ) : (
              <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <AlertCircle size={14} />
                No hay solicitudes que coincidan con estos filtros. Prueba con otro mes o grupo.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ 
          padding: "1rem 1.5rem", 
          borderTop: "1px solid hsl(var(--border)/0.5)", 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: "0.75rem", 
          backgroundColor: "hsl(var(--surface)/0.5)" 
        }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-ghost" 
            style={{ borderRadius: "10px", fontSize: "0.85rem" }}
          >
            Cancelar
          </button>
          
          <button 
            type="button" 
            onClick={handleDownloadCSV} 
            disabled={filteredData.length === 0}
            className="btn btn-primary hover-scale" 
            style={{ 
              borderRadius: "10px", 
              fontSize: "0.85rem", 
              fontWeight: 700, 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.5rem",
              opacity: filteredData.length === 0 ? 0.5 : 1,
              cursor: filteredData.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            <Download size={15} />
            Descargar CSV ({filteredData.length})
          </button>
        </div>

      </div>
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

function getRequestTypeInfo(type: string, specialType?: string | null) {
  switch (type) {
    case "VACATION":
      return { label: "Vacaciones", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.25)" }
    case "PERMISSION":
    case "SPECIAL": {
      const spec = specialType === "HOURS" ? "Horas" : specialType === "HALF" ? "Medio Día" : "Día Completo"
      return { label: `Permiso Especial (${spec})`, color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.25)" }
    }
    case "HOURS_MAKEUP":
      return { label: "Reposición de Horas", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.25)" }
    case "EARLY_LEAVE":
      return { label: "Salida Temprana", color: "#eab308", bg: "rgba(234, 179, 8, 0.12)", border: "rgba(234, 179, 8, 0.25)" }
    case "SICK_LEAVE":
      return { label: "Enfermedad", color: "#ec4899", bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.25)" }
    case "MEDICAL_LEAVE":
      return { label: "Licencia Médica", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.25)" }
    case "MATERNITY_LEAVE":
      return { label: "Maternidad", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.12)", border: "rgba(20, 184, 166, 0.25)" }
    case "PATERNITY_LEAVE":
      return { label: "Paternidad", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.25)" }
    case "BEREAVEMENT_LEAVE":
      return { label: "Luto Familiar", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.25)" }
    case "REMOTE_INTERNET":
      return { label: "Incidencia: Falla Internet", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.25)" }
    case "REMOTE_POWER":
      return { label: "Incidencia: Corte de Luz", color: "#eab308", bg: "rgba(234, 179, 8, 0.12)", border: "rgba(234, 179, 8, 0.25)" }
    case "REMOTE_HARDWARE":
      return { label: "Incidencia: Hardware / PC", color: "#f97316", bg: "rgba(249, 115, 22, 0.12)", border: "rgba(249, 115, 22, 0.25)" }
    case "REMOTE_VPN":
      return { label: "Incidencia: VPN / Red", color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.25)" }
    default:
      return { label: type, color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.12)", border: "hsl(var(--primary) / 0.25)" }
  }
}

function RequestCardItem({
  request,
  activeTab,
  processingId,
  onApprove,
  onReject,
  onEdit,
  onDelete
}: {
  request: any
  activeTab: "PENDING" | "HISTORY"
  processingId: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (req: any) => void
  onDelete: (id: string) => void
}) {
  const typeInfo = getRequestTypeInfo(request.type, request.specialType)
  const isBeingProcessed = processingId === request.id

  return (
    <div 
      style={{
        padding: "1.25rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1.5rem",
        alignItems: "start",
        position: "relative"
      }}
    >
      <div>
        {/* Encabezado del Colaborador */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "hsl(var(--primary) / 0.12)",
              color: "hsl(var(--primary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.95rem",
              border: "1px solid hsl(var(--primary) / 0.25)",
              flexShrink: 0
            }}>
              {request.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 750, color: "hsl(var(--foreground))" }}>
                  {request.user?.name}
                </h4>
                {request.user?.role && (
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "999px",
                    backgroundColor: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--muted-foreground))"
                  }}>
                    {request.user.role}
                  </span>
                )}
                {request.user?.project?.name && (
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 650,
                    color: request.user.project.color || "hsl(var(--muted-foreground))",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}>
                    • {request.user.project.name}
                  </span>
                )}
              </div>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                {request.user?.email}
              </p>
            </div>
          </div>

          {/* Badge del Tipo de Solicitud */}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.78rem",
            fontWeight: 700,
            backgroundColor: typeInfo.bg,
            color: typeInfo.color,
            border: `1px solid ${typeInfo.border}`
          }}>
            <Briefcase size={13} />
            {typeInfo.label}
          </span>
        </div>

        {/* Trazabilidad: Creada por y fechas */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "1.25rem", 
          fontSize: "0.76rem", 
          color: "hsl(var(--muted-foreground))", 
          marginBottom: "0.85rem", 
          padding: "0.45rem 0.75rem", 
          backgroundColor: "hsl(var(--surface) / 0.6)", 
          borderRadius: "0.5rem", 
          border: "1px solid hsl(var(--border) / 0.4)" 
        }}>
          <div><strong style={{ color: "hsl(var(--foreground))" }}>Creada por:</strong> {request.createdBy?.name || request.user?.name || "No disponible"}</div>
          <div><strong style={{ color: "hsl(var(--foreground))" }}>Fecha de registro:</strong> {formatDateLong(request.createdAt)} a las {formatTime12h(request.createdAt)}</div>
        </div>

        {/* Detalles de Fechas y Horarios */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={15} color="hsl(var(--primary))" />
            <span>
              {request.type === "HOURS_MAKEUP" ? (
                <>Ausencia: <strong>{request.absenceDate ? formatDateShort(request.absenceDate) : "N/A"}</strong> | Propuesta Reposición: <strong>{request.makeupDate ? formatDateShort(request.makeupDate) : "N/A"}</strong> ({request.makeupStartTime || "N/A"} a {request.makeupEndTime || "N/A"})</>
              ) : request.type === "SPECIAL" && request.specialType === "HOURS" ? (
                <>Fecha: <strong>{formatDateShort(request.startDate)}</strong> | Horario: <strong>{request.exitTime || "N/A"} a {request.returnTime || "N/A"}</strong></>
              ) : request.type === "EARLY_LEAVE" ? (
                <>Salida: <strong>{formatDateShort(request.startDate)}</strong> a las <strong>{formatTime12h(request.startDate)}</strong></>
              ) : (
                <>Del <strong>{formatDateShort(request.startDate)}</strong> al <strong>{formatDateShort(request.endDate)}</strong></>
              )}
            </span>
          </div>

          {(request.type === "HOURS_MAKEUP" || (request.type === "SPECIAL" && request.specialType === "HOURS")) && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Clock size={15} color="hsl(var(--primary))" />
              <span style={{ fontSize: "0.8rem", color: "hsl(var(--primary))", fontWeight: 700 }}>
                {request.type === "HOURS_MAKEUP" ? (
                  <>A reponer: {request.hoursToMakeUp || 0} hrs | Aprobadas: {request.hoursApproved !== null && request.hoursApproved !== undefined ? `${request.hoursApproved} hrs` : "Pendiente"}</>
                ) : (
                  <>Solicitadas: {request.hoursRequested || 0} hrs | Aprobadas: {request.hoursApproved !== null && request.hoursApproved !== undefined ? `${request.hoursApproved} hrs` : "Pendiente"} | Reales: {request.hoursUsed !== null && request.hoursUsed !== undefined ? `${request.hoursUsed} hrs` : "Pendiente"}</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Motivo */}
        {request.reason && (
          <div style={{ 
            marginTop: "0.6rem", 
            padding: "0.65rem 0.85rem", 
            backgroundColor: "hsl(var(--surface) / 0.8)", 
            borderRadius: "0.5rem", 
            fontSize: "0.84rem",
            border: "1px solid hsl(var(--border) / 0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem", color: "hsl(var(--muted-foreground))" }}>
              <MessageSquare size={13} />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>Motivo de la Solicitud</span>
            </div>
            {request.reason}
          </div>
        )}

        {/* Adjunto */}
        {request.documentUrl && (
          <div style={{ marginTop: "0.75rem" }}>
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
                backgroundColor: "hsl(var(--primary) / 0.08)",
                border: "1px solid hsl(var(--primary) / 0.2)",
                transition: "all 0.2s"
              }}
            >
              <Paperclip size={13} />
              <span>Ver Documento Adjunto</span>
              <ExternalLink size={11} style={{ opacity: 0.7 }} />
            </a>
          </div>
        )}

        {/* Nota del supervisor en historial */}
        {request.supervisorNote && activeTab === "HISTORY" && (
          <div style={{ 
            marginTop: "0.75rem", 
            padding: "0.65rem 0.85rem", 
            borderLeft: "3px solid hsl(var(--primary))", 
            backgroundColor: "hsl(var(--primary) / 0.05)", 
            borderRadius: "0 0.5rem 0.5rem 0", 
            fontSize: "0.825rem" 
          }}>
            <span style={{ fontWeight: 700, display: "block", marginBottom: "0.2rem", color: "hsl(var(--primary))" }}>Nota del Supervisor:</span>
            {request.supervisorNote}
          </div>
        )}
      </div>

      {/* Botones de acción / Estado */}
      {activeTab === "PENDING" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "stretch", minWidth: "115px" }}>
          <button 
            type="button"
            onClick={() => onApprove(request.id)}
            disabled={isBeingProcessed}
            className="btn hover-scale" 
            style={{ 
              backgroundColor: "#10b981", 
              color: "#fff", 
              border: "1px solid #059669",
              borderRadius: "0.6rem",
              padding: "0.5rem 0.85rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              cursor: isBeingProcessed ? "not-allowed" : "pointer"
            }}
          >
            <CheckCircle2 size={15} />
            <span>Aprobar</span>
          </button>

          <button 
            type="button"
            onClick={() => onReject(request.id)}
            disabled={isBeingProcessed}
            className="btn btn-surface hover-scale" 
            style={{ 
              color: "#ef4444", 
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "0.6rem",
              padding: "0.5rem 0.85rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              cursor: isBeingProcessed ? "not-allowed" : "pointer"
            }}
          >
            <XCircle size={15} />
            <span>Denegar</span>
          </button>

          <button 
            type="button"
            onClick={() => onEdit(request)}
            disabled={isBeingProcessed}
            className="btn btn-ghost" 
            style={{ 
              color: "hsl(var(--primary))",
              borderRadius: "0.6rem",
              padding: "0.4rem 0.85rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem"
            }}
            title="Editar solicitud"
          >
            <Pencil size={13} />
            <span>Editar</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end", justifyContent: "space-between", height: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
            <span style={{ 
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              padding: "0.3rem 0.75rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 700,
              backgroundColor: request.status === "APPROVED" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", 
              color: request.status === "APPROVED" ? "#10b981" : "#ef4444",
              border: request.status === "APPROVED" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
            }}>
              {request.status === "APPROVED" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {request.status === "APPROVED" ? "Aprobada" : "Rechazada"}
            </span>
            {request.status === "APPROVED" && (
              <span style={{ 
                display: "inline-flex", alignItems: "center", gap: "0.35rem",
                padding: "0.25rem 0.65rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700,
                backgroundColor: request.affectsBonus ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)", 
                color: request.affectsBonus ? "#ef4444" : "#10b981",
                border: request.affectsBonus ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)"
              }}>
                {request.affectsBonus ? "Afecta Bono" : "No Afecta Bono"}
              </span>
            )}
            <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", textAlign: "right", marginTop: "0.2rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <div>Registrada: {formatDateTimeShort(request.createdAt)}</div>
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
          <div style={{ display: "flex", gap: "0.35rem", marginTop: "auto" }}>
            <button 
              type="button"
              onClick={() => onEdit(request)}
              disabled={isBeingProcessed}
              className="btn btn-ghost" 
              title="Editar solicitud"
              style={{ padding: "0.4rem", color: "hsl(var(--primary))" }}
            >
              <Pencil size={15} />
            </button>
            <button 
              type="button"
              onClick={() => onDelete(request.id)}
              disabled={isBeingProcessed}
              className="btn btn-ghost" 
              title="Limpiar registro del historial"
              style={{ padding: "0.4rem", color: "hsl(0 70% 55%)" }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
