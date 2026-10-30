import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "@/app/actions/auditActions"

async function assertAuth(groupId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const user = session.user as any
  const isMasterAdmin = user?.email?.toLowerCase().trim() === "ireyes@tnoutsourcing.com" || user?.isSuperAdmin
  if (isMasterAdmin) return session

  const role = user?.role
  if (role === "TECHNOLOGY" || role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "ADMIN") {
    return session
  }

  // Si se provee groupId, verificar si es líder (supervisor o subLeader) del grupo
  if (groupId && user.id) {
    const isLeader = await prisma.project.findFirst({
      where: {
        id: groupId,
        OR: [
          { supervisors: { some: { id: user.id } } },
          { subLeaders: { some: { id: user.id } } }
        ]
      },
      select: { id: true }
    })
    if (isLeader) return session
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { groupId, userIds } = body

    const session = await assertAuth(groupId)
    if (!session) {
      return NextResponse.json({ error: "Acceso denegado: Solo administradores o líderes del grupo pueden agregar integrantes." }, { status: 403 })
    }

    if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    // Conectar en relación muchos a muchos
    await prisma.project.update({
      where: { id: groupId },
      data: {
        members: {
          connect: userIds.map((id: string) => ({ id }))
        }
      }
    })

    // Mantener compatibilidad con campo legado si no tenía ningún grupo
    await prisma.user.updateMany({
      where: { id: { in: userIds }, projectId: null },
      data: { projectId: groupId }
    })

    await createAuditLog({
      action: "GROUP_MEMBERS_ADDED",
      target: `Grupo: ${groupId}`,
      metadata: { groupId, userIds, count: userIds.length, source: "REST_API" }
    })

    revalidatePath("/admin/groups")
    revalidatePath(`/groups/${groupId}`)

    return NextResponse.json({ success: true, count: userIds.length })
  } catch (err: any) {
    console.error("API Error adding members:", err)
    return NextResponse.json({ error: err?.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { groupId, userIds, action } = body

    // Soporte para eliminar grupo completo vía API REST (solo administradores)
    if (action === "deleteGroup" && groupId) {
      const adminSession = await assertAuth()
      if (!adminSession) {
        return NextResponse.json({ error: "Acceso denegado: Solo administradores pueden eliminar un grupo." }, { status: 403 })
      }

      await prisma.user.updateMany({
        where: { projectId: groupId },
        data: { projectId: null }
      })
      await prisma.calendarEvent.updateMany({
        where: { projectId: groupId },
        data: { projectId: null }
      }).catch(err => console.warn("Notice updating calendarEvents:", err?.message))
      await prisma.project.update({
        where: { id: groupId },
        data: { supervisors: { set: [] }, subLeaders: { set: [] } }
      }).catch(err => console.warn("Notice clearing leaders:", err?.message))
      await prisma.project.delete({ where: { id: groupId } })

      await createAuditLog({
        action: "GROUP_DELETED",
        target: `Grupo: ${groupId}`,
        metadata: { groupId, source: "REST_API" }
      })

      revalidatePath("/admin/groups")
      return NextResponse.json({ success: true })
    }

    const session = await assertAuth(groupId)
    if (!session) {
      return NextResponse.json({ error: "Acceso denegado: Solo administradores o líderes del grupo pueden remover integrantes." }, { status: 403 })
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Debes especificar los IDs de los usuarios a remover" }, { status: 400 })
    }

    if (groupId) {
      // 1. Desconectar de members, supervisors y subLeaders de este grupo
      await prisma.project.update({
        where: { id: groupId },
        data: {
          members: { disconnect: userIds.map((id: string) => ({ id })) },
          supervisors: { disconnect: userIds.map((id: string) => ({ id })) },
          subLeaders: { disconnect: userIds.map((id: string) => ({ id })) }
        }
      }).catch(err => {
        console.warn("Notice on disconnecting members/supervisors in API:", err?.message)
      })

      // 2. Si el projectId legado era este grupo, reasignar a otro restante
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
      metadata: { groupId, userIds, count: userIds.length, source: "REST_API" }
    })

    revalidatePath("/admin/groups")
    if (groupId) {
      revalidatePath(`/groups/${groupId}`)
    }

    return NextResponse.json({ success: true, count: userIds.length })
  } catch (err: any) {
    console.error("API Error removing members:", err)
    return NextResponse.json({ error: err?.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { groupId, supervisorIds = [], subLeaderIds = [] } = body

    if (!groupId) {
      return NextResponse.json({ error: "Falta groupId" }, { status: 400 })
    }

    const session = await assertAuth(groupId)
    if (!session) {
      return NextResponse.json({ error: "Acceso denegado: Solo administradores o líderes del grupo pueden gestionar el liderazgo." }, { status: 403 })
    }

    const updated = await prisma.project.update({
      where: { id: groupId },
      data: {
        supervisors: { set: (supervisorIds as string[]).map(id => ({ id })) },
        subLeaders: { set: (subLeaderIds as string[]).map(id => ({ id })) }
      },
      include: {
        supervisors: { select: { id: true, name: true, email: true, role: true, image: true, position: true } },
        subLeaders: { select: { id: true, name: true, email: true, role: true, image: true, position: true } }
      }
    })

    await createAuditLog({
      action: "GROUP_LEADERS_UPDATED",
      target: updated.name || `Grupo: ${groupId}`,
      metadata: { 
        groupId, 
        supervisorsCount: supervisorIds.length, 
        subLeadersCount: subLeaderIds.length, 
        source: "REST_API" 
      }
    })

    revalidatePath("/admin/groups")
    revalidatePath(`/groups/${groupId}`)

    return NextResponse.json({ 
      success: true, 
      supervisors: updated.supervisors, 
      subLeaders: updated.subLeaders 
    })
  } catch (err: any) {
    console.error("API Error updating leaders:", err)
    return NextResponse.json({ error: err?.message || "Error interno del servidor" }, { status: 500 })
  }
}
