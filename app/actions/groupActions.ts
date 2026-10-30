"use server"

import { getServerSession } from "next-auth/next"
import { authOptions, isSuperAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "./auditActions"

async function assertTechnology() {
  const session = await getServerSession(authOptions)
  const isMasterAdmin = isSuperAdminEmail((session?.user as any)?.email) || (session?.user as any)?.isSuperAdmin
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== "TECHNOLOGY" && role !== "IT_MANAGER" && role !== "TECHNOLOGY_ADMIN" && role !== "ADMIN" && !isMasterAdmin)) {
    throw new Error("Acceso denegado. Solo Tecnología, Administradores o IT Manager pueden gestionar grupos.")
  }
  return session
}

export async function assertCanEditGroup(groupId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("No autenticado: Inicia sesión para realizar esta acción.")
  }

  const user = session.user as any
  const isMasterAdmin = isSuperAdminEmail(user.email) || user.isSuperAdmin
  const role = user.role
  const isIntranetAdmin = isMasterAdmin || role === "TECHNOLOGY" || role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "ADMIN"

  if (isIntranetAdmin) {
    return { session, user, isIntranetAdmin: true, isGroupLeader: false }
  }

  const userId = user.id
  if (!userId || !groupId) {
    throw new Error("Acceso denegado: Parámetros inválidos.")
  }

  const isLeader = await prisma.project.findFirst({
    where: {
      id: groupId,
      OR: [
        { supervisors: { some: { id: userId } } },
        { subLeaders: { some: { id: userId } } }
      ]
    },
    select: { id: true }
  })

  if (!isLeader) {
    throw new Error("Acceso denegado: Solo los líderes de este grupo o los administradores del intranet pueden editarlo.")
  }

  return { session, user, isIntranetAdmin: false, isGroupLeader: true }
}

export async function getGroups() {
  await assertTechnology()
  const groups = await prisma.project.findMany({
    include: {
      supervisors: { where: { isActive: true }, select: { id: true, name: true, email: true, role: true, image: true, isActive: true } },
      subLeaders: { where: { isActive: true }, select: { id: true, name: true, email: true, role: true, image: true, isActive: true } },
      members: { where: { isActive: true }, select: { id: true, name: true, email: true, role: true, image: true, lastSeen: true, isActive: true, requests: { where: { status: "APPROVED" }, select: { type: true, startDate: true, endDate: true, status: true } } } }
    },
    orderBy: { createdAt: "desc" }
  })

  return groups.map((g: any) => ({
    ...g,
    createdAt: g.createdAt.toISOString()
  }))
}

export async function createGroup(formData: FormData) {
  await assertTechnology()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const email = formData.get("email") as string
  const image = formData.get("image") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const supervisorIdsStr = formData.get("supervisorIds") as string
  const subLeaderIdsStr = formData.get("subLeaderIds") as string

  let supervisorIds: string[] = []
  try { if (supervisorIdsStr) supervisorIds = JSON.parse(supervisorIdsStr) } catch { supervisorIds = [supervisorIdsStr].filter(Boolean) }

  let subLeaderIds: string[] = []
  try { if (subLeaderIdsStr) subLeaderIds = JSON.parse(subLeaderIdsStr) } catch { subLeaderIds = [subLeaderIdsStr].filter(Boolean) }

  if (!name?.trim()) return { error: "El nombre del grupo es obligatorio." }
  if (supervisorIds.length === 0) return { error: "Debes asignar al menos un supervisor al grupo." }

  try {
    const newGroup = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        email: email?.trim() || null,
        image: image?.trim() || null,
        icon: icon?.trim() || null,
        color: color?.trim() || null,
        supervisors: { connect: supervisorIds.map(id => ({ id })) },
        subLeaders: { connect: subLeaderIds.map(id => ({ id })) }
      }
    })

    await createAuditLog({
      action: "GROUP_CREATED",
      target: newGroup.name,
      metadata: {
        groupId: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        supervisorsCount: supervisorIds.length,
        subLeadersCount: subLeaderIds.length
      }
    })

    revalidatePath("/admin/groups")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al crear el grupo." }
  }
}

