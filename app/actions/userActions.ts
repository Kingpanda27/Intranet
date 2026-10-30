"use server"

import { requireAuth, requirePermission, ROLE_HIERARCHY } from "@/lib/permissions"
import { getServerSession } from "next-auth/next"
import { authOptions, isSuperAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidateUserSessionsInRedis } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { saveFile } from "./fileActions"
import { sendInvitationEmail } from "@/lib/email"
import { computeUserStatus, NON_ABSENCE_REQUEST_TYPES } from "@/lib/userUtils"
import { createAuditLog } from "./auditActions"

export async function updateProfile(formData: FormData) {
  const sessionUser = await requireAuth()

  const name = formData.get("name") as string
  const position = formData.get("position") as string | null
  const location = formData.get("location") as string | null
  const extension = formData.get("extension") as string | null
  const aboutMe = formData.get("aboutMe") as string | null
  const skills = formData.get("skills") as string | null
  const socialLinkedIn = formData.get("socialLinkedIn") as string | null
  const socialTeams = formData.get("socialTeams") as string | null
  const socialWebsite = formData.get("socialWebsite") as string | null
  const showBirthday = formData.get("showBirthday") === "true"
  const birthdayRaw = formData.get("birthday") as string | null
  
  const imageFile = formData.get("image") as File | null
  const userId = sessionUser.id

  if (!name || name.trim().length === 0) return { error: "El nombre no puede estar vacío" }

  let birthdayDate: Date | null = null
  if (birthdayRaw) {
    const parsed = new Date(birthdayRaw)
    if (!isNaN(parsed.getTime())) birthdayDate = parsed
  }

  try {
    let imageUrl = undefined
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveFile(imageFile, "profiles")
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        name: name.trim(),
        ...(imageUrl ? { image: imageUrl } : {}),
        position: position?.trim() || null,
        location: location?.trim() || null,
        extension: extension?.trim() || null,
        aboutMe: aboutMe?.trim() || null,
        skills: skills?.trim() || null,
        socialLinkedIn: socialLinkedIn?.trim() || null,
        socialTeams: socialTeams?.trim() || null,
        socialWebsite: socialWebsite?.trim() || null,
        birthday: birthdayDate,
        showBirthday
      }
    })

    revalidatePath("/profile")
    revalidatePath("/directory")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { error: "Hubo un error al actualizar tu perfil." }
  }
}

export async function getAllUsers() {
  await requirePermission("users:view_all")

  return await prisma.user.findMany({
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      image: true, 
      vacationBalance: true,
      status: true,
      isActive: true,
      deletedAt: true,
      deactivatedBy: true
    },
    orderBy: { name: "asc" }
  })
}

export async function createUser(formData: FormData) {
  let currentUser: any
  try {
    currentUser = await requirePermission("users:create")
  } catch (err: any) {
    return { error: err.message || "Acceso denegado" }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as string

  if (!name?.trim() || !email?.trim()) return { error: "Nombre y correo son obligatorios." }

  const cleanEmail = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    return { error: "Por favor ingresa un correo electrónico válido." }
  }

  const validRoles = ["USER", "SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "ADMIN", "IT_MANAGER", "NO_ROLE"]
  if (!validRoles.includes(role)) return { error: "Rol inválido." }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) return { error: "Ya existe un usuario con ese correo." }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      }
    })

    await createAuditLog({
      action: "USER_CREATED",
      target: `${newUser.name} (${newUser.email})`,
      targetUserId: newUser.id,
      metadata: { name: newUser.name, email: newUser.email, role: newUser.role }
    })

    const inviteResult = await inviteUser(newUser.id)
    if (inviteResult.error) {
      return { success: true, warning: inviteResult.error }
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating user:", error)
    return { error: `Error al crear el usuario: ${error.message || String(error)}` }
  }
}

export async function updateLastSeen() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) return

  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { lastSeen: new Date() }
  })
}

