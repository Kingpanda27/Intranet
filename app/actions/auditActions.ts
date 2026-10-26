"use server"

import { requireAuth } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { canViewAuditLogs } from "@/lib/auditPermissions"

export type AuditLogCategory = 
  | "ALL"
  | "USERS"
  | "GROUPS"
  | "ROLES"
  | "TIMEOFF"
  | "CALENDAR"
  | "CONFIG"
  | "SECURITY"
  | "SYSTEM"

export interface CreateAuditLogParams {
  action: string
  target?: string | null
  targetUserId?: string | null
  actorUserId?: string | null
  userName?: string | null
  oldValue?: string | null
  newValue?: string | null
  result?: "SUCCESS" | "FAILED" | "WARNING" | "REJECTED" | string
  metadata?: any
}

/**
 * Registrar un evento en el log de auditoría.
 * Admite sobrecarga flexible: con objeto de parámetros o argumentos posicionales compatibles.
 */
export async function createAuditLog(
  actionOrParams: string | CreateAuditLogParams,
  targetArg?: string,
  resultOrDetailsArg: string = "SUCCESS",
  metadataArg?: any
) {
  try {
    let action: string
    let target: string | null = null
    let targetUserId: string | null = null
    let actorUserId: string | null = null
    let userName: string | null = null
    let oldValue: string | null = null
    let newValue: string | null = null
    let result: string = "SUCCESS"
    let metadata: any = null

    if (typeof actionOrParams === "object" && actionOrParams !== null) {
      action = actionOrParams.action
      target = actionOrParams.target || null
      targetUserId = actionOrParams.targetUserId || null
      actorUserId = actionOrParams.actorUserId || null
      userName = actionOrParams.userName || null
      oldValue = actionOrParams.oldValue || null
      newValue = actionOrParams.newValue || null
      result = actionOrParams.result || "SUCCESS"
      metadata = actionOrParams.metadata || null
    } else {
      action = actionOrParams
      target = targetArg || null

      const standardResults = ["SUCCESS", "FAILED", "WARNING", "REJECTED"]
      if (resultOrDetailsArg && standardResults.includes(resultOrDetailsArg.toUpperCase())) {
        result = resultOrDetailsArg.toUpperCase()
        metadata = metadataArg
      } else {
        result = "SUCCESS"
        metadata = {
          description: resultOrDetailsArg,
          ...(typeof metadataArg === "object" ? metadataArg : metadataArg ? { extra: metadataArg } : {})
        }
      }
    }

    // Si no se proporcionó actorUserId o userName, obtener de la sesión actual
    if (!actorUserId || !userName) {
      try {
        const session = await getServerSession(authOptions)
        const sessionUser = session?.user as any
        if (sessionUser) {
          if (!actorUserId) actorUserId = sessionUser.id || null
          if (!userName) userName = sessionUser.name || sessionUser.email || "Usuario"
        }
      } catch (sessErr) {
        // En caso de contexto sin sesión disponible
      }
    }

    const metaStr = metadata
      ? typeof metadata === "string"
        ? metadata
        : JSON.stringify(metadata)
      : null

    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        userId: actorUserId || null,
        userName: userName || "Sistema",
        action: action,
        target: target || null,
        targetUserId: targetUserId || null,
        oldValue: oldValue || null,
        newValue: newValue || null,
        result: result,
        metadata: metaStr
      }
    })
  } catch (err) {
    console.error("Error al registrar AuditLog:", err)
  }
}

