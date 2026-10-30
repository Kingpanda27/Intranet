"use client"

import { useState, useTransition, useRef } from "react"
import { updateUserAdmin, deleteUser, createUser, inviteUser, processBulkUsers, deleteBulkUsers } from "@/app/actions/userActions"
import { createRoleChangeRequest } from "@/app/actions/roleRequestActions"
import { updateUserVacationBalance } from "@/app/actions/timeOffActions"
import { Shield, Mail, Edit3, Trash2, Check, X, User, Users, UserPlus, ChevronDown, ChevronUp, FileUp, Send, Calendar, UserCheck, ShieldAlert, ArrowRight, AlertTriangle } from "lucide-react"
import Papa from "papaparse"
import { useTranslation } from "@/lib/i18n/LanguageContext"

const ROLES = ["AGENT", "USER", "SUPERVISOR", "TEAM_LEAD", "MANAGER", "HR", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "ADMIN", "IT_MANAGER", "NO_ROLE"]

const ROLE_COLORS: Record<string, string> = {
  AGENT: "hsl(220 10% 50%)",
  USER: "hsl(220 10% 50%)",
  SUPERVISOR: "hsl(var(--primary))",
  TEAM_LEAD: "hsl(var(--primary))",
  MANAGER: "hsl(262 60% 55%)",
  HR: "hsl(165 60% 40%)",
  ADMIN: "hsl(280 85% 60%)",
  TECHNOLOGY: "hsl(25 90% 55%)",
  TECHNOLOGY_ADMIN: "hsl(200 80% 50%)",
  IT_MANAGER: "hsl(200 80% 50%)",
  NO_ROLE: "hsl(0 0% 50%)",
}

