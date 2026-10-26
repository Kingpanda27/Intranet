import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { authorizeRequestAction } from "@/lib/requestAuthorization"
import { updateRequestStatus } from "@/app/actions/timeOffActions"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return handleReject(req, params)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  return handleReject(req, params)
}

async function handleReject(
  req: NextRequest,
  rawParams: Promise<{ id: string }> | { id: string }
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

  const note = body.note || body.supervisorNote || body.reason || "Rechazada por el supervisor"

  // 3. Ejecutar rechazo
  const result = await updateRequestStatus(requestId, "REJECTED", note)

  if (!result || !result.success) {
    return NextResponse.json(
      { error: result?.error || "Error al rechazar la solicitud." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Solicitud rechazada exitosamente.",
    requestId,
    status: "REJECTED",
    rejectedBy: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
}
