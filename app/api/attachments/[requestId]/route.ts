import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isCEO, getManagedUserIds } from "@/lib/requestAuthorization"
import { ROLE_HIERARCHY } from "@/lib/permissions"
import { createAuditLog } from "@/app/actions/auditActions"
import { resolveAttachmentPath } from "@/lib/privateStorage"
import { createReadStream, statSync } from "fs"
import { Readable } from "stream"
import { basename } from "path"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    // 1. Verificación de sesión activa
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autenticado. Inicie sesión para acceder a este recurso." },
        { status: 401 }
      )
    }

    const currentUser = session.user as any
    const currentUserId = currentUser.id
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Sesión de usuario inválida." },
        { status: 401 }
      )
    }

    // 2. Extracción y validación del requestId
    const resolvedParams = await params
    const requestId = resolvedParams.requestId
    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "Identificador de solicitud inválido." },
        { status: 400 }
      )
    }

    // 3. Consulta de la solicitud y relaciones necesarias
    const request = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            projectId: true,
            project: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (!request) {
      return NextResponse.json(
        { error: "Solicitud no encontrada." },
        { status: 404 }
      )
    }

    if (!request.documentUrl) {
      return NextResponse.json(
        { error: "Esta solicitud no cuenta con archivos adjuntos asociados." },
        { status: 404 }
      )
    }

    // 4. Control de Acceso Estricto a Nivel de Fila (Row-Level Authorization)
    const userRole = (currentUser.role || "").toUpperCase().trim()
    const roleHierarchy = ROLE_HIERARCHY[userRole] ?? 0
    const userEmail = (currentUser.email || "").toLowerCase().trim()
    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "ireyes@tnoutsourcing.com").toLowerCase().trim()

    // Regla 1: Colaborador propietario de la solicitud
    const isOwner = request.userId === currentUserId

    // Regla 2: Dirección / SuperAdmin / CEO
    const isSuperOrDirector =
      isCEO(currentUser) ||
      userEmail === superAdminEmail ||
      Boolean(currentUser.isSuperAdmin) ||
      userRole === "DIRECTOR" ||
      userRole === "SUPERADMIN" ||
      userRole === "CEO"

    // Regla 3: Recursos Humanos (rol HR o nivel de jerarquía >= 35)
    const isHR = userRole === "HR" || roleHierarchy >= 35

    // Regla 4: Supervisor legítimo del escuadrón (managedUserIds)
    let isSquadSupervisor = false
    if (["SUPERVISOR", "TEAM_LEAD", "MANAGER"].includes(userRole)) {
      const managedUserIds = await getManagedUserIds(currentUserId)
      if (managedUserIds.includes(request.userId)) {
        isSquadSupervisor = true
      }
      // O si fue el creador directo de la solicitud en nombre del colaborador
      if (request.createdById === currentUserId) {
        isSquadSupervisor = true
      }
    }

    const isAuthorized = isOwner || isSuperOrDirector || isHR || isSquadSupervisor

    // Si NO está autorizado -> Registrar intento en el log de auditoría y retornar 403 Forbidden
    if (!isAuthorized) {
      try {
        await createAuditLog({
          action: "SECURITY_UNAUTHORIZED_ATTACHMENT_ACCESS",
          target: `TimeOffRequest:${requestId}`,
          targetUserId: request.userId,
          actorUserId: currentUserId,
          userName: currentUser.name || currentUser.email || "Usuario no identificado",
          result: "REJECTED",
          metadata: {
            requestId,
            targetUserId: request.userId,
            targetUserName: request.user?.name || request.user?.email,
            targetUserRole: request.user?.role,
            targetProjectId: request.user?.projectId,
            attemptedByUserId: currentUserId,
            attemptedByRole: userRole,
            attemptedByEmail: userEmail,
            documentUrl: request.documentUrl,
            reason: "Intento no autorizado de acceso o descarga de justificante médico / documento confidencial (violación de BOLA/IDOR)"
          }
        })
      } catch (auditErr) {
        console.error("Error al registrar auditoría de intento de acceso no autorizado:", auditErr)
      }

      return NextResponse.json(
        {
          error: "Acceso denegado (403 Forbidden): No tienes autorización para visualizar o descargar este documento sensible."
        },
        { status: 403 }
      )
    }

    // 5. Resolución física del archivo en disco
    const resolvedFile = resolveAttachmentPath(request.documentUrl)
    if (!resolvedFile.exists || !resolvedFile.fullPath) {
      return NextResponse.json(
        { error: "El archivo adjunto no fue localizado en el servidor de almacenamiento." },
        { status: 404 }
      )
    }

    const stats = statSync(resolvedFile.fullPath)

    // 6. Preparación de cabeceras seguras y nombre de descarga
    const rawFileName = request.documentName || basename(resolvedFile.fullPath) || "adjunto"
    const safeAsciiName = rawFileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, '\\"')
    const encodedName = encodeURIComponent(rawFileName)

    // 7. Streaming del archivo con ReadableStream
    const nodeStream = createReadStream(resolvedFile.fullPath)
    const webStream = Readable.toWeb(nodeStream) as ReadableStream

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": resolvedFile.mimeType,
        "Content-Length": stats.size.toString(),
        "Content-Disposition": `inline; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff"
      }
    })
  } catch (error) {
    console.error("Error en endpoint /api/attachments/[requestId]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el archivo adjunto." },
      { status: 500 }
    )
  }
}
