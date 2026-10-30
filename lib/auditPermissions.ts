import { SUPERADMIN_EMAILS, isSuperAdminEmail } from "@/lib/auth"

/**
 * Permisos y autorización para visualización y consulta de Logs de Auditoría
 * 
 * Acceso permitido a:
 * 1. Super Administradores (Ivan Reyes, Rafael Ureña, Pablo Brun)
 * 2. Tecnología / IT (TECHNOLOGY, TECHNOLOGY_ADMIN, IT_MANAGER)
 * 3. Supervisores / Team Leads
 * 4. Managers de Operaciones
 * 5. Integrantes del equipo 'AI & Software Development' / Developers
 * 
 * Acceso DENEGADO a:
 * - Rol ADMIN (Rose Estevez, Ivana Lowe, Maria Peralta)
 * - Agentes / Usuarios generales
 */

export function canViewAuditLogs(user: any): boolean {
  if (!user) return false

  const email = String(user.email || '').toLowerCase().trim()
  if (isSuperAdminEmail(email) || user.isSuperAdmin) {
    return true
  }

  const role = String(user.role || '').toUpperCase().trim()

  // Rol ADMIN tiene prohibido explícitamente el acceso a Logs de Auditoría
  if (role === 'ADMIN') {
    return false
  }

  const allowedRoles = [
    'SUPERVISOR',
    'TEAM_LEAD',
    'MANAGER',
    'TECHNOLOGY',
    'TECHNOLOGY_ADMIN',
    'IT_MANAGER'
  ]
  if (allowedRoles.includes(role)) {
    return true
  }

  // Comprobar pertenencia a proyecto de IA y Software Development
  const project = String(user.projectName || user.project?.name || '').toLowerCase().trim()
  if (project.includes('ai') && project.includes('software')) {
    return true
  }
  if (project === 'ai & software development') {
    return true
  }

  // Comprobar cargo/posición relacionada
  const pos = String(user.position || '').toLowerCase().trim()
  if (
    pos.includes('software developer') ||
    pos.includes('software engineer') ||
    pos.includes('ai software') ||
    pos.includes('ai developer') ||
    pos.includes('workforce systems') ||
    pos.includes('developer') ||
    pos.includes('desarrollador') ||
    pos.includes('programmer') ||
    pos.includes('programador')
  ) {
    return true
  }

  return false
}
