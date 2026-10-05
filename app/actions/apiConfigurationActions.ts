"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

async function isAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  return role === "TECHNOLOGY" || role === "IT_MANAGER" || role === "TECHNOLOGY_ADMIN" || role === "ADMIN"
}

export async function createApiConfig(formData: FormData) {
  if (!(await isAdmin())) return { success: false, error: "No autorizado" }

  try {
    const name = formData.get("name") as string
    const provider = formData.get("provider") as string
    const apiKey = formData.get("apiKey") as string
    const baseUrl = formData.get("baseUrl") as string
    const isActive = formData.get("isActive") === "true"

    if (!name || !provider || !apiKey) {
      return { success: false, error: "Faltan campos obligatorios" }
    }

    const config = await prisma.apiConfiguration.create({
      data: {
        name,
        provider,
        apiKey,
        baseUrl: baseUrl || null,
        isActive
      }
    })

    revalidatePath("/admin/config")
    return { success: true, data: config }
  } catch (error: any) {
    console.error("Error creating API config:", error)
    return { success: false, error: error.message || "Error al crear la configuración" }
  }
}

export async function updateApiConfig(formData: FormData) {
  if (!(await isAdmin())) return { success: false, error: "No autorizado" }

  try {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const provider = formData.get("provider") as string
    const apiKey = formData.get("apiKey") as string
    const baseUrl = formData.get("baseUrl") as string
    const isActive = formData.get("isActive") === "true"

    if (!id || !name || !provider) {
      return { success: false, error: "Faltan campos obligatorios" }
    }

    // Only update API key if provided, else keep existing
    const dataToUpdate: any = {
      name,
      provider,
      baseUrl: baseUrl || null,
      isActive
    }

    if (apiKey) {
      dataToUpdate.apiKey = apiKey
    }

    const config = await prisma.apiConfiguration.update({
      where: { id },
      data: dataToUpdate
    })

    revalidatePath("/admin/config")
    return { success: true, data: config }
  } catch (error: any) {
    console.error("Error updating API config:", error)
    return { success: false, error: error.message || "Error al actualizar la configuración" }
  }
}

export async function deleteApiConfig(id: string) {
  if (!(await isAdmin())) return { success: false, error: "No autorizado" }

  try {
    await prisma.apiConfiguration.delete({
      where: { id }
    })

    revalidatePath("/admin/config")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting API config:", error)
    return { success: false, error: error.message || "Error al eliminar la configuración" }
  }
}
