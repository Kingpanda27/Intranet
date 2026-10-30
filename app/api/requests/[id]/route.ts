import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { authorizeRequestAction, isCEO } from "@/lib/requestAuthorization"
import { updateRequestStatus } from "@/app/actions/timeOffActions"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const user = session.user as any
  const resolvedParams = await params
  const requestId = resolvedParams.id

  const request = await prisma.timeOffRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          position: true,
          projectId: true,
          project: { select: { id: true, name: true } }
        }
      },
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      rejectedBy: { select: { id: true, name: true, email: true } }
    }
  })

  if (!request) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  // Permitir si es el propio empleado dueño de la solicitud
  const isOwner = request.userId === user.id
  if (isOwner) {
    return NextResponse.json({ success: true, request })
  }

  // Si no es el dueño, validar autorización estricta por rol/equipo
  const auth = await authorizeRequestAction(user, requestId)
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Acceso denegado (403 Forbidden)" },
      { status: auth.status || 403 }
    )
  }

  return NextResponse.json({ success: true, request })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const user = session.user as any
  const resolvedParams = await params
  const requestId = resolvedParams.id

  const auth = await authorizeRequestAction(user, requestId)
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Acceso denegado (403 Forbidden)" },
      { status: auth.status || 403 }
    )
  }

  let body: any = {}
  try {
    const text = await req.text()
    if (text) body = JSON.parse(text)
  } catch {
    body = {}
  }

  const status = body.status
  if (!status || !["APPROVED", "REJECTED", "CANCELLED", "PENDING"].includes(status)) {
    return NextResponse.json(
      { error: "Estado no válido o no proporcionado (APPROVED, REJECTED, CANCELLED)" },
      { status: 400 }
    )
  }

  const note = body.note || body.supervisorNote || ""
  const affectsBonus = Boolean(body.affectsBonus)
  const extraParams = {
    absenceDate: body.absenceDate,
    makeupDate: body.makeupDate,
    hoursApproved: body.hoursApproved ? parseFloat(body.hoursApproved) : undefined,
    hoursUsed: body.hoursUsed ? parseFloat(body.hoursUsed) : undefined,
    makeupStartTime: body.makeupStartTime,
    makeupEndTime: body.makeupEndTime,
    exitTime: body.exitTime,
    returnTime: body.returnTime
  }

  const result = await updateRequestStatus(
    requestId,
    status,
    note,
    affectsBonus,
    extraParams
  )

  if (!result || !result.success) {
    return NextResponse.json(
      { error: result?.error || "Error al actualizar la solicitud." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Solicitud actualizada a ${status}.`,
    requestId,
    status
  })
}
