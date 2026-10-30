"use client"

import { useState, useTransition, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { 
  createGroup, 
  updateGroup, 
  deleteGroup, 
  addMembersToGroup, 
  removeMembersFromGroup,
  setGroupLeaders,
  assignUserToGroups
} from "@/app/actions/groupActions"
import { 
  Users, 
  UserPlus, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Crown, 
  UserMinus, 
  Plus, 
  Phone, 
  Search, 
  Users2, 
  Shield, 
  Settings, 
  ExternalLink,
  AlertTriangle,
  Sparkles,
  CheckSquare,
  Square,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter,
  UserCheck,
  Building,
  Mail,
  Palette
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/LanguageContext"

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

const COLOR_PRESETS = [
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#64748b"  // Slate
]

const ICON_PRESETS = ["🏢", "🎧", "📞", "🎮", "📦", "⚡", "💻", "🛡️", "☕", "🤝", "🏹", "🎯", "🦇", "💬", "🍒", "💳", "🔍", "📊", "👥", "🚀"]

function Avatar({ user, size = 32 }: { user: any, size?: number }) {
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
        border: `1.5px solid ${roleColor}50`,
        boxShadow: `0 0 10px ${roleColor}15`, 
        transition: "transform 0.2s"
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

// =========================================================================
// MODAL DE CONFIRMACIÓN EN EL CENTRO DE LA PANTALLA
// =========================================================================
interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  members?: any[]
  isDestructive?: boolean
  confirmText?: string
  cancelText?: string
  isPending?: boolean
  errorMessage?: string | null
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  isOpen,
  title,
  description,
  members = [],
  isDestructive = true,
  confirmText,
  cancelText,
  isPending = false,
  errorMessage = null,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const { t } = useTranslation()
  const resolvedConfirmText = confirmText || t("groups.confirm.confirmBtn")
  const resolvedCancelText = cancelText || t("groups.confirm.cancelBtn")
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

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
        zIndex: 9999999,
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel()
      }}
    >
      <div 
        style={{
          width: "min(520px, 94vw)",
          backgroundColor: "#0f172a",
          border: isDestructive ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid hsl(var(--primary) / 0.4)",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow: isDestructive 
            ? "0 25px 60px -15px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)" 
            : "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          position: "relative",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Header Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div 
            style={{
              width: 52,
              height: 52,
              borderRadius: "1rem",
              backgroundColor: isDestructive ? "rgba(239, 68, 68, 0.15)" : "hsl(var(--primary) / 0.15)",
              border: isDestructive ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid hsl(var(--primary) / 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: isDestructive ? "0 0 20px rgba(239, 68, 68, 0.2)" : "0 0 20px hsl(var(--primary) / 0.2)"
            }}
          >
            {isDestructive ? (
              <Trash2 size={26} color="#ef4444" />
            ) : (
              <AlertTriangle size={26} color="hsl(var(--primary))" />
            )}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {title}
            </h3>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              {description}
            </p>
          </div>
        </div>

        {/* Member preview if removing members */}
        {members && members.length > 0 && (
          <div 
            style={{
              maxHeight: "160px",
              overflowY: "auto",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "0.875rem",
              padding: "0.6rem 0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem"
            }}
          >
            {members.filter(Boolean).map(m => (
              <div 
                key={m.id || Math.random()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.35rem 0.5rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.03)"
                }}
              >
                <Avatar user={m} size={26} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", flex: 1 }}>
                  {m.name}
                </span>
                {m.position && (
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "0.15rem 0.45rem", borderRadius: "9999px" }}>
                    {m.position}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mensaje de error si la acción falla */}
        {errorMessage && (
          <div 
            style={{ 
              padding: "0.65rem 0.85rem", 
              borderRadius: "0.75rem", 
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button 
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="btn btn-surface"
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "0.75rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#94a3b8"
            }}
          >
            {resolvedCancelText}
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              fontSize: "0.9rem",
              fontWeight: 800,
              color: "#ffffff",
              backgroundColor: isDestructive ? "#dc2626" : "hsl(var(--primary))",
              border: "none",
              cursor: isPending ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: isDestructive ? "0 4px 18px rgba(220, 38, 38, 0.4)" : "0 4px 18px hsl(var(--primary) / 0.4)",
              transition: "transform 0.15s, opacity 0.15s",
              opacity: isPending ? 0.7 : 1
            }}
            onMouseEnter={e => { if (!isPending) e.currentTarget.style.transform = "scale(1.02)" }}
            onMouseLeave={e => { if (!isPending) e.currentTarget.style.transform = "scale(1)" }}
          >
            {isPending ? (
              <>
                <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                <span>{t("groups.confirm.processing")}</span>
              </>
            ) : (
              <>
                {isDestructive ? <Trash2 size={16} /> : <Check size={16} />}
                <span>{resolvedConfirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// =========================================================================
// MODAL MULTI-SELECCIÓN: AGREGAR INTEGRANTES (SUMAR INTEGRANTES)
// =========================================================================
interface AddMembersModalProps {
  group: any
  allUsers: any[]
  onClose: () => void
  onMembersAdded?: (groupId: string, userIds: string[]) => void
}

function AddMembersModal({ group, allUsers, onClose, onMembersAdded }: AddMembersModalProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [search, setSearch] = useState("")
  const [filterMode, setFilterMode] = useState<"all" | "unassigned" | "otherGroup">("all")
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: "success" | "error", message: string } | null>(null)

  // Current member IDs in this group
  const currentMemberIds = useMemo(() => new Set(group.members.map((m: any) => m.id)), [group.members])
  const currentSupervisorIds = useMemo(() => new Set(group.supervisors?.map((s: any) => s.id) || []), [group.supervisors])

  // Available users (not already a member in this group)
  const availableUsers = useMemo(() => {
    return allUsers.filter(u => {
      // Must not be already a member of this exact group
      if (currentMemberIds.has(u.id)) return false

      const userGroups = u.projects || (u.project ? [u.project] : [])
      const hasAnyGroup = userGroups.length > 0 || Boolean(u.projectId)

      // Filter tabs
      if (filterMode === "unassigned" && hasAnyGroup) return false
      if (filterMode === "otherGroup" && !hasAnyGroup) return false

      // Search match
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchName = u.name?.toLowerCase().includes(query)
        const matchEmail = u.email?.toLowerCase().includes(query)
        const matchPos = u.position?.toLowerCase().includes(query)
        const matchRole = u.role?.toLowerCase().includes(query)
        return matchName || matchEmail || matchPos || matchRole
      }
      return true
    })
  }, [allUsers, currentMemberIds, filterMode, search])

  // Toggle single user
  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  // Toggle select all visible
  const toggleSelectAll = () => {
    if (selectedUserIds.size === availableUsers.length && availableUsers.length > 0) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(availableUsers.map(u => u.id)))
    }
  }

  // Execute Batch Add with Server Action and REST API fallback
  const handleAddSelected = () => {
    const userIds = Array.from(selectedUserIds)
    if (userIds.length === 0) return

    startTransition(async () => {
      let success = false
      let errorMsg = ""

      try {
        const result = await addMembersToGroup(group.id, userIds)
        if (result && result.success) success = true
        else if (result && result.error) errorMsg = result.error
      } catch (err: any) {
        console.warn("Server action failed, trying REST API...", err)
      }

      if (!success) {
        try {
          const res = await fetch("/api/admin/groups/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: group.id, userIds })
          })
          const data = await res.json()
          if (data && data.success) success = true
          else errorMsg = data?.error || "Error al agregar integrantes."
        } catch (apiErr: any) {
          errorMsg = apiErr?.message || "Error al conectar con el servidor."
        }
      }

      if (success) {
        if (onMembersAdded) onMembersAdded(group.id, userIds)
        setFeedback({ 
          type: "success", 
          message: t("groups.addModal.success", { count: userIds.length, group: group.name }) 
        })
        setTimeout(() => {
          onClose()
        }, 900)
      } else {
        setFeedback({ 
          type: "error", 
          message: errorMsg || t("groups.addModal.error") 
        })
      }
    })
  }

  if (!mounted) return null

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
        backgroundColor: "rgba(0, 0, 0, 0.75)", 
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 9999999,
        padding: "1rem",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div 
        style={{ 
          width: "min(680px, 96vw)", 
          height: "min(720px, 90vh)", 
          display: "flex", 
          flexDirection: "column", 
          backgroundColor: "#0b1329",
          border: "1px solid hsl(var(--primary) / 0.4)", 
          borderRadius: "1.5rem",
          boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: "1.5rem 1.75rem", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent)",
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div 
              style={{ 
                width: 44, 
                height: 44, 
                borderRadius: "0.875rem", 
                backgroundColor: "hsl(var(--primary) / 0.2)",
                border: "1px solid hsl(var(--primary) / 0.35)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "hsl(var(--primary))"
              }}
            >
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
                {t("groups.addModal.title", { name: group.name })}
              </h3>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                {t("groups.addModal.subtitle")}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="btn btn-surface" 
            style={{ 
              padding: "0.5rem", 
              borderRadius: "50%", 
              color: "#94a3b8",
              backgroundColor: "rgba(255, 255, 255, 0.05)" 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ padding: "1.25rem 1.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Search Input */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search 
              size={18} 
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} 
            />
            <input 
              className="input" 
              placeholder={t("groups.addModal.searchPlaceholder")} 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ 
                width: "100%",
                padding: "0.8rem 2.5rem 0.8rem 2.85rem",
                borderRadius: "0.875rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff"
              }} 
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs & Select All */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: filterMode === "all" ? "1px solid hsl(var(--primary))" : "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: filterMode === "all" ? "hsl(var(--primary) / 0.2)" : "transparent",
                  color: filterMode === "all" ? "hsl(var(--primary))" : "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {t("groups.addModal.tabAll", { count: allUsers.length - currentMemberIds.size })}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unassigned")}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: filterMode === "unassigned" ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: filterMode === "unassigned" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                  color: filterMode === "unassigned" ? "#10b981" : "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {t("groups.addModal.tabUnassigned")}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("otherGroup")}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: filterMode === "otherGroup" ? "1px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: filterMode === "otherGroup" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                  color: filterMode === "otherGroup" ? "#f59e0b" : "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {t("groups.addModal.tabOtherGroup")}
              </button>
            </div>

            {availableUsers.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "hsl(var(--primary))",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.3rem 0.5rem"
                }}
              >
                {selectedUserIds.size === availableUsers.length && availableUsers.length > 0 ? (
                  <>
                    <CheckSquare size={14} /> {t("groups.addModal.deselectVisible")}
                  </>
                ) : (
                  <>
                    <Square size={14} /> {t("groups.addModal.selectAll", { count: availableUsers.length })}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div 
            style={{
              margin: "0 1.75rem 0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: feedback.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              color: feedback.type === "success" ? "#10b981" : "#ef4444",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {feedback.message}
          </div>
        )}

        {/* Scrollable Users List */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "0 1.75rem 1rem",
            display: "flex", 
            flexDirection: "column", 
            gap: "0.45rem" 
          }}
        >
          {availableUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#94a3b8" }}>
              <Users size={44} style={{ opacity: 0.25, margin: "0 auto 1rem", display: "block" }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f8fafc" }}>
                {t("groups.addModal.noAvailable")}
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.35rem 0 0" }}>
                {search ? t("groups.addModal.noMatchQuery", { search }) : t("groups.addModal.allAlreadyAssigned")}
              </p>
            </div>
          ) : (
            availableUsers.map((u) => {
              const isSelected = selectedUserIds.has(u.id)
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.875rem",
                    backgroundColor: isSelected ? "hsl(var(--primary) / 0.12)" : "rgba(15, 23, 42, 0.5)",
                    border: isSelected ? "1.5px solid hsl(var(--primary))" : "1px solid rgba(255, 255, 255, 0.06)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 4px 15px hsl(var(--primary) / 0.1)" : "none"
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)"
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)"
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.5)"
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div 
                    style={{ 
                      width: 22, 
                      height: 22, 
                      borderRadius: "6px",
                      border: isSelected ? "none" : "1.5px solid rgba(255, 255, 255, 0.3)",
                      backgroundColor: isSelected ? "hsl(var(--primary))" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#ffffff",
                      transition: "all 0.15s"
                    }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>

                  {/* Avatar */}
                  <Avatar user={u} size={36} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.name}
                      </span>
                      {u.position && (
                        <span 
                          style={{ 
                            fontSize: "0.68rem", 
                            fontWeight: 700, 
                            color: "hsl(var(--primary))", 
                            backgroundColor: "hsl(var(--primary) / 0.15)",
                            padding: "0.1rem 0.45rem",
                            borderRadius: "9999px"
                          }}
                        >
                          {u.position}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.email}
                      </span>
                      {u.projects && u.projects.length > 0 ? (
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                          {u.projects.map((p: any) => (
                            <span key={p.id} style={{ fontSize: "0.68rem", color: p.color || "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.12)", padding: "0.05rem 0.4rem", borderRadius: "0.3rem" }}>
                              {p.icon || "📍"} {p.name}
                            </span>
                          ))}
                        </div>
                      ) : u.project?.name ? (
                        <span style={{ fontSize: "0.7rem", color: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.12)", padding: "0.1rem 0.4rem", borderRadius: "0.3rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          📍 {u.project.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div 
          style={{ 
            padding: "1rem 1.75rem", 
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(10, 17, 38, 0.95)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            gap: "1rem" 
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: selectedUserIds.size > 0 ? "hsl(var(--primary))" : "#94a3b8" }}>
              {selectedUserIds.size === 0 
                ? t("groups.addModal.noneSelected") 
                : t("groups.addModal.selectedCount", { count: selectedUserIds.size })}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn btn-surface"
              style={{ padding: "0.65rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem", fontWeight: 700 }}
            >
              {t("groups.addModal.cancelBtn")}
            </button>
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={isPending || selectedUserIds.size === 0}
              className="btn btn-primary"
              style={{
                padding: "0.65rem 1.5rem",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: selectedUserIds.size === 0 ? 0.5 : 1,
                cursor: selectedUserIds.size === 0 || isPending ? "not-allowed" : "pointer",
                boxShadow: "0 4px 18px hsl(var(--primary) / 0.35)"
              }}
            >
              {isPending ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                  <span>{t("groups.addModal.adding")}</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>{t("groups.addModal.addBtn", { count: selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : "" })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// =========================================================================
// MODAL ASIGNAR MÚLTIPLES GRUPOS A UN COLABORADOR
// =========================================================================
interface AssignMultiGroupModalProps {
  allUsers: any[]
  groups: any[]
  onClose: () => void
  onUserGroupsUpdated?: (userId: string, updatedGroupIds: string[]) => void
}

function AssignMultiGroupModal({ allUsers, groups, onClose, onUserGroupsUpdated }: AssignMultiGroupModalProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [userSearch, setUserSearch] = useState("")
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: "success" | "error", message: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPending, onClose])

  const selectedUser = useMemo(() => {
    return allUsers.find(u => u.id === selectedUserId)
  }, [allUsers, selectedUserId])

  const handleSelectUser = (user: any) => {
    setSelectedUserId(user.id)
    setFeedback(null)
    const gIds = new Set<string>()
    if (user.projects && Array.isArray(user.projects)) {
      user.projects.forEach((p: any) => gIds.add(p.id))
    }
    if (user.projectId) {
      gIds.add(user.projectId)
    }
    groups.forEach(g => {
      if ((g.members || []).some((m: any) => m.id === user.id)) {
        gIds.add(g.id)
      }
    })
    setSelectedGroupIds(gIds)
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleSave = () => {
    if (!selectedUserId) return
    const groupIds = Array.from(selectedGroupIds)
    startTransition(async () => {
      const res = await assignUserToGroups(selectedUserId, groupIds)
      if (res && res.success) {
        setFeedback({ 
          type: "success", 
          message: t("groups.multiGroup.saveSuccess", { name: selectedUser?.name || "Colaborador", count: groupIds.length }) 
        })
        if (onUserGroupsUpdated) {
          onUserGroupsUpdated(selectedUserId, groupIds)
        }
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        setFeedback({ type: "error", message: res?.error || t("groups.multiGroup.saveError") })
      }
    })
  }

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers.slice(0, 20)
    const q = userSearch.toLowerCase().trim()
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) || 
      u.position?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    ).slice(0, 30)
  }, [allUsers, userSearch])

  if (!mounted) return null

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
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div 
        style={{ 
          width: "min(740px, 96vw)", 
          height: "min(740px, 92vh)", 
          display: "flex", 
          flexDirection: "column", 
          backgroundColor: "#0b1329",
          border: "1px solid hsl(var(--primary) / 0.4)", 
          borderRadius: "1.5rem",
          boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            padding: "1.25rem 1.75rem", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(90deg, rgba(59, 130, 246, 0.12), transparent)",
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div 
              style={{ 
                width: 44, 
                height: 44, 
                borderRadius: "0.875rem", 
                backgroundColor: "hsl(var(--primary) / 0.2)",
                border: "1px solid hsl(var(--primary) / 0.35)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "hsl(var(--primary))" 
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.01em" }}>
                {t("groups.multiGroup.title")}
              </h2>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>
                {t("groups.multiGroup.subtitle")}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{ 
              width: 34, 
              height: 34, 
              borderRadius: "50%", 
              backgroundColor: "rgba(255, 255, 255, 0.05)", 
              border: "1px solid rgba(255, 255, 255, 0.08)", 
              color: "#94a3b8", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div 
            style={{
              margin: "1rem 1.75rem 0",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: feedback.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              color: feedback.type === "success" ? "#10b981" : "#ef4444",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {feedback.message}
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* User Selection Box */}
          <div style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", borderRadius: "1rem", padding: "1rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              1. {t("groups.multiGroup.selectUserPrompt")}
            </label>
            <div style={{ position: "relative", marginBottom: "0.75rem" }}>
              <Search size={15} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                className="input"
                placeholder={t("groups.multiGroup.searchUserPlaceholder")}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "2.4rem",
                  fontSize: "0.85rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(10, 17, 38, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)"
                }}
              />
            </div>

            {/* User chips or selected user banner */}
            {selectedUser ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--primary) / 0.12)", border: "1.5px solid hsl(var(--primary))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Avatar user={selectedUser} size={36} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#ffffff" }}>{selectedUser.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.1rem" }}>
                      <span>{selectedUser.email}</span>
                      <span style={{ padding: "0.05rem 0.4rem", borderRadius: "9999px", backgroundColor: "hsl(var(--primary) / 0.2)", color: "hsl(var(--primary))", fontWeight: 700 }}>
                        {selectedUser.role}
                      </span>
                      {selectedUser.position && <span>• {selectedUser.position}</span>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedUserId(""); setSelectedGroupIds(new Set()); }}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      cursor: "pointer",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <Avatar user={u} size={28} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#ffffff" }}>{u.name}</span>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginLeft: "0.5rem" }}>{u.position || u.role}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "hsl(var(--primary))", fontWeight: 700 }}>
                      Seleccionar →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group Checklist (Available when a user is selected) */}
          {selectedUser && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    2. {t("groups.multiGroup.selectGroupsTitle")}
                  </label>
                  <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                    {t("groups.multiGroup.selectGroupsHelp")}
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: selectedGroupIds.size > 0 ? "#10b981" : "#f59e0b" }}>
                  {t("groups.multiGroup.assignedToGroups", { count: selectedGroupIds.size })}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.65rem", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                {groups.map(g => {
                  const isChecked = selectedGroupIds.has(g.id)
                  const isSupervisor = (g.supervisors || []).some((s: any) => s.id === selectedUser.id)
                  const isSubLeader = (g.subLeaders || []).some((sl: any) => sl.id === selectedUser.id)

                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGroup(g.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 0.85rem",
                        borderRadius: "0.85rem",
                        backgroundColor: isChecked ? `${g.color || "#3b82f6"}18` : "rgba(15, 23, 42, 0.5)",
                        border: isChecked ? `1.5px solid ${g.color || "#3b82f6"}` : "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "5px",
                          border: isChecked ? "none" : "1.5px solid rgba(255, 255, 255, 0.3)",
                          backgroundColor: isChecked ? (g.color || "hsl(var(--primary))") : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0
                        }}
                      >
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>

                      <div style={{ fontSize: "1.2rem", flexShrink: 0 }}>
                        {g.icon || "🏢"}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem", flexWrap: "wrap" }}>
                          {isSupervisor && (
                            <span style={{ fontSize: "0.62rem", color: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.15)", padding: "0.05rem 0.35rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                              👑 {t("groups.multiGroup.roleSupervisor")}
                            </span>
                          )}
                          {isSubLeader && (
                            <span style={{ fontSize: "0.62rem", color: "#818cf8", backgroundColor: "rgba(129, 140, 248, 0.15)", padding: "0.05rem 0.35rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                              🛡️ {t("groups.multiGroup.roleSubLeader")}
                            </span>
                          )}
                          <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                            {(g.members || []).length} miembros
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{ 
            padding: "1rem 1.75rem", 
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(10, 17, 38, 0.95)",
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <button 
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="btn btn-surface"
            style={{ padding: "0.65rem 1.25rem", borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.85rem" }}
          >
            {t("common.cancel") || "Cancelar"}
          </button>

          <button 
            type="button"
            onClick={handleSave}
            disabled={isPending || !selectedUserId}
            className="btn btn-primary"
            style={{ 
              padding: "0.65rem 1.5rem", 
              borderRadius: "0.75rem", 
              fontWeight: 800, 
              fontSize: "0.88rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: (isPending || !selectedUserId) ? "not-allowed" : "pointer",
              opacity: (isPending || !selectedUserId) ? 0.6 : 1
            }}
          >
            {isPending ? (
              <>
                <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{t("groups.multiGroup.saveBtn", { count: selectedGroupIds.size })}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// =========================================================================
// MODAL GESTIONAR LÍDERES Y SUB-LÍDERES (ASIGNAR LIDERAZGO)
// =========================================================================
interface ManageLeadersModalProps {
  group: any
  allUsers: any[]
  onClose: () => void
  onLeadersUpdated?: (groupId: string, supervisors: any[], subLeaders: any[]) => void
}

function ManageLeadersModal({ group, allUsers, onClose, onLeadersUpdated }: ManageLeadersModalProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [filterMode, setFilterMode] = useState<"leadership" | "group_members" | "all">("leadership")
  
  // Selected IDs Sets
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<Set<string>>(() => {
    return new Set((group.supervisors || []).map((s: any) => s.id))
  })
  const [selectedSubLeaderIds, setSelectedSubLeaderIds] = useState<Set<string>>(() => {
    return new Set((group.subLeaders || []).map((s: any) => s.id))
  })

  const [isPending, setIsPending] = useState(false)
  const [, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPending, onClose])

  // Lookup map for fast user resolution
  const userMap = useMemo(() => {
    const map = new Map<string, any>()
    for (const u of allUsers) {
      map.set(u.id, u)
    }
    for (const s of (group.supervisors || [])) {
      if (!map.has(s.id)) map.set(s.id, s)
    }
    for (const sl of (group.subLeaders || [])) {
      if (!map.has(sl.id)) map.set(sl.id, sl)
    }
    return map
  }, [allUsers, group.supervisors, group.subLeaders])

  const selectedSupervisors = useMemo(() => {
    return Array.from(selectedSupervisorIds).map(id => userMap.get(id)).filter(Boolean)
  }, [selectedSupervisorIds, userMap])

  const selectedSubLeaders = useMemo(() => {
    return Array.from(selectedSubLeaderIds).map(id => userMap.get(id)).filter(Boolean)
  }, [selectedSubLeaderIds, userMap])

  // Roles categorized as leadership
  const leadershipRoles = useMemo(() => new Set([
    "SUPERVISOR", "TEAM_LEAD", "MANAGER", "HR", "TECHNOLOGY", "IT_MANAGER", "TECHNOLOGY_ADMIN", "DIRECTOR", "ADMIN", "SUPERADMIN"
  ]), [])

  // Candidate users based on search and tab filter
  const candidateUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const groupMemberIds = new Set((group.members || []).map((m: any) => m.id))

    return allUsers.filter(u => {
      // Tab filter
      if (filterMode === "leadership") {
        const isLeadership = leadershipRoles.has(u.role)
        const isAlreadySelected = selectedSupervisorIds.has(u.id) || selectedSubLeaderIds.has(u.id)
        if (!isLeadership && !isAlreadySelected) return false
      } else if (filterMode === "group_members") {
        const isMember = groupMemberIds.has(u.id)
        const isAlreadySelected = selectedSupervisorIds.has(u.id) || selectedSubLeaderIds.has(u.id)
        if (!isMember && !isAlreadySelected) return false
      }

      // Search query
      if (q) {
        const nameMatch = u.name?.toLowerCase().includes(q)
        const emailMatch = u.email?.toLowerCase().includes(q)
        const posMatch = u.position?.toLowerCase().includes(q)
        const roleMatch = u.role?.toLowerCase().includes(q)
        return nameMatch || emailMatch || posMatch || roleMatch
      }
      return true
    })
  }, [allUsers, search, filterMode, leadershipRoles, group.members, selectedSupervisorIds, selectedSubLeaderIds])

  // Actions
  const handleAssignSupervisor = (userId: string) => {
    setSelectedSupervisorIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    setSelectedSubLeaderIds(prev => {
      if (prev.has(userId)) {
        const next = new Set(prev)
        next.delete(userId)
        return next
      }
      return prev
    })
  }

  const handleAssignSubLeader = (userId: string) => {
    setSelectedSubLeaderIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    setSelectedSupervisorIds(prev => {
      if (prev.has(userId)) {
        const next = new Set(prev)
        next.delete(userId)
        return next
      }
      return prev
    })
  }

  const handleRemoveSupervisor = (userId: string) => {
    setSelectedSupervisorIds(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  const handleRemoveSubLeader = (userId: string) => {
    setSelectedSubLeaderIds(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  const handleSave = () => {
    setIsPending(true)
    setErrorMessage(null)

    const supIds = Array.from(selectedSupervisorIds)
    const subIds = Array.from(selectedSubLeaderIds)

    startTransition(async () => {
      let success = false
      let errorMsg = ""
      let updatedSupervisors: any[] = []
      let updatedSubLeaders: any[] = []

      // 1. Intentar Server Action
      try {
        const res = await setGroupLeaders(group.id, supIds, subIds)
        if (res && res.success) {
          success = true
          updatedSupervisors = res.supervisors || []
          updatedSubLeaders = res.subLeaders || []
        } else if (res && res.error) {
          errorMsg = res.error
        }
      } catch (e: any) {
        console.warn("Server action failed, trying REST API fallback...", e)
      }

      // 2. Fallback REST API
      if (!success) {
        try {
          const res = await fetch("/api/admin/groups/members", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId: group.id,
              supervisorIds: supIds,
              subLeaderIds: subIds
            })
          })
          const data = await res.json()
          if (data && data.success) {
            success = true
            updatedSupervisors = data.supervisors || []
            updatedSubLeaders = data.subLeaders || []
          } else {
            errorMsg = data?.error || "Error al actualizar líderes."
          }
        } catch (apiErr: any) {
          errorMsg = apiErr?.message || "Error de red al guardar líderes."
        }
      }

      setIsPending(false)
      if (success) {
        const finalSupervisors = updatedSupervisors.length > 0 
          ? updatedSupervisors 
          : supIds.map(id => userMap.get(id)).filter(Boolean)
        const finalSubLeaders = updatedSubLeaders.length > 0 
          ? updatedSubLeaders 
          : subIds.map(id => userMap.get(id)).filter(Boolean)

        onLeadersUpdated?.(group.id, finalSupervisors, finalSubLeaders)
        onClose()
      } else {
        setErrorMessage(errorMsg || t("groups.leadersModal.saveError"))
      }
    })
  }

  if (!mounted) return null

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
        zIndex: 9999999,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div 
        style={{
          width: "min(760px, 95vw)",
          maxHeight: "92vh",
          backgroundColor: "#0d1527",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "1.5rem",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.12)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Accent top line */}
        <div style={{ height: 4, background: "linear-gradient(90deg, #f59e0b, #8b5cf6, transparent)" }} />

        {/* Modal Header */}
        <div 
          style={{ 
            padding: "1.5rem 1.75rem 1.25rem", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(90deg, rgba(245, 158, 11, 0.08), transparent)",
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div 
              style={{ 
                width: 46, 
                height: 46, 
                borderRadius: "0.95rem", 
                backgroundColor: "rgba(245, 158, 11, 0.18)",
                border: "1.5px solid rgba(245, 158, 11, 0.4)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "#f59e0b",
                boxShadow: "0 4px 16px rgba(245, 158, 11, 0.2)"
              }}
            >
              <Crown size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>{t("groups.leadersModal.title", { name: group.name })}</span>
                {group.icon && <span style={{ fontSize: "1.1rem" }}>{group.icon}</span>}
              </h3>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                {t("groups.leadersModal.subtitle")}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isPending}
            className="btn btn-surface" 
            style={{ 
              padding: "0.5rem", 
              borderRadius: "50%", 
              color: "#94a3b8",
              backgroundColor: "rgba(255, 255, 255, 0.05)" 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Leadership Summary Strip */}
        <div 
          style={{ 
            padding: "1rem 1.75rem", 
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            backgroundColor: "rgba(10, 17, 38, 0.6)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "0.75rem"
          }}
        >
          {/* Supervisors Section */}
          <div 
            style={{ 
              padding: "0.75rem 0.85rem", 
              borderRadius: "0.85rem", 
              backgroundColor: "rgba(245, 158, 11, 0.06)", 
              border: "1px solid rgba(245, 158, 11, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Crown size={13} /> {t("groups.leadersModal.primaryLeaders", { count: selectedSupervisors.length })}
              </span>
            </div>
            {selectedSupervisors.length === 0 ? (
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                {t("groups.leadersModal.noPrimaryLeaders")}
              </span>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", maxHeight: "85px", overflowY: "auto" }}>
                {selectedSupervisors.map(sup => (
                  <div 
                    key={sup.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.25rem 0.55rem 0.25rem 0.35rem",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#fef3c7"
                    }}
                  >
                    <Avatar user={sup} size={18} />
                    <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sup.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSupervisor(sup.id)}
                      title={t("groups.leadersModal.removeSupervisorTitle")}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        marginLeft: "0.15rem",
                        color: "#f59e0b",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Leaders Section */}
          <div 
            style={{ 
              padding: "0.75rem 0.85rem", 
              borderRadius: "0.85rem", 
              backgroundColor: "rgba(139, 92, 246, 0.06)", 
              border: "1px solid rgba(139, 92, 246, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Shield size={13} /> {t("groups.leadersModal.subLeaders", { count: selectedSubLeaders.length })}
              </span>
            </div>
            {selectedSubLeaders.length === 0 ? (
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                {t("groups.leadersModal.noSubLeaders")}
              </span>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", maxHeight: "85px", overflowY: "auto" }}>
                {selectedSubLeaders.map(sub => (
                  <div 
                    key={sub.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.25rem 0.55rem 0.25rem 0.35rem",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.35)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#ede9fe"
                    }}
                  >
                    <Avatar user={sub} size={18} />
                    <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sub.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubLeader(sub.id)}
                      title={t("groups.leadersModal.removeSubLeaderTitle")}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        marginLeft: "0.15rem",
                        color: "#a78bfa",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: "1rem 1.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Search Input */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search 
              size={18} 
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} 
            />
            <input 
              className="input" 
              placeholder={t("groups.leadersModal.searchPlaceholder")} 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ 
                width: "100%",
                padding: "0.75rem 2.5rem 0.75rem 2.85rem",
                borderRadius: "0.85rem",
                fontSize: "0.88rem",
                fontWeight: 600,
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff"
              }} 
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilterMode("leadership")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: filterMode === "leadership" ? "1px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: filterMode === "leadership" ? "rgba(245, 158, 11, 0.18)" : "transparent",
                color: filterMode === "leadership" ? "#f59e0b" : "#94a3b8",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all 0.15s"
              }}
            >
              <Crown size={12} />
              <span>{t("groups.leadersModal.tabLeadership")}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("group_members")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: filterMode === "group_members" ? "1px solid hsl(var(--primary))" : "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: filterMode === "group_members" ? "hsl(var(--primary) / 0.2)" : "transparent",
                color: filterMode === "group_members" ? "hsl(var(--primary))" : "#94a3b8",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all 0.15s"
              }}
            >
              <Users size={12} />
              <span>{t("groups.leadersModal.tabGroupMembers")} ({group.members?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("all")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: filterMode === "all" ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                backgroundColor: filterMode === "all" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                color: filterMode === "all" ? "#ffffff" : "#94a3b8",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all 0.15s"
              }}
            >
              <span>{t("groups.leadersModal.tabAll")} ({allUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div 
            style={{ 
              margin: "0 1.75rem", 
              padding: "0.65rem 0.85rem", 
              borderRadius: "0.75rem", 
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Candidates List (Scrollable) */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "0.75rem 1.75rem 1.25rem",
            display: "flex", 
            flexDirection: "column", 
            gap: "0.5rem",
            minHeight: "220px",
            maxHeight: "360px"
          }}
        >
          {candidateUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#94a3b8" }}>
              <Search size={32} style={{ opacity: 0.3, margin: "0 auto 0.5rem", display: "block" }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{t("groups.leadersModal.noMatches")}</p>
            </div>
          ) : (
            candidateUsers.map(u => {
              const isSupervisor = selectedSupervisorIds.has(u.id)
              const isSubLeader = selectedSubLeaderIds.has(u.id)
              const roleColor = ROLE_COLORS[u.role] || "hsl(var(--primary))"

              return (
                <div 
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.85rem",
                    backgroundColor: isSupervisor 
                      ? "rgba(245, 158, 11, 0.1)" 
                      : isSubLeader 
                      ? "rgba(139, 92, 246, 0.1)" 
                      : "rgba(255, 255, 255, 0.03)",
                    border: isSupervisor 
                      ? "1px solid rgba(245, 158, 11, 0.35)" 
                      : isSubLeader 
                      ? "1px solid rgba(139, 92, 246, 0.35)" 
                      : "1px solid rgba(255, 255, 255, 0.06)",
                    transition: "all 0.15s"
                  }}
                >
                  {/* Avatar */}
                  <Avatar user={u} size={36} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.name}
                      </span>
                      {u.position && (
                        <span 
                          style={{ 
                            fontSize: "0.68rem", 
                            fontWeight: 700, 
                            color: "#94a3b8", 
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                            padding: "0.1rem 0.45rem",
                            borderRadius: "9999px"
                          }}
                        >
                          {u.position}
                        </span>
                      )}
                      <span 
                        style={{ 
                          fontSize: "0.68rem", 
                          fontWeight: 800, 
                          color: roleColor, 
                          backgroundColor: `${roleColor}18`,
                          border: `1px solid ${roleColor}35`,
                          padding: "0.1rem 0.45rem",
                          borderRadius: "9999px"
                        }}
                      >
                        {u.role}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.2rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.email}
                      </span>
                      {u.project?.name && (
                        <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          · {u.project.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Assignment Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                    {isSupervisor ? (
                      <>
                        <span 
                          style={{ 
                            fontSize: "0.72rem", 
                            fontWeight: 800, 
                            color: "#f59e0b", 
                            backgroundColor: "rgba(245, 158, 11, 0.18)", 
                            border: "1px solid rgba(245, 158, 11, 0.4)",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "0.5rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <Crown size={12} />
                          <span>{t("groups.leadersModal.isSupervisor")}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAssignSubLeader(u.id)}
                          style={{
                            padding: "0.3rem 0.55rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#a78bfa",
                            backgroundColor: "rgba(139, 92, 246, 0.12)",
                            border: "1px solid rgba(139, 92, 246, 0.25)",
                            cursor: "pointer"
                          }}
                        >
                          {t("groups.leadersModal.assignSubLeader")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSupervisor(u.id)}
                          style={{
                            padding: "0.3rem 0.55rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            cursor: "pointer"
                          }}
                        >
                          {t("common.remove")}
                        </button>
                      </>
                    ) : isSubLeader ? (
                      <>
                        <span 
                          style={{ 
                            fontSize: "0.72rem", 
                            fontWeight: 800, 
                            color: "#a78bfa", 
                            backgroundColor: "rgba(139, 92, 246, 0.18)",
                            border: "1px solid rgba(139, 92, 246, 0.4)",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "0.5rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <Shield size={12} />
                          <span>{t("groups.leadersModal.isSubLeader")}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAssignSupervisor(u.id)}
                          style={{
                            padding: "0.3rem 0.55rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#f59e0b",
                            backgroundColor: "rgba(245, 158, 11, 0.12)",
                            border: "1px solid rgba(245, 158, 11, 0.25)",
                            cursor: "pointer"
                          }}
                        >
                          {t("groups.leadersModal.assignSupervisor")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubLeader(u.id)}
                          style={{
                            padding: "0.3rem 0.55rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#ef4444",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            cursor: "pointer"
                          }}
                        >
                          {t("common.remove")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAssignSupervisor(u.id)}
                          style={{
                            padding: "0.35rem 0.7rem",
                            borderRadius: "0.55rem",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            color: "#f59e0b",
                            backgroundColor: "rgba(245, 158, 11, 0.12)",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            transition: "all 0.15s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.22)"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.12)"}
                        >
                          <Crown size={12} />
                          <span>{t("groups.leadersModal.assignSupervisor")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssignSubLeader(u.id)}
                          style={{
                            padding: "0.35rem 0.7rem",
                            borderRadius: "0.55rem",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            color: "#a78bfa",
                            backgroundColor: "rgba(139, 92, 246, 0.12)",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            transition: "all 0.15s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.22)"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.12)"}
                        >
                          <Shield size={12} />
                          <span>{t("groups.leadersModal.assignSubLeader")}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div 
          style={{ 
            padding: "1rem 1.75rem", 
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(10, 17, 38, 0.95)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            gap: "1rem" 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#94a3b8" }}>
              Total:
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#f59e0b" }}>
              👑 {selectedSupervisorIds.size}
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#a78bfa" }}>
              🛡️ {selectedSubLeaderIds.size}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn btn-surface"
              style={{ padding: "0.65rem 1.25rem", borderRadius: "0.75rem", fontSize: "0.85rem", fontWeight: 700 }}
            >
              {t("groups.leadersModal.cancelBtn")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{
                padding: "0.65rem 1.5rem",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "#ffffff",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: isPending ? "not-allowed" : "pointer",
                boxShadow: "0 4px 18px rgba(245, 158, 11, 0.35)",
                opacity: isPending ? 0.7 : 1
              }}
            >
              {isPending ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                  <span>{t("groups.leadersModal.saving")}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{t("groups.leadersModal.saveBtn")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// =========================================================================
// PANEL PARA CREAR GRUPO
// =========================================================================
function CreateGroupPanel({ allUsers }: { allUsers: any[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [icon, setIcon] = useState("🏢")
  const [color, setColor] = useState("#3b82f6")
  const [supervisorIds, setSupervisorIds] = useState<string[]>([])
  const [subLeaderIds, setSubLeaderIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Lookup map for fast user resolution
  const userMap = useMemo(() => {
    const map = new Map<string, any>()
    for (const u of allUsers) {
      map.set(u.id, u)
    }
    return map
  }, [allUsers])

  const selectedSupervisors = useMemo(() => {
    return supervisorIds.map(id => userMap.get(id)).filter(Boolean)
  }, [supervisorIds, userMap])

  const selectedSubLeaders = useMemo(() => {
    return subLeaderIds.map(id => userMap.get(id)).filter(Boolean)
  }, [subLeaderIds, userMap])

  const addSupervisor = (userId: string) => {
    if (!userId) return
    setSupervisorIds(prev => prev.includes(userId) ? prev : [...prev, userId])
    setSubLeaderIds(prev => prev.filter(id => id !== userId))
  }

  const removeSupervisor = (userId: string) => {
    setSupervisorIds(prev => prev.filter(id => id !== userId))
  }

  const addSubLeader = (userId: string) => {
    if (!userId) return
    setSubLeaderIds(prev => prev.includes(userId) ? prev : [...prev, userId])
    setSupervisorIds(prev => prev.filter(id => id !== userId))
  }

  const removeSubLeader = (userId: string) => {
    setSubLeaderIds(prev => prev.filter(id => id !== userId))
  }

  const isLeaderRole = (role: string) =>
    ["SUPERVISOR", "TEAM_LEAD", "MANAGER", "HR", "TECHNOLOGY", "IT_MANAGER", "TECHNOLOGY_ADMIN", "DIRECTOR", "ADMIN", "SUPERADMIN"].includes(role)

  const availableForSupervisors = useMemo(() => {
    const selected = new Set([...supervisorIds, ...subLeaderIds])
    return allUsers.filter(u => !selected.has(u.id))
  }, [allUsers, supervisorIds, subLeaderIds])

  const availableForSubLeaders = useMemo(() => {
    const selected = new Set([...supervisorIds, ...subLeaderIds])
    return allUsers.filter(u => !selected.has(u.id))
  }, [allUsers, supervisorIds, subLeaderIds])

  const handleCreate = () => {
    if (!name.trim()) return
    if (supervisorIds.length === 0) {
      setMessage({ type: "error", text: t("groups.create.supervisorsHelp") })
      return
    }
    const fd = new FormData()
    fd.set("name", name)
    fd.set("description", description)
    fd.set("email", email)
    fd.set("icon", icon)
    fd.set("color", color)
    fd.set("supervisorIds", JSON.stringify(supervisorIds))
    fd.set("subLeaderIds", JSON.stringify(subLeaderIds))

    startTransition(async () => {
      const result = await createGroup(fd)
      if (result.success) {
        setMessage({ type: "success", text: t("groups.create.successMessage") })
        setName("")
        setDescription("")
        setEmail("")
        setIcon("🏢")
        setColor("#3b82f6")
        setSupervisorIds([])
        setSubLeaderIds([])
        setTimeout(() => { 
          setOpen(false)
          setMessage(null) 
        }, 1500)
      } else {
        setMessage({ type: "error", text: result.error || t("groups.create.errorMessage") })
      }
    })
  }

  return (
    <div 
      style={{ 
        marginBottom: "2rem",
        borderRadius: "1.25rem",
        border: open ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(12px)",
        boxShadow: open ? "0 15px 35px hsl(var(--primary) / 0.12)" : "0 4px 16px rgba(0,0,0,0.2)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden"
      }}
    >
      <button 
        type="button"
        onClick={() => setOpen(!open)} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "100%", 
          border: "none", 
          background: open ? "linear-gradient(90deg, hsl(var(--primary) / 0.12), transparent)" : "transparent", 
          cursor: "pointer", 
          padding: "1.25rem 1.75rem", 
          textAlign: "left",
          transition: "background 0.3s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div 
            style={{ 
              width: 44, 
              height: 44, 
              borderRadius: "0.875rem", 
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 6px 16px hsl(var(--primary) / 0.3)",
              transform: open ? "rotate(90deg)" : "rotate(0deg)", 
              transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
              flexShrink: 0,
              color: "#ffffff"
            }}
          >
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#f8fafc", letterSpacing: "-0.01em" }}>
              {t("groups.create.title")}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.15rem" }}>
              {t("groups.create.subtitle")}
            </div>
          </div>
        </div>
        <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s", color: "hsl(var(--primary))" }}>
          <ChevronDown size={22} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 1.75rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, marginBottom: "0.4rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("groups.create.nameLabel")}
              </label>
              <input 
                className="input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder={t("groups.create.namePlaceholder")} 
                style={{ width: "100%", fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)" }} 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, marginBottom: "0.4rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("groups.create.descLabel")}
              </label>
              <input 
                className="input" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder={t("groups.create.descPlaceholder")} 
                style={{ width: "100%", fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)" }} 
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, marginBottom: "0.4rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("groups.create.emailLabel")}
              </label>
              <input 
                className="input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder={t("groups.create.emailPlaceholder")} 
                style={{ width: "100%", fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)" }} 
              />
            </div>

            {/* Color & Icon Picker */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, marginBottom: "0.4rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("groups.create.colorAndIconLabel")}
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input 
                  type="color" 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  style={{ width: 42, height: 42, border: "none", borderRadius: "0.5rem", cursor: "pointer", padding: 0 }} 
                />
                {/* Quick Swatches */}
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", flex: 1 }}>
                  {COLOR_PRESETS.slice(0, 7).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        backgroundColor: c,
                        border: color === c ? "2px solid #ffffff" : "none",
                        cursor: "pointer",
                        transition: "transform 0.15s"
                      }}
                    />
                  ))}
                </div>
                <input 
                  className="input" 
                  value={icon} 
                  onChange={e => setIcon(e.target.value)} 
                  placeholder="🏢" 
                  style={{ width: 60, textAlign: "center", fontSize: "1.2rem", borderRadius: "0.75rem", padding: "0.5rem", backgroundColor: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.12)" }} 
                />
              </div>
            </div>
          </div>

          {/* Quick Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700 }}>{t("groups.create.suggestedIcons")}</span>
            {ICON_PRESETS.slice(0, 12).map(ic => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                style={{
                  background: icon === ic ? "hsl(var(--primary) / 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: icon === ic ? "1px solid hsl(var(--primary))" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "0.5rem",
                  padding: "0.3rem 0.5rem",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                {ic}
              </button>
            ))}
          </div>

          {/* Liderazgo del Grupo (Supervisores y Sub-líderes) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", padding: "1.25rem", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "1rem", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            {/* Supervisores Principales */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Crown size={14} />
                  <span>{t("groups.create.supervisorsLabel")}</span>
                </label>
                <span style={{ fontSize: "0.7rem", color: supervisorIds.length > 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                  {supervisorIds.length > 0 ? `${supervisorIds.length} asignado(s)` : "Requerido"}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.3 }}>
                {t("groups.create.supervisorsHelp")}
              </div>

              <select
                className="input"
                value=""
                onChange={e => {
                  if (e.target.value) {
                    addSupervisor(e.target.value)
                  }
                }}
                style={{
                  width: "100%",
                  fontSize: "0.85rem",
                  borderRadius: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  border: supervisorIds.length === 0 ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f8fafc",
                  cursor: "pointer"
                }}
              >
                <option value="" disabled>{t("groups.create.selectSupervisorPlaceholder")}</option>
                {availableForSupervisors.filter(u => isLeaderRole(u.role)).length > 0 && (
                  <optgroup label={t("groups.create.recommendedLeadership")}>
                    {availableForSupervisors
                      .filter(u => isLeaderRole(u.role))
                      .map(u => (
                        <option key={u.id} value={u.id} style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
                          {u.name} — {u.position || u.role}
                        </option>
                      ))}
                  </optgroup>
                )}
                {availableForSupervisors.filter(u => !isLeaderRole(u.role)).length > 0 && (
                  <optgroup label={t("groups.create.otherMembers")}>
                    {availableForSupervisors
                      .filter(u => !isLeaderRole(u.role))
                      .map(u => (
                        <option key={u.id} value={u.id} style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
                          {u.name} — {u.position || u.role}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>

              {/* Chips de Supervisores seleccionados */}
              <div style={{ minHeight: "36px", display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                {selectedSupervisors.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#f87171", padding: "0.35rem 0.65rem", borderRadius: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px dashed rgba(239, 68, 68, 0.3)" }}>
                    <AlertTriangle size={13} />
                    <span>{t("groups.create.noSupervisorsSelected")}</span>
                  </div>
                ) : (
                  selectedSupervisors.map(u => (
                    <div
                      key={u.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "rgba(245, 158, 11, 0.12)",
                        border: "1px solid rgba(245, 158, 11, 0.35)",
                        borderRadius: "2rem",
                        padding: "0.25rem 0.65rem 0.25rem 0.35rem",
                        fontSize: "0.8rem",
                        color: "#f8fafc"
                      }}
                    >
                      <Avatar user={u} size={22} />
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{u.name}</span>
                        <span style={{ fontSize: "0.65rem", color: "#fcd34d" }}>{u.position || u.role}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSupervisor(u.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#cbd5e1",
                          cursor: "pointer",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          marginLeft: "0.2rem"
                        }}
                        title="Remover líder"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sub-Líderes de Apoyo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Shield size={14} />
                  <span>{t("groups.create.subLeadersLabel")}</span>
                </label>
                <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>
                  {subLeaderIds.length > 0 ? `${subLeaderIds.length} seleccionado(s)` : "Opcional"}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.3 }}>
                {t("groups.create.subLeadersHelp")}
              </div>

              <select
                className="input"
                value=""
                onChange={e => {
                  if (e.target.value) {
                    addSubLeader(e.target.value)
                  }
                }}
                style={{
                  width: "100%",
                  fontSize: "0.85rem",
                  borderRadius: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f8fafc",
                  cursor: "pointer"
                }}
              >
                <option value="" disabled>{t("groups.create.selectSubLeaderPlaceholder")}</option>
                {availableForSubLeaders.filter(u => isLeaderRole(u.role)).length > 0 && (
                  <optgroup label={t("groups.create.recommendedLeadership")}>
                    {availableForSubLeaders
                      .filter(u => isLeaderRole(u.role))
                      .map(u => (
                        <option key={u.id} value={u.id} style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
                          {u.name} — {u.position || u.role}
                        </option>
                      ))}
                  </optgroup>
                )}
                {availableForSubLeaders.filter(u => !isLeaderRole(u.role)).length > 0 && (
                  <optgroup label={t("groups.create.otherMembers")}>
                    {availableForSubLeaders
                      .filter(u => !isLeaderRole(u.role))
                      .map(u => (
                        <option key={u.id} value={u.id} style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
                          {u.name} — {u.position || u.role}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>

              {/* Chips de Sub-Líderes seleccionados */}
              <div style={{ minHeight: "36px", display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                {selectedSubLeaders.length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "#64748b", padding: "0.35rem 0.65rem" }}>
                    {t("groups.create.noSubLeadersSelected")}
                  </div>
                ) : (
                  selectedSubLeaders.map(u => (
                    <div
                      key={u.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "rgba(99, 102, 241, 0.12)",
                        border: "1px solid rgba(99, 102, 241, 0.35)",
                        borderRadius: "2rem",
                        padding: "0.25rem 0.65rem 0.25rem 0.35rem",
                        fontSize: "0.8rem",
                        color: "#f8fafc"
                      }}
                    >
                      <Avatar user={u} size={22} />
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{u.name}</span>
                        <span style={{ fontSize: "0.65rem", color: "#a5b4fc" }}>{u.position || u.role}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubLeader(u.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#cbd5e1",
                          cursor: "pointer",
                          padding: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          marginLeft: "0.2rem"
                        }}
                        title="Remover sub-líder"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {message && (
            <div 
              style={{ 
                padding: "0.75rem 1rem", 
                borderRadius: "0.75rem", 
                backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                color: message.type === "success" ? "#10b981" : "#ef4444",
                fontWeight: 700,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {message.text}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button 
              type="button"
              onClick={handleCreate} 
              disabled={isPending || !name.trim() || supervisorIds.length === 0} 
              className="btn btn-primary" 
              style={{ 
                flex: 1, 
                padding: "0.85rem", 
                borderRadius: "0.75rem", 
                fontSize: "0.95rem", 
                fontWeight: 800,
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: "0.5rem",
                boxShadow: "0 4px 18px hsl(var(--primary) / 0.35)",
                opacity: (isPending || !name.trim() || supervisorIds.length === 0) ? 0.6 : 1,
                cursor: (isPending || !name.trim() || supervisorIds.length === 0) ? "not-allowed" : "pointer"
              }}
            >
              {isPending ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                  <span>{t("groups.create.buildingGroup")}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>{t("groups.create.submitBtn")}</span>
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={() => setOpen(false)} 
              className="btn btn-surface" 
              style={{ padding: "0.85rem 1.5rem", borderRadius: "0.75rem", fontWeight: 700 }}
            >
              {t("groups.create.cancelBtn")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =========================================================================
// TARJETA INDIVIDUAL DE GRUPO (GROUP CARD)
// =========================================================================
function GroupCard({ 
  group, 
  allUsers, 
  index,
  onRequestDeleteGroup,
  onRequestRemoveMember,
  onRequestRemoveMultiple,
  onMembersAdded,
  onLeadersUpdated
}: { 
  group: any
  allUsers: any[]
  index: number
  onRequestDeleteGroup: (group: any) => void
  onRequestRemoveMember: (group: any, member: any) => void
  onRequestRemoveMultiple: (group: any, members: any[]) => void
  onMembersAdded?: (groupId: string, userIds: string[]) => void
  onLeadersUpdated?: (groupId: string, supervisors: any[], subLeaders: any[]) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLeaderModal, setShowLeaderModal] = useState(false)
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())

  // Leadership tab state (Full-width adaptive switcher to prevent cutoff)
  const supervisorsCount = group.supervisors?.length || 0
  const subLeadersCount = group.subLeaders?.length || 0
  const [activeLeaderTab, setActiveLeaderTab] = useState<"supervisors" | "subLeaders">(
    supervisorsCount > 0 ? "supervisors" : subLeadersCount > 0 ? "subLeaders" : "supervisors"
  )
  const [viewBothLeaders, setViewBothLeaders] = useState(false)

  // Edit form state
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || "")
  const [email, setEmail] = useState(group.email || "")
  const [icon, setIcon] = useState(group.icon || "🏢")
  const [color, setColor] = useState(group.color || "#3b82f6")
  const [isPending, startTransition] = useTransition()

  // Reset multi selection when leaving multi-select mode
  const toggleMultiSelect = () => {
    if (multiSelectMode) {
      setSelectedMemberIds(new Set())
      setMultiSelectMode(false)
    } else {
      setMultiSelectMode(true)
    }
  }

  const toggleSelectMember = (memberId: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    const fd = new FormData()
    fd.set("name", name)
    fd.set("description", description)
    fd.set("email", email)
    fd.set("icon", icon)
    fd.set("color", color)

    startTransition(async () => {
      const result = await updateGroup(group.id, fd)
      if (result.success) setEditing(false)
    })
  }

  // Handle batch removal request
  const handleBatchRemoveClick = () => {
    const selectedList = group.members.filter((m: any) => selectedMemberIds.has(m.id))
    if (selectedList.length === 0) return
    onRequestRemoveMultiple(group, selectedList)
  }

  const groupColor = group.color || "#3b82f6"

  return (
    <>
      {showAddModal && (
        <AddMembersModal 
          group={group} 
          allUsers={allUsers} 
          onClose={() => setShowAddModal(false)} 
          onMembersAdded={onMembersAdded}
        />
      )}

      {showLeaderModal && (
        <ManageLeadersModal 
          group={group} 
          allUsers={allUsers} 
          onClose={() => setShowLeaderModal(false)} 
          onLeadersUpdated={onLeadersUpdated}
        />
      )}

      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          borderRadius: "1.35rem", 
          border: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden", 
          backgroundColor: "#0d1527",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)", 
          transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
          position: "relative"
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.transform = "translateY(-4px)"
          e.currentTarget.style.borderColor = `${groupColor}60`
          e.currentTarget.style.boxShadow = `0 16px 38px ${groupColor}15`
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.35)"
        }}
      >
        {/* Color accent line */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${groupColor}, transparent)` }} />

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>
          
          {/* Card Title & Header Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
              <div 
                style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: "0.85rem", 
                  backgroundColor: `${groupColor}20`,
                  border: `1.5px solid ${groupColor}40`,
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  flexShrink: 0
                }}
              >
                {group.icon || "🏢"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editing ? (
                  <input 
                    className="input" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ fontSize: "1.1rem", fontWeight: 800, borderRadius: "0.6rem", padding: "0.4rem 0.6rem", width: "100%" }} 
                  />
                ) : (
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {group.name}
                  </h3>
                )}
                {editing ? (
                  <input 
                    className="input" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Misión del equipo..." 
                    style={{ fontSize: "0.78rem", marginTop: "0.35rem", borderRadius: "0.5rem", padding: "0.3rem 0.5rem", width: "100%" }} 
                  />
                ) : (
                  <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {group.description || t("groups.card.defaultMission")}
                  </p>
                )}
              </div>
            </div>

            {/* Top Toolbar */}
            <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0, alignItems: "center" }}>
              <Link 
                href={`/groups/${group.id}`} 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "0.35rem", 
                  padding: "0.4rem 0.75rem", 
                  borderRadius: "0.6rem", 
                  fontSize: "0.75rem", 
                  fontWeight: 700, 
                  color: "#ffffff",
                  backgroundColor: "hsl(var(--primary) / 0.2)",
                  border: "1px solid hsl(var(--primary) / 0.4)",
                  textDecoration: "none",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "hsl(var(--primary) / 0.35)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "hsl(var(--primary) / 0.2)"}
              >
                <ExternalLink size={13} />
                <span>{t("groups.card.dashboard")}</span>
              </Link>

              {editing ? (
                <>
                  <button 
                    type="button"
                    onClick={handleSave} 
                    disabled={isPending} 
                    className="btn btn-primary" 
                    style={{ padding: "0.45rem 0.6rem", borderRadius: "0.6rem" }}
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditing(false)} 
                    className="btn btn-surface" 
                    style={{ padding: "0.45rem 0.6rem", borderRadius: "0.6rem" }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={() => setShowLeaderModal(true)} 
                    style={{ 
                      padding: "0.45rem", 
                      borderRadius: "0.6rem", 
                      color: "#f59e0b", 
                      border: "1px solid rgba(245, 158, 11, 0.3)", 
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.22)"
                      e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.1)"
                      e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.3)"
                    }}
                    title={t("groups.card.leadersTooltip")}
                  >
                    <Crown size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditing(true)} 
                    style={{ 
                      padding: "0.45rem", 
                      borderRadius: "0.6rem", 
                      color: "#94a3b8", 
                      border: "1px solid rgba(255, 255, 255, 0.08)", 
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title={t("groups.card.editTooltip")}
                  >
                    <Settings size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => onRequestDeleteGroup(group)} 
                    style={{ 
                      padding: "0.45rem", 
                      borderRadius: "0.6rem", 
                      color: "#f87171", 
                      border: "1px solid rgba(239, 68, 68, 0.2)", 
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title={t("groups.card.deleteTooltip")}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Contact / Email Info if available */}
          {group.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#94a3b8" }}>
              <Mail size={13} color="hsl(var(--primary))" />
              <span>{group.email}</span>
            </div>
          )}

          {/* Full-Width Adaptive Leadership Section (No truncated text or clipped cards) */}
          <div 
            style={{ 
              borderRadius: "0.95rem", 
              backgroundColor: "rgba(10, 17, 38, 0.65)", 
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem"
            }}
          >
            {/* Header: Segmented Control when both roles exist, or dedicated badge */}
            {supervisorsCount > 0 && subLeadersCount > 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div 
                  style={{ 
                    display: "flex", 
                    flex: 1,
                    borderRadius: "0.65rem", 
                    backgroundColor: "rgba(255, 255, 255, 0.04)", 
                    padding: "0.2rem",
                    gap: "0.25rem",
                    border: "1px solid rgba(255, 255, 255, 0.06)"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setActiveLeaderTab("supervisors"); setViewBothLeaders(false); }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      backgroundColor: !viewBothLeaders && activeLeaderTab === "supervisors" ? "hsl(var(--primary))" : "transparent",
                      color: !viewBothLeaders && activeLeaderTab === "supervisors" ? "#ffffff" : "#94a3b8",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Crown size={13} />
                    <span>{t("groups.card.tabSupervisors", { count: supervisorsCount })}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveLeaderTab("subLeaders"); setViewBothLeaders(false); }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      backgroundColor: !viewBothLeaders && activeLeaderTab === "subLeaders" ? "#8b5cf6" : "transparent",
                      color: !viewBothLeaders && activeLeaderTab === "subLeaders" ? "#ffffff" : "#94a3b8",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Shield size={13} />
                    <span>{t("groups.card.tabSubLeaders", { count: subLeadersCount })}</span>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setViewBothLeaders(!viewBothLeaders)}
                    title={viewBothLeaders ? t("groups.card.viewTabsTooltip") : t("groups.card.viewBothTooltip")}
                    style={{
                      padding: "0.35rem 0.55rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      border: viewBothLeaders ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                      backgroundColor: viewBothLeaders ? "hsl(var(--primary) / 0.15)" : "transparent",
                      color: viewBothLeaders ? "#ffffff" : "#94a3b8",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {viewBothLeaders ? t("groups.card.viewTabs") : t("groups.card.viewBoth")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLeaderModal(true)}
                    title={t("groups.card.leadersTooltip")}
                    style={{
                      padding: "0.35rem 0.65rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      color: "#f59e0b",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <Crown size={12} />
                    <span>{t("groups.card.manage")}</span>
                  </button>
                </div>
              </div>
            ) : supervisorsCount > 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "hsl(var(--primary))", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Crown size={14} /> {t("groups.card.teamLeaders", { count: supervisorsCount })}
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaderModal(true)}
                  title={t("groups.card.leadersTooltip")}
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    color: "#f59e0b",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <Crown size={12} />
                  <span>{t("groups.card.manage")}</span>
                </button>
              </div>
            ) : subLeadersCount > 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Shield size={14} /> {t("groups.card.teamSubLeaders", { count: subLeadersCount })}
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaderModal(true)}
                  title={t("groups.card.leadersTooltip")}
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    color: "#f59e0b",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <Crown size={12} />
                  <span>{t("groups.card.manage")}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", padding: "0.2rem 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                  <Shield size={14} /> {t("groups.card.noLeaders")}
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaderModal(true)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    boxShadow: "0 2px 10px rgba(245, 158, 11, 0.15)",
                    transition: "all 0.2s"
                  }}
                >
                  <Crown size={13} />
                  <span>{t("groups.card.assignLeaders")}</span>
                </button>
              </div>
            )}

            {/* Content List: Active Tab or Only Available Role or Both Stacked */}
            {(() => {
              const renderSupervisors = () => (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "160px", overflowY: "auto", paddingRight: "4px" }}>
                  {viewBothLeaders && (
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "hsl(var(--primary))", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0.2rem 0" }}>
                      👑 Líderes ({supervisorsCount})
                    </div>
                  )}
                  {group.supervisors.map((sup: any) => (
                    <div 
                      key={sup.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.6rem", 
                        padding: "0.35rem 0.55rem", 
                        borderRadius: "0.6rem", 
                        backgroundColor: "rgba(59, 130, 246, 0.08)", 
                        border: "1px solid rgba(59, 130, 246, 0.16)",
                        transition: "background 0.15s"
                      }}
                    >
                      <Avatar user={sup} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sup.name}>
                          {sup.name}
                        </div>
                        {sup.position && (
                          <div style={{ fontSize: "0.68rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sup.position}>
                            {sup.position}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => onRequestRemoveMember(group, sup)}
                        title={t("groups.card.removeLeaderTitle", { name: sup.name })}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: "1px solid transparent",
                          backgroundColor: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)"
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"
                          e.currentTarget.style.color = "#ef4444"
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.borderColor = "transparent"
                          e.currentTarget.style.color = "#94a3b8"
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )

              const renderSubLeaders = () => (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "160px", overflowY: "auto", paddingRight: "4px" }}>
                  {viewBothLeaders && (
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0.4rem 0 0.2rem" }}>
                      🛡️ Sub-Líderes ({subLeadersCount})
                    </div>
                  )}
                  {group.subLeaders.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.6rem", 
                        padding: "0.35rem 0.55rem", 
                        borderRadius: "0.6rem", 
                        backgroundColor: "rgba(139, 92, 246, 0.08)", 
                        border: "1px solid rgba(139, 92, 246, 0.18)",
                        transition: "background 0.15s"
                      }}
                    >
                      <Avatar user={sub} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sub.name}>
                          {sub.name}
                        </div>
                        {sub.position && (
                          <div style={{ fontSize: "0.68rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sub.position}>
                            {sub.position}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => onRequestRemoveMember(group, sub)}
                        title={t("groups.card.removeSubLeaderTitle", { name: sub.name })}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: "1px solid transparent",
                          backgroundColor: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)"
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"
                          e.currentTarget.style.color = "#ef4444"
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.borderColor = "transparent"
                          e.currentTarget.style.color = "#94a3b8"
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )

              if (viewBothLeaders && supervisorsCount > 0 && subLeadersCount > 0) {
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {renderSupervisors()}
                    {renderSubLeaders()}
                  </div>
                )
              }

              const showSupervisors = (supervisorsCount > 0 && subLeadersCount > 0)
                ? activeLeaderTab === "supervisors"
                : supervisorsCount > 0

              const showSubLeaders = (supervisorsCount > 0 && subLeadersCount > 0)
                ? activeLeaderTab === "subLeaders"
                : subLeadersCount > 0

              if (showSupervisors && supervisorsCount > 0) return renderSupervisors()
              if (showSubLeaders && subLeadersCount > 0) return renderSubLeaders()

              return null
            })()}
          </div>

          {/* Members (Integrantes) Section */}
          <div 
            style={{ 
              marginTop: "auto",
              padding: "1rem", 
              borderRadius: "0.95rem", 
              backgroundColor: "rgba(10, 17, 38, 0.7)", 
              border: "1px solid rgba(255, 255, 255, 0.06)" 
            }}
          >
            {/* Members Section Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <Users2 size={16} color="hsl(var(--primary))" />
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {t("groups.card.membersSection", { count: group.members.length })}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                {group.members.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleMultiSelect}
                    style={{
                      padding: "0.3rem 0.6rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: multiSelectMode ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      border: multiSelectMode ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(255, 255, 255, 0.08)",
                      color: multiSelectMode ? "#ef4444" : "#94a3b8",
                      cursor: "pointer"
                    }}
                  >
                    {multiSelectMode ? t("groups.card.cancelSelection") : t("groups.card.multiSelect")}
                  </button>
                )}

                <button 
                  type="button"
                  onClick={() => setShowAddModal(true)} 
                  className="btn btn-primary" 
                  style={{ 
                    padding: "0.35rem 0.85rem", 
                    fontSize: "0.75rem", 
                    fontWeight: 800, 
                    borderRadius: "9999px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    boxShadow: "0 2px 10px hsl(var(--primary) / 0.3)"
                  }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>{t("groups.card.addBtn")}</span>
                </button>
              </div>
            </div>

            {/* Batch delete bar if members are selected */}
            {multiSelectMode && selectedMemberIds.size > 0 && (
              <div 
                style={{
                  marginBottom: "0.6rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.6rem",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem"
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f87171" }}>
                  {t("groups.card.selectedCount", { count: selectedMemberIds.size })}
                </span>
                <button
                  type="button"
                  onClick={handleBatchRemoveClick}
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "0.45rem",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  <Trash2 size={12} />
                  <span>{t("groups.card.removeSelectedBtn")}</span>
                </button>
              </div>
            )}

            {/* Members Scrollable List */}
            {!group.members.length ? (
              <div style={{ textAlign: "center", padding: "1.25rem 0", color: "#64748b", fontSize: "0.78rem" }}>
                {t("groups.card.noMembers")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "0.4rem", 
                    maxHeight: "260px", 
                    overflowY: "auto", 
                    paddingRight: "6px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255, 255, 255, 0.18) transparent"
                  }}
                >
                {group.members.map((member: any) => {
                  const isChecked = selectedMemberIds.has(member.id)
                  return (
                    <div 
                      key={member.id} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.65rem", 
                        padding: "0.45rem 0.65rem", 
                        borderRadius: "0.65rem", 
                        backgroundColor: isChecked ? "rgba(239, 68, 68, 0.12)" : "rgba(255, 255, 255, 0.02)", 
                        border: isChecked ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)", 
                        transition: "all 0.15s ease" 
                      }}
                      onMouseEnter={e => {
                        if (!isChecked) {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)"
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isChecked) {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)"
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)"
                        }
                      }}
                    >
                      {/* Checkbox in multi-select mode */}
                      {multiSelectMode && (
                        <div 
                          onClick={() => toggleSelectMember(member.id)}
                          style={{ 
                            width: 18, 
                            height: 18, 
                            borderRadius: "4px",
                            border: isChecked ? "none" : "1.5px solid rgba(255, 255, 255, 0.3)",
                            backgroundColor: isChecked ? "#ef4444" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#ffffff"
                          }}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                      )}

                      <Avatar user={member} size={28} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {member.name}
                        </div>
                        {member.position && (
                          <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                            {member.position}
                          </div>
                        )}
                      </div>

                      {/* SLEEK REDESIGNED REMOVE BUTTON (replacing the ugly raw red X!) */}
                      <button 
                        type="button"
                        onClick={() => onRequestRemoveMember(group, member)} 
                        title={t("groups.card.removeMemberTooltip", { name: member.name })}
                        style={{ 
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1px solid transparent",
                          backgroundColor: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)"
                          e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"
                          e.currentTarget.style.color = "#ef4444"
                          e.currentTarget.style.transform = "scale(1.15)"
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "transparent"
                          e.currentTarget.style.borderColor = "transparent"
                          e.currentTarget.style.color = "#94a3b8"
                          e.currentTarget.style.transform = "scale(1)"
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
                </div>
                {group.members.length > 5 && (
                  <div style={{ 
                    textAlign: "center", 
                    fontSize: "0.7rem", 
                    color: "#94a3b8", 
                    paddingTop: "0.45rem", 
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem"
                  }}>
                    <span>{t("groups.card.scrollHint", { count: group.members.length })}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// =========================================================================
// COMPONENTE PRINCIPAL: GROUP MANAGER
// =========================================================================
export function GroupManager({ groups, allUsers }: { groups: any[], allUsers: any[] }) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [localGroups, setLocalGroups] = useState(groups)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "withMembers" | "empty" | "withLeaders">("all")
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [showMultiGroupModal, setShowMultiGroupModal] = useState(false)

  // Sync when prop updates
  useEffect(() => {
    setLocalGroups(groups)
  }, [groups])

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Modal State for Confirmations
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean
    title: string
    description: string
    members?: any[]
    isDestructive: boolean
    confirmText: string
    errorMessage?: string | null
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    description: "",
    members: [],
    isDestructive: true,
    confirmText: "Confirmar",
    errorMessage: null,
    onConfirm: () => {}
  })

  const [isPendingAction, startActionTransition] = useTransition()

  // Calculate high-level stats from local state
  const totalGroups = localGroups.length
  const totalAssignedMembers = useMemo(() => {
    return localGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0)
  }, [localGroups])

  const totalLeaders = useMemo(() => {
    const leaderIds = new Set<string>()
    localGroups.forEach(g => {
      g.supervisors?.forEach((s: any) => leaderIds.add(s.id))
    })
    return leaderIds.size
  }, [localGroups])

  // Filter groups from local state
  const filteredGroups = useMemo(() => {
    return localGroups.filter(g => {
      const matchSearch = 
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase()) ||
        g.supervisors?.some((s: any) => s.name?.toLowerCase().includes(search.toLowerCase())) ||
        g.members?.some((m: any) => m.name?.toLowerCase().includes(search.toLowerCase()))

      if (!matchSearch) return false

      if (categoryFilter === "withMembers") return (g.members?.length || 0) > 0
      if (categoryFilter === "empty") return (!g.members || g.members.length === 0)
      if (categoryFilter === "withLeaders") return (g.supervisors?.length || 0) > 0

      return true
    })
  }, [localGroups, search, categoryFilter])

  // Resilient Removal Handler (Optimistic UI + Server Action + REST API Fallback)
  const executeRemoveMembers = async (group: any, memberIds: string[]) => {
    // 1. Optimistic removal on screen immediately
    setLocalGroups(prev => prev.map(g => {
      if (g.id === group.id) {
        return {
          ...g,
          members: (g.members || []).filter((m: any) => !memberIds.includes(m.id)),
          supervisors: (g.supervisors || []).filter((s: any) => !memberIds.includes(s.id)),
          subLeaders: (g.subLeaders || []).filter((sub: any) => !memberIds.includes(sub.id))
        }
      }
      return g
    }))

    // 2. Try Server Action first
    let success = false
    let errorMsg = ""

    try {
      const result = await removeMembersFromGroup(group.id, memberIds)
      if (result && result.success) {
        success = true
      } else if (result && result.error) {
        errorMsg = result.error
      }
    } catch (actionErr: any) {
      console.warn("Server action failed, trying REST API fallback...", actionErr)
    }

    // 3. Fallback to resilient REST API if Server Action failed (e.g. build hash mismatch)
    if (!success) {
      try {
        const response = await fetch("/api/admin/groups/members", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId: group.id, userIds: memberIds })
        })
        const data = await response.json()
        if (data && data.success) {
          success = true
        } else {
          errorMsg = data?.error || "Error al remover del grupo."
        }
      } catch (apiErr: any) {
        console.error("REST API removal failed:", apiErr)
        errorMsg = apiErr?.message || "Error de red al procesar la solicitud."
      }
    }

    if (success) {
      setToastMessage({
        type: "success",
        text: memberIds.length === 1 
          ? t("groups.confirm.singleRemovedSuccess") 
          : t("groups.confirm.multiRemovedSuccess", { count: memberIds.length })
      })
      router.refresh()
      return true
    } else {
      setToastMessage({
        type: "error",
        text: errorMsg || t("groups.confirm.removeError")
      })
      // Re-sync with server
      router.refresh()
      return false
    }
  }

  // Trigger Confirmation: Delete Single Member
  const handleRequestRemoveMember = (group: any, member: any) => {
    setConfirmModalState({
      isOpen: true,
      title: t("groups.confirm.removeSingleTitle", { name: member.name }),
      description: t("groups.confirm.removeSingleDesc", { group: group.name }),
      members: [member],
      isDestructive: true,
      confirmText: t("groups.confirm.removeSingleBtn"),
      errorMessage: null,
      onConfirm: () => {
        startActionTransition(async () => {
          const ok = await executeRemoveMembers(group, [member.id])
          if (ok) {
            setConfirmModalState(prev => ({ ...prev, isOpen: false, errorMessage: null }))
          } else {
            setConfirmModalState(prev => ({ 
              ...prev, 
              errorMessage: t("groups.confirm.removeError") 
            }))
          }
        })
      }
    })
  }

  // Trigger Confirmation: Delete Multiple Members
  const handleRequestRemoveMultiple = (group: any, members: any[]) => {
    const memberIds = members.map(m => m.id)
    setConfirmModalState({
      isOpen: true,
      title: t("groups.confirm.removeMultiTitle", { count: members.length }),
      description: t("groups.confirm.removeMultiDesc", { count: members.length, group: group.name }),
      members,
      isDestructive: true,
      confirmText: t("groups.confirm.removeMultiBtn", { count: members.length }),
      errorMessage: null,
      onConfirm: () => {
        startActionTransition(async () => {
          const ok = await executeRemoveMembers(group, memberIds)
          if (ok) {
            setConfirmModalState(prev => ({ ...prev, isOpen: false, errorMessage: null }))
          } else {
            setConfirmModalState(prev => ({ 
              ...prev, 
              errorMessage: t("groups.confirm.removeError") 
            }))
          }
        })
      }
    })
  }

  // Trigger Confirmation: Delete Entire Group
  const handleRequestDeleteGroup = (group: any) => {
    setConfirmModalState({
      isOpen: true,
      title: t("groups.confirm.deleteGroupTitle", { name: group.name }),
      description: t("groups.confirm.deleteGroupDesc", { count: group.members?.length || 0 }),
      members: group.members,
      isDestructive: true,
      confirmText: t("groups.confirm.deleteGroupBtn"),
      errorMessage: null,
      onConfirm: () => {
        startActionTransition(async () => {
          let success = false
          let errorMsg = ""

          // 1. Intentar Server Action
          try {
            const res = await deleteGroup(group.id)
            if (res && res.success) success = true
            else if (res && res.error) errorMsg = res.error
          } catch (e: any) {
            console.warn("Server action failed, trying REST API fallback...", e)
          }

          // 2. Fallback a API REST
          if (!success) {
            try {
              const res = await fetch("/api/admin/groups/members", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "deleteGroup", groupId: group.id })
              })
              const data = await res.json()
              if (data && data.success) success = true
              else errorMsg = data?.error || t("groups.confirm.groupDeleteError")
            } catch (apiErr: any) {
              errorMsg = apiErr?.message || t("groups.confirm.groupDeleteError")
            }
          }

          if (success) {
            setLocalGroups(prev => prev.filter(g => g.id !== group.id))
            setConfirmModalState(prev => ({ ...prev, isOpen: false, errorMessage: null }))
            setToastMessage({ type: "success", text: t("groups.confirm.groupDeletedSuccess", { name: group.name }) })
            router.refresh()
          } else {
            setConfirmModalState(prev => ({ ...prev, errorMessage: errorMsg || t("groups.confirm.groupDeleteError") }))
            router.refresh()
          }
        })
      }
    })
  }

  // Handle members added optimistically
  const handleMembersAdded = (groupId: string, userIds: string[]) => {
    const addedUserObjs = allUsers.filter(u => userIds.includes(u.id))
    setLocalGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const existingIds = new Set((g.members || []).map((m: any) => m.id))
        const newToAdd = addedUserObjs.filter(u => !existingIds.has(u.id)).map(u => ({ ...u, projectId: groupId }))
        return {
          ...g,
          members: [...(g.members || []), ...newToAdd]
        }
      }
      return g
    }))
    setToastMessage({
      type: "success",
      text: userIds.length === 1 
        ? t("groups.confirm.memberAddedSuccess") 
        : t("groups.confirm.membersAddedSuccess", { count: userIds.length })
    })
    router.refresh()
  }

  // Handle leaders updated optimistically
  const handleLeadersUpdated = (groupId: string, supervisors: any[], subLeaders: any[]) => {
    setLocalGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          supervisors,
          subLeaders
        }
      }
      return g
    }))
    setToastMessage({
      type: "success",
      text: t("groups.confirm.leadersUpdatedSuccess")
    })
    router.refresh()
  }

  // Handle multi-group assignments per user
  const handleUserGroupsUpdated = (userId: string, updatedGroupIds: string[]) => {
    const targetUser = allUsers.find(u => u.id === userId)
    if (!targetUser) return

    setLocalGroups(prev => prev.map(g => {
      const isNowMember = updatedGroupIds.includes(g.id)
      const currentMembers = g.members || []
      const isAlreadyMember = currentMembers.some((m: any) => m.id === userId)

      if (isNowMember && !isAlreadyMember) {
        return { ...g, members: [...currentMembers, { ...targetUser, projectId: g.id }] }
      } else if (!isNowMember && isAlreadyMember) {
        return { ...g, members: currentMembers.filter((m: any) => m.id !== userId) }
      }
      return g
    }))

    // Keep user's projects updated in memory
    targetUser.projects = localGroups.filter(g => updatedGroupIds.includes(g.id)).map(g => ({
      id: g.id,
      name: g.name,
      color: g.color,
      icon: g.icon
    }))

    setToastMessage({
      type: "success",
      text: t("groups.multiGroup.saveSuccess", { name: targetUser.name, count: updatedGroupIds.length })
    })
    router.refresh()
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", position: "relative" }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div 
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 9999999,
            padding: "0.85rem 1.25rem",
            borderRadius: "0.85rem",
            backgroundColor: toastMessage.type === "success" ? "#064e3b" : "#7f1d1d",
            color: "#ffffff",
            border: toastMessage.type === "success" ? "1px solid #10b981" : "1px solid #ef4444",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
            fontWeight: 700,
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            animation: "fadeIn 0.25s ease-out"
          }}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={18} color="#34d399" />
          ) : (
            <AlertTriangle size={18} color="#f87171" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Centered Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        description={confirmModalState.description}
        members={confirmModalState.members}
        isDestructive={confirmModalState.isDestructive}
        confirmText={confirmModalState.confirmText}
        errorMessage={confirmModalState.errorMessage}
        isPending={isPendingAction}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => {
          if (!isPendingAction) {
            setConfirmModalState(prev => ({ ...prev, isOpen: false, errorMessage: null }))
          }
        }}
      />

      {/* Multi-Group Assignment Modal */}
      {showMultiGroupModal && (
        <AssignMultiGroupModal
          allUsers={allUsers}
          groups={localGroups}
          onClose={() => setShowMultiGroupModal(false)}
          onUserGroupsUpdated={handleUserGroupsUpdated}
        />
      )}

      {/* Page Header */}
      <header style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <div 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "1rem", 
              backgroundColor: "hsl(var(--primary) / 0.15)",
              border: "1px solid hsl(var(--primary) / 0.3)",
              boxShadow: "0 0 25px hsl(var(--primary) / 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Users size={26} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{t("groups.title")}</h1>
              <span style={{ padding: "0.2rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)", fontSize: "0.75rem", fontWeight: 800 }}>
                {t("groups.masterControl")}
              </span>
            </div>
            <p style={{ color: "hsl(var(--muted-foreground))", margin: "0.35rem 0 0", fontSize: "0.95rem" }}>
              {t("groups.subtitle")}
            </p>
          </div>
        </div>
      </header>

      {/* KPI Stats Cards Banner */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1rem" 
        }}
      >
        <div 
          style={{ 
            padding: "1.25rem", 
            borderRadius: "1.25rem", 
            backgroundColor: "rgba(15, 23, 42, 0.7)", 
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "0.85rem", backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{totalGroups}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("groups.stats.squadsAndGroups")}</div>
          </div>
        </div>

        <div 
          style={{ 
            padding: "1.25rem", 
            borderRadius: "1.25rem", 
            backgroundColor: "rgba(15, 23, 42, 0.7)", 
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "0.85rem", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{totalAssignedMembers}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("groups.stats.assignedMembers")}</div>
          </div>
        </div>

        <div 
          style={{ 
            padding: "1.25rem", 
            borderRadius: "1.25rem", 
            backgroundColor: "rgba(15, 23, 42, 0.7)", 
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "0.85rem", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Crown size={22} />
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{totalLeaders}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("groups.stats.activeLeaders")}</div>
          </div>
        </div>

        <div 
          style={{ 
            padding: "1.25rem", 
            borderRadius: "1.25rem", 
            backgroundColor: "rgba(15, 23, 42, 0.7)", 
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "0.85rem", backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
              {totalGroups > 0 ? (totalAssignedMembers / totalGroups).toFixed(1) : 0}
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("groups.stats.averagePerGroup")}</div>
          </div>
        </div>
      </div>

      {/* Action Bar: Asignación Multi-Grupos */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "-0.75rem" }}>
        <button
          type="button"
          onClick={() => setShowMultiGroupModal(true)}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.55rem",
            fontWeight: 800,
            fontSize: "0.85rem",
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            color: "#60a5fa",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.1)"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.2)"
            e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.12)"
            e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)"
          }}
        >
          <Layers size={17} />
          <span>{t("groups.multiGroup.openBtn")}</span>
        </button>
      </div>

      {/* Collapsible Create Group Panel */}
      <CreateGroupPanel allUsers={allUsers} />

      {/* Search and Category Filter Controls */}
      <div 
        style={{ 
          padding: "1.25rem 1.5rem", 
          borderRadius: "1.25rem", 
          backgroundColor: "rgba(15, 23, 42, 0.7)", 
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          gap: "1rem", 
          flexWrap: "wrap" 
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "460px" }}>
          <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            className="input" 
            placeholder={t("groups.search.placeholder")} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ 
              width: "100%", 
              paddingLeft: "2.75rem", 
              borderRadius: "9999px", 
              fontSize: "0.9rem", 
              border: "1px solid rgba(255, 255, 255, 0.12)", 
              backgroundColor: "rgba(10, 17, 38, 0.7)",
              color: "#ffffff"
            }} 
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              border: categoryFilter === "all" ? "1px solid hsl(var(--primary))" : "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: categoryFilter === "all" ? "hsl(var(--primary) / 0.2)" : "transparent",
              color: categoryFilter === "all" ? "hsl(var(--primary))" : "#94a3b8",
              transition: "all 0.15s"
            }}
          >
            {t("groups.search.filterAll", { count: filteredGroups.length })}
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("withMembers")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              border: categoryFilter === "withMembers" ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: categoryFilter === "withMembers" ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: categoryFilter === "withMembers" ? "#10b981" : "#94a3b8",
              transition: "all 0.15s"
            }}
          >
            {t("groups.search.filterWithMembers")}
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("empty")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              border: categoryFilter === "empty" ? "1px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: categoryFilter === "empty" ? "rgba(245, 158, 11, 0.15)" : "transparent",
              color: categoryFilter === "empty" ? "#f59e0b" : "#94a3b8",
              transition: "all 0.15s"
            }}
          >
            {t("groups.search.filterEmpty")}
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("withLeaders")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              border: categoryFilter === "withLeaders" ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: categoryFilter === "withLeaders" ? "rgba(139, 92, 246, 0.15)" : "transparent",
              color: categoryFilter === "withLeaders" ? "#8b5cf6" : "#94a3b8",
              transition: "all 0.15s"
            }}
          >
            {t("groups.search.filterWithLeaders")}
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div 
          style={{ 
            padding: "5rem 1rem", 
            textAlign: "center", 
            borderRadius: "1.5rem",
            border: "1px dashed rgba(255, 255, 255, 0.15)", 
            backgroundColor: "rgba(15, 23, 42, 0.3)" 
          }}
        >
          <Building size={48} style={{ color: "#94a3b8", opacity: 0.25, margin: "0 auto 1rem", display: "block" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#ffffff" }}>
            {t("groups.search.noGroupsFound")}
          </h3>
          <p style={{ color: "#94a3b8", margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
            {t("groups.search.noGroupsHelp")}
          </p>
        </div>
      ) : (
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", 
            gap: "1.5rem" 
          }}
        >
          {filteredGroups.map((group, idx) => (
            <GroupCard 
              key={group.id} 
              index={idx} 
              group={group} 
              allUsers={allUsers}
              onRequestDeleteGroup={handleRequestDeleteGroup}
              onRequestRemoveMember={handleRequestRemoveMember}
              onRequestRemoveMultiple={handleRequestRemoveMultiple}
              onMembersAdded={handleMembersAdded}
              onLeadersUpdated={handleLeadersUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
