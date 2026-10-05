"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "./auditActions"
import { deduplicateHolidays } from "@/lib/holidayData"

// Obtiene los datos del calendario para un mes y año específicos según el rol del usuario
export async function getCalendarData(month: number, year: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const userId = (session.user as any).id
  const role = (session.user as any).role || "USER"

  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0)
  endDate.setHours(23, 59, 59, 999)

  // 1. Obtener los proyectos del usuario (para determinar si es miembro, sublíder o supervisor)
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { members: { some: { id: userId } } },
        { subLeaders: { some: { id: userId } } },
        { supervisors: { some: { id: userId } } }
      ]
    },
    select: {
      id: true,
      subLeaders: { select: { id: true } },
      supervisors: { select: { id: true } }
    }
  })

  const projectIds = userProjects.map(p => p.id)
  const ledProjectIds = userProjects.filter(p => p.subLeaders.some(sl => sl.id === userId)).map(p => p.id)
  const supervisedProjectIds = userProjects.filter(p => p.supervisors.some(sv => sv.id === userId)).map(p => p.id)
  const isLeader = ledProjectIds.length > 0
  const isSupervisor = supervisedProjectIds.length > 0 || role === "SUPERVISOR" || role === "MANAGER"

  // 2. Filtrado de ausencias (Vacaciones y Permisos)
  let timeOffWhereClause: any = {
    status: "APPROVED",
    OR: [
      { startDate: { gte: startDate, lte: endDate } },
      { endDate: { gte: startDate, lte: endDate } },
      { startDate: { lte: startDate }, endDate: { gte: endDate } }
    ]
  }

  if (role === "IT_MANAGER" || role === "HR" || role === "MANAGER") {
    // RRHH y TI: Visualización completa de toda la empresa
  } else if (isSupervisor || role === "SUPERVISOR") {
    // Supervisor: Ve a todo su equipo supervisado y a sí mismo
    timeOffWhereClause.OR = timeOffWhereClause.OR.map((cond: any) => ({
      ...cond,
      OR: [
        { userId: userId },
        { user: { projectId: { in: supervisedProjectIds } } }
      ]
    }))
  } else if (isLeader) {
    // Líder de Grupo: Ve a su grupo y a sí mismo
    timeOffWhereClause.OR = timeOffWhereClause.OR.map((cond: any) => ({
      ...cond,
      OR: [
        { userId: userId },
        { user: { projectId: { in: ledProjectIds } } }
      ]
    }))
  } else {
    // Usuario Normal (empleado): Únicamente ve sus propias ausencias
    timeOffWhereClause.OR = timeOffWhereClause.OR.map((cond: any) => ({
      ...cond,
      userId: userId
    }))
  }

  const timeOff = await prisma.timeOffRequest.findMany({
    where: timeOffWhereClause,
    include: {
      user: { select: { id: true, name: true, image: true, projectId: true } }
    }
  })

  // 3. Filtrado de eventos manuales (CalendarEvent - excluyendo feriados para que no se dupliquen)
  let eventWhereClause: any = {
    type: { not: "HOLIDAY" },
    OR: [
      { startDate: { gte: startDate, lte: endDate } },
      { endDate: { gte: startDate, lte: endDate } },
      { startDate: { lte: startDate }, endDate: { gte: endDate } }
    ]
  }

  if (role === "IT_MANAGER" || role === "HR" || role === "MANAGER") {
    // Ver todos los eventos
  } else if (isSupervisor || role === "SUPERVISOR") {
    // Supervisor: Públicos, dirigidos a Supervisores, creados por él o de proyectos supervisados
    eventWhereClause.OR = eventWhereClause.OR.map((cond: any) => ({
      ...cond,
      OR: [
        { scope: "PUBLIC" },
        { scope: "SUPERVISORS" },
        { createdById: userId },
        { projectId: { in: supervisedProjectIds } }
      ]
    }))
  } else if (isLeader) {
    // Líder de Grupo: Públicos, de su proyecto o creados por él
    eventWhereClause.OR = eventWhereClause.OR.map((cond: any) => ({
      ...cond,
      OR: [
        { scope: "PUBLIC" },
        { projectId: { in: ledProjectIds } },
        { createdById: userId }
      ]
    }))
  } else {
    // Usuario Normal: Públicos, de su proyecto, creados por él, o si es participante específico
    eventWhereClause.OR = eventWhereClause.OR.map((cond: any) => ({
      ...cond,
      OR: [
        { scope: "PUBLIC" },
        { projectId: { in: projectIds } },
        { createdById: userId },
        { participantIds: { contains: userId } }
      ]
    }))
  }

  const manualEvents = await prisma.calendarEvent.findMany({
    where: eventWhereClause,
    include: {
      createdBy: { select: { id: true, name: true, image: true, role: true } },
      project: { select: { id: true, name: true, color: true } },
      attendances: {
        include: {
          user: { select: { id: true, name: true, image: true } }
        }
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, image: true } }
        }
      }
    }
  })

  // 4. Obtener Feriados (visibles para todos, unificados y deduplicados estrictamente)
  const holidaysFromTable = await prisma.holiday.findMany({
    where: {
      date: { gte: startDate, lte: endDate }
    }
  })

  const holidayEventsFromCalendar = await prisma.calendarEvent.findMany({
    where: {
      type: "HOLIDAY",
      OR: [
        { startDate: { gte: startDate, lte: endDate } },
        { endDate: { gte: startDate, lte: endDate } }
      ]
    }
  })

  // Unificar cualquier feriado registrado en ambas tablas y deduplicarlo para que aparezca una sola vez
  const combinedRawHolidays = [
    ...holidaysFromTable.map(h => ({
      id: `hol-${h.id}`,
      title: h.name,
      name: h.name,
      date: h.date,
      startDate: h.date,
      endDate: h.date,
      description: null,
      location: null,
      color: null
    })),
    ...holidayEventsFromCalendar.map(e => ({
      id: `ev-${e.id}`,
      title: e.title,
      name: e.title,
      date: e.startDate,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      location: e.location,
      color: e.color
    }))
  ]

  const holidays = deduplicateHolidays(combinedRawHolidays)

  return { timeOff, manualEvents, holidays }
}

