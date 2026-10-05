"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const userId = (session.user as any).id
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20
  })

  return notifications
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false }

  const userId = (session.user as any).id
  
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true }
  })
  
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false }

  const userId = (session.user as any).id
  
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  })
  
  return { success: true }
}

export async function createNotification(userId: string, title: string, message: string, type: string = "INFO", link: string | null = null) {
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link
    }
  })
}
