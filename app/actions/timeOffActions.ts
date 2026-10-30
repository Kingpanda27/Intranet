"use server"

import { getServerSession } from "next-auth/next"
import { authOptions, isSuperAdminEmail } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendTimeOffEmail } from "@/lib/email"
import { saveFile } from "./fileActions"
import { savePrivateAttachment } from "@/lib/privateStorage"
import { createAuditLog } from "./auditActions"
import { MIN_VACATION_DAYS } from "@/lib/vacationPolicy"
import { formatTimeStr12h } from "@/lib/dateUtils"
import {
  canAccessApprovalsPanel,
  getTimeOffScopeFilter,
  authorizeRequestAction,
  getManagedProjectIds,
  isCEO,
  TECHNICAL_REQUEST_TYPES
} from "@/lib/requestAuthorization"

export type RequestType =
  | "VACATION"
  | "PERMISSION"
  | "EARLY_LEAVE"
  | "LATE_ARRIVAL"
  | "SICK_LEAVE"
  | "MEDICAL_LEAVE"
  | "MATERNITY_LEAVE"
  | "PATERNITY_LEAVE"
  | "MATERNITY_PATERNITY"
  | "BEREAVEMENT_LEAVE"
  | "MARRIAGE_LEAVE"
  | "HOURS_MAKEUP"
  | "SPECIAL"
  | "REMOTE_INTERNET"
  | "REMOTE_POWER"
  | "REMOTE_HARDWARE"
  | "REMOTE_VPN"
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED"

async function calculateWorkingDays(startDate: Date, endDate: Date): Promise<number> {
  const holidays = await prisma.holiday.findMany({
    select: { date: true }
  })
  const holidayStrings = holidays.map(h => h.date.toISOString().split('T')[0])

  let count = 0
  const curDate = new Date(startDate)
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const dateStr = curDate.toISOString().split('T')[0]
    const isHoliday = holidayStrings.includes(dateStr)

    if (!isWeekend && !isHoliday) {
      count++
    }
    curDate.setDate(curDate.getDate() + 1)
  }
  return count
}

export async function getEligibleEmployeesForTimeOff() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return []

  const user = session.user as any
  const role = (user.role || "").toUpperCase().trim()

  if (!canAccessApprovalsPanel(user)) return []

  const isMaster = isCEO(user)
  const isHR = role === "HR"
  const isAdminUser = role === "ADMIN"

  // 1. CEO, RRHH y ADMIN -> Acceso a todos los empleados
  if (isMaster || isHR || isAdminUser) {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { not: "NO_ROLE" } },
      select: {
        id: true,
        name: true,
        email: true,
        vacationBalance: true,
        project: { select: { name: true } }
      },
      orderBy: { name: "asc" }
    })
    return users.map(u => ({ ...u, vacationBalance: u.vacationBalance ?? 0 }))
  }

  // 2. IT Manager / Tecnología
  if (role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "TECHNOLOGY") {
    const managedProjectIds = await getManagedProjectIds(user.id)
    const techProjects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: "tech" } },
          { name: { contains: "software" } },
          { name: { contains: "ti" } },
          { name: { contains: "it" } },
          ...(managedProjectIds.length > 0 ? [{ id: { in: managedProjectIds } }] : [])
        ]
      },
      select: { id: true }
    })
    const techProjectIds = Array.from(new Set([...managedProjectIds, ...techProjects.map(p => p.id)]))

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: "NO_ROLE" },
        OR: [
          { role: { in: ["TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER"] } },
          ...(techProjectIds.length > 0 ? [
            { projects: { some: { id: { in: techProjectIds } } } },
            { projectId: { in: techProjectIds } }
          ] : [])
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        vacationBalance: true,
        project: { select: { name: true } },
        projects: { select: { name: true } }
      },
      orderBy: { name: "asc" }
    })
    return users.map(u => ({ ...u, vacationBalance: u.vacationBalance ?? 0 }))
  }

  // 3. Supervisor / Team Lead / Manager de Operaciones -> Solo su equipo directo
  if (role === "SUPERVISOR" || role === "TEAM_LEAD" || role === "MANAGER") {
    const managedProjectIds = await getManagedProjectIds(user.id)
    if (managedProjectIds.length === 0) return []

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: "NO_ROLE" },
        OR: [
          { projects: { some: { id: { in: managedProjectIds } } } },
          { projectId: { in: managedProjectIds } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        vacationBalance: true,
        project: { select: { name: true } },
        projects: { select: { name: true } }
      },
      orderBy: { name: "asc" }
    })
    return users.map(u => ({ ...u, vacationBalance: u.vacationBalance ?? 0 }))
  }

  return []
}

function formatTimeOffTypeLabel(type: string): string {
  switch (type) {
    case "VACATION": return "Vacaciones"
    case "PERMISSION": return "Permiso Especial"
    case "EARLY_LEAVE": return "Salida Temprana"
    case "LATE_ARRIVAL": return "Llegada Tarde"
    case "SICK_LEAVE": return "Licencia por Enfermedad"
    case "MEDICAL_LEAVE": return "Licencia Médica"
    case "MATERNITY_LEAVE":
    case "MATERNITY_PATERNITY": return "Licencia por Maternidad / Paternidad"
    case "PATERNITY_LEAVE": return "Licencia por Paternidad"
    case "BEREAVEMENT_LEAVE": return "Licencia por Duelo"
    case "MARRIAGE_LEAVE": return "Licencia por Matrimonio"
    case "HOURS_MAKEUP": return "Reposición de Horas"
    case "REMOTE_INTERNET": return "Incidencia: Falla de Internet"
    case "REMOTE_POWER": return "Incidencia: Corte de Luz"
    case "REMOTE_HARDWARE": return "Incidencia: Avería de Hardware / PC"
    case "REMOTE_VPN": return "Incidencia: Fallo de VPN / Red"
    default: return type.replace(/_/g, " ")
  }
}

