"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { 
  X, 
  Check, 
  Settings, 
  Users, 
  Crown, 
  Shield, 
  Trash2, 
  Search, 
  Mail, 
  Palette, 
  Smile, 
  CheckCircle2, 
  AlertCircle,
  UserPlus,
  Layers,
  ArrowRight
} from "lucide-react"
import { 
  updateGroup, 
  addMembersToGroup, 
  removeMembersFromGroup, 
  setGroupLeaders 
} from "@/app/actions/groupActions"
import { useTranslation } from "@/lib/i18n/LanguageContext"

const COLOR_PRESETS = [
  "#3b82f6", // Azul
  "#06b6d4", // Cian
  "#10b981", // Esmeralda
  "#8b5cf6", // Morado
  "#ec4899", // Rosa
  "#f59e0b", // Ámbar
  "#ef4444", // Rojo
  "#6366f1", // Índigo
  "#14b8a6", // Teal
  "#64748b"  // Pizarra
]

const ICON_PRESETS = [
  "🏢", "🎧", "📞", "🎮", "📦", "⚡", "💻", "🛡️", "☕", "🤝", 
  "🏹", "🎯", "🦇", "💬", "🍒", "💳", "🔍", "📊", "👥", "🚀"
]

const ROLE_COLORS: Record<string, string> = {
  AGENT: "hsl(220 10% 50%)",
  USER: "hsl(220 10% 50%)",
  SUPERVISOR: "hsl(var(--primary))",
  TEAM_LEAD: "hsl(var(--primary))",
  MANAGER: "hsl(262 60% 55%)",
  HR: "hsl(165 60% 40%)",
  TECHNOLOGY: "hsl(25 90% 55%)",
  IT_MANAGER: "hsl(200 80% 50%)",
  TECHNOLOGY_ADMIN: "hsl(200 80% 50%)",
  NO_ROLE: "hsl(0 0% 50%)"
}

function UserAvatar({ user, size = 32 }: { user: any, size?: number }) {
  if (!user) return null
  const roleColor = ROLE_COLORS[user?.role] || "hsl(var(--primary))"
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: "50%", 
        backgroundColor: `${roleColor}20`, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        overflow: "hidden", 
        flexShrink: 0, 
        fontSize: `${size * 0.4}px`, 
        fontWeight: 800, 
        color: roleColor, 
        border: `1.5px solid ${roleColor}50`
      }}
    >
      {user.image ? (
        <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        user.name?.[0]?.toUpperCase() || "?"
      )}
    </div>
  )
}

interface GroupEditModalProps {
  isOpen: boolean
  initialTab?: "info" | "members" | "leaders"
  group: any
  allUsers: any[]
  onClose: () => void
}

