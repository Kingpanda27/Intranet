export interface ScopedUser {
  id?: string
  email?: string | null
  name?: string | null
  role?: string | null
  department?: string | null
  isSuperAdmin?: boolean
}

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || "ireyes@tnoutsourcing.com").toLowerCase().trim()

/**
 * 1. CEO / Master Admin Check
 * Alcance Global: Puede visualizar, aprobar o rechazar todas las solicitudes
 * de cualquier departamento o empleado de la empresa sin excepción.
 */
export function isCEO(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  const email = (user.email || "").toLowerCase().trim()
  if (email === SUPERADMIN_EMAIL || user.isSuperAdmin) return true
  const role = (user.role || "").toUpperCase().trim()
  return role === "CEO" || role === "SUPERADMIN" || role === "DIRECTOR"
}

/**
 * 2. IT / Technology Department Check
 * Personal del departamento de Tecnología / TI y IT Manager
 */
export function isTechnologyStaff(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  if (isCEO(user)) return true
  const role = (user.role || "").toUpperCase().trim()
  const dept = (user.department || "").toUpperCase().trim()
  return (
    role === "TECHNOLOGY" ||
    role === "IT_MANAGER" ||
    role === "TECHNOLOGY_ADMIN" ||
    role === "ADMIN" ||
    dept === "TECHNOLOGY" ||
    dept === "IT" ||
    dept === "TI" ||
    dept === "SISTEMAS"
  )
}

/**
 * 3. Acceso Exclusivo a Configuración de TI
 * Solo personal de Technology / IT y IT Manager (y CEO)
 * Ningún otro rol (ni RRHH, ni Managers de otras áreas, ni Supervisores)
 */
export function canAccessITConfig(user: ScopedUser | null | undefined): boolean {
  return isTechnologyStaff(user)
}

/**
 * 4. Panel de Control de Aprobaciones
 * Roles Autorizados: CEO, RRHH, Manager, IT Manager, Supervisor, Team Lead, Technology
 * Roles Bloqueados: Empleados / Agentes regulares sin personal a cargo
 */
export function canAccessApprovalsPanel(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  if (isCEO(user)) return true
  const role = (user.role || "").toUpperCase().trim()
  return (
    role === "HR" ||
    role === "MANAGER" ||
    role === "IT_MANAGER" ||
    role === "TECHNOLOGY_ADMIN" ||
    role === "TECHNOLOGY" ||
    role === "SUPERVISOR" ||
    role === "TEAM_LEAD" ||
    role === "DIRECTOR"
  )
}