export async function createTimeOffRequest(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("No autenticado")
  }

  const loggedInUserId = (session.user as any).id
  const loggedInRole = (session.user as any).role
  const loggedInName = (session.user as any).name || (session.user as any).email
  if (!loggedInUserId) throw new Error("ID de usuario no encontrado")

  const assignedEmployeeIdsRaw = formData.get("assigned_employee_ids") as string | null
  let targetUserIds: string[] = []

  if (assignedEmployeeIdsRaw) {
    try {
      const parsed = JSON.parse(assignedEmployeeIdsRaw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        targetUserIds = parsed.filter(id => typeof id === "string" && id.trim().length > 0)
      }
    } catch {
      targetUserIds = assignedEmployeeIdsRaw.split(",").map(s => s.trim()).filter(Boolean)
    }
  }

  const targetUserId = formData.get("targetUserId") as string | null
  if (targetUserIds.length === 0 && targetUserId) {
    targetUserIds = [targetUserId]
  }

  const autoApprove = formData.get("autoApprove") === "true"
  const affectsBonus = formData.get("affectsBonus") === "true"
  const canManage = ["SUPERVISOR", "TEAM_LEAD", "MANAGER", "IT_MANAGER", "HR", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "ADMIN"].includes(loggedInRole) || Boolean((session.user as any)?.isSuperAdmin) || isSuperAdminEmail((session.user as any)?.email)

  if (targetUserIds.length === 0) {
    targetUserIds = [loggedInUserId]
  }

  const isMass = targetUserIds.length > 1
  if (isMass && !canManage) {
    return { success: false, error: "No tienes permisos de supervisor o manager para registrar solicitudes masivas." }
  }

  let userId = targetUserIds[0] || loggedInUserId
  let isCreatedOnBehalf = (targetUserIds.length > 0 && targetUserIds[0] !== loggedInUserId) || isMass

  const type = formData.get("type") as RequestType || "VACATION"
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string
  const rawLeaveTime = (formData.get("leaveTime") as string | null) || null
  const rawExitTime = (formData.get("exitTime") as string | null) || null
  const rawArrivalTime = (formData.get("arrivalTime") as string | null) || null
  const leaveTime = rawLeaveTime || rawExitTime // Para salida temprana
  const arrivalTime = rawArrivalTime || (formData.get("returnTime") as string | null) || null // Para llegada tarde
  const isPreApproved = formData.get("isPreApproved") === "true" || formData.get("specialType") === "PRE_APPROVED"
  const incidentDate = formData.get("incidentDate") as string | null
  const incidentStartTime = formData.get("incidentStartTime") as string | null
  const incidentEndTime = formData.get("incidentEndTime") as string | null
  const incidentExactHours = formData.get("incidentExactHours") as string | null
  const incidentDateTime = formData.get("incidentDateTime") as string | null
  const incidentDuration = formData.get("incidentDuration") as string | null
  const incidentContext = formData.get("incidentContext") as string | null
  const incidentNeedsItReview = formData.get("incidentNeedsItReview") === "true"

  const isRemoteIncident = ["REMOTE_INTERNET", "REMOTE_POWER", "REMOTE_HARDWARE", "REMOTE_VPN"].includes(type)

  let startDate: Date
  let endDate: Date

  if (isRemoteIncident) {
    if (incidentDate && incidentStartTime) {
      startDate = new Date(`${incidentDate}T${incidentStartTime}`)
      endDate = incidentEndTime ? new Date(`${incidentDate}T${incidentEndTime}`) : new Date(startDate)
    } else {
      const rawDate = incidentDateTime || startDateStr || new Date().toISOString()
      startDate = new Date(rawDate)
      endDate = new Date(rawDate)
    }
  } else {
    startDate = new Date(startDateStr)
    endDate = endDateStr ? new Date(endDateStr) : new Date(startDate)
  }

  if (type === "EARLY_LEAVE" && leaveTime) {
    const cleanDateStr = startDateStr ? startDateStr.split("T")[0] : new Date().toISOString().split("T")[0]
    const [hours, minutes] = leaveTime.split(":")
    const padH = (hours || "00").padStart(2, "0")
    const padM = (minutes || "00").padStart(2, "0")
    // Forzar zona horaria de República Dominicana (UTC-4) para evitar desfase al persistir
    const parsed = new Date(`${cleanDateStr}T${padH}:${padM}:00-04:00`)
    if (!isNaN(parsed.getTime())) {
      startDate = parsed
    } else {
      startDate = new Date(startDateStr)
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    endDate = new Date(startDate)
  } else if (type === "LATE_ARRIVAL" && arrivalTime) {
    const cleanDateStr = startDateStr ? startDateStr.split("T")[0] : new Date().toISOString().split("T")[0]
    const [hours, minutes] = arrivalTime.split(":")
    const padH = (hours || "00").padStart(2, "0")
    const padM = (minutes || "00").padStart(2, "0")
    const parsed = new Date(`${cleanDateStr}T${padH}:${padM}:00-04:00`)
    if (!isNaN(parsed.getTime())) {
      startDate = parsed
    } else {
      startDate = new Date(startDateStr)
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    endDate = new Date(startDate)
  }

  const rawReason = (formData.get("reason") as string) || ""
  let reason = rawReason

  if (isRemoteIncident) {
    const timeDetail = incidentStartTime && incidentEndTime
      ? `Horario exacto: ${incidentStartTime} a ${incidentEndTime}${incidentExactHours && incidentExactHours !== "--" ? ` (${incidentExactHours})` : ""}`
      : incidentDuration ? `Duración estimada: ${incidentDuration}` : null

    const details = [
      timeDetail,
      incidentContext ? `Detalle/Proveedor: ${incidentContext}` : null,
      incidentNeedsItReview ? `Requiere reemplazo/revisión de equipo por IT: Sí` : null,
      rawReason.trim() ? `Motivo/Notas: ${rawReason.trim()}` : null
    ].filter(Boolean).join(" | ")
    reason = details || "Incidencia de teletrabajo reportada"
  } else if (type === "LATE_ARRIVAL") {
    const approvalTag = isPreApproved ? "[Con Aprobación Previa]" : "[Sin Aprobación Previa]"
    if (rawReason.trim() && !rawReason.includes("[Con Aprobación Previa]") && !rawReason.includes("[Sin Aprobación Previa]")) {
      reason = `${approvalTag} ${rawReason.trim()}`
    } else if (!rawReason.trim()) {
      reason = approvalTag
    }
  }

  let workingDays = 0
  if (!isRemoteIncident && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    workingDays = await calculateWorkingDays(startDate, endDate)
  }

  // Campos de reposición de horas y permisos especiales
  const absenceDateStr = formData.get("absenceDate") as string | null
  const hoursToMakeUpStr = formData.get("hoursToMakeUp") as string | null
  const makeupDateStr = formData.get("makeupDate") as string | null
  const makeupStartTime = formData.get("makeupStartTime") as string | null
  const makeupEndTime = formData.get("makeupEndTime") as string | null

  const specialType = (formData.get("specialType") as string | null) || (type === "PERMISSION" ? "HOURS" : type === "LATE_ARRIVAL" ? (isPreApproved ? "PRE_APPROVED" : "NOT_PRE_APPROVED") : null)
  const exitTime = (formData.get("exitTime") as string | null) || leaveTime || null
  const returnTime = (formData.get("returnTime") as string | null) || arrivalTime || null
  const hoursRequestedStr = formData.get("hoursRequested") as string | null

  const hoursToMakeUp = hoursToMakeUpStr ? parseFloat(hoursToMakeUpStr) : null
  const hoursRequested = hoursRequestedStr ? parseFloat(hoursRequestedStr) : null
  const absenceDate = absenceDateStr ? new Date(absenceDateStr) : null
  const makeupDate = makeupDateStr ? new Date(makeupDateStr) : null

  // Si es un permiso por horas, salida temprana, llegada tarde, reposición de horas o incidencia remota, no consume días de saldo de vacaciones
  if (type === "HOURS_MAKEUP" || type === "EARLY_LEAVE" || type === "LATE_ARRIVAL" || type === "PERMISSION" || (type === "SPECIAL" && specialType === "HOURS") || isRemoteIncident) {
    workingDays = 0
  } else if (type === "SPECIAL" && specialType === "HALF") {
    workingDays = 0.5
  }

  const requiredTypes = ["SICK_LEAVE", "MEDICAL_LEAVE", "MATERNITY_LEAVE", "PATERNITY_LEAVE", "MATERNITY_PATERNITY", "BEREAVEMENT_LEAVE", "MARRIAGE_LEAVE"]
  const isDocumentRequired = requiredTypes.includes(type)
  const documentFile = formData.get("document") as File | null

  if (isDocumentRequired && (!documentFile || documentFile.size === 0)) {
    return { success: false, error: "La documentación de respaldo es obligatoria para esta solicitud." }
  }

  let documentUrl: string | null = null
  let documentName: string | null = null

  if (documentFile && documentFile.size > 0) {
    const ext = documentFile.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "msg"]
    if (!ext || !allowedExtensions.includes(ext)) {
      return { success: false, error: "Formato de archivo no permitido. Solo se aceptan PDF, JPG, JPEG, PNG, WEBP y MSG." }
    }
    try {
      const savedFile = await savePrivateAttachment(documentFile, "medical")
      documentName = documentFile.name
      documentUrl = savedFile.relativePath // Guarda únicamente la ruta relativa interna, nunca una URL pública directa
    } catch (e: any) {
      console.error("Error al guardar adjunto médico confidencial:", e)
      return { success: false, error: e?.message || "Error al guardar el archivo adjunto." }
    }
  }

  try {
    if (isMass) {
      const createdRequests = []
      const affectedUserNames: string[] = []

      for (const tId of targetUserIds) {
        const u = await prisma.user.findUnique({
          where: { id: tId },
          select: { id: true, name: true, email: true, vacationBalance: true }
        })
        if (!u) continue

        const initialStatus = autoApprove ? "APPROVED" : "PENDING"

        if (initialStatus === "APPROVED" && type === "VACATION" && workingDays > 0) {
          await prisma.user.update({
            where: { id: tId },
            data: { vacationBalance: { decrement: workingDays } }
          })
        }

        const requestReason = `[Registro Masivo por ${loggedInName}] ${reason || ""}`.trim()

        const req = await prisma.timeOffRequest.create({
          data: {
            userId: tId,
            createdById: loggedInUserId,
            type,
            startDate,
            endDate,
            requestedDays: workingDays,
            reason: requestReason,
            status: initialStatus,
            affectsBonus: affectsBonus,
            documentUrl,
            documentName,
            absenceDate,
            hoursToMakeUp,
            makeupDate,
            makeupStartTime,
            makeupEndTime,
            specialType,
            exitTime,
            returnTime,
            hoursRequested,
            hoursApproved: hoursRequested
          }
        })

        createdRequests.push(req)
        affectedUserNames.push(u.name || u.email || tId)

        try {
          const typeLabel = formatTimeOffTypeLabel(type)
          await prisma.notification.create({
            data: {
              userId: tId,
              title: `Solicitud registrada por supervisor: ${typeLabel}`,
              message: `${loggedInName} ha registrado una solicitud de ${typeLabel} para tu equipo. Estado: ${initialStatus === "APPROVED" ? "Aprobada" : "Pendiente de aprobación"}.`,
              type: "TIME_OFF",
              link: "/vacations"
            }
          })
        } catch (notifErr) {
          console.error("Error creating notification for user:", tId, notifErr)
        }
      }

      // Notificar a los líderes de los grupos/proyectos involucrados si la solicitud masiva queda pendiente
      if (!autoApprove) {
        try {
          const typeLabel = formatTimeOffTypeLabel(type)
          const targetUsers = await prisma.user.findMany({
            where: { id: { in: targetUserIds } },
            select: { projectId: true, projects: { select: { id: true } } }
          })
          const allGroupIds = new Set<string>()
          for (const tu of targetUsers) {
            if (tu.projectId) allGroupIds.add(tu.projectId)
            tu.projects?.forEach(p => allGroupIds.add(p.id))
          }
          
          for (const gId of allGroupIds) {
            const proj = await prisma.project.findUnique({
              where: { id: gId },
              include: {
                supervisors: { select: { id: true } },
                subLeaders: { select: { id: true } }
              }
            })
            const leaderIds = new Set<string>()
            proj?.supervisors?.forEach((s: any) => { if (s.id && s.id !== loggedInUserId) leaderIds.add(s.id) })
            proj?.subLeaders?.forEach((s: any) => { if (s.id && s.id !== loggedInUserId) leaderIds.add(s.id) })

            for (const leaderId of leaderIds) {
              await prisma.notification.create({
                data: {
                  userId: leaderId,
                  title: `Nueva solicitud masiva: ${typeLabel}`,
                  message: `${loggedInName} ha registrado una solicitud masiva de ${typeLabel} para ${createdRequests.length} integrantes de ${proj?.name || "tu grupo"}. Pendiente de revisión.`,
                  type: "TIME_OFF",
                  link: "/dashboard"
                }
              }).catch(() => {})
            }
          }
        } catch (massLeaderErr) {
          console.warn("Notice notifying leaders of mass requests:", massLeaderErr)
        }
      }

      try {
        await createAuditLog({
          action: "CREATE_TIME_OFF_MASS",
          target: `TimeOffBatch:${createdRequests.length}`,
          actorUserId: loggedInUserId,
          userName: loggedInName,
          newValue: `${type} para ${createdRequests.length} colaboradores`,
          result: "SUCCESS",
          metadata: { count: createdRequests.length, userIds: targetUserIds, type }
        })
      } catch (auditErr) {
        console.error("Error in mass audit log:", auditErr)
      }

      // Group email notification
      try {
        let typeLabel = "Incidencia / Permiso de Equipo"
        switch (type) {
          case "VACATION": typeLabel = "Vacaciones"; break
          case "PERMISSION": typeLabel = "Permiso Especial"; break
          case "EARLY_LEAVE": typeLabel = "Salida Temprana"; break
          case "SICK_LEAVE": typeLabel = "Licencia por Enfermedad (Corta)"; break
          case "MEDICAL_LEAVE": typeLabel = "Licencia Médica Oficial"; break
          case "MATERNITY_LEAVE":
          case "MATERNITY_PATERNITY": typeLabel = "Licencia por Maternidad / Paternidad"; break
          case "PATERNITY_LEAVE": typeLabel = "Licencia por Paternidad"; break
          case "BEREAVEMENT_LEAVE": typeLabel = "Licencia por Fallecimiento / Duelo"; break
          case "MARRIAGE_LEAVE": typeLabel = "Licencia por Matrimonio"; break
          case "HOURS_MAKEUP": typeLabel = "Reposición de Horas"; break
          case "REMOTE_INTERNET": typeLabel = "Incidencia Teletrabajo: Falla de Internet"; break
          case "REMOTE_POWER": typeLabel = "Incidencia Teletrabajo: Corte de Luz"; break
          case "REMOTE_HARDWARE": typeLabel = "Incidencia Teletrabajo: Avería de Hardware / PC"; break
          case "REMOTE_VPN": typeLabel = "Incidencia Teletrabajo: Fallo de VPN / Accesos"; break
        }

        let timeDetails = `Inicio: ${startDateStr}`
        if (isRemoteIncident) {
          const timeStr = incidentStartTime && incidentEndTime 
            ? `Horario: ${incidentStartTime} a ${incidentEndTime} (Total: ${incidentExactHours && incidentExactHours !== "--" ? incidentExactHours : "Calculado"})\n`
            : (incidentDuration ? `Duración estimada: ${incidentDuration}\n` : "")
          timeDetails = `Fecha de la falla: ${incidentDate || startDateStr || "Hoy"}\n${timeStr}`
        } else if (type === "EARLY_LEAVE") {
          timeDetails = `Fecha: ${startDateStr}\nHora de salida: ${formatTimeStr12h(exitTime) || exitTime || leaveTime || ""}`
        } else if (type === "LATE_ARRIVAL") {
          const approvalLabel = isPreApproved ? "Con aprobación previa" : "Sin aprobación previa"
          timeDetails = `Fecha: ${startDateStr}\nHora estimada de llegada: ${formatTimeStr12h(returnTime || rawArrivalTime) || returnTime || rawArrivalTime || ""}\nCondición: ${approvalLabel}`
        } else if (type === "PERMISSION" || type === "SPECIAL") {
          timeDetails = `Fecha: ${startDateStr}\nHorario solicitado: ${formatTimeStr12h(exitTime) || exitTime || "-"} a ${formatTimeStr12h(returnTime) || returnTime || "-"}${hoursRequested ? ` (${hoursRequested} hrs)` : ""}`
        } else {
          timeDetails = `Desde: ${startDateStr}\nHasta: ${endDateStr}`
        }

        await sendTimeOffEmail({
          employeeName: `${createdRequests.length} colaboradores (Asignación Masiva por ${loggedInName})`,
          projectName: "Asignación Masiva",
          typeLabel: `${typeLabel} (Masivo)`,
          timeDetails,
          reason: `${reason || "Registro de equipo"}\nColaboradores (${createdRequests.length}):\n${affectedUserNames.slice(0, 20).map(n => `- ${n}`).join("\n")}${affectedUserNames.length > 20 ? `\n... y ${affectedUserNames.length - 20} más` : ""}`,
          toEmails: ["hr@tnoutsourcing.com"]
        })
      } catch (emailErr) {
        console.error("Error sending mass notification email:", emailErr)
      }

      revalidatePath("/vacations")
      revalidatePath("/dashboard")
      return {
        success: true,
        count: createdRequests.length,
        id: createdRequests[0]?.id,
        message: `Se aplicó la incidencia/solicitud exitosamente a ${createdRequests.length} colaboradores del equipo.`
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, vacationBalance: true }
    })

    if (!user) {
      return { success: false, error: "El usuario seleccionado no existe." }
    }

    if (type === "VACATION" && !isCreatedOnBehalf) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const minNoticeDate = new Date(today)
      minNoticeDate.setDate(today.getDate() + 25)
      
      const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : String(startDate)
      const [sYear, sMonth, sDay] = startDateStr.split('T')[0].split('-').map(Number)
      const reqStartDate = new Date(sYear, sMonth - 1, sDay)

      if (reqStartDate < minNoticeDate) {
        const formattedMinDate = minNoticeDate.toLocaleDateString("es-DO", { 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        })
        return { 
          success: false, 
          error: `Por políticas de la empresa, las solicitudes de vacaciones deben realizarse con al menos 25 días de anticipación. La fecha de inicio mínima permitida a partir de hoy es el ${formattedMinDate}.` 
        }
      }
    }

    if (type === "VACATION" && (user.vacationBalance || 0) < workingDays) {
      return { success: false, error: `Saldo insuficiente. ${isCreatedOnBehalf ? user.name || 'El empleado' : 'Tienes'} dispone de ${user.vacationBalance} días y solicita ${workingDays}.` }
    }

    // Validación de mínimo de días según política de la empresa (legislación dominicana)
    if (type === "VACATION") {
      const currentBalance = user.vacationBalance || 0
      if (currentBalance >= MIN_VACATION_DAYS) {
        // Saldo suficiente: se exige el mínimo de días
        if (workingDays < MIN_VACATION_DAYS) {
          return {
            success: false,
            error: `Las solicitudes de vacaciones deben ser de un mínimo de ${MIN_VACATION_DAYS} días laborables consecutivos, de acuerdo con la política de la empresa basada en la legislación laboral dominicana.`
          }
        }
      } else {
        // Saldo menor al mínimo: solo se puede solicitar la totalidad del saldo restante
        if (workingDays !== currentBalance) {
          return {
            success: false,
            error: `Tu saldo disponible es de ${currentBalance} día${currentBalance !== 1 ? 's' : ''}. Cuando el saldo es menor a ${MIN_VACATION_DAYS} días, debes solicitar la totalidad de los días restantes (${currentBalance} día${currentBalance !== 1 ? 's' : ''}).`
          }
        }
      }
    }

    const initialStatus = (isCreatedOnBehalf && autoApprove) ? "APPROVED" : "PENDING"

    if (initialStatus === "APPROVED" && type === "VACATION") {
      await prisma.user.update({
        where: { id: userId },
        data: { vacationBalance: { decrement: workingDays } }
      })
    }

    const requestReason = isCreatedOnBehalf
      ? `[Registrado por ${loggedInName}] ${reason || ""}`.trim()
      : reason

    const request = await prisma.timeOffRequest.create({
      data: {
        userId,
        createdById: loggedInUserId,
        type,
        startDate,
        endDate,
        requestedDays: workingDays,
        reason: requestReason,
        status: initialStatus,
        affectsBonus: isCreatedOnBehalf ? affectsBonus : false,
        documentUrl,
        documentName,
        absenceDate,
        hoursToMakeUp,
        makeupDate,
        makeupStartTime,
        makeupEndTime,
        specialType,
        exitTime,
        returnTime,
        hoursRequested,
        hoursApproved: hoursRequested
      },
    })

    if (isCreatedOnBehalf) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            title: "Solicitud registrada en tu nombre",
            message: `${loggedInName} ha registrado una solicitud de ${type} a tu nombre. Estado: ${initialStatus === "APPROVED" ? "Aprobada" : "Pendiente"}.`,
            type: "TIME_OFF",
            link: "/vacations"
          }
        })

        await createAuditLog(
          "CREATE_TIME_OFF_ON_BEHALF",
          `TimeOffRequest:${request.id}`,
          `Solicitud de ${type} creada en nombre de ${user.name || user.email} por ${loggedInName}. Estado: ${initialStatus}.`
        )
      } catch (auditErr) {
        console.error("Error generating notification/audit log for on-behalf request:", auditErr)
      }
    }

    try {
      const userWithProject = await (prisma.user as any).findUnique({
        where: { id: userId },
        include: { 
          project: {
             include: {
               supervisors: true,
               subLeaders: true
             }
          }
        }
      }) as any
      
      const toEmails = ["hr@tnoutsourcing.com"]
      if (userWithProject?.project) {
        if (userWithProject.project.email) {
          const groupEmails = userWithProject.project.email.split(",").map((e: string) => e.trim()).filter(Boolean)
          groupEmails.forEach((email: string) => {
            if (!toEmails.includes(email)) toEmails.push(email)
          })
        }

        if (userWithProject.project.supervisors) {
          userWithProject.project.supervisors.forEach((sup: any) => {
            if (sup.email && !toEmails.includes(sup.email)) toEmails.push(sup.email)
          })
        }
      }

      const typeLabel = formatTimeOffTypeLabel(type)

      let timeDetails = `Inicio: ${startDateStr}`
      if (isRemoteIncident) {
        const timeStr = incidentStartTime && incidentEndTime 
          ? `Horario: ${incidentStartTime} a ${incidentEndTime} (Total: ${incidentExactHours && incidentExactHours !== "--" ? incidentExactHours : "Calculado"})\n`
          : (incidentDuration ? `Duración estimada: ${incidentDuration}\n` : "")
        timeDetails = `Fecha de la falla: ${incidentDate || startDateStr || "Hoy"}\n${timeStr}`
      } else if (type === "EARLY_LEAVE") {
        timeDetails = `Fecha: ${startDateStr}\nHora de salida: ${formatTimeStr12h(exitTime) || exitTime || leaveTime || ""}`
      } else if (type === "LATE_ARRIVAL") {
        const approvalLabel = isPreApproved ? "Con aprobación previa" : "Sin aprobación previa"
        timeDetails = `Fecha: ${startDateStr}\nHora estimada de llegada: ${formatTimeStr12h(returnTime || rawArrivalTime) || returnTime || rawArrivalTime || ""}\nCondición: ${approvalLabel}`
      } else if (type === "PERMISSION" || type === "SPECIAL") {
        timeDetails = `Fecha: ${startDateStr}\nHorario solicitado: ${formatTimeStr12h(exitTime) || exitTime || "-"} a ${formatTimeStr12h(returnTime) || returnTime || "-"}${hoursRequested ? ` (${hoursRequested} hrs)` : ""}`
      } else {
        timeDetails = `Desde: ${startDateStr}\nHasta: ${endDateStr}`
      }

      await sendTimeOffEmail({
        employeeName: `${userWithProject?.name || "Empleado"}${isCreatedOnBehalf ? ` (Registrado por ${loggedInName})` : ""}`,
        projectName: userWithProject?.project?.name || "General",
        typeLabel,
        timeDetails,
        reason: requestReason || "Ninguno especificado",
        toEmails
      });

      // Notificar en la campana a los líderes y supervisores del grupo si queda pendiente
      if (initialStatus === "PENDING") {
        const leaderIds = new Set<string>()
        if (userWithProject?.project) {
          if (Array.isArray(userWithProject.project.supervisors)) {
            userWithProject.project.supervisors.forEach((s: any) => {
              if (s.id && s.id !== loggedInUserId) leaderIds.add(s.id)
            })
          }
          if (Array.isArray(userWithProject.project.subLeaders)) {
            userWithProject.project.subLeaders.forEach((s: any) => {
              if (s.id && s.id !== loggedInUserId) leaderIds.add(s.id)
            })
          }

          if (userWithProject.project.id) {
            const projectLeadUsers = await prisma.user.findMany({
              where: {
                projectId: userWithProject.project.id,
                role: { in: ["TEAM_LEAD", "SUPERVISOR", "MANAGER"] },
                isActive: true,
                id: { not: loggedInUserId }
              },
              select: { id: true }
            })
            projectLeadUsers.forEach((pl: any) => leaderIds.add(pl.id))
          }
        }

        const firstTimeDetail = timeDetails.split('\n')[0] || ""
        for (const leaderId of leaderIds) {
          await prisma.notification.create({
            data: {
              userId: leaderId,
              title: `Nueva solicitud: ${typeLabel}`,
              message: `${userWithProject?.name || "Un agente"} de ${userWithProject?.project?.name || "tu grupo"} ha solicitado ${typeLabel} (${firstTimeDetail}). Requiere tu revisión.`,
              type: "TIME_OFF",
              link: "/dashboard"
            }
          }).catch(notifErr => console.error("Error creating leader notification:", notifErr))
        }
      }
    } catch (e) {
      console.error("Error al procesar notificación de solicitud:", e)
    }

    revalidatePath("/vacations")
    revalidatePath("/dashboard")
    return { success: true, id: request.id }
  } catch (error) {
    console.error("Error creating request:", error)
    return { success: false, error: "Error al crear la solicitud" }
  }
}