export async function updateGroup(groupId: string, formData: FormData) {
  await assertCanEditGroup(groupId)

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const email = formData.get("email") as string
  const image = formData.get("image") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const supervisorIdsStr = formData.get("supervisorIds") as string
  const subLeaderIdsStr = formData.get("subLeaderIds") as string

  let supervisorIds: string[] = []
  try { if (supervisorIdsStr) supervisorIds = JSON.parse(supervisorIdsStr) } catch { if (supervisorIdsStr) supervisorIds = [supervisorIdsStr] }

  let subLeaderIds: string[] = []
  try { if (subLeaderIdsStr) subLeaderIds = JSON.parse(subLeaderIdsStr) } catch { if (subLeaderIdsStr) subLeaderIds = [subLeaderIdsStr] }

  try {
    const existing = await prisma.project.findUnique({
      where: { id: groupId },
      select: { name: true, description: true }
    })

    const updated = await prisma.project.update({
      where: { id: groupId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(image !== undefined ? { image: image?.trim() || null } : {}),
        ...(icon !== undefined ? { icon: icon?.trim() || null } : {}),
        ...(color !== undefined ? { color: color?.trim() || null } : {}),
        ...(supervisorIdsStr ? { supervisors: { set: supervisorIds.map(id => ({ id })) } } : {}),
        ...(subLeaderIdsStr ? { subLeaders: { set: subLeaderIds.map(id => ({ id })) } } : {})
      }
    })

    await createAuditLog({
      action: "GROUP_UPDATED",
      target: updated.name || groupId,
      oldValue: existing ? JSON.stringify({ name: existing.name, description: existing.description }) : null,
      newValue: JSON.stringify({ name: updated.name, description: updated.description }),
      metadata: { groupId, name: updated.name }
    })

    revalidatePath("/admin/groups")
    revalidatePath(`/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al actualizar el grupo." }
  }
}

export async function deleteGroup(groupId: string) {
  await assertTechnology()
  try {
    const existingGroup = await prisma.project.findUnique({
      where: { id: groupId },
      select: { id: true, name: true }
    })

    // 1. Quitar todos los miembros asignados
    await prisma.user.updateMany({
      where: { projectId: groupId },
      data: { projectId: null }
    })

    // 2. Desvincular eventos de calendario asociados
    await prisma.calendarEvent.updateMany({
      where: { projectId: groupId },
      data: { projectId: null }
    }).catch(err => console.warn("Notice updating calendarEvents:", err?.message))

    // 3. Desvincular supervisores y sub-líderes
    await prisma.project.update({
      where: { id: groupId },
      data: {
        supervisors: { set: [] },
        subLeaders: { set: [] }
      }
    }).catch(err => console.warn("Notice clearing leaders:", err?.message))

    // 4. Eliminar el proyecto
    await prisma.project.delete({ where: { id: groupId } })

    await createAuditLog({
      action: "GROUP_DELETED",
      target: existingGroup?.name || `Grupo: ${groupId}`,
      metadata: { groupId, name: existingGroup?.name }
    })

    revalidatePath("/admin/groups")
    return { success: true }
  } catch (error: any) {
    console.error("Error al eliminar grupo:", error)
    return { error: error?.message || "Error al eliminar el grupo." }
  }
}

export async function addMembersToGroup(groupId: string, userIds: string[]) {
  await assertCanEditGroup(groupId)
  if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
    return { error: "Debes seleccionar al menos un usuario para agregar." }
  }
  try {
    // 1. Conectar usuarios al grupo en la relación muchos a muchos (_ProjectMembers)
    await prisma.project.update({
      where: { id: groupId },
      data: {
        members: {
          connect: userIds.map(id => ({ id }))
        }
      }
    })

    // 2. Mantener compatibilidad con campo legado (si no tiene ninguno asignado)
    await prisma.user.updateMany({
      where: { 
        id: { in: userIds },
        projectId: null
      },
      data: { projectId: groupId }
    })

    const group = await prisma.project.findUnique({
      where: { id: groupId },
      select: { name: true }
    })

    await createAuditLog({
      action: "GROUP_MEMBERS_ADDED",
      target: group?.name || `Grupo: ${groupId}`,
      metadata: { groupId, userIds, count: userIds.length }
    })

    revalidatePath("/admin/groups")
    revalidatePath(`/groups/${groupId}`)
    return { success: true, count: userIds.length }
  } catch (error: any) {
    console.error("Error al agregar miembros:", error)
    return { error: error?.message || "Error al agregar los integrantes." }
  }
}

export async function addMemberToGroup(groupId: string, userId: string) {
  return await addMembersToGroup(groupId, [userId])
}

export async function removeMembersFromGroup(
  arg1: string | string[], 
  arg2?: string[]
) {
  let groupId: string | null = null
  let userIds: string[] = []

  if (typeof arg1 === "string" && Array.isArray(arg2)) {
    groupId = arg1
    userIds = arg2
  } else if (Array.isArray(arg1)) {
    userIds = arg1
    if (typeof arg2 === "string") groupId = arg2
  } else if (typeof arg1 === "string" && !arg2) {
    userIds = [arg1]
  }

  if (groupId) {
    await assertCanEditGroup(groupId)
  } else {
    await assertTechnology()
  }

  if (userIds.length === 0) {
    return { error: "Debes seleccionar al menos un integrante para remover." }
  }

  try {
    if (groupId) {
      // 1. Desconectar de la relación muchos a muchos de este grupo
      await prisma.project.update({
        where: { id: groupId },
        data: {
          members: { disconnect: userIds.map(id => ({ id })) },
          supervisors: { disconnect: userIds.map(id => ({ id })) },
          subLeaders: { disconnect: userIds.map(id => ({ id })) }
        }
      }).catch(err => {
        console.warn("Notice on disconnecting members/supervisors in action:", err?.message)
      })

      // 2. Si el projectId legado era este grupo, reasignar a otro grupo restante o null
      const usersToReassign = await prisma.user.findMany({
        where: { id: { in: userIds }, projectId: groupId },
        select: { id: true, projects: { select: { id: true }, take: 1 } }
      })
      for (const u of usersToReassign) {
        await prisma.user.update({
          where: { id: u.id },
          data: { projectId: u.projects[0]?.id || null }
        })
      }
    } else {
      // Desvinculación total de todos los grupos si no se pasó groupId
      for (const userId of userIds) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            projects: { set: [] },
            projectId: null
          }
        })
      }
    }

    await createAuditLog({
      action: "GROUP_MEMBERS_REMOVED",
      target: groupId ? `Grupo: ${groupId}` : "Desvinculación general",
      metadata: { groupId, userIds, count: userIds.length }
    })

    revalidatePath("/admin/groups")
    if (groupId) revalidatePath(`/groups/${groupId}`)
    return { success: true, count: userIds.length }
  } catch (error: any) {
    console.error("Error al remover miembros:", error)
    return { error: error?.message || "Error al remover los integrantes." }
  }
}

export async function removeMemberFromGroup(groupIdOrUserId: string, userIdOptional?: string) {
  if (userIdOptional) {
    return await removeMembersFromGroup(groupIdOrUserId, [userIdOptional])
  }
  return await removeMembersFromGroup([groupIdOrUserId])
}

export async function assignUserToGroups(userId: string, groupIds: string[]) {
  await assertTechnology()
  if (!userId) return { error: "ID de usuario inválido." }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        projects: {
          set: groupIds.map(id => ({ id }))
        },
        projectId: groupIds[0] || null
      },
      include: {
        projects: { select: { id: true, name: true, color: true, icon: true } }
      }
    })

    await createAuditLog({
      action: "USER_GROUPS_UPDATED",
      target: updated.name || userId,
      metadata: { userId, groupIds, groupsCount: groupIds.length }
    })

    revalidatePath("/admin/groups")
    return { success: true, user: updated }
  } catch (err: any) {
    console.error("Error asignando grupos al usuario:", err)
    return { error: err?.message || "Error al asignar los grupos." }
  }
}

export async function getAllUsersForGroups() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("No autenticado: Inicia sesión para ver los colaboradores.")
  }
  return await prisma.user.findMany({
    where: { isActive: true },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      position: true,
      image: true, 
      projectId: true,
      project: { select: { id: true, name: true, color: true } },
      projects: { select: { id: true, name: true, color: true, icon: true } },
      supervisedProjects: { select: { id: true, name: true } },
      subLedProjects: { select: { id: true, name: true } }
    },
    orderBy: { name: "asc" }
  })
}

export async function setGroupLeaders(
  groupId: string, 
  supervisorIds: string[], 
  subLeaderIds: string[] = []
) {
  await assertCanEditGroup(groupId)
  if (!groupId) return { error: "ID de grupo inválido." }

  try {
    const updated = await prisma.project.update({
      where: { id: groupId },
      data: {
        supervisors: { set: supervisorIds.map(id => ({ id })) },
        subLeaders: { set: subLeaderIds.map(id => ({ id })) }
      },
      include: {
        supervisors: { select: { id: true, name: true, email: true, role: true, image: true, position: true } },
        subLeaders: { select: { id: true, name: true, email: true, role: true, image: true, position: true } }
      }
    })

    await createAuditLog({
      action: "GROUP_LEADERS_UPDATED",
      target: updated.name || groupId,
      metadata: {
        groupId,
        groupName: updated.name,
        supervisorIds,
        subLeaderIds,
        supervisorsCount: supervisorIds.length,
        subLeadersCount: subLeaderIds.length
      }
    })

    revalidatePath("/admin/groups")
    revalidatePath(`/groups/${groupId}`)
    return { 
      success: true, 
      supervisors: updated.supervisors, 
      subLeaders: updated.subLeaders 
    }
  } catch (error: any) {
    console.error("Error al actualizar líderes del grupo:", error)
    return { error: error?.message || "Error al actualizar los líderes del grupo." }
  }
}

