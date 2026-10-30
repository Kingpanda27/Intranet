import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { bulkUpdateRequestStatus } from "@/app/actions/timeOffActions"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { requestIds, status = "APPROVED", note, affectsBonus } = body

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ error: "Debes proporcionar una lista de IDs de solicitudes." }, { status: 400 })
    }

    const result = await bulkUpdateRequestStatus(requestIds, status, note, affectsBonus)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Error al procesar lote de solicitudes.", details: result.errors }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error("API Error in bulk-approve:", err)
    return NextResponse.json({ error: err?.message || "Error interno del servidor" }, { status: 500 })
  }
}
