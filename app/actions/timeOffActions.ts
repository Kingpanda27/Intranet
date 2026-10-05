"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendTimeOffEmail } from "@/lib/email"
import { saveFile } from "./fileActions"
import { createAuditLog } from "./auditActions"
import { MIN_VACATION_DAYS } from "@/lib/vacationPolicy"

export type RequestType =
  | "VACATION"
  | "PERMISSION"
  | "EARLY_LEAVE"
  | "SICK_LEAVE"
  | "MEDICAL_LEAVE"
  | "MATERNITY_LEAVE"
  | "PATERNITY_LEAVE"
  | "BEREAVEMENT_LEAVE"
  | "HOURS_MAKEUP"
  | "SPECIAL"
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
  const role = user.role
  const userId = user.id

  const isManager = ["HR", "MANAGER", "IT_MANAGER", "TECHNOLOGY"].includes(role)
  const isSupervisor = role === "SUPERVISOR"

  if (!isManager && !isSupervisor) return []

  if (isManager) {
    const users = await prisma.user.findMany({
      where: { role: { not: "NO_ROLE" } },
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

  if (isSupervisor) {
    const supervisedProjects = await (prisma.project as any).findMany({
      where: { supervisors: { some: { id: userId } } },
      select: { id: true }
    })
    const projectIds = supervisedProjects.map((p: any) => p.id)

    const users = await prisma.user.findMany({
      where: {
        role: { not: "NO_ROLE" },
        ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : {})
      },
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

  return []
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

  const targetUserId = formData.get("targetUserId") as string | null
  const autoApprove = formData.get("autoApprove") === "true"

  const canManage = ["SUPERVISOR", "MANAGER", "IT_MANAGER", "HR", "TECHNOLOGY"].includes(loggedInRole)

  let userId = loggedInUserId
  let isCreatedOnBehalf = false

  if (targetUserId && targetUserId !== loggedInUserId && canManage) {
    userId = targetUserId
    isCreatedOnBehalf = true
  }

  const type = formData.get("type") as RequestType || "VACATION"
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string
  const leaveTime = formData.get("leaveTime") as string // Para salida temprana

  let startDate = new Date(startDateStr)
  let endDate = new Date(endDateStr)

  if (type === "EARLY_LEAVE" && leaveTime) {
    const [hours, minutes] = leaveTime.split(":")
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    endDate = new Date(startDate)
  }

  const reason = formData.get("reason") as string
  let workingDays = await calculateWorkingDays(startDate, endDate)

  // Campos de reposición de horas y permisos especiales
  const absenceDateStr = formData.get("absenceDate") as string | null
  const hoursToMakeUpStr = formData.get("hoursToMakeUp") as string | null
  const makeupDateStr = formData.get("makeupDate") as string | null
  const makeupStartTime = formData.get("makeupStartTime") as string | null
  const makeupEndTime = formData.get("makeupEndTime") as string | null

  const specialType = formData.get("specialType") as string | null
  const exitTime = formData.get("exitTime") as string | null
  const returnTime = formData.get("returnTime") as string | null
  const hoursRequestedStr = formData.get("hoursRequested") as string | null

  const hoursToMakeUp = hoursToMakeUpStr ? parseFloat(hoursToMakeUpStr) : null
  const hoursRequested = hoursRequestedStr ? parseFloat(hoursRequestedStr) : null
  const absenceDate = absenceDateStr ? new Date(absenceDateStr) : null
  const makeupDate = makeupDateStr ? new Date(makeupDateStr) : null

  // Si es un permiso por horas o reposición de horas, no consume días de saldo de vacaciones de forma predeterminada
  if (type === "HOURS_MAKEUP" || (type === "SPECIAL" && specialType === "HOURS")) {
    workingDays = 0
  } else if (type === "SPECIAL" && specialType === "HALF") {
    workingDays = 0.5
  }

  const requiredTypes = ["SICK_LEAVE", "MEDICAL_LEAVE", "MATERNITY_LEAVE", "PATERNITY_LEAVE", "BEREAVEMENT_LEAVE"]
  const isDocumentRequired = requiredTypes.includes(type)
  const documentFile = formData.get("document") as File | null

  if (isDocumentRequired && (!documentFile || documentFile.size === 0)) {
    return { success: false, error: "La documentación de respaldo es obligatoria para esta solicitud." }
  }

  let documentUrl: string | null = null
  let documentName: string | null = null

  if (documentFile && documentFile.size > 0) {
    const ext = documentFile.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"]
    if (!ext || !allowedExtensions.includes(ext)) {
      return { success: false, error: "Formato de archivo no permitido. Solo se aceptan PDF, JPG, JPEG y PNG." }
    }
    try {
      documentName = documentFile.name
      documentUrl = await saveFile(documentFile, "documents")
    } catch (e) {
      console.error("Error saving document:", e)
      return { success: false, error: "Error al guardar el archivo adjunto." }
    }
  }

  try {
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
               supervisors: true
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

      let typeLabel = "Vacaciones"
      switch (type) {
        case "VACATION": typeLabel = "Vacaciones"; break
        case "PERMISSION": typeLabel = "Permiso Especial"; break
        case "EARLY_LEAVE": typeLabel = "Salida Temprana"; break
        case "SICK_LEAVE": typeLabel = "Licencia por Enfermedad"; break
        case "MEDICAL_LEAVE": typeLabel = "Licencia Médica"; break
        case "MATERNITY_LEAVE": typeLabel = "Licencia por Maternidad"; break
        case "PATERNITY_LEAVE": typeLabel = "Licencia por Paternidad"; break
        case "BEREAVEMENT_LEAVE": typeLabel = "Licencia por Fallecimiento de Familiar Directo"; break
      }

      let timeDetails = `Inicio: ${startDateStr}`
      if (type === "EARLY_LEAVE") {
        timeDetails = `Fecha: ${startDateStr}\nHora de salida: ${leaveTime}`
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
    } catch (e) {
      console.error("Error al procesar notificación de email:", e)
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
  const role = user.role

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
        project: { select: { name: true } }
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

  // RRHH, MANAGER, y IT_MANAGER ven todo
  if (role === "HR" || role === "MANAGER" || role === "IT_MANAGER") {
    const requests = await prisma.timeOffRequest.findMany({
      where: { status: "PENDING" },
      select: selectFields,
      orderBy: { createdAt: "desc" },
    })

    return requests.map(mapRequestDates)
  }

  // Supervisores ven solo su proyecto
  if (role === "SUPERVISOR") {
    const supervisedProjects = await (prisma.project as any).findMany({
      where: { supervisors: { some: { id: user.id } } },
      select: { id: true }
    })
    
    const projectIds = supervisedProjects.map((p: any) => p.id)

    const requests = await prisma.timeOffRequest.findMany({
      where: {
        status: "PENDING",
        user: {
          projectId: { in: projectIds }
        }
      },
      select: selectFields,
      orderBy: { createdAt: "desc" },
    })

    return requests.map(mapRequestDates)
  }

  return []
}

export async function getAllSupervisedRequests() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const user = session.user as any
  const role = user.role

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
        project: { select: { name: true } }
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

  // RRHH, MANAGER, y IT_MANAGER ven todo
  if (role === "HR" || role === "MANAGER" || role === "IT_MANAGER") {
    const requests = await prisma.timeOffRequest.findMany({
      select: selectFields,
      orderBy: { createdAt: "desc" },
    })

    return requests.map(mapRequestDates)
  }

  // Supervisores ven solo su proyecto
  if (role === "SUPERVISOR") {
    const supervisedProjects = await (prisma.project as any).findMany({
      where: { supervisors: { some: { id: user.id } } },
      select: { id: true }
    })
    
    const projectIds = supervisedProjects.map((p: any) => p.id)

    const requests = await prisma.timeOffRequest.findMany({
      where: {
        user: {
          projectId: { in: projectIds }
        }
      },
      select: selectFields,
      orderBy: { createdAt: "desc" },
    })

    return requests.map(mapRequestDates)
  }

  return []
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
  
  if (user.role === "USER") throw new Error("No tienes permisos")

  try {
    const oldRequest = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
      select: { status: true, userId: true, type: true, startDate: true, endDate: true }
    })

    if (!oldRequest) return { success: false, error: "Solicitud no encontrada" }

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

    const request = await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: updateData,
    })

    // Generar notificación interna al empleado sobre el cambio de estado
    await prisma.notification.create({
      data: {
        userId: oldRequest.userId,
        title: `Solicitud de Permiso ${status === "APPROVED" ? "Aprobada" : status === "REJECTED" ? "Rechazada" : status}`,
        message: `Tu solicitud de ${oldRequest.type.replace('_', ' ')} ha sido marcada como ${status}. Nota del supervisor: ${note || "N/A"}.`,
        type: "TIME_OFF",
        link: "/vacations"
      }
    })

    // Registro de Auditoría
    await createAuditLog(
      "APPROVE_TIME_OFF",
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

export async function deleteTimeOffRequest(requestId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autorizado")

  const user = session.user as any
  if (user.role === "USER") throw new Error("No tienes permisos")

  try {
    await prisma.timeOffRequest.delete({
      where: { id: requestId },
    })

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
  const userRole = loggedInUser.role
  const isManagement = ["SUPERVISOR", "MANAGER", "IT_MANAGER", "HR", "TECHNOLOGY"].includes(userRole)

  try {
    const existingReq = await prisma.timeOffRequest.findUnique({
      where: { id: requestId }
    })

    if (!existingReq) {
      return { success: false, error: "Solicitud no encontrada" }
    }

    if (existingReq.userId !== userId && !isManagement) {
      return { success: false, error: "No tienes permiso para cancelar esta solicitud" }
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

    revalidatePath("/vacations")
    revalidatePath("/admin/vacations")
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
  if (role !== "IT_MANAGER" && role !== "HR") throw new Error("No autorizado")

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