function BulkUploadPanel() {
  const { t } = useTranslation()
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
          setMessage({ type: "error", text: t("users.bulk.noValidUsers") })
          return
        }

        startTransition(async () => {
          const result = await processBulkUsers(validUsers) as any
          if (result.success) {
            const blockedCount = data.length - activeRows.length
            setMessage({ 
              type: "success", 
              text: t("users.bulk.success", { created: result.created, existing: result.existing || 0, blocked: blockedCount })
            })
            if (fileInputRef.current) fileInputRef.current.value = ""
          } else {
            setMessage({ type: "error", text: result.error || t("users.bulk.error") })
          }
        })
      },
      error: (err) => {
        setMessage({ type: "error", text: t("users.bulk.fileReadError") })
        console.error(err)
      }
    })
  }

  return (
    <div className="card glass animate-in" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem", border: "1px dashed hsl(var(--primary) / 0.35)" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 700, fontSize: "0.95rem", color: "hsl(var(--foreground))" }}>
          <FileUp size={18} style={{ color: "hsl(var(--primary))" }} />
          {t("users.bulk.title")}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{ marginTop: "1.25rem" }} className="animate-in">
          <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginBottom: "1rem", lineHeight: "1.4" }}>
            {t("users.bulk.description")}
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
            {isPending && <span style={{ fontSize: "0.8rem", color: "hsl(var(--primary))", fontWeight: 600 }}>{t("users.bulk.processing")}</span>}
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
  const { t } = useTranslation()
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
        setMessage({ type: "success", text: t("users.create.success") })
        setName("")
        setEmail("")
        setRole("AGENT")
      } else {
        setMessage({ type: "error", text: result.error || t("users.create.error") })
      }
    })
  }

  return (
    <div className="card glass animate-in" style={{ marginBottom: "1.5rem", padding: "1.25rem 1.5rem", border: "1px solid hsl(var(--primary) / 0.25)" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 700, fontSize: "0.95rem", color: "hsl(var(--foreground))" }}>
          <UserPlus size={18} style={{ color: "hsl(var(--primary))" }} />
          {t("users.create.title")}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{ marginTop: "1.25rem" }} className="animate-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.35rem", color: "hsl(var(--muted-foreground))" }}>{t("users.create.nameLabel")}</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t("users.create.namePlaceholder")} style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.35rem", color: "hsl(var(--muted-foreground))" }}>{t("users.create.emailLabel")}</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("users.create.emailPlaceholder")} style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.35rem", color: "hsl(var(--muted-foreground))" }}>{t("users.create.roleLabel")}</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)} style={{ fontSize: "0.85rem", padding: "0.5rem 0.75rem" }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={handleCreate} disabled={isPending || !name.trim() || !email.trim()} className="btn btn-primary" style={{ height: "38px", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
              <UserPlus size={14} /> {isPending ? t("users.create.creatingBtn") : t("users.create.createBtn")}
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
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name || "")
  const [email, setEmail] = useState(user.email || "")
  const [role, setRole] = useState(user.role || "AGENT")
  const [vacationBalance, setVacationBalance] = useState(user.vacationBalance || 0)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const isTech = currentUserRole === "TECHNOLOGY" || currentUserRole === "TECHNOLOGY_ADMIN" || currentUserRole === "IT_MANAGER"
  const isSelf = user.id === currentUserId

  const handleCancel = () => {
    setName(user.name || "")
    setEmail(user.email || "")
    setRole(user.role || "AGENT")
    setVacationBalance(user.vacationBalance || 0)
    setEditing(false)
  }

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
        setMessage({ type: "success", text: t("users.actions.saved") })
        setEditing(false)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: result.error || t("users.actions.error") })
      }
    })
  }

  const handleInvite = () => {
    startTransition(async () => {
      const result = await inviteUser(user.id)
      if (result.success) {
        setMessage({ type: "success", text: t("users.actions.inviteSent") })
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: "error", text: result.error || t("users.actions.inviteError") })
        setTimeout(() => setMessage(null), 5000)
      }
    })
  }

  return (
    <tr className={`user-row-modern ${editing ? "user-row-editing" : ""} ${isSelected ? "user-row-selected" : ""}`}>
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
            title={isSelf ? t("users.table.selectSelfTooltip") : t("users.table.selectUserTooltip", { name: user.name })}
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
            fontSize: "0.9rem", fontWeight: 800,
            flexShrink: 0
          }}>
            {user.name?.charAt(0) || "U"}
          </div>
          <div>
            {editing ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="user-edit-input" 
                  style={{ fontSize: "0.85rem", width: "170px" }} 
                  autoFocus
                  placeholder={t("users.table.fullNamePlaceholder")}
                />
                <span className="user-editing-pill-badge">
                  {t("users.table.editing")}
                </span>
              </div>
            ) : (
              <div style={{ fontWeight: 700, fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                {user.name}
                {(user.isActive === false || user.status === "INACTIVE") && (
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "0.1rem 0.45rem",
                    borderRadius: "0.35rem",
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.25)"
                  }}>
                    {t("users.table.inactiveBadge")}
                  </span>
                )}
              </div>
            )}
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{user.position || t("users.table.defaultPosition")}</div>
          </div>
        </div>
      </td>

      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
        {editing ? (
          <input 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="user-edit-input" 
            style={{ fontSize: "0.85rem", width: "100%", maxWidth: "230px" }} 
            placeholder={t("users.table.emailPlaceholder")}
          />
        ) : (
          user.email
        )}
      </td>

      <td style={{ padding: "1rem" }}>
        {editing && isTech ? (
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)} 
            className="user-edit-input" 
            style={{ fontSize: "0.8rem", cursor: "pointer" }}
          >
            {ROLES.map(r => (
              <option key={r} value={r} style={{ background: "#0f172a", color: "#f8fafc" }}>
                {r}
              </option>
            ))}
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <input 
              type="number" 
              step="0.5" 
              value={vacationBalance} 
              onChange={e => setVacationBalance(Number(e.target.value))} 
              className="user-edit-input" 
              style={{ width: "70px" }} 
            />
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{t("users.table.days")}</span>
          </div>
        ) : (
          `${user.vacationBalance ?? 0} ${t("users.table.days")}`
        )}
      </td>

      <td style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {message && (
            <span 
              className="user-action-status-badge"
              style={{
                backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                borderColor: message.type === "success" ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
                color: message.type === "success" ? "#34d399" : "#f87171"
              }}
            >
              {message.text}
            </span>
          )}

          {/* Si es Technology: Cápsula de acciones moderna o modo edición */}
          {isTech ? (
            editing ? (
              <div className="action-edit-container">
                <button 
                  type="button"
                  onClick={handleSave} 
                  disabled={isPending} 
                  className="action-edit-btn-save"
                >
                  <Check size={13} />
                  <span>{isPending ? t("users.actions.saving") : t("users.actions.save")}</span>
                </button>
                <button 
                  type="button"
                  onClick={handleCancel} 
                  className="action-edit-btn-cancel"
                  title={t("users.actions.discardChanges")}
                >
                  <X size={13} />
                  <span>{t("users.actions.cancel")}</span>
                </button>
              </div>
            ) : (
              <div className="action-dock-container">
                <button 
                  type="button"
                  onClick={() => setEditing(true)} 
                  className="action-dock-btn action-dock-btn-edit"
                  title={t("users.actions.editTooltip", { name: user.name })}
                >
                  <Edit3 size={12.5} className="action-dock-icon" />
                  <span>{t("users.actions.edit")}</span>
                </button>

                <span className="action-dock-divider" />

                <button 
                  type="button"
                  onClick={handleInvite} 
                  disabled={isPending} 
                  className="action-dock-btn action-dock-btn-invite"
                  title={t("users.actions.inviteTooltip", { email: user.email })}
                >
                  <Send size={12} className="action-dock-icon" />
                  <span>{isPending ? t("users.actions.inviting") : t("users.actions.invite")}</span>
                </button>

                <span className="action-dock-divider" />

                <button 
                  type="button"
                  onClick={() => onDeleteRequest(user)} 
                  disabled={isPending || isSelf} 
                  className={`action-dock-btn action-dock-btn-delete ${isSelf ? "disabled" : ""}`}
                  title={isSelf ? t("users.actions.deleteSelfTooltip") : t("users.actions.deleteTooltip", { name: user.name })}
                >
                  <Trash2 size={13} className="action-dock-icon" />
                </button>
              </div>
            )
          ) : (
            /* Si es Supervisor/Manager: botón para solicitar cambio de rol */
            !isSelf && (
              <div className="action-dock-container">
                <button
                  type="button"
                  onClick={() => onRequestRole(user)}
                  className="action-dock-btn"
                  style={{ color: "hsl(var(--primary))" }}
                  title={t("users.actions.requestRoleTooltip")}
                >
                  <UserCheck size={13} style={{ color: "hsl(var(--primary))" }} />
                  <span>{t("users.actions.requestRole")}</span>
                </button>
              </div>
            )
          )}
        </div>
      </td>
    </tr>
  )
}