export async function getMyRequests() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const userId = (session.user as any).id
  
  const requests = await prisma.timeOffRequest.findMany({
    where: { userId },
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      requestedDays: true,
      reason: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
      createdBy: { select: { name: true, email: true } },
      approvedAt: true,
      approvedById: true,
      approvedBy: { select: { name: true, email: true } },
      rejectedAt: true,
      rejectedById: true,
      rejectedBy: { select: { name: true, email: true } },
      documentUrl: true,
      documentName: true,
      affectsBonus: true,
      supervisorNote: true,
      absenceDate: true,
      hoursToMakeUp: true,
      makeupDate: true,
      makeupStartTime: true,
      makeupEndTime: true,
      specialType: true,
      exitTime: true,
      returnTime: true,
      hoursRequested: true,
      hoursApproved: true,
      hoursUsed: true
    },
    orderBy: { createdAt: "desc" },
  })

  return requests.map((r: any) => ({
    ...r,
    startDate: r.startDate ? r.startDate.toISOString() : null,
    endDate: r.endDate ? r.endDate.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    absenceDate: r.absenceDate ? r.absenceDate.toISOString() : null,
    makeupDate: r.makeupDate ? r.makeupDate.toISOString() : null,
  }))
}

export async function getPendingRequests() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const user = session.user as any

  if (!canAccessApprovalsPanel(user)) {
    throw new Error("Acceso denegado: No tienes permisos para consultar solicitudes de aprobación.")
  }

  const scopeFilter = await getTimeOffScopeFilter(user)
  if (scopeFilter === null) {
    return []
  }

  const selectFields = {
    id: true,
    type: true,
    startDate: true,
    endDate: true,
    reason: true,
    status: true,
    requestedDays: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
    createdBy: { select: { id: true, name: true, email: true } },
    approvedAt: true,
    approvedById: true,
    approvedBy: { select: { id: true, name: true, email: true } },
    rejectedAt: true,
    rejectedById: true,
    rejectedBy: { select: { id: true, name: true, email: true } },
    documentUrl: true,
    documentName: true,
    affectsBonus: true,
    supervisorNote: true,
    absenceDate: true,
    hoursToMakeUp: true,
    makeupDate: true,
    makeupStartTime: true,
    makeupEndTime: true,
    specialType: true,
    exitTime: true,
    returnTime: true,
    hoursRequested: true,
    hoursApproved: true,
    hoursUsed: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            image: true
          }
        }
      }
    }
  }

  const mapRequestDates = (r: any) => ({
    ...r,
    startDate: r.startDate ? r.startDate.toISOString() : null,
    endDate: r.endDate ? r.endDate.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    absenceDate: r.absenceDate ? r.absenceDate.toISOString() : null,
    makeupDate: r.makeupDate ? r.makeupDate.toISOString() : null,
  })

  const requests = await prisma.timeOffRequest.findMany({
    where: {
      status: "PENDING",
      ...scopeFilter
    },
    select: selectFields,
    orderBy: { createdAt: "desc" },
  })

  return requests.map(mapRequestDates)
}