export async function updateUserAdmin(userId: string, formData: FormData) {
  let currentUser
  try {
    currentUser = await requirePermission("users:edit")
  } catch (err: any) {
    return { error: err.message || "Acceso denegado." }
  }

  const email = formData.get("email") as string
  const role = formData.get("role") as string
  const name = formData.get("name") as string

  const validRoles = ["AGENT", "USER", "SUPERVISOR", "TEAM_LEAD", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "ADMIN", "HR", "MANAGER", "IT_MANAGER", "NO_ROLE"]
  if (role && !validRoles.includes(role)) {
    return { error: "Rol inválido." }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return { error: "Usuario no encontrado." }
    
    const isMasterAdmin = isSuperAdminEmail(currentUser.email) || currentUser.isSuperAdmin
    if (targetUser.role === "TECHNOLOGY" && currentUser.role !== "IT_MANAGER" && !isMasterAdmin) {
      return { error: "Solo un IT_MANAGER puede modificar o degradar a un usuario de Tecnología." }
    }

    // Check email uniqueness if being changed
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== userId) {
        return { error: "Ese correo ya está en uso por otro usuario." }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
        ...(role ? { role } : {})
      }
    })

    const roleChanged = Boolean(role && role !== targetUser.role)
    await createAuditLog({
      action: roleChanged ? "USER_ROLE_CHANGED" : "USER_UPDATED",
      target: `${updatedUser.name} (${updatedUser.email})`,
      targetUserId: targetUser.id,
      oldValue: JSON.stringify({ name: targetUser.name, email: targetUser.email, role: targetUser.role }),
      newValue: JSON.stringify({ name: updatedUser.name, email: updatedUser.email, role: updatedUser.role }),
      metadata: {
        updatedBy: currentUser.email,
        roleChanged,
        previousRole: targetUser.role,
        newRole: updatedUser.role
      }
    })

    revalidatePath("/admin/users")
    revalidatePath("/directory")
    return { success: true }
  } catch (error) {
    console.error("Error updating user:", error)
    return { error: "Error al actualizar el usuario." }
  }
}

async function cleanupUserRelations(userIds: string[]) {
  if (!userIds || userIds.length === 0) return
  await prisma.account.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {})
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {})
  await prisma.document.deleteMany({ where: { authorId: { in: userIds } } }).catch(() => {})
  await prisma.chatMessage.deleteMany({ where: { authorId: { in: userIds } } }).catch(() => {})
  await prisma.conversation.deleteMany({
    where: { OR: [{ user1Id: { in: userIds } }, { user2Id: { in: userIds } }] }
  }).catch(() => {})
  await prisma.friendship.deleteMany({
    where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] }
  }).catch(() => {})
  await prisma.timeOffRequest.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {})
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {})
  await prisma.like.deleteMany({ where: { authorId: { in: userIds } } }).catch(() => {})
  await prisma.comment.deleteMany({ where: { authorId: { in: userIds } } }).catch(() => {})
  await prisma.post.deleteMany({ where: { authorId: { in: userIds } } }).catch(() => {})
  await prisma.recognition.deleteMany({
    where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] }
  }).catch(() => {})
  await prisma.roleChangeRequest.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { requestedById: { in: userIds } }, { reviewedById: { in: userIds } }] }
  }).catch(() => {})
  await prisma.eventAttendance.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {})
  await prisma.eventComment.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {})
  await prisma.calendarEvent.deleteMany({ where: { createdById: { in: userIds } } }).catch(() => {})
  await (prisma as any).supportTicket?.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {})
}