const USER_ACTIONS_STYLES = `
/* Estilos modernos y animados para la fila y acciones de usuarios */
.user-row-modern {
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  transition: background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.user-row-modern.user-row-selected {
  background-color: hsl(var(--primary) / 0.08) !important;
}

.user-row-modern.user-row-editing {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.06) 45%, rgba(15, 23, 42, 0.55) 100%) !important;
  box-shadow: inset 3.5px 0 0 #38bdf8, inset 0 1px 0 rgba(56, 189, 248, 0.2), inset 0 -1px 0 rgba(56, 189, 248, 0.2);
}

.user-edit-input {
  animation: subtleFieldPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  background: rgba(15, 23, 42, 0.85) !important;
  border: 1px solid rgba(56, 189, 248, 0.38) !important;
  color: #f8fafc !important;
  border-radius: 8px !important;
  padding: 0.35rem 0.65rem !important;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.12), 0 2px 6px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.2s ease !important;
  outline: none !important;
}

.user-edit-input:focus {
  border-color: #38bdf8 !important;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25), 0 2px 8px rgba(0, 0, 0, 0.35) !important;
}

@keyframes subtleFieldPop {
  from {
    opacity: 0;
    transform: translateY(-2px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.user-editing-pill-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  animation: subtlePulseBadge 2.2s infinite ease-in-out;
  white-space: nowrap;
}

@keyframes subtlePulseBadge {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; border-color: rgba(56, 189, 248, 0.65); transform: scale(1.02); }
}

/* Action Dock Cápsula */
.action-dock-container {
  display: inline-flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 3px 5px;
  gap: 3px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.action-dock-container:hover {
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.action-dock-divider {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 1px;
}

.action-dock-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  line-height: 1;
}

.action-dock-btn:active {
  transform: scale(0.96);
}

/* EDIT BUTTON */
.action-dock-btn-edit {
  color: #cbd5e1;
}
.action-dock-btn-edit .action-dock-icon {
  color: #38bdf8;
  transition: transform 0.2s ease;
}
.action-dock-btn-edit:hover {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.35);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.2);
  transform: translateY(-1px);
}
.action-dock-btn-edit:hover .action-dock-icon {
  transform: rotate(-12deg) scale(1.1);
}

/* INVITE BUTTON */
.action-dock-btn-invite {
  color: #cbd5e1;
}
.action-dock-btn-invite .action-dock-icon {
  color: #34d399;
  transition: transform 0.2s ease;
}
.action-dock-btn-invite:hover:not(:disabled) {
  background: rgba(52, 211, 153, 0.12);
  border-color: rgba(52, 211, 153, 0.35);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(52, 211, 153, 0.2);
  transform: translateY(-1px);
}
.action-dock-btn-invite:hover:not(:disabled) .action-dock-icon {
  transform: translateX(1px) translateY(-1px);
}
.action-dock-btn-invite:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* DELETE BUTTON */
.action-dock-btn-delete {
  padding: 5px 8px;
  color: #f87171;
}
.action-dock-btn-delete .action-dock-icon {
  transition: transform 0.2s ease;
}
.action-dock-btn-delete:hover:not(.disabled) {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.45);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
  transform: translateY(-1px);
}
.action-dock-btn-delete:hover:not(.disabled) .action-dock-icon {
  transform: scale(1.15);
}
.action-dock-btn-delete.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  color: #64748b;
}

/* EDIT MODE ACTIONS (animación sutil y disimulada) */
.action-edit-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  animation: editDockMorph 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes editDockMorph {
  from {
    opacity: 0;
    transform: translateY(-2px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.action-edit-btn-save {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1px solid rgba(16, 185, 129, 0.6);
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.action-edit-btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #34d399 0%, #059669 100%);
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
}

.action-edit-btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 11px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-edit-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* Feedback message badge */
.user-action-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  animation: subtleFieldPop 0.2s ease;
  white-space: nowrap;
}
`