export async function getAllSupervisedRequests() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const user = session.user as any

  if (!canAccessApprovalsPanel(user)) {
    throw new Error("Acceso denegado: No tienes permisos para consultar solicitudes de aprobación.")
  }

  const scopeFilter = await getTimeOffScopeFilter(user)
  if (scopeFilter === null) {
    return []
  }

  const selectFields = {
    id: true,
    type: true,
    startDate: true,
    endDate: true,
    reason: true,
    status: true,
    requestedDays: true,
    createdAt: true,
    updatedAt: true,
    createdById: true,
    createdBy: { select: { id: true, name: true, email: true } },
    approvedAt: true,
    approvedById: true,
    approvedBy: { select: { id: true, name: true, email: true } },
    rejectedAt: true,
    rejectedById: true,
    rejectedBy: { select: { id: true, name: true, email: true } },
    documentUrl: true,
    documentName: true,
    affectsBonus: true,
    supervisorNote: true,
    absenceDate: true,
    hoursToMakeUp: true,
    makeupDate: true,
    makeupStartTime: true,
    makeupEndTime: true,
    specialType: true,
    exitTime: true,
    returnTime: true,
    hoursRequested: true,
    hoursApproved: true,
    hoursUsed: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        isActive: true,
        status: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            image: true
          }
        }
      }
    }
  }

  const mapRequestDates = (r: any) => ({
    ...r,
    startDate: r.startDate ? r.startDate.toISOString() : null,
    endDate: r.endDate ? r.endDate.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    absenceDate: r.absenceDate ? r.absenceDate.toISOString() : null,
    makeupDate: r.makeupDate ? r.makeupDate.toISOString() : null,
  })

  const requests = await prisma.timeOffRequest.findMany({
    where: scopeFilter,
    select: selectFields,
    orderBy: { createdAt: "desc" },
  })

  return requests.map(mapRequestDates)
}