export async function deleteBulkUsers(userIds: string[]) {
  let currentUser: any
  try {
    currentUser = await requirePermission("users:delete")
  } catch (err: any) {
    return { error: err.message || "Acceso denegado." }
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { error: "No se proporcionaron usuarios para desactivar." }
  }

  // Prevenir auto-eliminación o auto-desactivación
  const targetIds = userIds.filter(id => id !== currentUser.id)
  if (targetIds.length === 0) {
    return { error: "No puedes dar de baja tu propia cuenta." }
  }

  try {
    // Si no es IT_MANAGER ni el administrador maestro, no puede dar de baja a usuarios con rol TECHNOLOGY
    const isMasterAdmin = isSuperAdminEmail(currentUser.email) || currentUser.isSuperAdmin
    if (currentUser.role !== "IT_MANAGER" && !isMasterAdmin) {
      const techUsers = await prisma.user.findMany({
        where: { id: { in: targetIds }, role: "TECHNOLOGY" },
        select: { id: true, name: true, email: true }
      })
      if (techUsers.length > 0) {
        return { error: `Solo un IT_MANAGER puede dar de baja a usuarios con rol Tecnología (${techUsers.map(u => u.name || u.email).join(", ")}).` }
      }
    }

    // 1. Snapshot Antes de la desactivación
    const snapshotBefore = await prisma.user.findMany({
      where: { id: { in: targetIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
        projectId: true,
        project: { select: { id: true, name: true } },
        supervisedProjects: { select: { id: true, name: true } },
        subLedProjects: { select: { id: true, name: true } }
      }
    })

    const now = new Date()

    // 2. Ejecutar Soft Delete y desvinculación de liderazgo para cada usuario
    for (const targetId of targetIds) {
      // A. Desvincular de supervisión o sub-liderazgo en Project (manteniendo projectId histórico)
      await prisma.user.update({
        where: { id: targetId },
        data: {
          isActive: false,
          status: "INACTIVE",
          deletedAt: now,
          deactivatedBy: currentUser.id,
          supervisedProjects: { set: [] },
          subLedProjects: { set: [] }
        }
      })

      // B. Invalidar sesiones activas en MySQL
      await prisma.session.deleteMany({ where: { userId: targetId } }).catch(() => {})

      // C. Invalidar de inmediato sesiones, tokens y caché en Redis (REDIS_URL)
      await invalidateUserSessionsInRedis(targetId)
    }

    // 3. Snapshot Después de la desactivación
    const snapshotAfter = await prisma.user.findMany({
      where: { id: { in: targetIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
        deletedAt: true,
        deactivatedBy: true,
        projectId: true,
        project: { select: { id: true, name: true } },
        supervisedProjects: { select: { id: true, name: true } },
        subLedProjects: { select: { id: true, name: true } }
      }
    })

    // 4. Registro en auditoría con trazabilidad de snapshot Antes vs. Después
    await createAuditLog({
      action: "USER_DEACTIVATED_SOFT_DELETE",
      target: snapshotBefore.map(u => `${u.name || u.email} (${u.email})`).join(", ") || `${targetIds.length} usuario(s)`,
      metadata: {
        deactivatedCount: targetIds.length,
        deactivatedBy: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role
        },
        snapshotBefore,
        snapshotAfter
      }
    })

    revalidatePath("/admin/users")
    revalidatePath("/admin/groups")
    revalidatePath("/directory")
    revalidatePath("/social")
    revalidatePath("/vacations")
    revalidatePath("/dashboard")

    return { 
      success: true, 
      count: targetIds.length,
      message: `Se aplicó la baja lógica (Soft Delete) a ${targetIds.length} colaborador(es) conservando su historial corporativo.` 
    }
  } catch (error: any) {
    console.error("Error al dar de baja usuarios (Soft Delete):", error)
    return { error: error.message || "Error al desactivar usuarios." }
  }
}

export async function deleteUser(userId: string) {
  const res = await deleteBulkUsers([userId])
  if (!res.success) return res
  return { success: true }
}

/**
 * Purga Física Definitiva de Usuarios de Prueba (Hard Delete)
 * 
 * Restricciones estrictas de seguridad e integridad:
 * 1. Restringida exclusivamente a IT_MANAGER (nivel 50) y SUPERADMIN.
 * 2. Bloqueada si el usuario tiene solicitudes históricas aprobadas (TimeOffRequest con status APPROVED)
 *    o si figura como aprobador oficial en solicitudes históricas.
 * 3. Ejecuta cleanupUserRelations únicamente si todas las verificaciones son satisfactorias.
 */
export async function hardPurgeTestUser(userId: string) {
  let currentUser: any
  try {
    currentUser = await requireAuth()
  } catch (err: any) {
    return { error: err.message || "Acceso denegado." }
  }

  const role = String(currentUser.role || "").toUpperCase().trim()
  const isMasterAdmin = isSuperAdminEmail(currentUser.email) || currentUser.isSuperAdmin
  const isItManager = role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || (ROLE_HIERARCHY[role] ?? 0) >= 50

  if (!isMasterAdmin && !isItManager) {
    return {
      error: "Acceso denegado (403 Forbidden): La purga física definitiva de usuarios está restringida exclusivamente a IT_MANAGER y SUPERADMIN."
    }
  }

  if (!userId || userId === currentUser.id) {
    return { error: "Identificador de usuario inválido o intento de auto-purga." }
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!targetUser) {
      return { error: "El usuario a purgar no existe en la base de datos." }
    }

    // 1. Bloqueo por integridad: Verificar si tiene solicitudes de vacaciones o incidencias aprobadas
    const approvedRequestsCount = await prisma.timeOffRequest.count({
      where: {
        userId,
        status: "APPROVED"
      }
    })

    if (approvedRequestsCount > 0) {
      return {
        error: `Operación bloqueada por integridad corporativa: El usuario tiene ${approvedRequestsCount} solicitud(es) de vacaciones o permisos aprobada(s). Por normativas de auditoría y nómina, solo se permite la baja lógica (Soft Delete).`
      }
    }

    // 2. Bloqueo si actuó como aprobador oficial de solicitudes históricas
    const approvalsAsSignerCount = await prisma.timeOffRequest.count({
      where: {
        approvedById: userId,
        status: "APPROVED"
      }
    })

    if (approvalsAsSignerCount > 0) {
      return {
        error: `Operación bloqueada: El usuario figura como firmante/aprobador oficial en ${approvalsAsSignerCount} solicitud(es) histórica(s). No se puede destruir la trazabilidad legal.`
      }
    }

    // 3. Ejecutar limpieza transaccional de dependencias
    await cleanupUserRelations([userId])

    // 4. Eliminar físicamente el registro de la tabla User
    await prisma.user.delete({
      where: { id: userId }
    })

    // 5. Invalidar sesiones en Redis
    await invalidateUserSessionsInRedis(userId)

    // 6. Registro de auditoría
    await createAuditLog({
      action: "USER_HARD_PURGED_TEST_ONLY",
      target: `${targetUser.name || targetUser.email} (${targetUser.email})`,
      metadata: {
        purgedUserId: userId,
        purgedUserEmail: targetUser.email,
        purgedUserName: targetUser.name,
        purgedBy: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role
        },
        reason: "Purga física definitiva de usuario de prueba sin historial de solicitudes aprobadas"
      }
    })

    revalidatePath("/admin/users")
    revalidatePath("/admin/groups")
    revalidatePath("/directory")
    revalidatePath("/social")

    return {
      success: true,
      message: `El usuario de prueba ${targetUser.name || targetUser.email} ha sido purgado físicamente del sistema de forma definitiva.`
    }
  } catch (error: any) {
    console.error("Error en hardPurgeTestUser:", error)
    return { error: error.message || "Error al purgar físicamente el usuario de prueba." }
  }
}

