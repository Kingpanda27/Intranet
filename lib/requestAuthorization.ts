import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export const TECHNICAL_REQUEST_TYPES = [
  "REMOTE_INTERNET",
  "REMOTE_POWER",
  "REMOTE_HARDWARE",
  "REMOTE_VPN"
] as const

export type TechnicalRequestType = typeof TECHNICAL_REQUEST_TYPES[number]

export * from "./authorizationRoles"
import { isCEO, isTechnologyStaff, canAccessITConfig, canAccessApprovalsPanel, ScopedUser } from "./authorizationRoles"

/**
 * Obtiene los IDs de proyectos gestionados por el usuario
 * (donde figure en la relación de 'supervisors' o 'subLeaders')
 */
export async function getManagedProjectIds(userId: string): Promise<string[]> {
  if (!userId) return []
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { supervisors: { some: { id: userId } } },
        { subLeaders: { some: { id: userId } } }
      ]
    },
    select: { id: true }
  })
  return projects.map(p => p.id)
}

/**
 * 5. Filtro Dinámico de Data Scoping (Row-Level Security) para TimeOffRequest
 * 
 * Genera el predicado Prisma WHERE estricto según la jerarquía corporativa:
 * - CEO: {} (Alcance global de toda la empresa sin filtros)
 * - RRHH: {} (Alcance global / corporativo)
 * - IT Manager:
 *     (tipo en solicitudes técnicas) OR
 *     (empleado solicitante pertenece a equipo/proyectos de tecnología)
 * - Team Lead / Supervisor / Manager de Operaciones:
 *     WHERE employee.team_id IN (current_user.managed_team_ids)
 * - Otros / Sin Permisos: null
 */
export async function getTimeOffScopeFilter(
  user: ScopedUser | null | undefined
): Promise<Prisma.TimeOffRequestWhereInput | null> {
  if (!user || !user.id) return null

  // A. CEO -> Alcance Global
  if (isCEO(user)) {
    return {}
  }

  const role = (user.role || "").toUpperCase().trim()

  // B. RRHH -> Alcance Corporativo Global
  if (role === "HR") {
    return {}
  }

  // C. IT Manager y Personal de Tecnología
  if (role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "TECHNOLOGY") {
    const managedProjectIds = await getManagedProjectIds(user.id)
    
    // Proyectos con afinidad de tecnología
    const techProjects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: "tech" } },
          { name: { contains: "software" } },
          { name: { contains: "ti" } },
          { name: { contains: "it" } },
          ...(managedProjectIds.length > 0 ? [{ id: { in: managedProjectIds } }] : [])
        ]
      },
      select: { id: true }
    })
    const techProjectIds = Array.from(new Set([...managedProjectIds, ...techProjects.map(p => p.id)]))

    return {
      OR: [
        // 1. Todas las solicitudes técnicas de cualquier empleado de la empresa
        { type: { in: Array.from(TECHNICAL_REQUEST_TYPES) } },
        // 2. Solicitudes administrativas del equipo directo de tecnología
        {
          user: {
            OR: [
              { role: { in: ["TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER"] } },
              ...(techProjectIds.length > 0 ? [{ projectId: { in: techProjectIds } }] : [])
            ]
          }
        }
      ]
    }
  }

  // D. Team Lead / Supervisor / Manager de Operaciones (Team Scope Estricto)
  if (role === "SUPERVISOR" || role === "TEAM_LEAD" || role === "MANAGER") {
    const managedProjectIds = await getManagedProjectIds(user.id)

    // Si aún no tiene proyectos/escuadrones asignados, no puede ver registros de otros
    if (managedProjectIds.length === 0) {
      return { id: "__NO_TEAM_ASSIGNED__" }
    }

    return {
      user: {
        projectId: { in: managedProjectIds }
      }
    }
  }

  // E. Empleados / Agentes regulares sin personal a cargo
  return null
}

/**
 * 6. Validador de Autorización a Nivel de Registro (BOLA / IDOR Protection)
 * 
 * Verifica que el usuario autenticado tenga derecho legítimo sobre la solicitud:
 * - CEO y RRHH: Bypass global para cualquier registro.
 * - IT Manager: Autorizado si es técnica o si el solicitante pertenece a tecnología.
 * - Supervisor / Team Lead / Manager: Únicamente si el solicitante pertenece a su equipo directo.
 */
export async function authorizeRequestAction(
  user: ScopedUser | null | undefined,
  requestId: string
): Promise<{
  authorized: boolean
  error?: string
  status?: number
  request?: any
}> {
  if (!user || !user.id) {
    return { authorized: false, error: "No autenticado", status: 401 }
  }

  if (!canAccessApprovalsPanel(user)) {
    return {
      authorized: false,
      error: "Acceso denegado (403 Forbidden): Tu rol no tiene permisos de aprobación.",
      status: 403
    }
  }

  const request = await prisma.timeOffRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          projectId: true,
          project: { select: { id: true, name: true } }
        }
      }
    }
  })

  if (!request) {
    return { authorized: false, error: "Solicitud no encontrada", status: 404 }
  }

  // A. CEO y RRHH -> Bypass de autorización corporativo
  if (isCEO(user) || (user.role || "").toUpperCase().trim() === "HR") {
    return { authorized: true, request }
  }

  const role = (user.role || "").toUpperCase().trim()
  const isTechnical = (TECHNICAL_REQUEST_TYPES as readonly string[]).includes(request.type)

  // B. IT Manager / Tecnología
  if (role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "TECHNOLOGY") {
    // Las incidencias técnicas de cualquier empleado de la empresa son competencia de IT
    if (isTechnical) {
      return { authorized: true, request }
    }

    // Para solicitudes administrativas, verificar si el colaborador pertenece a su equipo de tecnología
    const managedProjectIds = await getManagedProjectIds(user.id)
    const empRole = (request.user?.role || "").toUpperCase().trim()
    const isTechEmployee = empRole === "TECHNOLOGY" || empRole === "TECHNOLOGY_ADMIN" || empRole === "IT_MANAGER"
    const isInManagedProject = Boolean(request.user?.projectId && managedProjectIds.includes(request.user.projectId))

    if (isTechEmployee || isInManagedProject) {
      return { authorized: true, request }
    }

    return {
      authorized: false,
      error: "Acceso denegado (403 Forbidden): Como IT Manager solo puedes gestionar solicitudes técnicas o de colaboradores de tu equipo de tecnología.",
      status: 403
    }
  }

  // C. Team Lead / Supervisor / Manager de Operaciones
  if (role === "SUPERVISOR" || role === "TEAM_LEAD" || role === "MANAGER") {
    const managedProjectIds = await getManagedProjectIds(user.id)

    if (!request.user?.projectId || !managedProjectIds.includes(request.user.projectId)) {
      return {
        authorized: false,
        error: "Acceso denegado (403 Forbidden): Esta solicitud pertenece a un colaborador fuera de tu equipo asignado.",
        status: 403
      }
    }

    return { authorized: true, request }
  }

  return {
    authorized: false,
    error: "Acceso denegado (403 Forbidden): No tienes autorización sobre este registro.",
    status: 403
  }
}
