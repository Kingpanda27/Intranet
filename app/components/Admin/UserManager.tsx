"use client"

import { useState, useTransition, useRef } from "react"
import { updateUserAdmin, deleteUser, createUser, inviteUser, processBulkUsers } from "@/app/actions/userActions"
import { createRoleChangeRequest } from "@/app/actions/roleRequestActions"
import { updateUserVacationBalance } from "@/app/actions/timeOffActions"
import { Shield, Mail, Edit3, Trash2, Check, X, User, UserPlus, ChevronDown, ChevronUp, FileUp, Send, Calendar, UserCheck, ShieldAlert, ArrowRight } from "lucide-react"
import Papa from "papaparse"

const ROLES = ["AGENT", "USER", "SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER", "NO_ROLE"]

const ROLE_COLORS: Record<string, string> = {
  AGENT: "hsl(220 10% 50%)",
  USER: "hsl(220 10% 50%)",
  SUPERVISOR: "hsl(var(--primary))",
  MANAGER: "hsl(262 60% 55%)",
  HR: "hsl(165 60% 40%)",
  TECHNOLOGY: "hsl(25 90% 55%)",
  TECHNOLOGY_ADMIN: "hsl(200 80% 50%)",
  IT_MANAGER: "hsl(200 80% 50%)",
  NO_ROLE: "hsl(0 0% 50%)",
}

