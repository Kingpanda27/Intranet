import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessApprovalsPanel, getTimeOffScopeFilter } from "@/lib/requestAuthorization"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const user = session.user as any

  if (!canAccessApprovalsPanel(user)) {
    return NextResponse.json(
      { error: "Acceso denegado (403 Forbidden): Tu rol no tiene permisos para consultar solicitudes de aprobación." },
      { status: 403 }
    )
  }

  const scopeFilter = await getTimeOffScopeFilter(user)
  if (scopeFilter === null) {
    return NextResponse.json(
      { error: "Acceso denegado (403 Forbidden): Sin alcance autorizado." },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get("status")

  const whereClause: any = {
    ...scopeFilter,
    ...(statusParam ? { status: statusParam.toUpperCase() } : {})
  }

  const requests = await prisma.timeOffRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          project: { select: { id: true, name: true, color: true } }
        }
      },
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      rejectedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  })

  return NextResponse.json({
    success: true,
    count: requests.length,
    requests
  })
}
