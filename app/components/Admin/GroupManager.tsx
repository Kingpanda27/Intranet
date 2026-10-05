"use client"
// v3 - ultra animated redesign - v3
import { useState, useTransition, useEffect, useRef } from "react"
import { createGroup, updateGroup, deleteGroup, addMemberToGroup, removeMemberFromGroup } from "@/app/actions/groupActions"
import { Users, UserPlus, ChevronDown, ChevronUp, Edit3, Trash2, Check, X, Crown, UserMinus, Plus, Phone, Search, Users2, Shield, Settings, ExternalLink } from "lucide-react"
import Link from "next/link"

const ROLE_COLORS: Record<string, string> = {
  USER: "hsl(220 10% 50%)",
  SUPERVISOR: "hsl(var(--primary))",
  MANAGER: "hsl(262 60% 55%)",
  HR: "hsl(165 60% 40%)",
  TECHNOLOGY: "hsl(25 90% 55%)",
  IT_MANAGER: "hsl(200 80% 50%)"
}

function Avatar({ user }: { user: any }) {
  const roleColor = ROLE_COLORS[user.role] || "hsl(0,0%,50%)"
  return (
    <div style={{ 
      width: 32, height: 32, borderRadius: "50%", 
      backgroundColor: roleColor + "15", display: "flex", alignItems: "center", justifyContent: "center", 
      overflow: "hidden", flexShrink: 0, fontSize: "0.75rem", fontWeight: 700, 
      color: roleColor, border: `1px solid ${roleColor}40`,
      boxShadow: `0 0 10px ${roleColor}10`, transition: "transform 0.2s"
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {user.image ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.name?.[0] || "?")}
    </div>
  )
}

function UserCombobox({
  users,
  selectedIds,
  onSelect,
  onRemove,
  placeholder = "Escribe el nombre del usuario..."
}: {
  users: any[]
  selectedIds: string[]
  onSelect: (userId: string) => void
  onRemove: (userId: string) => void
  placeholder?: string
}) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedUsers = users.filter(u => selectedIds.includes(u.id))
  const availableUsers = users.filter(u => 
    !selectedIds.includes(u.id) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", zIndex: 100 }}>
      {selectedUsers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.5rem" }}>
          {selectedUsers.map(u => (
            <span
              key={u.id}
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                backgroundColor: "hsl(var(--primary) / 0.15)",
                color: "hsl(var(--primary))",
                padding: "0.25rem 0.6rem",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                border: "1px solid hsl(var(--primary) / 0.3)"
              }}
            >
              {u.name}
              <button
                type="button"
                onClick={() => onRemove(u.id)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: "0.75rem", color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
        <input
          className="input"
          placeholder={placeholder}
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          style={{
            fontSize: "0.85rem",
            borderRadius: "0.65rem",
            padding: "0.5rem 2rem 0.5rem 2.25rem",
            width: "100%",
            fontWeight: 600
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: "0.5rem", background: "none", border: "none", color: "hsl(var(--muted-foreground))", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.25rem)",
            left: 0, right: 0,
            maxHeight: "180px",
            overflowY: "auto",
            backgroundColor: "#111827",
            color: "#f8fafc",
            border: "1px solid hsl(var(--primary) / 0.4)",
            borderRadius: "0.75rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
            zIndex: 9999,
            padding: "0.35rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem"
          }}
        >
          {availableUsers.length > 0 ? (
            availableUsers.map(u => (
              <div
                key={u.id}
                onClick={() => {
                  onSelect(u.id)
                  setSearch("")
                  setIsOpen(false)
                }}
                style={{
                  padding: "0.5rem 0.65rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "hsl(var(--muted) / 0.3)",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "hsl(var(--primary) / 0.2)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "hsl(var(--muted) / 0.3)")}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ffffff" }}>{u.name}</div>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{u.role}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: "0.5rem", fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
              Sin usuarios coincidentes
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CreateGroupPanel({ allUsers }: { allUsers: any[] }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [image, setImage] = useState("")
  const [icon, setIcon] = useState("")
  const [color, setColor] = useState("hsl(var(--primary))")
  const [supervisorIds, setSupervisorIds] = useState<string[]>([])
  const [subLeaderIds, setSubLeaderIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const supervisors = allUsers.filter(u => ["SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "IT_MANAGER"].includes(u.role))

  const handleCreate = () => {
    if (!name.trim()) return
    const fd = new FormData()
    fd.set("name", name)
    fd.set("description", description)
    fd.set("email", email)
    fd.set("image", image)
    fd.set("icon", icon)
    fd.set("color", color)
    fd.set("supervisorIds", JSON.stringify(supervisorIds))
    fd.set("subLeaderIds", JSON.stringify(subLeaderIds))
    startTransition(async () => {
      const result = await createGroup(fd)
      if (result.success) {
        setMessage({ type: "success", text: "¡Grupo creado mágicamente! ✨" })
        setName(""); setDescription(""); setEmail(""); setImage(""); setIcon(""); setColor("hsl(var(--primary))"); setSupervisorIds([]); setSubLeaderIds([])
        setTimeout(() => { setOpen(false); setMessage(null) }, 2000)
      } else {
        setMessage({ type: "error", text: result.error || "Error al crear" })
      }
    })
  }

  return (
    <div className="card animate-in" style={{ 
      marginBottom: "2rem", overflow: "hidden",
      border: open ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border) / 0.6)",
      boxShadow: open ? "0 12px 32px hsl(var(--primary) / 0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      backgroundColor: "hsl(var(--surface))"
    }}>
      <button onClick={() => setOpen(!open)} style={{ 
        display: "flex", alignItems: "center", justifyContent: "space-between", 
        width: "100%", border: "none", background: open ? "linear-gradient(90deg, hsl(var(--primary) / 0.08), transparent)" : "transparent", 
        cursor: "pointer", padding: "1.25rem 1.5rem", transition: "background 0.3s",
        textAlign: "left"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: "0.75rem", 
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))", 
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
            flexShrink: 0
          }}>
            <Plus size={22} color="white" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>Nuevo Grupo</div>
            <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", opacity: open ? 0 : 1, transition: "opacity 0.2s" }}>
              Haz clic para desplegar el formulario
            </div>
          </div>
        </div>
        <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.4s" }}>
          <ChevronDown size={20} style={{ color: "hsl(var(--primary))" }} />
        </div>
      </button>

      <div style={{ 
        maxHeight: open ? "800px" : "0", 
        opacity: open ? 1 : 0, 
        overflow: "hidden", 
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <div style={{ padding: "0 1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="animate-in stagger-item-1">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>NOMBRE DEL GRUPO *</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Equipo Alfa..." style={{ fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
            </div>
            <div className="animate-in stagger-item-2">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>DESCRIPCIÓN</label>
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Misión del grupo..." style={{ fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="animate-in stagger-item-3">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>CORREO DE CONTACTO</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="ejemplo@telecom.com" style={{ fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
            </div>
            <div className="animate-in stagger-item-4">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>COLOR E ÍCONO</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: "40px", height: "40px", padding: 0, border: "none", borderRadius: "0.5rem", cursor: "pointer" }} />
                <input className="input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="Ícono (ej: 🚀 o URL)" style={{ flex: 1, fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
              </div>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="animate-in stagger-item-4">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>LÍDERES DE ESCUADRÓN</label>
              <UserCombobox 
                users={supervisors}
                selectedIds={supervisorIds}
                onSelect={id => setSupervisorIds([...supervisorIds, id])}
                onRemove={id => setSupervisorIds(supervisorIds.filter(x => x !== id))}
                placeholder="Buscar líder..."
              />
            </div>
            <div className="animate-in stagger-item-5">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>SUB-LÍDERES</label>
              <UserCombobox 
                users={allUsers}
                selectedIds={subLeaderIds}
                onSelect={id => setSubLeaderIds([...subLeaderIds, id])}
                onRemove={id => setSubLeaderIds(subLeaderIds.filter(x => x !== id))}
                placeholder="Buscar sub-líder..."
              />
            </div>
          </div>
          
          {message && (
            <div className="animate-in" style={{ 
              fontSize: "0.85rem", fontWeight: 700, 
              color: message.type === "success" ? "#10b981" : "#ef4444", 
              padding: "0.75rem 1rem", borderRadius: "0.75rem", 
              backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
              display: "flex", alignItems: "center", gap: "0.5rem"
            }}>
              {message.type === "success" ? <Check size={16} /> : <X size={16} />}
              {message.text}
            </div>
          )}
          
          <div className="animate-in stagger-item-5" style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button onClick={handleCreate} disabled={isPending || !name.trim()} className="btn btn-primary" style={{ flex: 1, padding: "0.875rem", fontSize: "0.95rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              {isPending ? <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span> : <Users2 size={18} />} 
              {isPending ? "Construyendo grupo..." : "Dar Vida al Grupo"}
            </button>
            <button onClick={() => setOpen(false)} className="btn btn-surface" style={{ padding: "0.875rem 1.5rem", fontSize: "0.95rem", borderRadius: "0.75rem" }}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberPicker({ group, allUsers, onClose }: { group: any, allUsers: any[], onClose: () => void }) {
  const [search, setSearch] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const memberIds = new Set(group.members.map((m: any) => m.id))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const available = allUsers.filter(u =>
    !memberIds.has(u.id) &&
    !group.supervisors?.some((s: any) => s.id === u.id) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  const add = (userId: string) => {
    startTransition(async () => { 
      await addMemberToGroup(group.id, userId) 
      setSearch("")
      setIsDropdownOpen(false)
    })
  }

  return (
    <div style={{ 
      position: "fixed", inset: 0, 
      backgroundColor: "rgba(0,0,0, 0.65)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      animation: "fadeIn 0.2s ease-out"
    }}>
      <div className="card animate-in scale-in" style={{ 
        width: "min(560px, 92vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", 
        padding: "2rem", border: "1px solid hsl(var(--primary) / 0.4)", borderRadius: "1.5rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.95)",
        backgroundColor: "hsl(var(--surface))",
        overflow: "visible"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserPlus size={22} color="hsl(var(--primary))" /> Agregar integrante a {group.name}
          </h3>
          <button onClick={onClose} className="btn btn-surface" style={{ padding: "0.5rem", borderRadius: "50%", boxShadow: "none" }}><X size={18} /></button>
        </div>
        
        {/* Input Buscador con Autocompletado */}
        <div ref={dropdownRef} style={{ position: "relative", marginBottom: "1.25rem", zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "1rem", color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
            <input 
              className="input" 
              placeholder="Escribe el nombre o correo del usuario para buscar..." 
              value={search} 
              onFocus={() => setIsDropdownOpen(true)}
              onChange={e => {
                setSearch(e.target.value)
                setIsDropdownOpen(true)
              }} 
              style={{ 
                paddingLeft: "2.75rem", 
                paddingRight: "2.5rem", 
                borderRadius: "0.875rem", 
                fontSize: "0.9rem", 
                padding: "0.875rem 2.5rem 0.875rem 2.75rem",
                width: "100%",
                fontWeight: 600,
                border: "1px solid hsl(var(--primary) / 0.4)"
              }} 
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "0.75rem", background: "none", border: "none", color: "hsl(var(--muted-foreground))", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Menú Desplegable Autocompletado */}
          {isDropdownOpen && search.trim().length > 0 && (
            <div 
              style={{
                position: "absolute",
                top: "calc(100% + 0.35rem)",
                left: 0, right: 0,
                maxHeight: "240px",
                overflowY: "auto",
                backgroundColor: "#111827",
                color: "#f8fafc",
                border: "1px solid hsl(var(--primary) / 0.4)",
                borderRadius: "0.875rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                zIndex: 9999,
                padding: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem"
              }}
            >
              {available.length > 0 ? (
                available.map(u => (
                  <div
                    key={u.id}
                    onClick={() => add(u.id)}
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.65rem",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "hsl(var(--muted) / 0.3)",
                      border: "1px solid hsl(var(--border) / 0.4)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "hsl(var(--primary) / 0.15)"
                      e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "hsl(var(--muted) / 0.3)"
                      e.currentTarget.style.borderColor = "hsl(var(--border) / 0.4)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Avatar user={u} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#ffffff" }}>{u.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{u.email || u.role}</div>
                      </div>
                    </div>
                    <button 
                      disabled={isPending}
                      className="btn btn-primary" 
                      style={{ padding: "0.3rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 }}
                    >
                      + Sumar
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: "0.85rem", fontSize: "0.85rem", color: "#94a3b8", textAlign: "center" }}>
                  No se encontraron usuarios coincidentes con "{search}".
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Lista de Usuarios Disponibles */}
        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.625rem", paddingRight: "8px" }}>
          {available.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Users size={40} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.2, margin: "0 auto 1rem", display: "block" }} />
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.9rem", margin: 0 }}>Nadie disponible para añadir.</p>
            </div>
          ) : available.map((u, idx) => (
            <div key={u.id} className="animate-in" style={{ 
              animationDelay: `${idx * 0.03}s`,
              display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem", 
              borderRadius: "1rem", border: "1px solid hsl(var(--border) / 0.5)", backgroundColor: "hsl(var(--surface))",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.borderColor = "hsl(var(--primary)/0.3)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.borderColor = "hsl(var(--border)/0.5)" }}
            >
              <Avatar user={u} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.15rem" }}>{u.role}{u.projectId ? " · Pertenece a otro grupo" : ""}</div>
              </div>
              <button onClick={() => add(u.id)} disabled={isPending} className="btn btn-primary" style={{ padding: "0.4rem 1rem", borderRadius: "9999px", fontSize: "0.8rem", boxShadow: "0 4px 12px hsl(var(--primary)/0.2)" }}>
                + Sumar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GroupCard({ group, allUsers, index }: { group: any, allUsers: any[], index: number }) {
  const [editing, setEditing] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || "")
  const [email, setEmail] = useState(group.email || "")
  const [image, setImage] = useState(group.image || "")
  const [icon, setIcon] = useState(group.icon || "")
  const [color, setColor] = useState(group.color || "hsl(var(--primary))")
  const [supervisorIds, setSupervisorIds] = useState<string[]>(group.supervisors?.map((s:any) => s.id) || [])
  const [subLeaderIds, setSubLeaderIds] = useState<string[]>(group.subLeaders?.map((s:any) => s.id) || [])
  const [isPending, startTransition] = useTransition()

  const supervisors = allUsers.filter(u => ["SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "IT_MANAGER"].includes(u.role))

  const handleSave = () => {
    if (!name.trim()) return
    const fd = new FormData()
    fd.set("name", name); fd.set("description", description); fd.set("email", email)
    fd.set("image", image); fd.set("icon", icon); fd.set("color", color)
    fd.set("supervisorIds", JSON.stringify(supervisorIds))
    fd.set("subLeaderIds", JSON.stringify(subLeaderIds))
    startTransition(async () => {
      const result = await updateGroup(group.id, fd)
      if (result.success) setEditing(false)
    })
  }

  const handleDelete = () => {
    if (!confirm(`¿Eliminar permanentemente "${group.name}"?`)) return
    startTransition(async () => { await deleteGroup(group.id) })
  }

  const handleRemoveMember = (userId: string) => {
    startTransition(async () => { await removeMemberFromGroup(userId) })
  }

  return (
    <>
      {showPicker && <MemberPicker group={group} allUsers={allUsers} onClose={() => setShowPicker(false)} />}
      
      <div 
        className={`card animate-in stagger-item-${(index % 5) + 1}`} 
        style={{ 
          padding: 0, display: "flex", flexDirection: "column", 
          borderRadius: "1.25rem", border: "1px solid hsl(var(--border) / 0.6)",
          overflow: "hidden", backgroundColor: "hsl(var(--surface))",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)", transition: "transform 0.3s, box-shadow 0.3s"
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)" }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.03)" }}
      >
        {/* Header Ribbon */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${group.color || "hsl(var(--primary))"}, transparent)` }} />

        <div style={{ padding: "1.5rem" }}>
          {/* Card Title Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <input className="input" value={name} onChange={e => setName(e.target.value)} style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem", borderRadius: "0.75rem" }} />
              ) : (
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "hsl(var(--foreground))", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Shield size={18} color="hsl(var(--primary))" />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</span>
                </h3>
              )}
              {editing ? (
                <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Misión del equipo..." style={{ fontSize: "0.85rem", marginTop: "0.5rem", borderRadius: "0.75rem" }} />
              ) : (
                <p style={{ margin: "0.4rem 0 0", color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", lineHeight: "1.5" }}>
                  {group.description || "Un equipo sin misión declarada aún."}
                </p>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
              <Link href={`/groups/${group.id}`} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700, boxShadow: "0 4px 12px hsl(var(--primary)/0.2)" }}>
                <ExternalLink size={14} /> Dashboard
              </Link>
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={isPending} className="btn btn-primary" style={{ padding: "0.5rem", borderRadius: "0.5rem", boxShadow: "0 4px 12px hsl(var(--primary)/0.3)" }}><Check size={14} /></button>
                  <button onClick={() => setEditing(false)} className="btn btn-surface" style={{ padding: "0.5rem", borderRadius: "0.5rem" }}><X size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} className="btn btn-surface" style={{ padding: "0.5rem", borderRadius: "0.5rem", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)", backgroundColor: "hsl(var(--primary)/0.05)" }}><Settings size={14} /></button>
                  <button onClick={handleDelete} disabled={isPending} className="btn btn-surface" style={{ padding: "0.5rem", color: "hsl(var(--destructive))", borderRadius: "0.5rem", border: "1px solid hsl(var(--destructive)/0.2)", backgroundColor: "hsl(var(--destructive)/0.05)" }}><Trash2 size={14} /></button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Contact Email */}
            {(editing || group.email) && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border)/0.5)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "hsl(var(--foreground)/0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.8rem" }}>📧</span>
                </div>
                {editing ? (
                  <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email del grupo..." style={{ flex: 1, height: "30px", fontSize: "0.85rem", padding: "0 0.5rem" }} />
                ) : (
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>{group.email}</span>
                )}
              </div>
            )}

            {/* WhatsApp */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Phone size={13} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                {group.whatsappConfigs?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    {group.whatsappConfigs.map((wa: any) => (
                      <div key={wa.id} style={{ fontSize: "0.8rem" }}><span style={{ fontWeight: 700 }}>{wa.name}</span> <span style={{ color: "hsl(var(--muted-foreground))" }}>({wa.phoneNumber})</span></div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>Sin canal de WhatsApp</span>
                )}
              </div>
            </div>

            {/* Supervisors & SubLeaders */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "1rem", borderRadius: "0.875rem", background: "linear-gradient(135deg, hsl(var(--primary)/0.08), transparent)", border: "1px solid hsl(var(--primary)/0.15)" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "hsl(var(--primary))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Crown size={12} /> Líderes de Escuadrón
                </div>
                {editing ? (
                  <UserCombobox 
                    users={supervisors}
                    selectedIds={supervisorIds}
                    onSelect={id => setSupervisorIds([...supervisorIds, id])}
                    onRemove={id => setSupervisorIds(supervisorIds.filter(x => x !== id))}
                    placeholder="Buscar líder..."
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {!group.supervisors?.length ? (
                      <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Sin líder asignado</span>
                    ) : group.supervisors.map((sup: any) => (
                      <div key={sup.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Avatar user={sup} />
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sup.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding: "1rem", borderRadius: "0.875rem", background: "linear-gradient(135deg, hsl(var(--foreground)/0.03), transparent)", border: "1px solid hsl(var(--border)/0.5)" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "hsl(var(--foreground))", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Shield size={12} /> Sub-Líderes
                </div>
                {editing ? (
                  <UserCombobox 
                    users={allUsers}
                    selectedIds={subLeaderIds}
                    onSelect={id => setSubLeaderIds([...subLeaderIds, id])}
                    onRemove={id => setSubLeaderIds(subLeaderIds.filter(x => x !== id))}
                    placeholder="Buscar sub-líder..."
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {!group.subLeaders?.length ? (
                      <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Sin sub-líder asignado</span>
                    ) : group.subLeaders.map((sub: any) => (
                      <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Avatar user={sub} />
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ margin: "1.5rem -1.5rem -1.5rem", padding: "1.25rem 1.5rem", borderTop: "1px solid hsl(var(--border)/0.5)", backgroundColor: "hsl(var(--muted)/0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users2 size={16} color="hsl(var(--muted-foreground))" />
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Integrantes ({group.members.length})
                </span>
              </div>
              <button onClick={() => setShowPicker(true)} className="btn btn-primary" style={{ padding: "0.4rem 0.875rem", fontSize: "0.75rem", borderRadius: "9999px", boxShadow: "0 4px 12px hsl(var(--primary)/0.2)" }}>
                + Sumar
              </button>
            </div>
            
            {!group.members.length ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "hsl(var(--muted-foreground))", fontSize: "0.8rem" }}>Un grupo solitario.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
                {group.members.map((member: any, mIdx: number) => (
                  <div key={member.id} className="animate-in" style={{ animationDelay: `${mIdx * 0.04}s`, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border)/0.5)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
                    <Avatar user={member} />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: "0.8rem", color: "hsl(var(--foreground))" }}>{member.name}</span>
                    <button onClick={() => handleRemoveMember(member.id)} disabled={isPending} className="btn btn-ghost" style={{ padding: "0.3rem", color: "hsl(var(--destructive))", borderRadius: "50%" }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export function GroupManager({ groups, allUsers }: { groups: any[], allUsers: any[] }) {
  const [search, setSearch] = useState("")
  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <CreateGroupPanel allUsers={allUsers} />

      <div className="card glass animate-in" style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", borderRadius: "1rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
          <input className="input" placeholder="Buscar grupo por nombre..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "2.75rem", borderRadius: "9999px", fontSize: "0.9rem", border: "1px solid hsl(var(--primary)/0.2)", backgroundColor: "hsl(var(--surface))" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ padding: "0.4rem 0.875rem", borderRadius: "9999px", backgroundColor: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", fontSize: "0.8rem", fontWeight: 800 }}>
            {filtered.length} EQUIPOS
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card animate-in scale-in" style={{ padding: "5rem 1rem", textAlign: "center", border: "1px dashed hsl(var(--border))", background: "transparent" }}>
          <Shield size={48} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.2, margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "hsl(var(--foreground))" }}>Sin escuadrones a la vista</h3>
          <p style={{ color: "hsl(var(--muted-foreground))", margin: "0.5rem 0 0", fontSize: "0.9rem" }}>No se encontraron grupos. Empieza creando el primero arriba.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((group, idx) => <GroupCard key={group.id} index={idx} group={group} allUsers={allUsers} />)}
        </div>
      )}
    </div>
  )
}
