export interface ScopedUser {
  id?: string
  email?: string | null
  name?: string | null
  role?: string | null
  department?: string | null
  isSuperAdmin?: boolean
}

export const SUPERADMIN_EMAILS = [
  "ireyes@tnoutsourcing.com",
  "rurena@tnoutsourcing.com",
  "pbrun@tnoutsourcing.com"
]

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return SUPERADMIN_EMAILS.includes(email.toLowerCase().trim())
}

/**
 * Verifica si el usuario es Super Administrador
 */
export function isSuperAdmin(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  const email = (user.email || "").toLowerCase().trim()
  if (isSuperAdminEmail(email) || user.isSuperAdmin) return true
  const role = (user.role || "").toUpperCase().trim()
  return role === "SUPERADMIN"
}

/**
 * 1. CEO / Master Admin Check
 * Alcance Global: Puede visualizar, aprobar o rechazar todas las solicitudes
 * de cualquier departamento o empleado de la empresa sin excepción.
 */
export function isCEO(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = (user.role || "").toUpperCase().trim()
  return role === "CEO" || role === "DIRECTOR"
}

/**
 * Rol Administrador (ADMIN)
 * Acceso administrativo general pero sin permisos técnicos avanzados (Logs auditoría, Config TI, Solicitudes Rol)
 */
export function isAdmin(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user) || isCEO(user)) return true
  const role = (user.role || "").toUpperCase().trim()
  return role === "ADMIN"
}

/**
 * 2. IT / Technology Department Check
 * Personal del departamento de Tecnología / TI y IT Manager
 */
export function isTechnologyStaff(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = (user.role || "").toUpperCase().trim()
  if (role === "ADMIN") return false
  const dept = (user.department || "").toUpperCase().trim()
  return (
    role === "TECHNOLOGY" ||
    role === "IT_MANAGER" ||
    role === "TECHNOLOGY_ADMIN" ||
    dept === "TECHNOLOGY" ||
    dept === "IT" ||
    dept === "TI" ||
    dept === "SISTEMAS"
  )
}

/**
 * 3. Acceso Exclusivo a Configuración de TI
 * Solo personal de Technology / IT y IT Manager (y Super Admins)
 * Los ADMIN tienen acceso bloqueado por política.
 */
export function canAccessITConfig(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  const role = (user.role || "").toUpperCase().trim()
  if (role === "ADMIN" && !isSuperAdmin(user)) return false
  return isTechnologyStaff(user)
}

/**
 * 4. Panel de Control de Aprobaciones
 * Roles Autorizados: CEO, Super Admins, ADMIN, RRHH, Manager, IT Manager, Supervisor, Team Lead, Technology
 * Roles Bloqueados: Empleados / Agentes regulares sin personal a cargo
 */
export function canAccessApprovalsPanel(user: ScopedUser | null | undefined): boolean {
  if (!user) return false
  if (isCEO(user)) return true
  const role = (user.role || "").toUpperCase().trim()
  return (
    role === "ADMIN" ||
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