function BulkUploadPanel() {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]
        const validUsers = data.map(u => ({
          name: u.nombre || u.name || "",
          email: u.correo || u.email || "",
          role: u.rol || u.role || "AGENT"
        })).filter(u => u.email)

        if (validUsers.length === 0) {
          setMessage({ type: "error", text: "No se encontraron correos válidos en el CSV." })
          return
        }

        startTransition(async () => {
          const result = await processBulkUsers(validUsers) as any
          if (result.success) {
            setMessage({ type: "success", text: `¡Éxito! Creados: ${result.created}. Errores: ${result.errors?.length || 0}` })
            if (fileInputRef.current) fileInputRef.current.value = ""
          } else {
            setMessage({ type: "error", text: result.error || "Error al procesar el archivo." })
          }
        })
      },
      error: (err) => {
        setMessage({ type: "error", text: "Error al leer el archivo CSV." })
        console.error(err)
      }
    })
  }

  return (
    <div className="card glass animate-in" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem", border: "1px dashed hsl(var(--primary) / 0.35)" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 700, fontSize: "0.95rem", color: "hsl(var(--foreground))" }}>
          <FileUp size={18} style={{ color: "hsl(var(--primary))" }} />
          Subir Usuarios por CSV
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{ marginTop: "1.25rem" }} className="animate-in">
          <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginBottom: "1rem", lineHeight: "1.4" }}>
            Selecciona un archivo <b>.csv</b> delimitado por comas con cabeceras obligatorias: <code>nombre</code>, <code>correo</code>, <code>rol</code>.
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isPending}
              className="input"
              style={{ fontSize: "0.85rem", padding: "0.5rem 0.75rem", maxWidth: "300px" }}
            />
            {isPending && <span style={{ fontSize: "0.8rem", color: "hsl(var(--primary))", fontWeight: 600 }}>Procesando...</span>}
          </div>
          {message && (
            <div style={{ 
              marginTop: "1rem", 
              fontSize: "0.85rem", 
              fontWeight: 550,
              color: message.type === "success" ? "#10b981" : "#ef4444", 
              padding: "0.625rem 0.875rem", 
              borderRadius: "var(--radius-sm)", 
              backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: message.type === "success" ? "1px solid rgba(16, 185, 129, 0.15)" : "1px solid rgba(239, 68, 68, 0.15)"
            }}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CreateUserPanel() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("AGENT")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const handleCreate = () => {
    if (!name.trim() || !email.trim()) return
    const fd = new FormData()
    fd.set("name", name.trim())
    fd.set("email", email.trim().toLowerCase())
    fd.set("role", role)

    startTransition(async () => {
      setMessage(null)
      const result = await createUser(fd)
      if (result.success) {
        setMessage({ type: "success", text: "Usuario creado exitosamente e invitación enviada." })
        setName("")
        setEmail("")
        setRole("AGENT")
      } else {
        setMessage({ type: "error", text: result.error || "Error al crear usuario." })
      }
    })
  }

  return (
    <div className="card glass animate-in" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem", border: "1px solid hsl(var(--primary) / 0.25)" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 700, fontSize: "0.95rem", color: "hsl(var(--foreground))" }}>
          <UserPlus size={18} style={{ color: "hsl(var(--primary))" }} />
          Crear Nuevo Usuario
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{ marginTop: "1.25rem" }} className="animate-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.35rem", color: "hsl(var(--muted-foreground))" }}>NOMBRE COMPLETO</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.35rem", color: "hsl(var(--muted-foreground))" }}>CORREO CORPORATIVO</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@tnoutsourcing.com" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.35rem", color: "hsl(var(--muted-foreground))" }}>ROL ASIGNADO</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ fontSize: "0.85rem", padding: "0.5rem 0.75rem" }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={handleCreate} disabled={isPending || !name.trim() || !email.trim()} className="btn btn-primary" style={{ height: "38px", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
              <UserPlus size={14} /> {isPending ? "Creando..." : "Crear"}
            </button>
          </div>
          {message && (
            <div style={{ 
              marginTop: "1rem", 
              fontSize: "0.85rem", 
              fontWeight: 550,
              color: message.type === "success" ? "#10b981" : "#ef4444", 
              padding: "0.625rem 0.875rem", 
              borderRadius: "var(--radius-sm)", 
              backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: message.type === "success" ? "1px solid rgba(16, 185, 129, 0.15)" : "1px solid rgba(239, 68, 68, 0.15)"
            }}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UserRow({ 
  user, 
  currentUserRole,
  currentUserId,
  onRequestRole 
}: { 
  user: any
  currentUserRole: string
  currentUserId: string
  onRequestRole: (user: any) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name || "")
  const [email, setEmail] = useState(user.email || "")
  const [role, setRole] = useState(user.role || "AGENT")
  const [vacationBalance, setVacationBalance] = useState(user.vacationBalance || 0)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const isTech = currentUserRole === "TECHNOLOGY" || currentUserRole === "TECHNOLOGY_ADMIN" || currentUserRole === "IT_MANAGER"

  const handleSave = () => {
    const fd = new FormData()
    fd.set("name", name)
    fd.set("email", email)
    fd.set("role", role)
    startTransition(async () => {
      const result = await updateUserAdmin(user.id, fd)
      if (result.success) {
        if (vacationBalance !== user.vacationBalance) {
          await updateUserVacationBalance(user.id, Number(vacationBalance))
        }
        setMessage({ type: "success", text: "Guardado" })
        setEditing(false)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: result.error || "Error" })
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`¿Eliminar permanentemente a ${user.name}? Esta acción es irreversible.`)) return
    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (!result.success) setMessage({ type: "error", text: result.error || "Error" })
    })
  }

  const handleInvite = () => {
    startTransition(async () => {
      const result = await inviteUser(user.id)
      if (result.success) {
        setMessage({ type: "success", text: "Enviada ✅" })
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: "error", text: result.error || "Error al invitar" })
        setTimeout(() => setMessage(null), 5000)
      }
    })
  }

  return (
    <tr style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
      <td style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem", fontWeight: 800
          }}>
            {user.name?.charAt(0) || "U"}
          </div>
          <div>
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)} className="input" style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem" }} />
            ) : (
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{user.name}</div>
            )}
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{user.position || "Empleado"}</div>
          </div>
        </div>
      </td>

      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
        {editing ? (
          <input value={email} onChange={e => setEmail(e.target.value)} className="input" style={{ fontSize: "0.85rem", padding: "0.25rem 0.5rem" }} />
        ) : (
          user.email
        )}
      </td>

      <td style={{ padding: "1rem" }}>
        {editing && isTech ? (
          <select value={role} onChange={e => setRole(e.target.value)} className="input" style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        ) : (
          <span style={{
            padding: "0.2rem 0.6rem", borderRadius: "999px",
            fontSize: "0.75rem", fontWeight: 700,
            backgroundColor: `${ROLE_COLORS[user.role] || "hsl(var(--primary))"}22`,
            color: ROLE_COLORS[user.role] || "hsl(var(--primary))"
          }}>
            {user.role}
          </span>
        )}
      </td>

      <td style={{ padding: "1rem", fontSize: "0.85rem" }}>
        {editing && isTech ? (
          <input type="number" step="0.5" value={vacationBalance} onChange={e => setVacationBalance(Number(e.target.value))} className="input" style={{ width: "70px", padding: "0.25rem 0.5rem" }} />
        ) : (
          `${user.vacationBalance ?? 0} días`
        )}
      </td>

      <td style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {message && (
            <span style={{ fontSize: "0.75rem", color: message.type === "success" ? "#10b981" : "#ef4444" }}>
              {message.text}
            </span>
          )}

          {/* Si es Technology: edición directa */}
          {isTech ? (
            editing ? (
              <>
                <button onClick={handleSave} disabled={isPending} className="btn btn-primary" style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}>
                  <Check size={12} /> Guardar
                </button>
                <button onClick={() => setEditing(false)} className="btn btn-surface" style={{ padding: "0.35rem" }}>
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="btn btn-surface hover-scale" style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}>
                  <Edit3 size={12} /> Editar
                </button>
                <button onClick={handleInvite} disabled={isPending} className="btn btn-surface hover-scale" style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}>
                  <Send size={12} /> Invitar
                </button>
                <button onClick={handleDelete} disabled={isPending} className="btn btn-ghost" style={{ padding: "0.35rem", color: "hsl(var(--destructive))" }}>
                  <Trash2 size={13} />
                </button>
              </>
            )
          ) : (
            /* Si es Supervisor/Manager: botón para solicitar cambio de rol */
            user.id !== currentUserId && (
              <button
                type="button"
                onClick={() => onRequestRole(user)}
                className="btn btn-surface hover-scale"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}
              >
                <UserCheck size={13} /> Solicitar cambio de rol
              </button>
            )
          )}
        </div>
      </td>
    </tr>
  )
}

