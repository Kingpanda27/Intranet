"use client"

import styles from './Sidebar.module.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, LogOut, UserCircle, LayoutDashboard, Book, Settings, FolderOpen, Sun, Moon, Umbrella, ShieldCheck, Activity } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from '@/app/Providers'
import React, { useState, useEffect } from 'react'
import { getMyGroups } from '@/app/actions/teamActions'

export function Sidebar() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const user = session?.user as any
  const [myGroups, setMyGroups] = useState<any[]>([])

  const hasDashboardAccess = user?.role === "SUPERVISOR" || user?.role === "MANAGER" || user?.role === "IT_MANAGER" || user?.role === "TECHNOLOGY_ADMIN" || user?.role === "HR"
  const isTechnology = user?.role === "TECHNOLOGY" || user?.role === "IT_MANAGER" || user?.role === "TECHNOLOGY_ADMIN" || user?.role === "HR"
  const isEmployeeOnly = user?.role === "USER" || user?.role === "AGENT"

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
        <img 
          src={theme === "light" ? "/logo_tn.png" : "/logo_tn_dark.png"} 
          alt="Telecom Networks" 
          style={{ height: "46px", width: "auto", margin: "0 auto", display: "block" }} 
        />
      </div>
      
      <nav className={styles.nav}>
        <Link href="/" className={getLinkClass("/")}>
          <Home size={18} />
          <span>Inicio</span>
        </Link>
        <Link href="/social" className={getLinkClass("/social")}>
          <Users size={18} />
          <span>Centro Social</span>
        </Link>

        <Link href="/knowledge-base" className={getLinkClass("/knowledge-base")}>
          <Book size={18} />
          <span>Documentos</span>
        </Link>
        <Link href="/calendar" className={getLinkClass("/calendar")}>
          <Calendar size={18} />
          <span>Calendario</span>
        </Link>
        <Link href="/vacations" className={getLinkClass("/vacations")}>
          <Umbrella size={18} />
          <span>Vacaciones / Permisos</span>
        </Link>

        {/* Grupos del Usuario */}
        {visibleGroups.map(g => (
          <Link key={g.id} href={`/groups/${g.id}`} className={getLinkClass(`/groups/${g.id}`)}>
            <Users size={18} style={{ color: g.color || "hsl(var(--primary))" }} />
            <span>
              {g.name} {g.isLeader ? "👑" : g.isSupervisor ? "🛡️" : ""}
            </span>
          </Link>
        ))}

        {hasDashboardAccess && !isEmployeeOnly && (
          <Link href="/dashboard" className={getLinkClass("/dashboard")}>
            <LayoutDashboard size={18} />
            <span>Panel Control</span>
          </Link>
        )}

        {(hasDashboardAccess || isTechnology) && !isEmployeeOnly && (
          <Link href="/admin/role-requests" className={getLinkClass("/admin/role-requests")}>
            <ShieldCheck size={18} />
            <span>Solicitudes de Rol</span>
          </Link>
        )}

        {isTechnology && (
          <Link href="/admin/users" className={getLinkClass("/admin/users")}>
            <Settings size={18} />
            <span>Gestión de Usuarios</span>
          </Link>
        )}
        {isTechnology && (
          <Link href="/admin/groups" className={getLinkClass("/admin/groups")}>
            <FolderOpen size={18} />
            <span>Gestión de Grupos</span>
          </Link>
        )}
        {isTechnology && (
          <Link href="/admin/config" className={getLinkClass("/admin/config")}>
            <Settings size={18} />
            <span>Configuración TI</span>
          </Link>
        )}
        {isTechnology && (
          <Link href="/admin/audit-logs" className={getLinkClass("/admin/audit-logs")}>
            <Activity size={18} />
            <span>Logs de Auditoría</span>
          </Link>
        )}
        <Link href="/profile" className={getLinkClass("/profile")}>
          <UserCircle size={18} />
          <span>Mi Perfil</span>
        </Link>
      </nav>

      <div className={styles.footer}>
        <button onClick={toggleTheme} className={styles.themeToggleBtn} title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === "light" ? "Modo Oscuro" : "Modo Claro"}</span>
        </button>

        <button onClick={() => signOut()} className={`${styles.navItem} ${styles.logoutBtn}`}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>

        <div style={{ marginTop: "1.25rem", fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", textAlign: "center", lineHeight: "1.4" }}>
          Desarrollado por IT Telecom Support Team<br/>
          Soporte: <a href="mailto:support@tnoutsourcing.com" style={{ color: "hsl(var(--primary))", textDecoration: "none", fontWeight: 600 }}>support@tnoutsourcing.com</a>
        </div>
      </div>
    </aside>
  )
}