// Obtiene los eventos próximos filtrados para el dashboard o barra lateral
export async function getUpcomingEvents() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const userId = (session.user as any).id
  const role = (session.user as any).role || "USER"

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 14) // Próximos 14 días

  // Filtrado de eventos próximos para el usuario
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { members: { some: { id: userId } } },
        { subLeaders: { some: { id: userId } } },
        { supervisors: { some: { id: userId } } }
      ]
    },
    select: { id: true }
  })
  const projectIds = userProjects.map(p => p.id)

  let eventWhereClause: any = {
    type: { not: "HOLIDAY" },
    startDate: { gte: today, lte: nextWeek }
  }

  if (role !== "IT_MANAGER" && role !== "HR" && role !== "MANAGER") {
    eventWhereClause.OR = [
      { scope: "PUBLIC" },
      { createdById: userId },
      { projectId: { in: projectIds } },
      { participantIds: { contains: userId } }
    ]
    if (role === "SUPERVISOR") {
      eventWhereClause.OR.push({ scope: "SUPERVISORS" })
    }
  }

  const manualEvents = await prisma.calendarEvent.findMany({
    where: eventWhereClause,
    orderBy: { startDate: 'asc' },
    take: 4
  })

  const holidaysRaw = await prisma.holiday.findMany({
    where: {
      date: { gte: today, lte: nextWeek }
    },
    orderBy: { date: 'asc' },
    take: 4
  })

  const uniqueHolidays = deduplicateHolidays(holidaysRaw.map(h => ({
    id: h.id,
    title: h.name,
    date: h.date,
    startDate: h.date
  }))).slice(0, 2)

  const combined = [
    ...manualEvents.map(e => ({ id: e.id, title: e.title, date: e.startDate, type: e.type, isHoliday: false, color: e.color })),
    ...uniqueHolidays.map(h => ({ id: h.id, title: h.title, date: h.date, type: 'HOLIDAY', isHoliday: true, color: (h as any).color || '#f43f5e' }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4)

  return combined
}

// Crea un nuevo evento de calendario (Líderes, Supervisores, RRHH y TI)
export async function createCalendarEvent(data: {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  type: string
  color: string
  location?: string
  responsible?: string
  scope: string
  projectId?: string
  sendNotification?: boolean
  showReminder?: boolean
  allowComments?: boolean
  allowRSVP?: boolean
  participantsScope: string
  participantIds?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autenticado")

  const userId = (session.user as any).id
  const role = (session.user as any).role || "USER"

  // Verificar si es líder de grupo o rol administrativo/supervisor
  const ledGroupsCount = await prisma.project.count({
    where: { subLeaders: { some: { id: userId } } }
  })
  const isLeader = ledGroupsCount > 0
  const isAuthorized = role !== "USER" || isLeader

  if (!isAuthorized) {
    throw new Error("No tienes permisos para crear eventos en el calendario.")
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      type: data.type,
      color: data.color,
      location: data.location,
      responsible: data.responsible,
      scope: data.scope,
      projectId: data.projectId || null,
      sendNotification: data.sendNotification ?? false,
      showReminder: data.showReminder ?? false,
      allowComments: data.allowComments ?? false,
      allowRSVP: data.allowRSVP ?? false,
      participantsScope: data.participantsScope || "ALL",
      participantIds: data.participantIds || null,
      createdById: userId
    }
  })

  // Generar notificación si se seleccionó la opción o si el alcance es grupal/específico
  if (data.sendNotification) {
    let notifyUserIds: string[] = []
    if (data.participantsScope === "GROUP" && data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        select: { members: { select: { id: true } } }
      })
      notifyUserIds = project?.members.map(m => m.id) || []
    } else if (data.participantsScope === "SPECIFIC" && data.participantIds) {
      notifyUserIds = data.participantIds.split(",")
    }

    if (notifyUserIds.length > 0) {
      await prisma.notification.createMany({
        data: notifyUserIds.map(uId => ({
          userId: uId,
          title: `Nuevo Evento: ${data.title}`,
          message: `Se ha programado el evento "${data.title}" para el ${new Date(data.startDate).toLocaleDateString()}. Ubicación: ${data.location || "N/A"}.`,
          type: "EVENT",
          link: "/calendar"
        }))
      })
    }
  }

  await createAuditLog(
    "CREATE_EVENT",
    `CalendarEvent:${event.id}`,
    `Evento '${data.title}' creado con éxito. Alcance: ${data.scope}.`
  )

  revalidatePath("/calendar")
  return event
}

