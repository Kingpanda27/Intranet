import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { authorizeRequestAction } from "@/lib/requestAuthorization"
import { updateRequestStatus } from "@/app/actions/timeOffActions"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApprove(req, params)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleApprove(req, params)
}

async function handleApprove(
  req: NextRequest,
  rawParams: Promise<{ id: string }>
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "No autenticado. Inicia sesión para realizar esta acción." },
      { status: 401 }
    )
  }

  const user = session.user as any
  const resolvedParams = await rawParams
  const requestId = resolvedParams.id

  if (!requestId) {
    return NextResponse.json(
      { error: "ID de solicitud no proporcionado." },
      { status: 400 }
    )
  }

  // 1. Verificación Estricta BOLA / IDOR
  const auth = await authorizeRequestAction(user, requestId)
  if (!auth.authorized) {
    return NextResponse.json(
      {
        error: auth.error || "Acceso denegado (403 Forbidden): No tienes autorización sobre esta solicitud.",
        requestId
      },
      { status: auth.status || 403 }
    )
  }

  // 2. Extracción de parámetros opcionales del cuerpo
  let body: any = {}
  try {
    const text = await req.text()
    if (text) body = JSON.parse(text)
  } catch {
    body = {}
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

  // 3. Ejecutar aprobación
  const result = await updateRequestStatus(
    requestId,
    "APPROVED",
    note,
    affectsBonus,
    extraParams
  )

  if (!result || !result.success) {
    return NextResponse.json(
      { error: result?.error || "Error al aprobar la solicitud." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Solicitud aprobada exitosamente.",
    requestId,
    status: "APPROVED",
    approvedBy: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
}
