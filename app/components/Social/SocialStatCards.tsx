"use client"

import { useState } from "react"
import { Globe, UserCheck, UserPlus, X, ChevronDown } from "lucide-react"
import { getSocialStatsDetail } from "@/app/actions/friendActions"
import { acceptFriendRequest, declineFriendRequest } from "@/app/actions/friendActions"

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  MANAGER:    { label: "Manager",    color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  SUPERVISOR: { label: "Supervisor", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  TECHNOLOGY: { label: "Technology", color: "#06b6d4", bg: "rgba(6,182,212,0.12)"  },
  IT_MANAGER: { label: "IT Manager", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  HR:         { label: "RRHH",       color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  EMPLOYEE:   { label: "Empleado",   color: "#6b7280", bg: "rgba(107,114,128,0.12)"},
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_LABELS[role] ?? { label: role, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" }
  return (
    <span style={{
      fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase", padding: "0.15rem 0.45rem", borderRadius: "9999px",
      color: meta.color, backgroundColor: meta.bg
    }}>
      {meta.label}
    </span>
  )
}

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  const initials = (name ?? "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
  if (image) {
    return (
      <img src={image} alt={name ?? ""} style={{
        width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
        border: "2px solid hsl(var(--border))"
      }} />
    )
  }
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, hsl(var(--primary) / 0.7), hsl(var(--primary)))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.75rem", fontWeight: 800, color: "white"
    }}>
      {initials}
    </div>
  )
}

function PersonRow({ person, actions }: { person: any; actions?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.65rem 0.875rem", borderRadius: "0.75rem",
      backgroundColor: "hsl(var(--surface))",
      border: "1px solid hsl(var(--border) / 0.5)",
      transition: "background 0.15s"
    }}>
      <Avatar name={person.name} image={person.image} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {person.name || "Sin nombre"}
        </div>
        <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "0.05rem" }}>
          {person.email || ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        {person.role && <RoleBadge role={person.role} />}
        {actions}
      </div>
    </div>
  )
}

type Panel = "network" | "connections" | "requests" | null

interface StatCardData {
  totalUsers: number
  myFriends: number
  pendingCount: number
}

