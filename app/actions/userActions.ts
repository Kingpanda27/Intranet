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

  const validRoles = ["USER", "SUPERVISOR", "TECHNOLOGY", "HR", "MANAGER", "IT_MANAGER", "NO_ROLE"]
  if (role && !validRoles.includes(role)) {
    return { error: "Rol inválido." }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return { error: "Usuario no encontrado." }
    
    if (targetUser.role === "TECHNOLOGY" && currentUser.role !== "IT_MANAGER") {
      return { error: "Solo un IT_MANAGER puede modificar o degradar a un usuario de Tecnología." }
    }

    // Check email uniqueness if being changed
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== userId) {
        return { error: "Ese correo ya está en uso por otro usuario." }
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
        ...(role ? { role } : {})
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

export async function deleteUser(userId: string) {
  let currentUser
  try {
    currentUser = await requirePermission("users:delete")
  } catch (err: any) {
    return { error: err.message || "Acceso denegado." }
  }

  // Prevent self-deletion
  if (userId === currentUser.id) {
    return { error: "No puedes eliminar tu propia cuenta." }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return { error: "Usuario no encontrado." }
    
    if (targetUser.role === "TECHNOLOGY" && currentUser.role !== "IT_MANAGER") {
      return { error: "Solo un IT_MANAGER puede eliminar a un usuario de Tecnología." }
    }

    // Borrado manual en cascada para evitar el error de Foreign Key Constraint
    await prisma.document.deleteMany({ where: { authorId: userId } })
    await prisma.chatMessage.deleteMany({ where: { authorId: userId } })
    await prisma.conversation.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] }
    })

    await prisma.user.delete({ where: { id: userId } })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { error: "Error al eliminar el usuario." }
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

    return { success: true }
  } catch (error) {
    console.error("Error setting password:", error)
    return { error: "Error al configurar la contraseña." }
  }
}

export async function processBulkUsers(usersData: { name: string, email: string, role: string }[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user || ((session.user as any).role !== "TECHNOLOGY" && (session.user as any).role !== "IT_MANAGER")) {
    return { error: "Acceso denegado." }
  }

  const validRoles = ["USER", "SUPERVISOR", "MANAGER", "HR", "TECHNOLOGY", "IT_MANAGER", "NO_ROLE"]
  const results = {
    created: 0,
    errors: [] as string[]
  }

  for (const data of usersData) {
    const { name, email, role } = data
    if (!email || !email.endsWith("@tnoutsourcing.com")) {
      results.errors.push(`Correo inválido skipeado: ${email}`)
      continue
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      if (existing) {
        results.errors.push(`Usuario ya existe: ${email}`)
        continue
      }

      const newUser = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          role: validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : "USER"
        }
      })
      await inviteUser(newUser.id)
      results.created++
    } catch (e) {
      results.errors.push(`Error con ${email}: ${String(e)}`)
    }
  }

  revalidatePath("/admin/users")
  return { success: true, ...results }
}

export async function testSmtp(targetEmail: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "IT_MANAGER") {
    return { error: "Solo IT_MANAGER puede probar el SMTP" }
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