export interface GetAuditLogsParams {
  action?: string
  category?: string
  search?: string
  result?: string
  dateRange?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

/**
 * Consultar registros de auditoría con soporte de filtros por acción, categoría, búsqueda y rangos de fecha.
 */
export async function getAuditLogs({
  action,
  category,
  search,
  result,
  dateRange,
  startDate,
  endDate,
  limit = 150,
  offset = 0
}: GetAuditLogsParams = {}) {
  const caller = await requireAuth()

  let allowed = canViewAuditLogs(caller)
  if (!allowed && caller.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: caller.id },
      select: { role: true, position: true, project: { select: { name: true } } }
    }).catch(() => null)

    if (dbUser) {
      allowed = canViewAuditLogs({
        ...caller,
        role: dbUser.role,
        position: dbUser.position,
        projectName: dbUser.project?.name
      })
    }
  }

  if (!allowed) {
    throw new Error("Acceso denegado: No tienes permisos para consultar los logs de auditoría.")
  }

  const whereClause: any = {}

  // 1. Filtro por acción específica
  if (action && action !== "ALL") {
    whereClause.action = action
  }

  // 2. Filtro por categoría de módulo
  if (category && category !== "ALL") {
    switch (category.toUpperCase()) {
      case "USERS":
        whereClause.action = { startsWith: "USER" }
        break
      case "GROUPS":
        whereClause.action = { startsWith: "GROUP" }
        break
      case "ROLES":
        whereClause.action = { startsWith: "ROLE" }
        break
      case "TIMEOFF":
        whereClause.OR = [
          { action: { contains: "TIME_OFF" } },
          { action: { contains: "VACATION" } }
        ]
        break
      case "CALENDAR":
        whereClause.OR = [
          { action: { contains: "EVENT" } },
          { action: { contains: "CALENDAR" } }
        ]
        break
      case "CONFIG":
        whereClause.OR = [
          { action: { contains: "CONFIG" } },
          { action: { contains: "API" } }
        ]
        break
      case "SECURITY":
        whereClause.OR = [
          { result: { in: ["FAILED", "REJECTED"] } },
          { action: { contains: "AUTH" } },
          { action: { contains: "PASSWORD" } },
          { action: { contains: "ROLE" } }
        ]
        break
    }
  }

  // 3. Filtro por resultado (SUCCESS, REJECTED, FAILED, WARNING)
  if (result && result !== "ALL") {
    whereClause.result = result
  }

  // 4. Filtro por rango de fecha
  const now = new Date()
  if (dateRange && dateRange !== "all") {
    if (dateRange === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      whereClause.createdAt = { gte: todayStart }
    } else if (dateRange === "7d") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      whereClause.createdAt = { gte: sevenDaysAgo }
    } else if (dateRange === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      whereClause.createdAt = { gte: thirtyDaysAgo }
    }
  } else if (startDate || endDate) {
    whereClause.createdAt = {}
    if (startDate) whereClause.createdAt.gte = new Date(startDate)
    if (endDate) {
      const endD = new Date(endDate)
      endD.setHours(23, 59, 59, 999)
      whereClause.createdAt.lte = endD
    }
  }

  // 5. Búsqueda de texto libre
  if (search && search.trim()) {
    const term = search.trim()
    const searchFilter = {
      OR: [
        { action: { contains: term, mode: "insensitive" } },
        { userName: { contains: term, mode: "insensitive" } },
        { target: { contains: term, mode: "insensitive" } },
        { metadata: { contains: term, mode: "insensitive" } },
        { oldValue: { contains: term, mode: "insensitive" } },
        { newValue: { contains: term, mode: "insensitive" } }
      ]
    }

    if (whereClause.OR) {
      whereClause.AND = [
        { OR: whereClause.OR },
        searchFilter
      ]
      delete whereClause.OR
    } else {
      whereClause.OR = searchFilter.OR
    }
  }

  // Ejecutar consultas en paralelo: registros y métricas estadísticas
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  const [logs, totalFiltered, totalAll, countToday, countAlerts, actionDistGroup] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
      skip: offset
    }),
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: { createdAt: { gte: startOfDay } }
    }),
    prisma.auditLog.count({
      where: { result: { in: ["FAILED", "REJECTED", "WARNING"] } }
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 25
    })
  ])

  const availableActions = actionDistGroup.map(g => ({
    action: g.action,
    count: g._count.action
  }))

  return {
    logs: logs.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString()
    })),
    totalCount: totalFiltered,
    stats: {
      total: totalAll,
      today: countToday,
      alerts: countAlerts,
      uniqueActionsCount: availableActions.length,
      topActions: availableActions
    },
    availableActions: availableActions.map(a => a.action)
  }
}