// Responde a la asistencia (RSVP) de un evento
export async function respondToEventRSVP(eventId: string, status: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autenticado")

  const userId = (session.user as any).id

  const attendance = await prisma.eventAttendance.upsert({
    where: {
      eventId_userId: { eventId, userId }
    },
    update: { status },
    create: { eventId, userId, status }
  })

  await createAuditLog(
    "RSVP_EVENT",
    `CalendarEvent:${eventId}`,
    `Usuario respondió '${status}' al evento.`
  )

  revalidatePath("/calendar")
  return attendance
}

// Agrega un comentario en un evento
export async function addEventComment(eventId: string, content: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autenticado")

  const userId = (session.user as any).id

  const comment = await prisma.eventComment.create({
    data: {
      eventId,
      userId,
      content
    },
    include: {
      user: { select: { id: true, name: true, image: true } }
    }
  })

  await createAuditLog(
    "COMMENT_EVENT",
    `CalendarEvent:${eventId}`,
    `Usuario añadió un comentario al foro del evento.`
  )

  revalidatePath("/calendar")
  return comment
}

// Elimina un evento de calendario
export async function deleteCalendarEvent(eventId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autenticado")

  const userId = (session.user as any).id
  const role = (session.user as any).role || "USER"

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId }
  })
  if (!event) throw new Error("Evento no encontrado")

  const ledGroupsCount = await prisma.project.count({
    where: { subLeaders: { some: { id: userId } } }
  })
  const isLeader = ledGroupsCount > 0
  const isAuthorized = role !== "USER" || isLeader || event.createdById === userId

  if (!isAuthorized) {
    throw new Error("No tienes permisos para eliminar este evento.")
  }

  await prisma.calendarEvent.delete({
    where: { id: eventId }
  })

  await createAuditLog(
    "DELETE_EVENT",
    `CalendarEvent:${eventId}`,
    `Evento '${event.title}' eliminado por completo.`
  )

  revalidatePath("/calendar")
  return { success: true }
}

