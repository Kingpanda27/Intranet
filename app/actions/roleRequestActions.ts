"use server"

import { requireAuth } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const ALLOWED_ROLES = ["AGENT", "USER", "SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER"]

const ROLE_LEVELS: Record<string, number> = {
  AGENT: 10,
  USER: 10,
  SUPERVISOR: 20,
  MANAGER: 30,
  HR: 35,
  TECHNOLOGY: 40,
  TECHNOLOGY_ADMIN: 50,
  IT_MANAGER: 50
}

/**
 * Crear una solicitud de cambio de rol (Supervisor, Manager, RRHH, TI)
 */
export async function createRoleChangeRequest({
  userId,
  requestedRole,
  reason
}: {
  userId: string
  requestedRole: string
  reason: string
}) {
  const caller = await requireAuth()

  if (!userId || !requestedRole || !reason?.trim()) {
    return { success: false, error: "Todos los campos son obligatorios." }
  }

  const cleanRequestedRole = requestedRole.trim().toUpperCase()
  if (!ALLOWED_ROLES.includes(cleanRequestedRole)) {
    return { success: false, error: "El rol solicitado no es válido." }
  }

  // 1. Protección contra auto-escalamiento
  if (caller.id === userId) {
    return { success: false, error: "No puedes solicitar un cambio de rol para ti mismo." }
  }

  // 2. Verificar existencia del usuario objetivo
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  })

  if (!targetUser) {
    return { success: false, error: "Usuario objetivo no encontrado." }
  }

  const currentRole = (targetUser.role || "AGENT").trim()
  if (currentRole === cleanRequestedRole) {
    return { success: false, error: "El usuario ya tiene asignado el rol solicitado." }
  }

  // 3. Jerarquía y permisos de solicitud
  const callerLevel = ROLE_LEVELS[caller.role] || 10
  const requestedLevel = ROLE_LEVELS[cleanRequestedRole] || 10

  // Supervisores y Managers solo pueden solicitar roles dentro o hasta su nivel jerárquico correspondiente
  if ((caller.role === "SUPERVISOR" || caller.role === "MANAGER") && requestedLevel > 35) {
    return { success: false, error: "No tienes autorización para solicitar roles del área de Tecnología o Administración." }
  }

  // 4. Verificar si ya existe una solicitud pendiente
  const existingPending = await prisma.roleChangeRequest.findFirst({
    where: {
      userId,
      status: "PENDING"
    }
  })

  if (existingPending) {
    return { success: false, error: "Ya existe una solicitud pendiente de revisión para este usuario." }
  }

  // 5. Crear la solicitud y registrar auditoría
  const request = await prisma.roleChangeRequest.create({
    data: {
      userId,
      requestedById: caller.id,
      currentRole,
      requestedRole: cleanRequestedRole,
      reason: reason.trim(),
      status: "PENDING"
    }
  })

  // Registrar en AuditLog
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: caller.id,
        userName: caller.name || caller.email || "Usuario",
        action: "ROLE_CHANGE_REQUESTED",
        target: targetUser.email,
        targetUserId: targetUser.id,
        oldValue: currentRole,
        newValue: cleanRequestedRole,
        metadata: JSON.stringify({ reason: reason.trim(), requestId: request.id })
      }
    })
  } catch (auditErr) {
    console.error("Error al registrar AuditLog:", auditErr)
  }

  // Notificar al equipo de Tecnología
  try {
    const techUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "TECHNOLOGY" },
          { role: "TECHNOLOGY_ADMIN" },
          { role: "IT_MANAGER" }
        ],
        status: "ACTIVE"
      },
      select: { id: true }
    })

    for (const tech of techUsers) {
      await prisma.notification.create({
        data: {
          userId: tech.id,
          title: "Nueva Solicitud de Cambio de Rol",
          message: `${caller.name || 'Un supervisor'} ha solicitado el rol ${cleanRequestedRole} para ${targetUser.name || targetUser.email}.`,
          type: "ROLE_REQUEST",
          link: "/admin/role-requests"
        }
      })
    }
  } catch (notifErr) {
    console.error("Error al enviar notificaciones:", notifErr)
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/role-requests")

  return { success: true, request }
}

/**
 * Obtener solicitudes de cambio de rol
 */
export async function getRoleChangeRequests(statusFilter?: string) {
  const caller = await requireAuth()

  const isTech = caller.role === "TECHNOLOGY" || caller.role === "TECHNOLOGY_ADMIN" || caller.role === "IT_MANAGER"

  const whereClause: any = {}
  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter
  }

  // Si no es de Tecnología, solo ve las que él mismo solicitó
  if (!isTech) {
    whereClause.requestedById = caller.id
  }

  const requests = await prisma.roleChangeRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, position: true }
      },
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      },
      reviewedBy: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return requests
}

/**
 * Aprobar una solicitud de cambio de rol (Solo Technology / Technology Admin)
 */
