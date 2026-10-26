import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "@/app/actions/auditActions"

async function assertAuth() {
  const session = await getServerSession(authOptions)
  const isMasterAdmin = (session?.user as any)?.email?.toLowerCase().trim() === "ireyes@tnoutsourcing.com" || (session?.user as any)?.isSuperAdmin
  if (isMasterAdmin) return session
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== "TECHNOLOGY" && role !== "IT_MANAGER" && role !== "TECHNOLOGY_ADMIN" && role !== "ADMIN")) {
    return null
  }
  return session
}

export async function POST(req: NextRequest) {
  const session = await assertAuth()
  if (!session) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { groupId, userIds } = body

    if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
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
  const session = await assertAuth()
  if (!session) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { groupId, userIds, action } = body

    // Soporte para eliminar grupo completo vía API REST
    if (action === "deleteGroup" && groupId) {
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

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Debes especificar los IDs de los usuarios a remover" }, { status: 400 })
    }

    // 1. Quitar de members (projectId = null)
    await prisma.user.updateMany({
      where: { 
        id: { in: userIds },
        ...(groupId ? { projectId: groupId } : {})
      },
      data: { projectId: null }
    })

    // 2. Si se especificó groupId, también desconectar de supervisors y subLeaders
    if (groupId) {
      await prisma.project.update({
        where: { id: groupId },
        data: {
          supervisors: { disconnect: userIds.map((id: string) => ({ id })) },
          subLeaders: { disconnect: userIds.map((id: string) => ({ id })) }
        }
      }).catch(err => {
        console.warn("Notice on disconnecting supervisors/subLeaders in API:", err?.message)
      })
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
