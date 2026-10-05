"use server"

import { requireAuth } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * Registrar un evento en el log de auditoría
 */
export async function createAuditLog(
  action: string,
  target?: string,
  result: string = "SUCCESS",
  metadata?: any
) {
  try {
    const session = await getServerSession(authOptions)
    const actor = session?.user as any

    const metaStr = metadata ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata)) : null

    await prisma.auditLog.create({
      data: {
        actorUserId: actor?.id || null,
        userId: actor?.id || null,
        userName: actor?.name || actor?.email || "Sistema",
        action: action,
        target: target || null,
        result: result,
        metadata: metaStr
      }
    })
  } catch (err) {
    console.error("Error al registrar AuditLog:", err)
  }
}

/**
 * Consultar registros de auditoría
 */
export async function getAuditLogs({
  action,
  limit = 100
}: {
  action?: string
  limit?: number
} = {}) {
  const caller = await requireAuth()

  const isTech = caller.role === "TECHNOLOGY" || caller.role === "TECHNOLOGY_ADMIN" || caller.role === "IT_MANAGER"
  if (!isTech) {
    throw new Error("Acceso denegado: Se requieren permisos de Tecnología para consultar los logs de auditoría.")
  }

  const whereClause: any = {}
  if (action && action !== "ALL") {
    whereClause.action = action
  }

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: limit
  })

  return logs
}
