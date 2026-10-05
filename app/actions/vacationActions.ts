"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createVacationRequest(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("No autenticado")
  }

  const userId = (session.user as any).id
  if (!userId) throw new Error("ID de usuario no encontrado")

  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string
  const reason = formData.get("reason") as string

  if (!startDate || !endDate) {
    return { error: "Las fechas de inicio y fin son requeridas." }
  }

  try {
    await prisma.timeOffRequest.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || "",
        userId: userId,
      }
    })

    revalidatePath("/vacations")
    return { success: true }
  } catch (error) {
    console.error("Error creating vacation request:", error)
    return { error: "Hubo un error al procesar tu solicitud." }
  }
}

export async function getMyVacations() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("No autenticado")
  }

  const userId = (session.user as any).id
  if (!userId) throw new Error("ID de usuario no encontrado")

  return await prisma.timeOffRequest.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" }
  })
}