export function SocialStatCards({ initialStats }: { initialStats: StatCardData }) {
  const [activePanel, setActivePanel] = useState<Panel>(null)
  const [detail, setDetail] = useState<{
    allUsers: any[];
    myConnections: any[];
    pendingRequests: any[];
  } | null>(null)
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const stats = [
    {
      id: "network" as Panel,
      icon: Globe,
      label: "Personas en la red",
      value: initialStats.totalUsers,
      color: "hsl(var(--primary))",
      bg: "hsl(var(--primary) / 0.08)"
    },
    {
      id: "connections" as Panel,
      icon: UserCheck,
      label: "Mis conexiones",
      value: initialStats.myFriends,
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)"
    },
    {
      id: "requests" as Panel,
      icon: UserPlus,
      label: "Solicitudes recibidas",
      value: initialStats.pendingCount,
      color: "#f97316",
      bg: "rgba(249,115,22,0.08)"
    },
  ]

  const handleCardClick = async (panelId: Panel) => {
    if (activePanel === panelId) {
      setActivePanel(null)
      return
    }
    setActivePanel(panelId)
    if (!detail) {
      setLoadingPanel(true)
      const data = await getSocialStatsDetail()
      setDetail(data)
      setLoadingPanel(false)
    }
  }

  const handleAccept = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    await acceptFriendRequest(friendshipId)
    // Refresh detail
    const data = await getSocialStatsDetail()
    setDetail(data)
    setActionLoading(null)
  }

  const handleDecline = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    await declineFriendRequest(friendshipId)
    const data = await getSocialStatsDetail()
    setDetail(data)
    setActionLoading(null)
  }

  const panelTitle: Record<string, string> = {
    network: "Personas en la red",
    connections: "Mis conexiones",
    requests: "Solicitudes recibidas"
  }

  const panelItems = (panel: Panel): any[] => {
    if (!detail || !panel) return []
    if (panel === "network") return detail.allUsers
    if (panel === "connections") return detail.myConnections
    if (panel === "requests") return detail.pendingRequests
    return []
  }

  return (
    <div>
      {/* Stat Cards row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
        marginTop: "1.75rem"
      }}>
        {stats.map(({ id, icon: Icon, label, value, color, bg }) => {
          const isActive = activePanel === id
          return (
            <button
              key={label}
              onClick={() => handleCardClick(id)}
              className="card glass animate-in"
              style={{
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                cursor: "pointer",
                border: isActive
                  ? `1px solid ${color}`
                  : "1px solid hsl(var(--border) / 0.6)",
                boxShadow: isActive ? `0 0 0 3px ${color}22` : undefined,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: isActive ? "translateY(-2px)" : "translateY(0)",
                textAlign: "left",
                background: isActive ? `${bg}` : undefined,
                width: "100%",
                borderRadius: "1rem"
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: "0.75rem",
                backgroundColor: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1, color: "hsl(var(--foreground))", letterSpacing: "-0.03em" }}>
                  {value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>
                  {label}
                </div>
              </div>
              <ChevronDown
                size={16}
                color="hsl(var(--muted-foreground))"
                style={{
                  flexShrink: 0,
                  transition: "transform 0.25s",
                  transform: isActive ? "rotate(180deg)" : "rotate(0deg)"
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Expandable panel */}
      {activePanel && (
        <div
          className="animate-in"
          style={{
            marginTop: "1rem",
            borderRadius: "1rem",
            border: "1px solid hsl(var(--border) / 0.7)",
            backgroundColor: "hsl(var(--surface))",
            overflow: "hidden"
          }}
        >
          {/* Panel header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid hsl(var(--border) / 0.5)",
            background: "hsl(var(--primary) / 0.04)"
          }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>
              {panelTitle[activePanel]}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {!loadingPanel && detail && (
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700,
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                  padding: "0.2rem 0.6rem", borderRadius: "9999px"
                }}>
                  {panelItems(activePanel).length} {panelItems(activePanel).length === 1 ? "registro" : "registros"}
                </span>
              )}
              <button
                onClick={() => setActivePanel(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "hsl(var(--muted-foreground))", padding: "0.25rem",
                  borderRadius: "0.375rem", display: "flex", alignItems: "center"
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div style={{ padding: "1rem 1.25rem", maxHeight: "380px", overflowY: "auto" }}>
            {loadingPanel ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: 58, borderRadius: "0.75rem",
                    backgroundColor: "hsl(var(--muted))",
                    animation: "pulse 1.5s ease-in-out infinite"
                  }} />
                ))}
              </div>
            ) : panelItems(activePanel).length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", textAlign: "center", padding: "1.5rem 0" }}>
                {activePanel === "requests"
                  ? "No tienes solicitudes de conexión pendientes."
                  : activePanel === "connections"
                  ? "Aún no tienes conexiones. ¡Busca a tus compañeros!"
                  : "No hay personas registradas."}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {panelItems(activePanel).map((person: any) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    actions={
                      activePanel === "requests" ? (
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button
                            disabled={actionLoading === person.friendshipId}
                            onClick={() => handleAccept(person.friendshipId)}
                            style={{
                              padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.7rem",
                              fontWeight: 700, cursor: "pointer", border: "none",
                              backgroundColor: "#10b981", color: "white",
                              opacity: actionLoading === person.friendshipId ? 0.6 : 1
                            }}
                          >
                            Aceptar
                          </button>
                          <button
                            disabled={actionLoading === person.friendshipId}
                            onClick={() => handleDecline(person.friendshipId)}
                            style={{
                              padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.7rem",
                              fontWeight: 700, cursor: "pointer", border: "1px solid hsl(var(--border))",
                              backgroundColor: "transparent", color: "hsl(var(--muted-foreground))",
                              opacity: actionLoading === person.friendshipId ? 0.6 : 1
                            }}
                          >
                            Ignorar
                          </button>
                        </div>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
