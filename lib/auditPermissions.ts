/**
 * Permisos y autorización para visualización y consulta de Logs de Auditoría
 * 
 * Acceso permitido a:
 * 1. Supervisores / Team Leads
 * 2. Managers
 * 3. Tecnología / IT (TECHNOLOGY, TECHNOLOGY_ADMIN, IT_MANAGER)
 * 4. Integrantes del equipo 'AI & Software Development'
 * 5. Ivan Reyes (Administrador Maestro)
 */

export function canViewAuditLogs(user: any): boolean {
  if (!user) return false

  const email = String(user.email || '').toLowerCase().trim()
  if (email === 'ireyes@tnoutsourcing.com' || user.isSuperAdmin) {
    return true
  }

  const role = String(user.role || '').toUpperCase().trim()
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