export async function updateRequestStatus(
  requestId: string, 
  status: RequestStatus, 
  note?: string, 
  affectsBonus?: boolean,
  extraParams?: {
    absenceDate?: string
    makeupDate?: string
    hoursApproved?: number
    hoursUsed?: number
    makeupStartTime?: string
    makeupEndTime?: string
    exitTime?: string
    returnTime?: string
  }
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const user = session.user as any

  // 1. Verificación BOLA / IDOR Estricta
  const auth = await authorizeRequestAction(user, requestId)
  if (!auth.authorized) {
    return {
      success: false,
      error: auth.error || "Acceso denegado (403 Forbidden): No tienes autorización sobre esta solicitud."
    }
  }

  const oldRequest = auth.request

  try {
    // Logic for vacation balance deduction/restoration
    if (oldRequest.type === "VACATION") {
      const workingDays = await calculateWorkingDays(oldRequest.startDate, oldRequest.endDate)
      
      if (status === "APPROVED" && oldRequest.status !== "APPROVED") {
        await prisma.user.update({
          where: { id: oldRequest.userId },
          data: { vacationBalance: { decrement: workingDays } }
        })
      }
      else if (oldRequest.status === "APPROVED" && (status === "REJECTED" || status === "CANCELLED")) {
        await prisma.user.update({
          where: { id: oldRequest.userId },
          data: { vacationBalance: { increment: workingDays } }
        })
      }
    }

    const updateData: any = {
      status,
      supervisorNote: note,
      affectsBonus: affectsBonus ?? false,
      updatedAt: new Date(),
    }

    if (status === "APPROVED") {
      updateData.approvedAt = new Date()
      updateData.approvedById = user.id
    } else if (status === "REJECTED") {
      updateData.rejectedAt = new Date()
      updateData.rejectedById = user.id
    }

    if (extraParams) {
      if (extraParams.absenceDate) updateData.absenceDate = new Date(extraParams.absenceDate)
      if (extraParams.makeupDate) updateData.makeupDate = new Date(extraParams.makeupDate)
      if (extraParams.hoursApproved !== undefined) updateData.hoursApproved = parseFloat(extraParams.hoursApproved as any)
      if (extraParams.hoursUsed !== undefined) updateData.hoursUsed = parseFloat(extraParams.hoursUsed as any)
      if (extraParams.makeupStartTime) updateData.makeupStartTime = extraParams.makeupStartTime
      if (extraParams.makeupEndTime) updateData.makeupEndTime = extraParams.makeupEndTime
      if (extraParams.exitTime) updateData.exitTime = extraParams.exitTime
      if (extraParams.returnTime) updateData.returnTime = extraParams.returnTime
    }

    await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: updateData,
    })

    // Generar notificación interna al empleado sobre el cambio de estado
    const typeLabel = formatTimeOffTypeLabel(oldRequest.type)
    const notifTitle = status === "APPROVED" 
      ? `Solicitud Aprobada: ${typeLabel}`
      : status === "REJECTED"
      ? `Solicitud Denegada: ${typeLabel}`
      : `Solicitud de ${typeLabel}: ${status}`
    
    const notifMessage = status === "APPROVED"
      ? `Tu solicitud de ${typeLabel} ha sido aprobada.${note ? ` Nota del supervisor: "${note}".` : ""}`
      : status === "REJECTED"
      ? `Tu solicitud de ${typeLabel} ha sido denegada.${note ? ` Motivo: "${note}".` : ""}`
      : `Tu solicitud de ${typeLabel} ha cambiado a estado '${status}'.${note ? ` Nota: "${note}".` : ""}`

    await prisma.notification.create({
      data: {
        userId: oldRequest.userId,
        title: notifTitle,
        message: notifMessage,
        type: "TIME_OFF",
        link: "/vacations"
      }
    }).catch(err => console.warn("Error creating user notification:", err))

    // Si quien solicitó/registró el permiso fue otra persona (on behalf), notificarle también a quien la solicitó
    if (oldRequest.createdById && oldRequest.createdById !== oldRequest.userId) {
      await prisma.notification.create({
        data: {
          userId: oldRequest.createdById,
          title: notifTitle,
          message: `La solicitud de ${typeLabel} que registraste para ${oldRequest.user?.name || "el colaborador"} ha sido ${status === "APPROVED" ? "aprobada" : status === "REJECTED" ? "denegada" : status}.${note ? ` Nota: "${note}".` : ""}`,
          type: "TIME_OFF",
          link: "/dashboard"
        }
      }).catch(err => console.warn("Error notifying request creator:", err))
    }

    // Registro de Auditoría
    await createAuditLog(
      status === "APPROVED" ? "APPROVE_TIME_OFF" : "REJECT_TIME_OFF",
      `TimeOffRequest:${requestId}`,
      `Solicitud de tiempo libre de tipo ${oldRequest.type} fue actualizada a '${status}' por ${user.name || user.email}. Nota: ${note || "Ninguna"}.`
    )

    revalidatePath("/dashboard")
    revalidatePath("/vacations")
    return { success: true }
  } catch (error) {
    console.error("Error updating request:", error)
    return { success: false, error: "Error al actualizar la solicitud" }
  }
}