export function UserManager({ 
  users, 
  currentUserRole = "TECHNOLOGY", 
  currentUserId = "" 
}: { 
  users: any[]
  currentUserRole?: string
  currentUserId?: string 
}) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [requestModalUser, setRequestModalUser] = useState<any | null>(null)
  const [targetRole, setTargetRole] = useState("SUPERVISOR")
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const isTech = currentUserRole === "TECHNOLOGY" || currentUserRole === "TECHNOLOGY_ADMIN" || currentUserRole === "IT_MANAGER"

  const filtered = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleSendRoleRequest = () => {
    if (!requestModalUser || !reason.trim()) {
      setModalMessage({ type: "error", text: "Por favor especifica el motivo de la solicitud." })
      return
    }

    startTransition(async () => {
      setModalMessage(null)
      const res = await createRoleChangeRequest({
        userId: requestModalUser.id,
        requestedRole: targetRole,
        reason: reason.trim()
      })

      if (res.success) {
        setModalMessage({ type: "success", text: "Solicitud enviada correctamente. Pendiente de aprobación por Technology." })
        setReason("")
        setTimeout(() => {
          setRequestModalUser(null)
          setModalMessage(null)
        }, 2500)
      } else {
        setModalMessage({ type: "error", text: res.error || "Error al enviar la solicitud." })
      }
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Paneles de Creación solo visibles para Tecnología */}
      {isTech && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.25rem" }}>
          <CreateUserPanel />
          <BulkUploadPanel />
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "420px" }}>
          <input
            className="input"
            placeholder="Buscar por nombre o correo corporativo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: "0.85rem", paddingLeft: "1rem", borderRadius: "999px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
          {["ALL", "AGENT", "SUPERVISOR", "MANAGER", "TECHNOLOGY", "HR"].map(rf => (
            <button
              key={rf}
              onClick={() => setRoleFilter(rf)}
              className="btn btn-surface hover-scale"
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: roleFilter === rf ? "hsl(var(--primary))" : "hsl(var(--surface))",
                color: roleFilter === rf ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                cursor: "pointer"
              }}
            >
              {rf === "ALL" ? "Todos los roles" : rf}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="table-container-modern animate-in">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Vacaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
                  No se encontraron usuarios coincidentes.
                </td>
              </tr>
            ) : (
              filtered.map(user => (
                <UserRow 
                  key={user.id} 
                  user={user} 
                  currentUserRole={currentUserRole}
                  currentUserId={currentUserId}
                  onRequestRole={(u) => {
                    setRequestModalUser(u)
                    setTargetRole("SUPERVISOR")
                    setReason("")
                    setModalMessage(null)
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Solicitar Cambio de Rol (Supervisor / Manager) */}
      {requestModalUser && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: "1rem"
        }}>
          <div className="card glass animate-in" style={{ width: "100%", maxWidth: "480px", padding: "2rem", borderRadius: "1.25rem", boxShadow: "var(--shadow-xl)" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserCheck size={20} style={{ color: "hsl(var(--primary))" }} /> Solicitar Cambio de Rol
            </h3>
            <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", marginBottom: "1.25rem" }}>
              La solicitud será enviada al equipo de Tecnología para su revisión y aprobación.
            </p>

            {modalMessage && (
              <div style={{
                padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: 600,
                backgroundColor: modalMessage.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: modalMessage.type === "success" ? "#10b981" : "#ef4444"
              }}>
                {modalMessage.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem" }}>
              <div>
                <b>Usuario:</b> {requestModalUser.name} ({requestModalUser.email})
              </div>
              <div>
                <b>Rol actual:</b> <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", backgroundColor: "hsl(var(--muted))", fontWeight: 700 }}>{requestModalUser.role}</span>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>Nuevo rol solicitado:</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.6rem" }}
                >
                  <option value="AGENT">AGENT</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>Motivo de la solicitud (obligatorio):</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explica la justificación operativa o ascenso del colaborador..."
                  className="input"
                  style={{ width: "100%", padding: "0.6rem", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setRequestModalUser(null)}
                className="btn btn-surface"
                style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendRoleRequest}
                disabled={isPending || !reason.trim()}
                className="btn btn-primary"
                style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", fontWeight: 700, cursor: (isPending || !reason.trim()) ? "not-allowed" : "pointer" }}
              >
                {isPending ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
