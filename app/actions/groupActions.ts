"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function assertTechnology() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== "TECHNOLOGY" && role !== "IT_MANAGER")) {
    throw new Error("Acceso denegado. Solo Tecnología o IT Manager pueden gestionar grupos.")
  }
  return session
}

export async function getGroups() {
  await assertTechnology()
  const groups = await prisma.project.findMany({
    include: {
      supervisors: { select: { id: true, name: true, email: true, role: true, image: true } },
      subLeaders: { select: { id: true, name: true, email: true, role: true, image: true } },
      members: { select: { id: true, name: true, email: true, role: true, image: true, lastSeen: true, requests: { where: { status: "APPROVED" }, select: { type: true, startDate: true, endDate: true, status: true } } } }
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
    await prisma.project.create({
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
    revalidatePath("/admin/groups")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al crear el grupo." }
  }
}

export async function updateGroup(groupId: string, formData: FormData) {
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
  try { if (supervisorIdsStr) supervisorIds = JSON.parse(supervisorIdsStr) } catch { if (supervisorIdsStr) supervisorIds = [supervisorIdsStr] }

  let subLeaderIds: string[] = []
  try { if (subLeaderIdsStr) subLeaderIds = JSON.parse(subLeaderIdsStr) } catch { if (subLeaderIdsStr) subLeaderIds = [subLeaderIdsStr] }

  try {
    await prisma.project.update({
      where: { id: groupId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(image !== undefined ? { image: image?.trim() || null } : {}),
        ...(icon !== undefined ? { icon: icon?.trim() || null } : {}),
        ...(color !== undefined ? { color: color?.trim() || null } : {}),
        ...(supervisorIds.length > 0 ? { supervisors: { set: supervisorIds.map(id => ({ id })) } } : {}),
        ...(subLeaderIdsStr ? { subLeaders: { set: subLeaderIds.map(id => ({ id })) } } : {})
      }
    })
    revalidatePath("/admin/groups")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al actualizar el grupo." }
  }
}

export async function deleteGroup(groupId: string) {
  await assertTechnology()
  try {
    // Remove all members first (set projectId to null)
    await prisma.user.updateMany({
      where: { projectId: groupId },
      data: { projectId: null }
    })
    await prisma.project.delete({ where: { id: groupId } })
    revalidatePath("/admin/groups")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al eliminar el grupo." }
  }
}

export async function addMemberToGroup(groupId: string, userId: string) {
  await assertTechnology()
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { projectId: groupId }
    })
    revalidatePath("/admin/groups")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al agregar el miembro." }
  }
}

export async function removeMemberFromGroup(userId: string) {
  await assertTechnology()
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { projectId: null }
    })
    revalidatePath("/admin/groups")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al remover el miembro." }
  }
}

export async function getAllUsersForGroups() {
  await assertTechnology()
  return await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, image: true, projectId: true },
    orderBy: { name: "asc" }
  })
}