export function GroupEditModal({
  isOpen,
  initialTab = "info",
  group,
  allUsers,
  onClose
}: GroupEditModalProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "members" | "leaders">(initialTab)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: "success" | "error", message: string } | null>(null)

  // Tab 1: Info State
  const [name, setName] = useState(group.name || "")
  const [description, setDescription] = useState(group.description || "")
  const [email, setEmail] = useState(group.email || "")
  const [icon, setIcon] = useState(group.icon || "🏢")
  const [color, setColor] = useState(group.color || "#3b82f6")
  const [image, setImage] = useState(group.image || "")

  // Tab 2: Members State
  const [memberSearch, setMemberSearch] = useState("")
  const [newMemberSearch, setNewMemberSearch] = useState("")
  const [selectedNewUserIds, setSelectedNewUserIds] = useState<Set<string>>(new Set())
  const [filterMode, setFilterMode] = useState<"all" | "unassigned" | "otherGroup">("all")

  // Tab 3: Leaders State
  const [supervisorIds, setSupervisorIds] = useState<string[]>(() => 
    (group.supervisors || []).map((s: any) => s.id)
  )
  const [subLeaderIds, setSubLeaderIds] = useState<string[]>(() => 
    (group.subLeaders || []).map((sl: any) => sl.id)
  )
  const [leaderSearch, setLeaderSearch] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      setName(group.name || "")
      setDescription(group.description || "")
      setEmail(group.email || "")
      setIcon(group.icon || "🏢")
      setColor(group.color || "#3b82f6")
      setImage(group.image || "")
      setSupervisorIds((group.supervisors || []).map((s: any) => s.id))
      setSubLeaderIds((group.subLeaders || []).map((sl: any) => sl.id))
      setSelectedNewUserIds(new Set())
      setFeedback(null)
    }
  }, [isOpen, initialTab, group])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, isPending, onClose])

  // Current member IDs in this group
  const currentMemberIds = useMemo(() => new Set((group.members || []).map((m: any) => m.id)), [group.members])

  // Filter available users to add as members
  const availableUsersToAdd = useMemo(() => {
    return allUsers.filter(u => {
      if (currentMemberIds.has(u.id)) return false

      const userGroups = u.projects || (u.project ? [u.project] : [])
      const hasAnyGroup = userGroups.length > 0 || Boolean(u.projectId)

      if (filterMode === "unassigned" && hasAnyGroup) return false
      if (filterMode === "otherGroup" && !hasAnyGroup) return false

      if (newMemberSearch.trim()) {
        const query = newMemberSearch.toLowerCase()
        const matchName = u.name?.toLowerCase().includes(query)
        const matchEmail = u.email?.toLowerCase().includes(query)
        const matchPos = u.position?.toLowerCase().includes(query)
        const matchRole = u.role?.toLowerCase().includes(query)
        if (!matchName && !matchEmail && !matchPos && !matchRole) return false
      }
      return true
    })
  }, [allUsers, currentMemberIds, filterMode, newMemberSearch])

  // Filter existing members
  const filteredCurrentMembers = useMemo(() => {
    if (!memberSearch.trim()) return group.members || []
    const q = memberSearch.toLowerCase()
    return (group.members || []).filter((m: any) => 
      m.name?.toLowerCase().includes(q) || 
      m.email?.toLowerCase().includes(q) || 
      m.position?.toLowerCase().includes(q)
    )
  }, [group.members, memberSearch])

  // Save General Information
  const handleSaveInfo = () => {
    if (!name.trim()) {
      setFeedback({ type: "error", message: t("groups.editModal.nameRequired") })
      return
    }

    const fd = new FormData()
    fd.set("name", name.trim())
    fd.set("description", description.trim())
    fd.set("email", email.trim())
    fd.set("icon", icon.trim())
    fd.set("color", color.trim())
    fd.set("image", image.trim())

    startTransition(async () => {
      const res = await updateGroup(group.id, fd)
      if (res.success) {
        setFeedback({ type: "success", message: t("groups.editModal.infoUpdated") })
        router.refresh()
        setTimeout(() => {
          setFeedback(null)
        }, 2500)
      } else {
        setFeedback({ type: "error", message: res.error || t("groups.editModal.infoError") })
      }
    })
  }

  // Toggle user for adding to members
  const toggleSelectNewUser = (id: string) => {
    setSelectedNewUserIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Add selected users to group
  const handleAddMembers = () => {
    const userIds = Array.from(selectedNewUserIds)
    if (userIds.length === 0) return

    startTransition(async () => {
      const res = await addMembersToGroup(group.id, userIds)
      if (res.success) {
        setSelectedNewUserIds(new Set())
        setFeedback({ type: "success", message: t("groups.editModal.membersAdded", { count: res.count }) })
        router.refresh()
        setTimeout(() => setFeedback(null), 2500)
      } else {
        setFeedback({ type: "error", message: res.error || t("groups.editModal.membersError") })
      }
    })
  }

  // Remove a member from the group
  const handleRemoveMember = (member: any) => {
    if (!confirm(t("groups.editModal.removeConfirm", { name: member.name }))) return

    startTransition(async () => {
      const res = await removeMembersFromGroup(group.id, [member.id])
      if (res.success) {
        setFeedback({ type: "success", message: t("groups.editModal.memberRemoved", { name: member.name }) })
        router.refresh()
        setTimeout(() => setFeedback(null), 2500)
      } else {
        setFeedback({ type: "error", message: res.error || t("groups.editModal.removeError") })
      }
    })
  }

  // Save Leadership (Supervisors and SubLeaders)
  const handleSaveLeadership = () => {
    startTransition(async () => {
      const res = await setGroupLeaders(group.id, supervisorIds, subLeaderIds)
      if (res.success) {
        setFeedback({ type: "success", message: t("groups.editModal.leadershipUpdated") })
        router.refresh()
        setTimeout(() => setFeedback(null), 2500)
      } else {
        setFeedback({ type: "error", message: res.error || t("groups.editModal.leadershipError") })
      }
    })
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999999,
        padding: "1rem",
        animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div
        style={{
          width: "min(780px, 95vw)",
          maxHeight: "90vh",
          backgroundColor: "#0d1527",
          border: `1.5px solid ${color}50`,
          borderRadius: "1.5rem",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 25px 60px -15px ${color}25, 0 0 0 1px rgba(255, 255, 255, 0.05)`,
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Top Accent Line */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${color}, ${color}80, transparent)` }} />

        {/* Modal Header */}
        <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "0.85rem",
                backgroundColor: `${color}25`,
                border: `1.5px solid ${color}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem"
              }}
            >
              {icon || "🏢"}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
                {t("groups.editModal.title", { name: group.name })}
              </h2>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                {t("groups.editModal.subtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)"
              e.currentTarget.style.color = "#ef4444"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
              e.currentTarget.style.color = "#94a3b8"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1.75rem", backgroundColor: "rgba(10, 17, 38, 0.7)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "0.75rem",
              border: "none",
              backgroundColor: activeTab === "info" ? "hsl(var(--primary))" : "transparent",
              color: activeTab === "info" ? "#ffffff" : "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Settings size={15} />
            <span>{t("groups.editModal.tabInfo")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "0.75rem",
              border: "none",
              backgroundColor: activeTab === "members" ? "hsl(var(--primary))" : "transparent",
              color: activeTab === "members" ? "#ffffff" : "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Users size={15} />
            <span>{t("groups.editModal.tabMembers", { count: group.members?.length || 0 })}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("leaders")}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "0.75rem",
              border: "none",
              backgroundColor: activeTab === "leaders" ? "hsl(var(--primary))" : "transparent",
              color: activeTab === "leaders" ? "#ffffff" : "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Crown size={15} />
            <span>{t("groups.editModal.tabLeaders", { count: (group.supervisors?.length || 0) + (group.subLeaders?.length || 0) })}</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            style={{
              margin: "1rem 1.75rem 0",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              backgroundColor: feedback.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: feedback.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
              color: feedback.type === "success" ? "#10b981" : "#ef4444"
            }}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body with Scroll */}
        <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* TAB 1: INFORMACIÓN GENERAL */}
          {activeTab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Nombre */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  {t("groups.editModal.nameLabel")}
                </label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t("groups.editModal.namePlaceholder")}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    fontSize: "0.95rem",
                    color: "#ffffff"
                  }}
                />
              </div>

              {/* Misión / Descripción */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  {t("groups.editModal.descLabel")}
                </label>
                <textarea
                  className="input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t("groups.editModal.descPlaceholder")}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    fontSize: "0.9rem",
                    color: "#ffffff",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Email de Contacto */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  {t("groups.editModal.emailLabel")}
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t("groups.editModal.emailPlaceholder")}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.6rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      fontSize: "0.9rem",
                      color: "#ffffff"
                    }}
                  />
                </div>
              </div>

              {/* Color Temático */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  {t("groups.editModal.colorLabel")}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "0.65rem",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      backgroundColor: "transparent"
                    }}
                    title={t("groups.editModal.customColorPicker")}
                  />
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: c,
                        border: color.toLowerCase() === c.toLowerCase() ? "3px solid #ffffff" : "2px solid transparent",
                        boxShadow: color.toLowerCase() === c.toLowerCase() ? `0 0 12px ${c}` : "none",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    />
                  ))}
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "0.5rem" }}>{color}</span>
                </div>
              </div>

              {/* Ícono / Emoji Representativo */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  {t("groups.editModal.iconLabel")}
                </label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    style={{
                      width: 64,
                      height: 44,
                      textAlign: "center",
                      fontSize: "1.5rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff"
                    }}
                    placeholder="🏢"
                  />
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {t("groups.editModal.iconHint")}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {ICON_PRESETS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "0.6rem",
                        backgroundColor: icon === ic ? "hsl(var(--primary) / 0.25)" : "rgba(255, 255, 255, 0.05)",
                        border: icon === ic ? "1.5px solid hsl(var(--primary))" : "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s"
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Guardar Info */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={handleSaveInfo}
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.75rem",
                    borderRadius: "0.75rem",
                    fontWeight: 700,
                    fontSize: "0.95rem"
                  }}
                >
                  <Check size={16} />
                  <span>{isPending ? t("groups.editModal.savingInfo") : t("groups.editModal.saveInfoBtn")}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INTEGRANTES */}
          {activeTab === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Sección Sumar Nuevos Integrantes */}
              <div
                style={{
                  padding: "1.25rem",
                  borderRadius: "1rem",
                  backgroundColor: "rgba(10, 17, 38, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserPlus size={16} color="hsl(var(--primary))" />
                    <span>{t("groups.editModal.addMembersTitle")}</span>
                  </div>
                  {selectedNewUserIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleAddMembers}
                      disabled={isPending}
                      className="btn btn-primary"
                      style={{
                        padding: "0.4rem 0.85rem",
                        borderRadius: "0.6rem",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem"
                      }}
                    >
                      <Check size={14} />
                      <span>{t("groups.editModal.addSelectedBtn", { count: selectedNewUserIds.size })}</span>
                    </button>
                  )}
                </div>

                {/* Filtro y Buscador */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                    <Search size={15} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="text"
                      className="input"
                      value={newMemberSearch}
                      onChange={e => setNewMemberSearch(e.target.value)}
                      placeholder={t("groups.editModal.searchNewPlaceholder")}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.85rem 0.55rem 2.4rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: "0.85rem",
                        color: "#ffffff"
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    <button
                      type="button"
                      onClick={() => setFilterMode("all")}
                      style={{
                        padding: "0.4rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        backgroundColor: filterMode === "all" ? "hsl(var(--primary) / 0.25)" : "transparent",
                        color: filterMode === "all" ? "#ffffff" : "#94a3b8",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {t("common.all")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("unassigned")}
                      style={{
                        padding: "0.4rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        backgroundColor: filterMode === "unassigned" ? "hsl(var(--primary) / 0.25)" : "transparent",
                        color: filterMode === "unassigned" ? "#ffffff" : "#94a3b8",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {t("groups.editModal.tabUnassigned")}
                    </button>
                  </div>
                </div>

                {/* Lista de usuarios disponibles */}
                <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem", paddingRight: "4px" }}>
                  {availableUsersToAdd.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                      {t("groups.editModal.noNewMembers")}
                    </div>
                  ) : (
                    availableUsersToAdd.slice(0, 40).map(u => {
                      const isSelected = selectedNewUserIds.has(u.id)
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleSelectNewUser(u.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "0.6rem",
                            backgroundColor: isSelected ? "hsl(var(--primary) / 0.15)" : "rgba(255, 255, 255, 0.03)",
                            border: isSelected ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                            cursor: "pointer",
                            transition: "background 0.15s"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by row click
                            style={{ cursor: "pointer" }}
                          />
                          <UserAvatar user={u} size={28} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                              <span>{u.position || u.role}</span>
                              {u.projects && u.projects.length > 0 ? (
                                u.projects.map((p: any) => (
                                  <span key={p.id} style={{ fontSize: "0.68rem", color: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.12)", padding: "0.05rem 0.4rem", borderRadius: "0.3rem" }}>
                                    {p.icon || "📍"} {p.name}
                                  </span>
                                ))
                              ) : u.project?.name ? (
                                <span style={{ fontSize: "0.68rem", color: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.12)", padding: "0.05rem 0.4rem", borderRadius: "0.3rem" }}>
                                  📍 {u.project.name}
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                  • {t("groups.editModal.unassignedMember")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Lista de Integrantes Actuales */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff" }}>
                    {t("groups.editModal.currentMembersTitle", { count: group.members?.length || 0 })}
                  </div>
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder={t("groups.editModal.searchCurrentPlaceholder")}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "0.8rem",
                      color: "#ffffff",
                      width: "220px"
                    }}
                  />
                </div>

                <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", paddingRight: "4px" }}>
                  {filteredCurrentMembers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                      {t("groups.editModal.noCurrentMembers")}
                    </div>
                  ) : (
                    filteredCurrentMembers.map((m: any) => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.55rem 0.85rem",
                          borderRadius: "0.65rem",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                          <UserAvatar user={m} size={32} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {m.name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                              {m.position || t("groups.dashboard.defaultRoleMember")} • {m.email}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m)}
                          disabled={isPending}
                          title={t("groups.editModal.removeMemberTitle", { name: m.name })}
                          style={{
                            padding: "0.4rem 0.6rem",
                            borderRadius: "0.5rem",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <Trash2 size={13} />
                          <span>{t("groups.editModal.removeShortBtn")}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LIDERAZGO */}
          {activeTab === "leaders" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Buscador de usuarios para asignar como líderes */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "0.4rem" }}>
                  {t("groups.editModal.searchLeadershipPlaceholder")}
                </label>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    value={leaderSearch}
                    onChange={e => setLeaderSearch(e.target.value)}
                    placeholder={t("groups.editModal.searchLeadershipPlaceholder")}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem 0.6rem 2.4rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      fontSize: "0.85rem",
                      color: "#ffffff"
                    }}
                  />
                </div>

                {leaderSearch.trim() && (
                  <div style={{ maxHeight: "150px", overflowY: "auto", marginTop: "0.5rem", borderRadius: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.1)", backgroundColor: "#0f172a", padding: "0.35rem" }}>
                    {allUsers
                      .filter(u => u.name?.toLowerCase().includes(leaderSearch.toLowerCase()) || u.position?.toLowerCase().includes(leaderSearch.toLowerCase()))
                      .slice(0, 10)
                      .map(u => (
                        <div
                          key={u.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "0.5rem",
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            marginBottom: "0.25rem"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <UserAvatar user={u} size={24} />
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff" }}>{u.name}</span>
                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>({u.position || u.role})</span>
                          </div>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!supervisorIds.includes(u.id)) {
                                  setSupervisorIds(prev => [...prev, u.id])
                                  setSubLeaderIds(prev => prev.filter(id => id !== u.id))
                                }
                                setLeaderSearch("")
                              }}
                              style={{
                                padding: "0.25rem 0.55rem",
                                borderRadius: "0.4rem",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                backgroundColor: "rgba(245, 158, 11, 0.15)",
                                border: "1px solid rgba(245, 158, 11, 0.3)",
                                color: "#f59e0b",
                                cursor: "pointer"
                              }}
                            >
                              {t("groups.leadersModal.assignSupervisor")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!subLeaderIds.includes(u.id)) {
                                  setSubLeaderIds(prev => [...prev, u.id])
                                  setSupervisorIds(prev => prev.filter(id => id !== u.id))
                                }
                                setLeaderSearch("")
                              }}
                              style={{
                                padding: "0.25rem 0.55rem",
                                borderRadius: "0.4rem",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                backgroundColor: "rgba(139, 92, 246, 0.15)",
                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                color: "#a78bfa",
                                cursor: "pointer"
                              }}
                            >
                              {t("groups.leadersModal.assignSubLeader")}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Líderes de Escuadrón Actuales */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.95rem",
                  backgroundColor: "rgba(245, 158, 11, 0.06)",
                  border: "1px solid rgba(245, 158, 11, 0.2)"
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f59e0b", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Crown size={15} />
                  <span>{t("groups.editModal.supervisorsTitle")} ({supervisorIds.length})</span>
                </div>
                {supervisorIds.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                    {t("groups.editModal.noSupervisorsAssigned")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {supervisorIds.map(id => {
                      const u = allUsers.find(user => user.id === id) || (group.supervisors || []).find((s: any) => s.id === id)
                      if (!u) return null
                      return (
                        <div
                          key={id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            color: "#ffffff",
                            fontSize: "0.85rem",
                            fontWeight: 700
                          }}
                        >
                          <UserAvatar user={u} size={22} />
                          <span>{u.name}</span>
                          <button
                            type="button"
                            onClick={() => setSupervisorIds(prev => prev.filter(x => x !== id))}
                            style={{
                              border: "none",
                              backgroundColor: "transparent",
                              color: "#f59e0b",
                              cursor: "pointer",
                              padding: "0 2px",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title={t("groups.leadersModal.removeSupervisorTitle")}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sub-Líderes Actuales */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.95rem",
                  backgroundColor: "rgba(139, 92, 246, 0.06)",
                  border: "1px solid rgba(139, 92, 246, 0.2)"
                }}
              >
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#a78bfa", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Shield size={15} />
                  <span>{t("groups.editModal.subLeadersTitle")} ({subLeaderIds.length})</span>
                </div>
                {subLeaderIds.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                    {t("groups.editModal.noSubLeadersAssigned")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {subLeaderIds.map(id => {
                      const u = allUsers.find(user => user.id === id) || (group.subLeaders || []).find((sl: any) => sl.id === id)
                      if (!u) return null
                      return (
                        <div
                          key={id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(139, 92, 246, 0.15)",
                            border: "1px solid rgba(139, 92, 246, 0.35)",
                            color: "#ffffff",
                            fontSize: "0.85rem",
                            fontWeight: 700
                          }}
                        >
                          <UserAvatar user={u} size={22} />
                          <span>{u.name}</span>
                          <button
                            type="button"
                            onClick={() => setSubLeaderIds(prev => prev.filter(x => x !== id))}
                            style={{
                              border: "none",
                              backgroundColor: "transparent",
                              color: "#a78bfa",
                              cursor: "pointer",
                              padding: "0 2px",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title={t("groups.leadersModal.removeSubLeaderTitle")}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Botón Guardar Liderazgo */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={handleSaveLeadership}
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.75rem",
                    borderRadius: "0.75rem",
                    fontWeight: 700,
                    fontSize: "0.95rem"
                  }}
                >
                  <Check size={16} />
                  <span>{isPending ? t("groups.editModal.savingLeadership") : t("groups.editModal.saveLeadershipBtn")}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  )
}