export async function bulkUpdateRequestStatus(
  requestIds: string[], 
  status: RequestStatus, 
  note?: string, 
  affectsBonus?: boolean
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return { success: false, error: "No se seleccionaron solicitudes para procesar." }
  }

  const user = session.user as any
  let approvedCount = 0
  let rejectedCount = 0
  let failedCount = 0
  const errors: string[] = []

  for (const requestId of requestIds) {
    try {
      const auth = await authorizeRequestAction(user, requestId)
      if (!auth.authorized) {
        failedCount++
        errors.push(`ID ${requestId}: ${auth.error || "No autorizado"}`)
        continue
      }

      const oldRequest = auth.request

      // Si es VACATION, ajustar el saldo de vacaciones
      if (oldRequest.type === "VACATION") {
        const workingDays = await calculateWorkingDays(oldRequest.startDate, oldRequest.endDate)
        if (status === "APPROVED" && oldRequest.status !== "APPROVED") {
          await prisma.user.update({
            where: { id: oldRequest.userId },
            data: { vacationBalance: { decrement: workingDays } }
          })
        } else if (oldRequest.status === "APPROVED" && (status === "REJECTED" || status === "CANCELLED")) {
          await prisma.user.update({
            where: { id: oldRequest.userId },
            data: { vacationBalance: { increment: workingDays } }
          })
        }
      }

      const updateData: any = {
        status,
        supervisorNote: note || oldRequest.supervisorNote,
        affectsBonus: affectsBonus !== undefined ? affectsBonus : (status === "APPROVED" ? false : oldRequest.affectsBonus),
        updatedAt: new Date()
      }

      if (status === "APPROVED") {
        updateData.approvedAt = new Date()
        updateData.approvedById = user.id
      } else if (status === "REJECTED") {
        updateData.rejectedAt = new Date()
        updateData.rejectedById = user.id
      }

      await prisma.timeOffRequest.update({
        where: { id: requestId },
        data: updateData
      })

      // Notificación al empleado y a quien solicitó
      try {
        const typeLabel = formatTimeOffTypeLabel(oldRequest.type)
        const notifTitle = status === "APPROVED" 
          ? `Solicitud Aprobada: ${typeLabel}`
          : status === "REJECTED"
          ? `Solicitud Denegada: ${typeLabel}`
          : `Solicitud de ${typeLabel}: ${status}`
        
        const notifMsg = status === "APPROVED"
          ? `Tu solicitud de ${typeLabel} ha sido aprobada.${note ? ` Nota del supervisor: "${note}".` : ""}`
          : status === "REJECTED"
          ? `Tu solicitud de ${typeLabel} ha sido denegada.${note ? ` Motivo: "${note}".` : ""}`
          : `Tu solicitud de ${typeLabel} ha cambiado a estado '${status}'.${note ? ` Nota: "${note}".` : ""}`

        await prisma.notification.create({
          data: {
            userId: oldRequest.userId,
            title: notifTitle,
            message: notifMsg,
            type: "TIME_OFF",
            link: "/vacations"
          }
        })

        if (oldRequest.createdById && oldRequest.createdById !== oldRequest.userId) {
          await prisma.notification.create({
            data: {
              userId: oldRequest.createdById,
              title: notifTitle,
              message: `La solicitud de ${typeLabel} que registraste para ${oldRequest.user?.name || "el colaborador"} ha sido ${status === "APPROVED" ? "aprobada" : status === "REJECTED" ? "denegada" : status}.${note ? ` Nota: "${note}".` : ""}`,
              type: "TIME_OFF",
              link: "/dashboard"
            }
          }).catch(() => {})
        }
      } catch (notifErr) {
        console.warn("Notice creating notification in bulk:", notifErr)
      }

      if (status === "APPROVED") approvedCount++
      else if (status === "REJECTED") rejectedCount++
    } catch (err: any) {
      console.error(`Error in bulk processing ${requestId}:`, err)
      failedCount++
      errors.push(`ID ${requestId}: ${err?.message || "Error al actualizar"}`)
    }
  }

  // Auditoría del lote masivo
  try {
    await createAuditLog(
      status === "APPROVED" ? "BULK_APPROVE_TIME_OFF" : "BULK_REJECT_TIME_OFF",
      `Lote:${approvedCount + rejectedCount} solicitudes`,
      `Aprobación masiva de ${approvedCount} solicitudes por ${user.name || user.email}. Nota: ${note || "N/A"}.`,
      { requestIds, approvedCount, rejectedCount, failedCount }
    )
  } catch (auditErr) {
    console.warn("Notice in audit log:", auditErr)
  }

  revalidatePath("/dashboard")
  revalidatePath("/vacations")
  revalidatePath("/calendar")

  return {
    success: approvedCount > 0 || rejectedCount > 0,
    approved: approvedCount,
    rejected: rejectedCount,
    failed: failedCount,
    total: requestIds.length,
    errors: errors.length > 0 ? errors : undefined
  }
}

