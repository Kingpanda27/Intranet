"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, Clock, Check, X, Users, UserCheck, Sparkles, Bot } from "lucide-react"
import { getPeople, sendFriendRequest, getPendingRequests, acceptFriendRequest, declineFriendRequest } from "@/app/actions/friendActions"
import { UserStatusBadge } from "@/app/components/UI/UserStatusBadge"

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  MANAGER:     { label: "Manager",       color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  SUPERVISOR:  { label: "Supervisor",    color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  TECHNOLOGY:  { label: "Technology",   color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  IT_MANAGER:  { label: "IT Manager",   color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  HR:          { label: "RRHH",          color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  EMPLOYEE:    { label: "Empleado",      color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_LABELS[role] ?? { label: role, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" }
  return (
    <span style={{
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em",
      textTransform: "uppercase", padding: "0.2rem 0.55rem", borderRadius: "9999px",
      color: meta.color, backgroundColor: meta.bg, display: "inline-block", marginTop: "0.2rem"
    }}>
      {meta.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "1.5rem 1rem", borderRadius: "1rem",
      border: "1px solid hsl(var(--border) / 0.5)",
      backgroundColor: "hsl(var(--surface))", gap: "0.75rem",
      animation: "pulse 1.6s ease-in-out infinite"
    }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "hsl(var(--muted))" }} />
      <div style={{ width: "70%", height: 10, borderRadius: 6, backgroundColor: "hsl(var(--muted))" }} />
      <div style={{ width: "50%", height: 8, borderRadius: 6, backgroundColor: "hsl(var(--muted))" }} />
      <div style={{ width: "60%", height: 28, borderRadius: 8, backgroundColor: "hsl(var(--muted))" }} />
    </div>
  )
}

function PersonCard({ person, pending, onRequest, onAccept, onDecline }: {
  person: any, pending: any[], onRequest: (id: string) => void,
  onAccept: (id: string) => void, onDecline: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const isSent = person.friendshipsReceived.length > 0
  const isPendingFromHim = person.friendshipsSent.length > 0
  const isAccepted =
    person.friendshipsSent.some((f: any) => f.status === "ACCEPTED") ||
    person.friendshipsReceived.some((f: any) => f.status === "ACCEPTED")

  const initials = (person.name ?? "U").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div
      className="animate-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", 
        flexDirection: "row", 
        alignItems: "center", 
        textAlign: "left",
        padding: "1rem 1.25rem",
        borderRadius: "1.125rem",
        border: `1px solid ${hovered ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border) / 0.6)"}`,
        backgroundColor: hovered ? "hsl(var(--surface-hover))" : "hsl(var(--surface))",
        boxShadow: hovered
          ? "0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px hsl(var(--primary) / 0.1)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        gap: "1rem",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        width: "100%"
      }}
    >
      {/* Subtle top glow when hovered */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.3s"
      }} />

      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: `2px solid ${isAccepted ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
          boxShadow: isAccepted ? "0 0 0 4px hsl(var(--primary) / 0.15)" : "none",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "hsl(var(--primary))", color: "white",
          fontWeight: 700, fontSize: "1rem",
          transition: "box-shadow 0.3s, border-color 0.3s"
        }}>
          {person.image
            ? <img src={person.image} alt={person.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials
          }
        </div>
        {isAccepted && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 16, height: 16, borderRadius: "50%",
            backgroundColor: "hsl(var(--primary))", border: "2px solid hsl(var(--surface))",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Check size={9} color="white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Info Container */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "hsl(var(--foreground))", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person.name ?? "Usuario"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <RoleBadge role={person.role} />
          {person.currentStatus && <UserStatusBadge status={person.currentStatus} />}
        </div>
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0, minWidth: "100px" }}>
        {isAccepted ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
            padding: "0.4rem 0.75rem", borderRadius: "9999px",
            backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))",
            fontSize: "0.75rem", fontWeight: 700
          }}>
            <UserCheck size={12} /> Conectados
          </div>
        ) : isSent ? (
          <button
            onClick={() => {
              const req = person.friendshipsReceived[0]
              if (req) onDecline(req.id)
            }}
            style={{
              width: "100%", padding: "0.45rem", borderRadius: "0.625rem",
              border: "1px solid hsl(var(--destructive) / 0.25)",
              backgroundColor: "hsl(var(--destructive) / 0.06)",
              color: "hsl(var(--destructive))",
              fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Cancelar
          </button>
        ) : isPendingFromHim ? (
          <button
            onClick={() => {
              const req = pending.find(p => p.senderId === person.id)
              if (req) onAccept(req.id)
            }}
            className="btn btn-primary"
            style={{ width: "100%", borderRadius: "0.625rem", fontSize: "0.75rem", padding: "0.45rem" }}
          >
            <Check size={12} /> Aceptar
          </button>
        ) : (
          <button
            onClick={() => onRequest(person.id)}
            style={{
              width: "100%", padding: "0.45rem", borderRadius: "0.625rem",
              border: "1px solid hsl(var(--primary) / 0.3)",
              backgroundColor: hovered ? "hsl(var(--primary) / 0.1)" : "transparent",
              color: "hsl(var(--primary))",
              fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
              transition: "all 0.2s"
            }}
          >
            <UserPlus size={12} /> Conectar
          </button>
        )}
      </div>
    </div>
  )
}

export function PeopleSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("ALL")

  const fetchPeople = async () => {
    setLoading(true)
    const data = await getPeople(query)
    setResults(data)
    setLoading(false)
  }

  const fetchPending = async () => {
    const data = await getPendingRequests()
    setPending(data)
  }

  useEffect(() => { fetchPeople() }, [query])
  useEffect(() => {
    fetchPending()
    fetchPeople()
    const interval = setInterval(fetchPending, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRequest = async (userId: string) => {
    const res = await sendFriendRequest(userId)
    if (res.success) fetchPeople()
    else alert(res.error || "Error al enviar solicitud")
  }

  const handleAccept = async (reqId: string) => {
    const res = await acceptFriendRequest(reqId)
    if (res.success) fetchPending()
    else alert(res.error || "Error al aceptar")
  }

  const handleDecline = async (reqId: string) => {
    const res = await declineFriendRequest(reqId)
    if (res.success) fetchPending()
    else alert(res.error || "Error al declinar")
  }

  const FILTER_OPTIONS = [
    { id: "ALL", label: "Todos" },
    { id: "AVAILABLE", label: "Disponibles" },
    { id: "VACATION", label: "Vacaciones" },
    { id: "SICK_LEAVE", label: "Enfermedad" },
    { id: "LICENSES", label: "Licencias" },
    { id: "PERMISSIONS", label: "Permisos Especiales" }
  ]

  const filteredResults = results.filter(p => {
    if (statusFilter === "ALL") return true
    if (!p.currentStatus) return true
    if (statusFilter === "AVAILABLE") return p.currentStatus.status === "AVAILABLE"
    if (statusFilter === "VACATION") return p.currentStatus.type === "VACATION"
    if (statusFilter === "SICK_LEAVE") return p.currentStatus.type === "SICK_LEAVE"
    if (statusFilter === "PERMISSIONS") return p.currentStatus.type === "PERMISSION" || p.currentStatus.type === "EARLY_LEAVE"
    if (statusFilter === "LICENSES") return ["MEDICAL_LEAVE", "MATERNITY_LEAVE", "PATERNITY_LEAVE", "BEREAVEMENT_LEAVE"].includes(p.currentStatus.type)
    return true
  })

  return (
    <div className="card glass animate-in" style={{ padding: "1.75rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
            <div style={{ backgroundColor: "hsl(var(--primary) / 0.1)", padding: "0.35rem", borderRadius: "0.5rem" }}>
              <Users size={18} color="hsl(var(--primary))" />
            </div>
            Encontrar Colegas
          </h3>
          <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", margin: 0 }}>
            Conecta con tu equipo y expande tu red interna.
          </p>
        </div>
        {results.length > 0 && !loading && (
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, color: "hsl(var(--muted-foreground))",
            backgroundColor: "hsl(var(--muted) / 0.5)", padding: "0.25rem 0.6rem",
            borderRadius: "9999px"
          }}>
            {results.length} personas
          </span>
        )}
      </div>

      {/* Pending requests banner */}
      {pending.length > 0 && (
        <div style={{
          marginBottom: "1.5rem", padding: "1rem 1.25rem",
          borderRadius: "0.875rem",
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.04))",
          border: "1px solid hsl(var(--primary) / 0.2)"
        }}>
          <h4 style={{
            fontSize: "0.72rem", fontWeight: 800, color: "hsl(var(--primary))",
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.35rem"
          }}>
            <Clock size={12} /> {pending.length} Solicitud{pending.length > 1 ? "es" : ""} pendiente{pending.length > 1 ? "s" : ""}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pending.map(req => (
              <div key={req.id} style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "0.625rem 0.875rem",
                backgroundColor: "hsl(var(--surface))",
                borderRadius: "0.75rem",
                border: "1px solid hsl(var(--border) / 0.5)"
              }}>
                <img
                  src={req.sender.image || "/default-avatar.png"}
                  style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid hsl(var(--primary) / 0.3)", objectFit: "cover" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{req.sender.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {req.sender.email}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", gap: "0.3rem" }}
                    title="Aceptar"
                  >
                    <Check size={13} /> Aceptar
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    style={{
                      padding: "0.4rem", borderRadius: "0.5rem", cursor: "pointer",
                      border: "1px solid hsl(var(--destructive) / 0.2)",
                      backgroundColor: "transparent", color: "hsl(var(--destructive))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s"
                    }}
                    title="Rechazar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search box & AI */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{
            position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)",
            color: "hsl(var(--muted-foreground))", pointerEvents: "none"
          }} />
          <input
            type="text"
            placeholder="Buscar por nombre o rol..."
            className="input"
            style={{ paddingLeft: "2.5rem", borderRadius: "0.75rem", fontSize: "0.875rem", width: "100%" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-assistant'))}
          className="btn btn-surface hover-scale"
          style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)", fontWeight: 700 }}
          title="Búsqueda Inteligente en el Directorio"
        >
          <Bot size={16} /> Búsqueda IA
        </button>
      </div>

      {/* Status Filters */}
      <style>
        {`
          .filter-pill {
            padding: 0.4rem 0.8rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid hsl(var(--border));
            background: hsl(var(--surface));
            color: hsl(var(--muted-foreground));
            white-space: nowrap;
          }
          .filter-pill.active {
            border-color: hsl(var(--primary));
            background: hsl(var(--primary) / 0.1);
            color: hsl(var(--primary));
          }
          .filter-pill:hover:not(.active) {
            background: hsl(var(--muted) / 0.5);
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>
      <div className="hide-scrollbar" style={{ 
        display: "flex", gap: "0.5rem", overflowX: "auto", 
        marginBottom: "1.5rem", paddingBottom: "0.25rem", width: "100%" 
      }}>
        {FILTER_OPTIONS.map(opt => (
          <button 
            key={opt.id} 
            className={`filter-pill ${statusFilter === opt.id ? "active" : ""}`}
            onClick={() => setStatusFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* People grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
        gap: "0.875rem",
        maxHeight: "520px",
        overflowY: "auto",
        paddingRight: "4px"
      }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredResults.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1", textAlign: "center", padding: "3rem 1rem",
            color: "hsl(var(--muted-foreground))", fontSize: "0.875rem"
          }}>
            <Sparkles size={28} style={{ margin: "0 auto 0.75rem", opacity: 0.3, display: "block" }} />
            No se encontraron colegas con ese nombre.
          </div>
        ) : (
          filteredResults.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              pending={pending}
              onRequest={handleRequest}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))
        )}
      </div>
    </div>
  )
}