export async function approveRoleChangeRequest(requestId: string) {
  const caller = await requireAuth()

  const isTech = caller.role === "TECHNOLOGY" || caller.role === "TECHNOLOGY_ADMIN" || caller.role === "IT_MANAGER"
  if (!isTech) {
    return { success: false, error: "Acceso denegado: Se requieren permisos de Tecnología para aprobar solicitudes." }
  }

  const request = await prisma.roleChangeRequest.findUnique({
    where: { id: requestId },
    include: { user: true, requestedBy: true }
  })

  if (!request) {
    return { success: false, error: "Solicitud no encontrada." }
  }

  if (request.status !== "PENDING") {
    return { success: false, error: `La solicitud ya fue procesada previamente con estado ${request.status}.` }
  }

  // Nadie puede aprobar una solicitud donde él mismo sea el usuario objetivo
  if (request.userId === caller.id) {
    return { success: false, error: "No puedes aprobar un cambio de rol para ti mismo." }
  }

  // Si se promueve a TECHNOLOGY_ADMIN, el aprobador debe ser TECHNOLOGY_ADMIN o IT_MANAGER
  if (request.requestedRole === "TECHNOLOGY_ADMIN" && caller.role !== "TECHNOLOGY_ADMIN" && caller.role !== "IT_MANAGER") {
    return { success: false, error: "Solo un Technology Admin puede otorgar el rol TECHNOLOGY_ADMIN." }
  }

  // Buscar el Role correspondiente en la base de datos
  const roleObj = await prisma.role.findUnique({
    where: { name: request.requestedRole }
  })

  // Ejecutar transacción atómica
  await prisma.$transaction(async (tx) => {
    // 1. Actualizar estado de la solicitud
    await tx.roleChangeRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: caller.id,
        reviewedAt: new Date()
      }
    })

    // 2. Actualizar el rol del usuario en la base de datos
    await tx.user.update({
      where: { id: request.userId },
      data: {
        role: request.requestedRole,
        roleId: roleObj?.id || null
      }
    })

    // 3. Registrar en AuditLog
    await tx.auditLog.create({
      data: {
        actorUserId: caller.id,
        userName: caller.name || caller.email || "Technology User",
        action: "ROLE_CHANGE_APPROVED",
        target: request.user.email,
        targetUserId: request.userId,
        oldValue: request.currentRole,
        newValue: request.requestedRole,
        metadata: JSON.stringify({
          requestId: request.id,
          requestedBy: request.requestedBy.email,
          reason: request.reason
        }),
        result: "SUCCESS"
      }
    })

    // 4. Notificar al solicitante
    await tx.notification.create({
      data: {
        userId: request.requestedById,
        title: "Solicitud de Rol Aprobada",
        message: `Tu solicitud para asignar el rol ${request.requestedRole} a ${request.user.name || request.user.email} fue aprobada por ${caller.name || 'Tecnología'}.`,
        type: "ROLE_APPROVED",
        link: "/admin/users"
      }
    })

    // 5. Notificar al usuario afectado
    await tx.notification.create({
      data: {
        userId: request.userId,
        title: "Rol Actualizado",
        message: `Tu rol en la Intranet ha sido actualizado a ${request.requestedRole}.`,
        type: "ROLE_CHANGED",
        link: "/profile"
      }
    })
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/role-requests")
  revalidatePath("/")

  return { success: true }
}

/**
 * Rechazar una solicitud de cambio de rol (Solo Technology / Technology Admin)
 */
export async function rejectRoleChangeRequest({
  requestId,
  rejectionReason
}: {
  requestId: string
  rejectionReason: string
}) {
  const caller = await requireAuth()

  const isTech = caller.role === "TECHNOLOGY" || caller.role === "TECHNOLOGY_ADMIN" || caller.role === "IT_MANAGER"
  if (!isTech) {
    return { success: false, error: "Acceso denegado: Se requieren permisos de Tecnología para rechazar solicitudes." }
  }

  if (!rejectionReason?.trim()) {
    return { success: false, error: "Es obligatorio especificar el motivo del rechazo." }
  }

  const request = await prisma.roleChangeRequest.findUnique({
    where: { id: requestId },
    include: { user: true, requestedBy: true }
  })

  if (!request) {
    return { success: false, error: "Solicitud no encontrada." }
  }

  if (request.status !== "PENDING") {
    return { success: false, error: `La solicitud ya se encuentra en estado ${request.status}.` }
  }

  // Ejecutar transacción atómica
  await prisma.$transaction(async (tx) => {
    // 1. Actualizar solicitud a REJECTED
    await tx.roleChangeRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
        reviewedById: caller.id,
        reviewedAt: new Date()
      }
    })

    // 2. Registrar en AuditLog (El rol del usuario se mantiene intacto)
    await tx.auditLog.create({
      data: {
        actorUserId: caller.id,
        userName: caller.name || caller.email || "Technology User",
        action: "ROLE_CHANGE_REJECTED",
        target: request.user.email,
        targetUserId: request.userId,
        oldValue: request.currentRole,
        newValue: request.currentRole,
        metadata: JSON.stringify({
          requestId: request.id,
          requestedRole: request.requestedRole,
          rejectionReason: rejectionReason.trim(),
          requestedBy: request.requestedBy.email
        }),
        result: "REJECTED"
      }
    })

    // 3. Notificar al solicitante
    await tx.notification.create({
      data: {
        userId: request.requestedById,
        title: "Solicitud de Rol Rechazada",
        message: `Tu solicitud para asignar el rol ${request.requestedRole} a ${request.user.name || request.user.email} fue rechazada. Motivo: ${rejectionReason.trim()}`,
        type: "ROLE_REJECTED",
        link: "/admin/users"
      }
    })
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/role-requests")

  return { success: true }
}