export async function deleteTimeOffRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const user = session.user as any

  // Verificación BOLA / IDOR
  const auth = await authorizeRequestAction(user, requestId)
  if (!auth.authorized) {
    return {
      success: false,
      error: auth.error || "Acceso denegado (403 Forbidden): No tienes autorización para eliminar esta solicitud."
    }
  }

  try {
    await prisma.timeOffRequest.delete({
      where: { id: requestId },
    })

    await createAuditLog(
      "DELETE_TIME_OFF",
      `TimeOffRequest:${requestId}`,
      `Solicitud de tiempo libre ${requestId} eliminada por ${user.name || user.email}.`
    )

    revalidatePath("/dashboard")
    revalidatePath("/vacations")
    return { success: true }
  } catch (error) {
    console.error("Error deleting request:", error)
    return { success: false, error: "Error al eliminar la solicitud en base de datos" }
  }
}

export async function cancelMyRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const userId = (session.user as any).id

  try {
    const request = await prisma.timeOffRequest.findUnique({
      where: { id: requestId }
    })

    if (!request || request.userId !== userId) {
      return { success: false, error: "Solicitud no encontrada" }
    }

    if (request.status === "REJECTED" || request.status === "CANCELLED") {
      return { success: false, error: "La solicitud ya está finalizada" }
    }

    // Si estaba aprobada, devolver los días
    if (request.status === "APPROVED" && request.type === "VACATION") {
      const workingDays = await calculateWorkingDays(request.startDate, request.endDate)
      await prisma.user.update({
        where: { id: userId },
        data: { vacationBalance: { increment: workingDays } }
      })
    }

    await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" }
    })

    revalidatePath("/vacations")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al cancelar" }
  }
}

