"use client"

import { useState, useTransition, useRef } from "react"
import { updateUserAdmin, deleteUser, createUser, inviteUser, processBulkUsers, deleteBulkUsers } from "@/app/actions/userActions"
import { createRoleChangeRequest } from "@/app/actions/roleRequestActions"
import { updateUserVacationBalance } from "@/app/actions/timeOffActions"
import { Shield, Mail, Edit3, Trash2, Check, X, User, UserPlus, ChevronDown, ChevronUp, FileUp, Send, Calendar, UserCheck, ShieldAlert, ArrowRight, AlertTriangle } from "lucide-react"
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
        
        // 1. Filtrar únicamente usuarios activos si el CSV incluye columna de bloqueo (Microsoft 365)
        const activeRows = data.filter((r: any) => {
          const block = (
            r['Block credential'] || 
            r['Blocked credential'] || 
            r['Bloquear inicio de sesión'] || 
            r['Bloqueado'] || 
            ''
          ).toString().trim().toLowerCase()
          if (block === 'true' || block === 'yes' || block === 'sí' || block === 'si') return false
          return true
        })

        // 2. Extraer usuarios compatibles con Microsoft 365 y formato estándar
        const validUsers = activeRows.map((u: any) => {
          const email = (
            u['User principal name'] || 
            u['userPrincipalName'] || 
            u['User Principal Name'] || 
            u['Correo electrónico'] || 
            u['correo'] || 
            u['Correo'] || 
            u['email'] || 
            u['Email'] || 
            ""
          ).toString().trim().toLowerCase()

          let name = (
            u['Display name'] || 
            u['displayName'] || 
            u['Display Name'] || 
            u['Nombre para mostrar'] || 
            u['nombre'] || 
            u['Nombre'] || 
            u['name'] || 
            ""
          ).toString().trim()

          const firstName = (u['First name'] || u['firstName'] || u['Nombre de pila'] || "").toString().trim()
          const lastName = (u['Last name'] || u['lastName'] || u['Apellidos'] || "").toString().trim()
          if ((!name || name === "." || name === "-") && (firstName || lastName)) {
            name = `${firstName} ${lastName}`.trim()
          }
          if (!name && email) {
            name = email.split("@")[0]
          }

          const position = (u['Title'] || u['Job title'] || u['Puesto'] || u['Cargo'] || "").toString().trim()
          const department = (u['Department'] || u['Departamento'] || "").toString().trim()
          const entraObjectId = (u['Object Id'] || u['objectId'] || u['ObjectId'] || "").toString().trim()
          const role = (u['rol'] || u['Rol'] || u['role'] || u['Role'] || "USER").toString().trim()

          return {
            name,
            email,
            role,
            position,
            department,
            entraObjectId
          }
        }).filter((u: any) => u.email && u.email.includes("@"))

        if (validUsers.length === 0) {
          setMessage({ type: "error", text: "No se encontraron usuarios válidos o activos en el CSV." })
          return
        }

        startTransition(async () => {
          const result = await processBulkUsers(validUsers) as any
          if (result.success) {
            const blockedCount = data.length - activeRows.length
            setMessage({ 
              type: "success", 
              text: `¡Proceso completado! Creados: ${result.created}. Existentes actualizados: ${result.existing || 0}. Omitidos/Bloqueados: ${blockedCount}.` 
            })
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
            Selecciona un archivo <b>.csv</b>. Compatible de forma nativa con la exportación de <b>Microsoft 365 Admin Center</b> (<code>Display name</code>, <code>User principal name</code>, <code>Block credential</code>) o formato estándar (<code>nombre</code>, <code>correo</code>, <code>rol</code>). Solo se importarán usuarios activos.
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
  isSelected = false,
  onToggleSelect,
  onDeleteRequest,
  onRequestRole 
}: { 
  user: any
  currentUserRole: string
  currentUserId: string
  isSelected?: boolean
  onToggleSelect?: () => void
  onDeleteRequest: (user: any) => void
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
  const isSelf = user.id === currentUserId

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
    <tr style={{
      borderBottom: "1px solid hsl(var(--border) / 0.5)",
      backgroundColor: isSelected ? "hsl(var(--primary) / 0.08)" : undefined,
      transition: "background-color 0.15s ease"
    }}>
      {isTech && (
        <td style={{ padding: "1rem", width: "40px", textAlign: "center" }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            disabled={isSelf}
            style={{
              width: "16px",
              height: "16px",
              cursor: isSelf ? "not-allowed" : "pointer",
              accentColor: "hsl(var(--primary))"
            }}
            title={isSelf ? "No puedes seleccionarte a ti mismo" : `Seleccionar a ${user.name}`}
          />
        </td>
      )}

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
                <button 
                  onClick={() => onDeleteRequest(user)} 
                  disabled={isPending || isSelf} 
                  className="btn btn-ghost" 
                  style={{ 
                    padding: "0.35rem", 
                    color: isSelf ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(var(--destructive))",
                    cursor: isSelf ? "not-allowed" : "pointer"
                  }}
                  title={isSelf ? "No puedes eliminar tu propia cuenta" : `Eliminar a ${user.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </>
            )
          ) : (
            /* Si es Supervisor/Manager: botón para solicitar cambio de rol */
            !isSelf && (
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

  // Selección múltiple y modal moderno de confirmación de eliminación
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [deleteModalUsers, setDeleteModalUsers] = useState<any[] | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null)

  const isTech = currentUserRole === "TECHNOLOGY" || currentUserRole === "TECHNOLOGY_ADMIN" || currentUserRole === "IT_MANAGER"

  const filtered = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Usuarios seleccionables en la vista actual (excluyendo la cuenta propia)
  const selectableVisibleUsers = filtered.filter(u => u.id !== currentUserId)
  const isAllSelected = selectableVisibleUsers.length > 0 && selectableVisibleUsers.every(u => selectedUserIds.includes(u.id))
  const isSomeSelected = selectableVisibleUsers.some(u => selectedUserIds.includes(u.id)) && !isAllSelected

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds(prev => prev.filter(id => !selectableVisibleUsers.some(u => u.id === id)))
    } else {
      const visibleIds = selectableVisibleUsers.map(u => u.id)
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleConfirmDelete = async () => {
    if (!deleteModalUsers || deleteModalUsers.length === 0) return
    setIsDeleting(true)
    setDeleteModalError(null)

    try {
      const idsToDelete = deleteModalUsers.map(u => u.id)
      const result = await deleteBulkUsers(idsToDelete)
      if (result.success) {
        setSelectedUserIds(prev => prev.filter(id => !idsToDelete.includes(id)))
        setDeleteModalUsers(null)
      } else {
        setDeleteModalError(result.error || "Ocurrió un error al eliminar los usuarios.")
      }
    } catch (err: any) {
      setDeleteModalError(err?.message || "Error inesperado al eliminar.")
    } finally {
      setIsDeleting(false)
    }
  }

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

      {/* Barra de Acciones por Lote (cuando hay usuarios seleccionados) */}
      {isTech && selectedUserIds.length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          backgroundColor: "hsl(var(--surface))",
          border: "1px solid hsl(var(--primary) / 0.35)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.25)",
          gap: "1rem",
          flexWrap: "wrap",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "26px",
              height: "26px",
              padding: "0 8px",
              borderRadius: "999px",
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              fontSize: "0.8rem",
              fontWeight: 800
            }}>
              {selectedUserIds.length}
            </span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {selectedUserIds.length === 1 ? "1 usuario seleccionado" : `${selectedUserIds.length} usuarios seleccionados`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedUserIds([])}
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem", textDecoration: "underline", color: "hsl(var(--muted-foreground))" }}
            >
              Deseleccionar todo
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const targets = users.filter(u => selectedUserIds.includes(u.id))
              setDeleteModalUsers(targets)
              setDeleteModalError(null)
            }}
            style={{
              background: "linear-gradient(145deg, hsl(0 84% 55%), hsl(0 84% 45%))",
              color: "#fff",
              border: "1px solid hsl(0 84% 60% / 0.5)",
              padding: "0.55rem 1.15rem",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              boxShadow: "0 4px 14px hsl(0 84% 50% / 0.3)"
            }}
          >
            <Trash2 size={15} /> Eliminar {selectedUserIds.length} {selectedUserIds.length === 1 ? "usuario" : "usuarios"}
          </button>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="table-container-modern animate-in">
        <table className="table-modern">
          <thead>
            <tr>
              {isTech && (
                <th style={{ width: "40px", padding: "1rem", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={el => {
                      if (el) el.indeterminate = isSomeSelected
                    }}
                    onChange={handleToggleSelectAll}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "hsl(var(--primary))" }}
                    title="Seleccionar todos los usuarios visibles"
                  />
                </th>
              )}
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
                <td colSpan={isTech ? 6 : 5} style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
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
                  isSelected={selectedUserIds.includes(user.id)}
                  onToggleSelect={() => handleToggleSelectUser(user.id)}
                  onDeleteRequest={(u) => {
                    setDeleteModalUsers([u])
                    setDeleteModalError(null)
                  }}
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

      {/* Modal Moderno de Confirmación de Eliminación (Individual y Masivo) */}
      {deleteModalUsers && deleteModalUsers.length > 0 && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 120,
          padding: "1rem"
        }}>
          <div className="card glass animate-in" style={{
            width: "100%",
            maxWidth: "520px",
            padding: "2rem",
            borderRadius: "1.25rem",
            border: "1px solid hsl(0 84% 60% / 0.35)",
            boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.6)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "hsl(0 84% 60% / 0.12)",
                color: "hsl(0 84% 60%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <AlertTriangle size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.2rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>
                  {deleteModalUsers.length === 1 
                    ? `¿Eliminar a ${deleteModalUsers[0].name}?`
                    : `¿Eliminar ${deleteModalUsers.length} usuarios?`
                  }
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.45 }}>
                  Esta acción es <b>irreversible</b>. Se eliminarán permanentemente las cuentas, accesos, sesiones y datos vinculados en la intranet.
                </p>
              </div>
            </div>

            {/* Lista previa de usuarios a eliminar */}
            <div style={{
              maxHeight: "170px",
              overflowY: "auto",
              border: "1px solid hsl(var(--border) / 0.6)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "hsl(var(--surface) / 0.6)",
              padding: "0.5rem",
              marginBottom: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem"
            }}>
              {deleteModalUsers.map(u => (
                <div key={u.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "hsl(var(--surface-hover) / 0.4)",
                  fontSize: "0.825rem",
                  gap: "0.75rem"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontWeight: 600, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.name}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.email}
                    </span>
                  </div>
                  <span style={{
                    padding: "0.15rem 0.5rem",
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    backgroundColor: `${ROLE_COLORS[u.role] || "hsl(var(--primary))"}22`,
                    color: ROLE_COLORS[u.role] || "hsl(var(--primary))",
                    flexShrink: 0
                  }}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>

            {deleteModalError && (
              <div style={{
                marginBottom: "1.25rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#ef4444",
                fontSize: "0.825rem",
                fontWeight: 600
              }}>
                {deleteModalError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalUsers(null)
                  setDeleteModalError(null)
                }}
                disabled={isDeleting}
                className="btn btn-surface"
                style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", fontSize: "0.85rem", cursor: isDeleting ? "not-allowed" : "pointer" }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  background: "linear-gradient(145deg, hsl(0 84% 55%), hsl(0 84% 45%))",
                  color: "#fff",
                  border: "1px solid hsl(0 84% 60% / 0.5)",
                  padding: "0.55rem 1.25rem",
                  borderRadius: "0.6rem",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px hsl(0 84% 50% / 0.3)"
                }}
              >
                <Trash2 size={15} />
                {isDeleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

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
