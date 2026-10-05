"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Obtiene todos los detalles de un grupo específico
export async function getTeamDashboard(groupId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autenticado")

  const team = await prisma.project.findUnique({
    where: { id: groupId },
    include: {
      supervisors: { select: { id: true, name: true, email: true, role: true, image: true, position: true } },
      subLeaders: { select: { id: true, name: true, email: true, role: true, image: true, position: true } },
      members: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true, 
          image: true, 
          position: true,
          birthday: true,
          showBirthday: true,
          requests: {
            where: { status: "APPROVED", endDate: { gte: new Date() } },
            select: { type: true, startDate: true, endDate: true, status: true }
          }
        } 
      },
      documents: {
        select: { id: true, title: true, category: true, createdAt: true, url: true }
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 15
      }
    }
  })

  if (!team) throw new Error("Grupo no encontrado")

  // Calcular cumplaños próximos de todos los miembros del equipo
  const allUsers = [...team.supervisors, ...team.subLeaders, ...team.members]
  const today = new Date()
  
  const upcomingBirthdays = allUsers
    .filter(u => u.birthday && u.showBirthday)
    .map(u => {
      if (!u.birthday) return null;
      const bDate = new Date(u.birthday)
      bDate.setFullYear(today.getFullYear())
      if (bDate < today) bDate.setFullYear(today.getFullYear() + 1)
      const daysUntil = Math.ceil((bDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { ...u, nextBirthday: bDate, daysUntil }
    })
    .filter(u => u !== null && u.daysUntil <= 30) // Cumpleaños en los próximos 30 días
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

  return {
    team,
    upcomingBirthdays
  }
}

export async function logProjectActivity(projectId: string, content: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return

  await prisma.projectActivity.create({
    data: {
      projectId,
      content
    }
  })
}

export async function getMyGroups() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const userId = (session.user as any).id

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { subLeaders: { some: { id: userId } } },
        { supervisors: { some: { id: userId } } },
        { members: { some: { id: userId } } }
      ]
    },
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      subLeaders: { select: { id: true } },
      supervisors: { select: { id: true } }
    }
  })

  return projects.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    icon: p.icon,
    isLeader: p.subLeaders.some(sl => sl.id === userId),
    isSupervisor: p.supervisors.some(sv => sv.id === userId)
  }))
}