export function UserManager({ 
  users, 
  currentUserRole = "TECHNOLOGY", 
  currentUserId = "" 
}: { 
  users: any[]
  currentUserRole?: string
  currentUserId?: string 
}) {
  const { t } = useTranslation()
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
  const isManager = currentUserRole === "MANAGER"
  const canCreate = isTech || isManager || currentUserRole === "HR" || currentUserRole === "CEO" || currentUserRole === "SUPERADMIN"

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
        setDeleteModalError(result.error || t("users.deleteModal.error"))
      }
    } catch (err: any) {
      setDeleteModalError(err?.message || t("users.deleteModal.error"))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendRoleRequest = () => {
    if (!requestModalUser || !reason.trim()) {
      setModalMessage({ type: "error", text: t("users.roleRequestModal.reasonRequired") })
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
        setModalMessage({ type: "success", text: t("users.roleRequestModal.success") })
        setReason("")
        setTimeout(() => {
          setRequestModalUser(null)
          setModalMessage(null)
        }, 2500)
      } else {
        setModalMessage({ type: "error", text: res.error || t("users.roleRequestModal.error") })
      }
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <style dangerouslySetInnerHTML={{ __html: USER_ACTIONS_STYLES }} />
      
      {/* Header reactivo traducible */}
      <header style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{ padding: "0.6rem", borderRadius: "0.75rem", backgroundColor: "hsl(25 90% 55% / 0.15)" }}>
            <Users size={24} style={{ color: "hsl(25 90% 55%)" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800 }}>{t("users.pageTitle")}</h1>
        </div>
        <p style={{ color: "hsl(var(--muted-foreground))", margin: 0 }}>
          {t("users.pageSubtitle")}
        </p>
      </header>

      {/* Paneles de Creación: Creación individual para Tecnología, Managers y Administradores; Carga masiva para Tecnología */}
      {canCreate && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.25rem" }}>
          <CreateUserPanel />
          {isTech && <BulkUploadPanel />}
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "420px" }}>
          <input
            className="input"
            placeholder={t("users.searchPlaceholder")}
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
              {rf === "ALL" ? t("users.allRoles") : rf}
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
              {selectedUserIds.length === 1 ? t("users.batch.selectedCount", { count: 1 }) : t("users.batch.selectedCountPlural", { count: selectedUserIds.length })}
            </span>
            <button
              type="button"
              onClick={() => setSelectedUserIds([])}
              className="btn btn-ghost"
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem", textDecoration: "underline", color: "hsl(var(--muted-foreground))" }}
            >
              {t("users.batch.deselectAll")}
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
            <Trash2 size={15} /> {selectedUserIds.length === 1 ? t("users.batch.deleteBtn", { count: 1 }) : t("users.batch.deleteBtnPlural", { count: selectedUserIds.length })}
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
                    title={t("users.table.selectAllTooltip")}
                  />
                </th>
              )}
              <th>{t("users.table.user")}</th>
              <th>{t("users.table.email")}</th>
              <th>{t("users.table.role")}</th>
              <th>{t("users.table.vacations")}</th>
              <th style={{ minWidth: "195px" }}>{t("users.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isTech ? 6 : 5} style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
                  {t("users.table.noUsersFound")}
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
                    ? t("users.deleteModal.titleSingle", { name: deleteModalUsers[0].name })
                    : t("users.deleteModal.titleMulti", { count: deleteModalUsers.length })
                  }
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.45 }}>
                  {t("users.deleteModal.description")}
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
                    color: ROLE_COLORS[u.role] || "hsl(var(--primary))"
                    ,flexShrink: 0
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
                {t("users.deleteModal.cancelBtn")}
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
                {isDeleting ? t("users.deleteModal.deletingBtn") : t("users.deleteModal.confirmBtn")}
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
              <UserCheck size={20} style={{ color: "hsl(var(--primary))" }} /> {t("users.roleRequestModal.title")}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", marginBottom: "1.25rem" }}>
              {t("users.roleRequestModal.subtitle")}
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
                <b>{t("users.roleRequestModal.userLabel")}</b> {requestModalUser.name} ({requestModalUser.email})
              </div>
              <div>
                <b>{t("users.roleRequestModal.currentRoleLabel")}</b> <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", backgroundColor: "hsl(var(--muted))", fontWeight: 700 }}>{requestModalUser.role}</span>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>{t("users.roleRequestModal.targetRoleLabel")}</label>
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
                <label style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>{t("users.roleRequestModal.reasonLabel")}</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("users.roleRequestModal.reasonPlaceholder")}
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
                {t("users.roleRequestModal.cancelBtn")}
              </button>
              <button
                type="button"
                onClick={handleSendRoleRequest}
                disabled={isPending || !reason.trim()}
                className="btn btn-primary"
                style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", fontWeight: 700, cursor: (isPending || !reason.trim()) ? "not-allowed" : "pointer" }}
              >
                {isPending ? t("users.roleRequestModal.submittingBtn") : t("users.roleRequestModal.submitBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