export async function inviteUser(userId: string) {
  try {
    await requirePermission("users:edit")
  } catch (err: any) {
    return { error: err.message || "Acceso denegado." }
  }

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        invitationToken: token,
        invitationExpires: expires
      }
    })

    if (!user.email) return { error: "El usuario no tiene correo configurado." }

    const emailSent = await sendInvitationEmail(user.email, token, user.name || "")
    if (!emailSent.success) {
      return { error: "Fallo envío correo, pero usuario actualizado." }
    }

    await createAuditLog({
      action: "USER_INVITED",
      target: `${user.name || user.email} (${user.email})`,
      targetUserId: user.id
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error inviting user:", error)
    return { error: `Error invitación: ${error.message || "desconocido"}` }
  }
}


export async function setInitialPassword(token: string, password: string) {
  if (!password || password.length < 6) return { error: "Contraseña demasiado corta." }

  try {
    const user = await prisma.user.findUnique({
      where: { invitationToken: token }
    })

    if (!user || !user.invitationExpires || user.invitationExpires < new Date()) {
      return { error: "Token inválido o expirado." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        invitationToken: null,
        invitationExpires: null,
        emailVerified: new Date()
      }
    })

    await createAuditLog({
      action: "USER_PASSWORD_SET",
      target: user.email || user.name || "Usuario",
      targetUserId: user.id,
      metadata: { email: user.email }
    })

    return { success: true }
  } catch (error) {
    console.error("Error setting password:", error)
    return { error: "Error al configurar la contraseña." }
  }
}

