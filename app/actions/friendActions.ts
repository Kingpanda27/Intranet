"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendFriendRequestEmail } from "@/lib/email"
import { redis } from "@/lib/redis"

export async function sendFriendRequest(receiverId: string) {
  if (!receiverId || typeof receiverId !== "string") return { error: "ID de destinatario inválido" }
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autenticado")
  const senderId = (session.user as any).id

  console.log(`[SOCIAL] sendFriendRequest: ${senderId} -> ${receiverId}`)
  if (senderId === receiverId) return { error: "No puedes agregarte a ti mismo" }

  try {
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    })

    if (existing) return { error: "Ya existe una solicitud o amistad" }

    // Verificar que ambos usuarios existen
    const [senderUser, receiverUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } })
    ])

    if (!senderUser) return { error: "Tu sesión parece ser inválida. Por favor, cierra sesión y vuelve a entrar." }
    if (!receiverUser) return { error: "El usuario que intentas agregar ya no existe." }

    await prisma.friendship.create({
      data: { senderId, receiverId, status: "PENDING" }
    })

    // Invalidate cache
    await redis.del(`friends:${senderId}`)
    await redis.del(`friends:${receiverId}`)

    // Enviar notificación por correo
    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { email: true } })
    if (receiver?.email) {
      await sendFriendRequestEmail(receiver.email, session.user.name || "Un colega")
    }

    revalidatePath("/")
    revalidatePath("/social")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al enviar solicitud" }
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autenticado")

  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } })
    console.log(`[SOCIAL] acceptFriendRequest: id=${friendshipId}`, friendship)
    if (!friendship) return { error: "Solicitud no encontrada" }

    // Verificar que los usuarios de la amistad todavía existen
    const [u1, u2] = await Promise.all([
      prisma.user.findUnique({ where: { id: friendship.senderId } }),
      prisma.user.findUnique({ where: { id: friendship.receiverId } })
    ])

    if (!u1 || !u2) return { error: "Uno de los usuarios de esta solicitud ya no existe." }

    if (friendship.receiverId !== (session.user as any).id) {
      return { error: "No autorizado" }
    }

    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "ACCEPTED" }
    })

    // Invalidate cache
    try {
      await redis.del(`friends:${friendship.senderId}`)
      await redis.del(`friends:${friendship.receiverId}`)
    } catch (e) {
      console.error("Redis del error:", e)
    }

    revalidatePath("/")
    revalidatePath("/social")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Accept error:", error)
    return { error: "Error al aceptar solicitud" }
  }
}

export async function declineFriendRequest(friendshipId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) throw new Error("No autenticado")

  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } })
    const userId = (session.user as any).id
    console.log(`[SOCIAL] declineFriendRequest: id=${friendshipId} user=${userId}`, friendship)
    if (!friendship || (friendship.receiverId !== userId && friendship.senderId !== userId)) {
      return { error: "No autorizado" }
    }

    await prisma.friendship.delete({ where: { id: friendshipId } })

    // Invalidate cache
    try {
      await redis.del(`friends:${friendship.senderId}`)
      await redis.del(`friends:${friendship.receiverId}`)
    } catch (e) {
       console.error("Redis del error:", e)
    }

    revalidatePath("/social")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Decline error:", error)
    return { error: "Error al declinar solicitud" }
  }
}

export async function removeFriend(friendshipId: string) {
  try {
    const friendship = await prisma.friendship.delete({ where: { id: friendshipId } })
    
    // Invalidate cache
    await redis.del(`friends:${friendship.senderId}`)
    await redis.del(`friends:${friendship.receiverId}`)

    revalidatePath("/")
    revalidatePath("/social")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al eliminar amigo" }
  }
}

export async function getPeople(query: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []
  const userId = (session.user as any).id

  const { computeUserStatus } = await import('@/lib/userUtils')

  const people = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: userId } },
        {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      lastSeen: true,
      friendshipsSent: { where: { receiverId: userId } },
      friendshipsReceived: { where: { senderId: userId } },
      requests: {
        where: { status: "APPROVED" },
        select: { type: true, startDate: true, endDate: true, status: true }
      }
    },
    take: 100
  })

  return people.map(p => {
    const { requests, lastSeen, ...rest } = p
    return {
      ...rest,
      lastSeen,
      currentStatus: computeUserStatus(requests || [], lastSeen)
    }
  })
}

export async function getFriends() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []
  const userId = (session.user as any).id

  const cacheKey = `friends:${userId}`
  
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error("Redis get error:", e)
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: userId, status: "ACCEPTED" },
        { receiverId: userId, status: "ACCEPTED" }
      ]
    },
    include: {
      sender: { select: { id: true, name: true, image: true, lastSeen: true } },
      receiver: { select: { id: true, name: true, image: true, lastSeen: true } }
    }
  })

  const friends = friendships.map((f: any) => {
    const friend = f.senderId === userId ? f.receiver : f.sender
    return {
      friendshipId: f.id,
      id: friend.id,
      name: friend.name,
      image: friend.image,
      lastSeen: friend.lastSeen?.toISOString()
    }
  })

  try {
    await redis.set(cacheKey, JSON.stringify(friends), "EX", 300) // Cache for 5 mins
  } catch (e) {
    console.error("Redis set error:", e)
  }

  return friends
}

export async function getPendingRequests() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []
  const userId = (session.user as any).id

  return await prisma.friendship.findMany({
    where: { receiverId: userId, status: "PENDING" },
    include: {
      sender: { select: { id: true, name: true, image: true } }
    }
  })
}

export async function getSocialStatsDetail() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { allUsers: [], myConnections: [], pendingRequests: [] }
  const userId = (session.user as any).id

  const [allUsers, friendships, pendingRequests] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true, role: true }
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender:   { select: { id: true, name: true, email: true, image: true, role: true } },
        receiver: { select: { id: true, name: true, email: true, image: true, role: true } }
      }
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true, role: true } }
      }
    })
  ])

  const myConnections = friendships.map((f: any) => {
    const friend = f.senderId === userId ? f.receiver : f.sender
    return { friendshipId: f.id, ...friend }
  })

  return {
    allUsers: allUsers.map((u: any) => ({ ...u })),
    myConnections,
    pendingRequests: pendingRequests.map((r: any) => ({ friendshipId: r.id, ...r.sender }))
  }
}
