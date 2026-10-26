"use server"

import { requireAuth, requirePermission } from "@/lib/permissions"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { saveFile } from "./fileActions"
import { sendInvitationEmail } from "@/lib/email"
import { computeUserStatus } from "@/lib/userUtils"
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
    select: { id: true, name: true, email: true, role: true, image: true, vacationBalance: true },
    orderBy: { name: "asc" }
  })
}

export async function createUser(formData: FormData) {
  try {
    await requirePermission("users:create")
  } catch (err: any) {
    return { error: err.message || "Acceso denegado" }
  }


  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as string

  if (!name?.trim() || !email?.trim()) return { error: "Nombre y correo son obligatorios." }
  if (!email.endsWith("@tnoutsourcing.com")) return { error: "El correo debe ser @tnoutsourcing.com" }

  const validRoles = ["USER", "SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "IT_MANAGER", "NO_ROLE"]
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

  const validRoles = ["AGENT", "USER", "SUPERVISOR", "TEAM_LEAD", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "HR", "MANAGER", "IT_MANAGER", "NO_ROLE"]
  if (role && !validRoles.includes(role)) {
    return { error: "Rol inválido." }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return { error: "Usuario no encontrado." }
    
    const isMasterAdmin = currentUser.email?.toLowerCase().trim() === "ireyes@tnoutsourcing.com" || currentUser.isSuperAdmin
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
    return { error: "No se proporcionaron usuarios para eliminar." }
  }

  // Prevenir auto-eliminación
  const targetIds = userIds.filter(id => id !== currentUser.id)
  if (targetIds.length === 0) {
    return { error: "No puedes eliminar tu propia cuenta." }
  }

  try {
    // Si no es IT_MANAGER ni el administrador maestro, no puede eliminar usuarios con rol TECHNOLOGY
    const isMasterAdmin = currentUser.email?.toLowerCase().trim() === "ireyes@tnoutsourcing.com" || currentUser.isSuperAdmin
    if (currentUser.role !== "IT_MANAGER" && !isMasterAdmin) {
      const techUsers = await prisma.user.findMany({
        where: { id: { in: targetIds }, role: "TECHNOLOGY" },
        select: { id: true, name: true, email: true }
      })
      if (techUsers.length > 0) {
        return { error: `Solo un IT_MANAGER puede eliminar a usuarios con rol Tecnología (${techUsers.map(u => u.name || u.email).join(", ")}).` }
      }
    }

    const deletedUsersInfo = await prisma.user.findMany({
      where: { id: { in: targetIds } },
      select: { id: true, name: true, email: true, role: true }
    })

    await cleanupUserRelations(targetIds)
    const result = await prisma.user.deleteMany({
      where: { id: { in: targetIds } }
    })

    await createAuditLog({
      action: "USER_DELETED",
      target: deletedUsersInfo.map(u => `${u.name || u.email} (${u.email})`).join(", ") || `${result.count} usuario(s)`,
      metadata: {
        deletedCount: result.count,
        users: deletedUsersInfo
      }
    })

    revalidatePath("/admin/users")
    return { success: true, count: result.count }
  } catch (error: any) {
    console.error("Error deleting bulk users:", error)
    return { error: error.message || "Error al eliminar usuarios." }
  }
}

export async function deleteUser(userId: string) {
  const res = await deleteBulkUsers([userId])
  if (!res.success) return res
  return { success: true }
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

  const validRoles = ["USER", "SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "IT_MANAGER", "NO_ROLE"]
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
  const isMasterAdmin = (session?.user as any)?.email?.toLowerCase().trim() === "ireyes@tnoutsourcing.com" || (session?.user as any)?.isSuperAdmin
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
        where: { status: "APPROVED" },
        select: { type: true, startDate: true, endDate: true, status: true }
      }
    }
  })

  return users.map(u => ({ ...u, currentStatus: computeUserStatus(u.requests, u.lastSeen) }))
    .filter(u => u.currentStatus.status !== "AVAILABLE" && u.currentStatus.status !== "OFFLINE")
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