export async function cancelTimeOffRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const loggedInUser = session.user as any
  const userId = loggedInUser.id

  try {
    const existingReq = await prisma.timeOffRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingReq) {
      return { success: false, error: "Solicitud no encontrada" }
    }

    // Si no es el propio empleado dueño de la solicitud, validar autorización de mando
    if (existingReq.userId !== userId) {
      const auth = await authorizeRequestAction(loggedInUser, requestId)
      if (!auth.authorized) {
        return {
          success: false,
          error: auth.error || "Acceso denegado (403 Forbidden): No tienes permiso para cancelar la solicitud de este empleado."
        }
      }
    }

    if (existingReq.status === "CANCELLED") {
      return { success: false, error: "La solicitud ya se encuentra cancelada" }
    }

    if (existingReq.status === "APPROVED" && existingReq.type === "VACATION") {
      const workingDays = existingReq.requestedDays || (await calculateWorkingDays(existingReq.startDate, existingReq.endDate))
      await prisma.user.update({
        where: { id: existingReq.userId },
        data: { vacationBalance: { increment: workingDays } }
      })
    }

    await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" }
    })

    await createAuditLog(
      "CANCEL_TIME_OFF",
      `TimeOffRequest:${requestId}`,
      `Solicitud de tiempo libre cancelada por ${loggedInUser.name || loggedInUser.email}.`
    )

    revalidatePath("/vacations")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error al cancelar solicitud:", error)
    return { success: false, error: "Ocurrió un error al cancelar la solicitud" }
  }
}

export async function editTimeOffRequest(data: {
  requestId: string
  startDate: string
  endDate: string
  type: string
  reason: string
}) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const loggedInUser = session.user as any
  const userId = loggedInUser.id
  const userRole = loggedInUser.role
  const isManagement = ["SUPERVISOR", "MANAGER", "IT_MANAGER", "HR", "TECHNOLOGY"].includes(userRole)

  try {
    const existingReq = await prisma.timeOffRequest.findUnique({
      where: { id: data.requestId },
      include: { user: true }
    })

    if (!existingReq) {
      return { success: false, error: "Solicitud no encontrada" }
    }

    if (existingReq.userId !== userId && !isManagement) {
      return { success: false, error: "No tienes permisos para editar esta solicitud" }
    }

    if (existingReq.status === "CANCELLED") {
      return { success: false, error: "No se puede editar una solicitud cancelada" }
    }

    const start = new Date(data.startDate)
    const end = new Date(data.endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: "Fechas inválidas" }
    }

    if (end < start) {
      return { success: false, error: "La fecha final no puede ser anterior a la inicial" }
    }

    const newWorkingDays = await calculateWorkingDays(start, end)

    if (!isManagement && data.type === "VACATION") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const minNoticeDate = new Date(today)
      minNoticeDate.setDate(today.getDate() + 25)
      
      const reqStart = new Date(data.startDate)
      reqStart.setHours(0, 0, 0, 0)

      if (reqStart < minNoticeDate) {
        return { 
          success: false, 
          error: "Las vacaciones deben solicitarse con al menos 25 días de anticipación según las normas y políticas internas." 
        }
      }
    }

    // Si estaba aprobada y era vacaciones, reintegrar saldo previo
    if (existingReq.status === "APPROVED" && existingReq.type === "VACATION") {
      const oldDays = existingReq.requestedDays || (await calculateWorkingDays(existingReq.startDate, existingReq.endDate))
      await prisma.user.update({
        where: { id: existingReq.userId },
        data: { vacationBalance: { increment: oldDays } }
      })
    }

    // Si lo edita un empleado regular, el estado pasa OBLIGATORIAMENTE a PENDING para re-aprobación
    let newStatus = existingReq.status
    if (!isManagement) {
      newStatus = "PENDING"
    }

    // Si el estado resulta APPROVED y es VACATION (editado por manager)
    if (newStatus === "APPROVED" && data.type === "VACATION") {
      const updatedUser = await prisma.user.findUnique({ where: { id: existingReq.userId } })
      if ((updatedUser?.vacationBalance || 0) < newWorkingDays) {
        return { success: false, error: `Saldo insuficiente para aprobar. Dispone de ${updatedUser?.vacationBalance} días.` }
      }
      await prisma.user.update({
        where: { id: existingReq.userId },
        data: { vacationBalance: { decrement: newWorkingDays } }
      })
    }

    await prisma.timeOffRequest.update({
      where: { id: data.requestId },
      data: {
        startDate: start,
        endDate: end,
        requestedDays: newWorkingDays,
        type: data.type,
        reason: data.reason,
        status: newStatus
      }
    })

    revalidatePath("/vacations")
    revalidatePath("/admin/vacations")
    return { success: true, newStatus }
  } catch (error) {
    console.error("Error al editar solicitud:", error)
    return { success: false, error: "Ocurrió un error al editar la solicitud" }
  }
}

// Holiday Management (Solo IT_MANAGER o RRHH)
export async function getHolidays() {
  return await prisma.holiday.findMany({ orderBy: { date: "asc" } })
}

export async function addHoliday(name: string, dateStr: string) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const isMasterAdmin = isSuperAdminEmail((session?.user as any)?.email) || Boolean((session?.user as any)?.isSuperAdmin)
  if (role !== "IT_MANAGER" && role !== "HR" && role !== "TECHNOLOGY" && role !== "ADMIN" && !isMasterAdmin) throw new Error("No autorizado")

  try {
    await prisma.holiday.create({
      data: { name, date: new Date(dateStr) }
    })
    revalidatePath("/vacations")
    return { success: true }
  } catch (e) {
    return { success: false, error: "Error al crear feriado" }
  }
}

export async function updateUserVacationBalance(userId: string, newBalance: number) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const user = session.user as any
  const role = user.role

  // Solo HR, MANAGER, IT_MANAGER o TECHNOLOGY pueden editar saldos
  const allowedRoles = ["HR", "MANAGER", "IT_MANAGER", "TECHNOLOGY"]
  if (!allowedRoles.includes(role)) {
    throw new Error("No tienes permisos para editar saldos de vacaciones")
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { vacationBalance: newBalance }
    })

    revalidatePath("/vacations")
    revalidatePath("/dashboard")
    revalidatePath("/admin/users") // Por si acaso
    return { success: true }
  } catch (error) {
    console.error("Error updating vacation balance:", error)
    return { success: false, error: "Error al actualizar el saldo" }
  }
}