export async function processBulkUsers(usersData: { 
  name: string
  email: string
  role?: string
  position?: string
  department?: string
  entraObjectId?: string 
}[]) {
  try {
    await requirePermission("users:create")
  } catch (err: any) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (role !== "TECHNOLOGY" && role !== "IT_MANAGER") {
      return { error: "Acceso denegado. Se requieren permisos de IT_MANAGER o TECHNOLOGY." }
    }
  }

  const validRoles = ["USER", "SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "ADMIN", "IT_MANAGER", "NO_ROLE"]
  const results = {
    created: 0,
    existing: 0,
    errors: [] as string[]
  }

  // Pre-obtener proyectos para mapear departamento a proyecto si coincide el nombre
  const projects = await prisma.project.findMany({ select: { id: true, name: true } })
  const projectMap = new Map<string, string>()
  projects.forEach(p => projectMap.set(p.name.toLowerCase().trim(), p.id))

  for (const data of usersData) {
    const { name, email, role, position, department, entraObjectId } = data
    if (!email || !email.includes("@")) {
      results.errors.push(`Correo inválido omitido: ${email}`)
      continue
    }

    const cleanEmail = email.toLowerCase().trim()

    try {
      const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
      if (existing) {
        const updateData: any = {}
        if (!existing.position && position) updateData.position = position
        if (!existing.entraObjectId && entraObjectId) updateData.entraObjectId = entraObjectId
        if ((!existing.name || existing.name === cleanEmail.split('@')[0]) && name) updateData.name = name

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: existing.id },
            data: updateData
          })
        }
        results.existing++
        continue
      }

      const matchedProjectId = department ? projectMap.get(department.toLowerCase().trim()) : undefined
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await prisma.user.create({
        data: {
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: role && validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : "USER",
          position: position || undefined,
          entraObjectId: entraObjectId || undefined,
          projectId: matchedProjectId || undefined,
          invitationToken: token,
          invitationExpires: expires,
          status: "ACTIVE",
          vacationBalance: 14.0
        }
      })
      results.created++
    } catch (e: any) {
      results.errors.push(`Error con ${cleanEmail}: ${e.message || String(e)}`)
    }
  }

  await createAuditLog({
    action: "USERS_BULK_IMPORT",
    target: `${results.created} creados, ${results.existing} actualizados`,
    metadata: {
      createdCount: results.created,
      existingCount: results.existing,
      errorsCount: results.errors.length,
      totalCount: usersData.length
    }
  })

  revalidatePath("/admin/users")
  return { success: true, ...results }
}

export async function testSmtp(targetEmail: string) {
  const session = await getServerSession(authOptions)
  const isMasterAdmin = isSuperAdminEmail((session?.user as any)?.email) || (session?.user as any)?.isSuperAdmin
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== "IT_MANAGER" && role !== "TECHNOLOGY" && !isMasterAdmin)) {
    return { error: "Solo IT_MANAGER o TI puede probar el SMTP" }
  }

  try {
    const result = await sendInvitationEmail(targetEmail, "test-token", "Administrador de Prueba")
    return result
} catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getAbsentEmployeesToday() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, image: true, role: true, lastSeen: true,
      requests: {
        where: { 
          status: "APPROVED",
          type: { notIn: NON_ABSENCE_REQUEST_TYPES }
        },
        select: { type: true, startDate: true, endDate: true, status: true }
      }
    }
  })

  return users.map(u => ({ ...u, currentStatus: computeUserStatus(u.requests, u.lastSeen) }))
    .filter(u => u.currentStatus.status !== "AVAILABLE" && u.currentStatus.status !== "OFFLINE" && u.currentStatus.status !== "SPECIAL_PERMISSION")
    .sort((a, b) => {
       const da = a.currentStatus.returnDate ? a.currentStatus.returnDate.getTime() : 0
       const db = b.currentStatus.returnDate ? b.currentStatus.returnDate.getTime() : 0
       return da - db
    })
}

export async function getSimpleUsersList() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    where: { role: { not: "NO_ROLE" } },
    orderBy: { name: 'asc' }
  })
  return users
}

export async function getProfileStats(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    })
    
    const docsCount = await prisma.document.count({ where: { authorId: userId } })
    const postsCount = await prisma.post.count({ where: { authorId: userId } })
    const commentsCount = await prisma.comment.count({ where: { authorId: userId } })
    const recognitionsCount = await prisma.recognition.count({ where: { receiverId: userId } })
    
    // Recent activity
    const recentDocs = await prisma.document.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
    
    const recentPosts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
    
    const recognitions = await prisma.recognition.findMany({
      where: { receiverId: userId },
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return {
      stats: {
        createdAt: user?.createdAt,
        docsCount,
        postsCount,
        commentsCount,
        recognitionsCount
      },
      recentDocs,
      recentPosts,
      recognitions
    }
  } catch (error) {
    console.error("Error fetching profile stats:", error)
    return { error: "Hubo un error al obtener las estadísticas." }
  }
}

export async function getAllUsersCompact() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      position: true
    },
    orderBy: { name: 'asc' }
  })

  return users
}


