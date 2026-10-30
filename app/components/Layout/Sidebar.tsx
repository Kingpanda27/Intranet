"use client"

import styles from './Sidebar.module.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, LogOut, UserCircle, LayoutDashboard, Book, Settings, FolderOpen, Sun, Moon, Umbrella, ShieldCheck, Activity, Headset } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from '@/app/Providers'
import React, { useState, useEffect } from 'react'
import { getMyGroups } from '@/app/actions/teamActions'
import { useSupportChat } from '@/app/components/SupportAILlama/SupportContext'
import { canViewAuditLogs } from '@/lib/auditPermissions'
import { canAccessITConfig, canAccessApprovalsPanel, isSuperAdminEmail } from '@/lib/authorizationRoles'
import { APP_VERSION } from '@/lib/version'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export function Sidebar() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const user = session?.user as any
  const [myGroups, setMyGroups] = useState<any[]>([])
  const { isSupportOpen, openSupportChat, closeSupportChat, activeView, canAccessAdmin } = useSupportChat()

  const isMasterAdmin = isSuperAdminEmail(user?.email) || user?.isSuperAdmin
  const hasDashboardAccess = canAccessApprovalsPanel(user)
  const isITConfigAccess = canAccessITConfig(user)
  const isTechnology = isMasterAdmin || user?.role === "TECHNOLOGY" || user?.role === "IT_MANAGER" || user?.role === "TECHNOLOGY_ADMIN" || user?.role === "HR"
  const canManageUsers = isTechnology || user?.role === "MANAGER" || user?.role === "ADMIN"
  const canManageGroups = isTechnology || user?.role === "ADMIN"
  const canViewAudit = canViewAuditLogs(user)
  const isEmployeeOnly = !isMasterAdmin && (user?.role === "USER" || user?.role === "AGENT")
  const canAccessRoleRequests = (hasDashboardAccess || isTechnology) && !isEmployeeOnly && user?.role !== "ADMIN"

  useEffect(() => {
    if (session?.user) {
      getMyGroups().then(setMyGroups)
    }
  }, [session])

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  const getLinkClass = (path: string) => {
    if (isSupportOpen) return styles.navItem
    return `${styles.navItem} ${isActive(path) ? styles.navItemActive : ''}`
  }

  // Filtrado de visualización de grupos:
  // Si es empleado normal, solo ve su grupo. Si es líder de grupo (isLeader = true), también puede entrar.
  const visibleGroups = myGroups.filter(g => {
    if (isTechnology) return true
    if (hasDashboardAccess) return true
    // Si es sublíder del grupo (Líder de Grupo) o miembro
    return g.isLeader || g.isSupervisor || myGroups.some(mg => mg.id === g.id)
  })

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Link href="/" onClick={() => closeSupportChat()} style={{ display: "block" }}>
          <img 
            src={theme === "light" ? "/logo_tn.png" : "/logo_tn_dark.png"} 
            alt="Telecom Networks" 
            style={{ height: "46px", width: "auto", margin: "0 auto", display: "block" }} 
          />
        </Link>
      </div>
      
      <nav className={styles.nav}>
        <Link href="/" onClick={() => closeSupportChat()} className={getLinkClass("/")}>
          <Home size={18} />
          <span>{t("nav.home")}</span>
        </Link>
        <Link href="/social" onClick={() => closeSupportChat()} className={getLinkClass("/social")}>
          <Users size={18} />
          <span>{t("nav.social")}</span>
        </Link>

        <Link href="/knowledge-base" onClick={() => closeSupportChat()} className={getLinkClass("/knowledge-base")}>
          <Book size={18} />
          <span>{t("nav.documents")}</span>
        </Link>
        <Link href="/calendar" onClick={() => closeSupportChat()} className={getLinkClass("/calendar")}>
          <Calendar size={18} />
          <span>{t("nav.calendar")}</span>
        </Link>
        <Link href="/vacations" onClick={() => closeSupportChat()} className={getLinkClass("/vacations")}>
          <Umbrella size={18} />
          <span>{t("nav.vacations")}</span>
        </Link>

        {/* Grupos del Usuario */}
        {visibleGroups.map(g => (
          <Link key={g.id} href={`/groups/${g.id}`} onClick={() => closeSupportChat()} className={getLinkClass(`/groups/${g.id}`)}>
            <Users size={18} style={{ color: g.color || "hsl(var(--primary))" }} />
            <span>
              {g.name} {g.isLeader ? "👑" : g.isSupervisor ? "🛡️" : ""}
            </span>
          </Link>
        ))}

        {hasDashboardAccess && !isEmployeeOnly && (
          <Link href="/dashboard" onClick={() => closeSupportChat()} className={getLinkClass("/dashboard")}>
            <LayoutDashboard size={18} />
            <span>{t("nav.dashboard")}</span>
          </Link>
        )}

        {canAccessRoleRequests && (
          <Link href="/admin/role-requests" onClick={() => closeSupportChat()} className={getLinkClass("/admin/role-requests")}>
            <ShieldCheck size={18} />
            <span>{t("nav.roleRequests")}</span>
          </Link>
        )}

        {canManageUsers && (
          <Link href="/admin/users" onClick={() => closeSupportChat()} className={getLinkClass("/admin/users")}>
            <Settings size={18} />
            <span>{t("nav.userManager")}</span>
          </Link>
        )}
        {canManageGroups && (
          <Link href="/admin/groups" onClick={() => closeSupportChat()} className={getLinkClass("/admin/groups")}>
            <FolderOpen size={18} />
            <span>{t("nav.groupManager")}</span>
          </Link>
        )}
        {isITConfigAccess && (
          <Link href="/admin/config" onClick={() => closeSupportChat()} className={getLinkClass("/admin/config")}>
            <Settings size={18} />
            <span>{t("nav.itConfig")}</span>
          </Link>
        )}
        {canViewAudit && (
          <Link href="/admin/audit-logs" onClick={() => closeSupportChat()} className={getLinkClass("/admin/audit-logs")}>
            <Activity size={18} />
            <span>{t("nav.auditLogs")}</span>
          </Link>
        )}

        {/* Support AILlama Chat - Botón Destacado e Interactivo */}
        <button
          type="button"
          onClick={() => openSupportChat('chat')}
          className={`${styles.supportChatBtn} ${isSupportOpen ? styles.supportChatBtnActive : ''}`}
          title="Abrir chat de soporte técnico asistido por IA"
        >
          <Headset size={19} style={{ color: "#ff6a00", flexShrink: 0 }} />
          <span style={{ fontWeight: 650, letterSpacing: '-0.01em' }}>{t("nav.itSupportChat")}</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.64rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '9999px',
              background: 'rgba(255, 106, 0, 0.16)',
              color: '#ff6a00',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            AI BOT
          </span>
        </button>

        <Link href="/profile" onClick={() => closeSupportChat()} className={getLinkClass("/profile")}>
          <UserCircle size={18} />
          <span>{t("nav.myProfile")}</span>
        </Link>
      </nav>

      <div className={styles.footer}>
        <button onClick={toggleTheme} className={styles.themeToggleBtn} title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === "light" ? t("nav.darkMode") : t("nav.lightMode")}</span>
        </button>

        <button onClick={() => signOut()} className={`${styles.navItem} ${styles.logoutBtn}`}>
          <LogOut size={18} />
          <span>{t("nav.logout")}</span>
        </button>

        <div style={{ marginTop: "1.25rem", fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", textAlign: "center", lineHeight: "1.4" }}>
          {t("common.developedBy")}<br/>
          {t("common.support")}: <a href="mailto:support@tnoutsourcing.com" style={{ color: "hsl(var(--primary))", textDecoration: "none", fontWeight: 600 }}>support@tnoutsourcing.com</a><br/>
          <span style={{ display: "inline-block", marginTop: "0.35rem", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
            {t("common.version")} {APP_VERSION}
          </span>
        </div>
      </div>
    </aside>
  )
}
