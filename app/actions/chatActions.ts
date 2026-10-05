"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { saveFile } from "./fileActions"
import { redis } from "@/lib/redis"

export async function getConversations() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const userId = (session.user as any).id

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    },
    include: {
      user1: { select: { id: true, name: true, image: true, role: true, lastSeen: true } },
      user2: { select: { id: true, name: true, image: true, role: true, lastSeen: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  })

  return conversations.map((c: any) => ({
    ...c,
    updatedAt: c.updatedAt.toISOString(),
    user1: { ...c.user1, lastSeen: c.user1.lastSeen?.toISOString() || null },
    user2: { ...c.user2, lastSeen: c.user2.lastSeen?.toISOString() || null },
    messages: c.messages.map((m: any) => ({ ...m, createdAt: m.createdAt.toISOString() }))
  }))
}

export async function getChatMessages(conversationId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const userId = (session.user as any).id

  // Validar pertenencia a la conversación
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ user1Id: userId }, { user2Id: userId }]
    }
  })

  if (!conversation) {
    throw new Error("Acceso denegado: no perteneces a esta conversación.")
  }

  const cacheKey = `chat:${conversationId}`
  
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error("Redis get chat error:", e)
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    include: {
      author: {
        select: { id: true, name: true, image: true }
      }
    },
    orderBy: { createdAt: "asc" },
    take: 100 // Limit for performance
  })

  const msgs = messages.map((m: any) => ({
    ...m,
    createdAt: m.createdAt.toISOString()
  }))

  try {
    await redis.set(cacheKey, JSON.stringify(msgs), "EX", 60) // Cache for 1 min
  } catch (e) {
    console.error("Redis set chat error:", e)
  }

  return msgs
}

export async function sendMessage(conversationId: string, content?: string, imageFile?: File) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autorizado")

  const userId = (session.user as any).id

  // Validar pertenencia a la conversación
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ user1Id: userId }, { user2Id: userId }]
    }
  })

  if (!conversation) {
    throw new Error("Acceso denegado: no puedes enviar mensajes a esta conversación.")
  }

  let imageUrl = null

  try {
    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveFile(imageFile, "chat")
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content?.trim() || null,
        imageUrl,
        type: imageUrl ? "IMAGE" : "TEXT",
        authorId: userId,
        conversationId
      }
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Invalidate chat cache
    await redis.del(`chat:${conversationId}`)

    return { 
      success: true, 
      message: {
        ...message,
        createdAt: message.createdAt.toISOString()
      }
    }
  } catch (error) {
    console.error(error)
    return { success: false }
  }
}

export async function getMessages(conversationId: string) {
  return await getChatMessages(conversationId)
}

export async function startConversation(targetUserId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("No autorizado")

  const currentUserId = (session.user as any).id
  const [u1, u2] = [currentUserId, targetUserId].sort()

  console.log(`[CHAT] startConversation: from ${currentUserId} to ${targetUserId} as [${u1}, ${u2}]`)

  // Verificar que ambos usuarios existen en la DB
  const [user1Exists, user2Exists] = await Promise.all([
    prisma.user.findUnique({ where: { id: currentUserId } }),
    prisma.user.findUnique({ where: { id: targetUserId } })
  ])

  if (!user1Exists) throw new Error("Tu sesión es inválida o el usuario ha sido eliminado. Por favor, reinicia sesión.")
  if (!user2Exists) throw new Error("El destinatario ya no existe.")

  try {
    const conversation = await prisma.conversation.upsert({
      where: {
        user1Id_user2Id: {
          user1Id: u1,
          user2Id: u2
        }
      },
      update: {},
      create: {
        user1Id: u1,
        user2Id: u2
      }
    })

    return {
      ...conversation,
      updatedAt: conversation.updatedAt.toISOString()
    }
  } catch (error) {
    console.error(error)
    throw new Error("No se pudo iniciar la conversación")
  }
}

export async function getConversation(targetUserId: string) {
  return await startConversation(targetUserId)
}

export async function sendMessageToUser(targetUserId: string, content?: string, imageFile?: File) {
  const conv = await startConversation(targetUserId)
  return await sendMessage(conv.id, content, imageFile)
}

export async function updateLastSeen() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return
  const userId = (session.user as any).id

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() }
    })
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}

export async function searchUsers(query: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } }
      ],
      NOT: { id: (session.user as any).id }
    },
    select: { id: true, name: true, image: true, role: true, lastSeen: true },
    take: 10
  })

  return users.map((u: any) => ({
    ...u,
    lastSeen: u.lastSeen?.toISOString() || null
  }))
}

export async function getAvailableContacts() {
  return [] // Stub para evitar errores en componentes antiguos
}

export async function addContact(id: string) {
  return { success: true } // Stub
}


