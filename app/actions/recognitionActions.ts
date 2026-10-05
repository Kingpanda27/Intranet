"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "./notificationActions"
import { revalidatePath } from "next/cache"

export async function giveRecognition(receiverId: string, type: string, message: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autenticado")
  
  const senderId = (session.user as any).id
  
  if (senderId === receiverId) {
    throw new Error("No puedes darte un reconocimiento a ti mismo")
  }

  const recognition = await prisma.recognition.create({
    data: {
      type,
      message,
      senderId,
      receiverId
    },
    include: {
      sender: { select: { name: true } }
    }
  })

  // Create notification for the receiver
  await createNotification(
    receiverId,
    "¡Has recibido un reconocimiento!",
    `${recognition.sender.name} te ha otorgado un reconocimiento por ${type.replace('_', ' ')}.`,
    "SUCCESS",
    "/profile"
  )

  revalidatePath("/")
  revalidatePath("/profile")
  revalidatePath("/social")

  return { success: true }
}

export async function getRecentRecognitions() {
  return await prisma.recognition.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      sender: { select: { name: true, image: true, id: true } },
      receiver: { select: { name: true, image: true, id: true } }
    }
  })
}

export async function getRecognitionsForUser(userId: string) {
  return await prisma.recognition.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { name: true, image: true } }
    }
  })
}
