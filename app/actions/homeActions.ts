"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function updateHeartbeat() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user && (session.user as any).id) {
      await prisma.user.update({
        where: { id: (session.user as any).id },
        data: { lastSeen: new Date() }
      })
    }
  } catch (e) {
    // Ignore heartbeat errors
  }
}

export async function getHomeMetrics() {
  await updateHeartbeat()

  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0,0,0,0)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [activeUsersCount, absents, eventsThisWeek, recognitionsThisMonth, recentDocs] = await Promise.all([
    prisma.user.count({
      where: {
        lastSeen: { gte: startOfDay }
      }
    }),
    prisma.timeOffRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay }
      }
    }),
    prisma.calendarEvent.count({
      where: {
        startDate: { gte: startOfWeek }
      }
    }),
    prisma.recognition.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ])

  return {
    activeEmployees: Math.max(activeUsersCount, 1),
    absentEmployees: absents,
    eventsThisWeek,
    recognitionsThisMonth,
    recentDocs
  }
}

export async function getCorporateActivity() {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - 7)
  
  const [posts, docs, recs, requests] = await Promise.all([
    prisma.post.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.document.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.recognition.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.timeOffRequest.count({ where: { updatedAt: { gte: startOfWeek }, status: "APPROVED" } })
  ])

  return { posts, docs, recs, requests }
}

export async function getUpcomingAbsences() {
  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  
  const in7Days = new Date(today)
  in7Days.setDate(today.getDate() + 14)
  
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: { gt: startOfDay, lte: in7Days }
    },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { startDate: "asc" },
    take: 5
  })
  
  return requests
}

export async function getTodaysBirthdays() {
  const today = new Date()
  const month = today.getMonth()
  const day = today.getDate()

  const allUsers = await prisma.user.findMany({
    where: { showBirthday: true, birthday: { not: null } },
    select: { id: true, name: true, image: true, birthday: true, position: true }
  })

  return allUsers.filter(u => {
    if (!u.birthday) return false;
    return u.birthday.getMonth() === month && u.birthday.getDate() === day
  })
}

export async function getPersonalSummary(userId: string) {
  const today = new Date()
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vacationBalance: true }
  })
  
  const nextAbsence = await prisma.timeOffRequest.findFirst({
    where: { userId, status: "APPROVED", startDate: { gt: today } },
    orderBy: { startDate: "asc" }
  })
  
  const recognitions = await prisma.recognition.count({
    where: { receiverId: userId }
  })
  
  return {
    vacationBalance: user?.vacationBalance || 0,
    nextAbsence,
    recognitions
  }
}

export async function getActiveEmployeesDetails() {
  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)

  const users = await prisma.user.findMany({
    where: {
      lastSeen: { gte: startOfDay }
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      image: true, 
      position: true, 
      role: true, 
      lastSeen: true,
      project: { select: { name: true } } 
    },
    orderBy: { lastSeen: "desc" }
  })

  return users.map(u => {
    const isOnline = u.lastSeen ? (Date.now() - new Date(u.lastSeen).getTime() < 5 * 60 * 1000) : false
    return {
      ...u,
      department: u.project?.name || "Sin Dpto.",
      isOnline
    }
  })
}

export async function getAbsentEmployeesDetails() {
  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  return prisma.timeOffRequest.findMany({
    where: { status: "APPROVED", startDate: { lte: endOfDay }, endDate: { gte: startOfDay } },
    include: { 
      user: { 
        select: { id: true, name: true, email: true, image: true, position: true, project: { select: { name: true } } } 
      } 
    },
    orderBy: { startDate: "asc" }
  })
}

export async function getEventsThisWeekDetails() {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0,0,0,0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  return prisma.calendarEvent.findMany({
    where: { startDate: { gte: startOfWeek, lte: endOfWeek } },
    orderBy: { startDate: "asc" }
  })
}

export async function getRecognitionsThisMonthDetails() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const recognitions = await prisma.recognition.findMany({
    where: { createdAt: { gte: startOfMonth } },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  const counts: Record<string, { count: number; user: any }> = {}
  recognitions.forEach(r => {
    if (!counts[r.receiver.id]) counts[r.receiver.id] = { count: 0, user: r.receiver }
    counts[r.receiver.id].count += 1
  })

  const top3 = Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return { list: recognitions, top3 }
}

export async function getRecentDocsDetails() {
  return prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  })
}
