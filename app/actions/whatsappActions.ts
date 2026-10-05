"use server"

import { requirePermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getWhatsappConfigs() {
  await requirePermission("config:manage")
  
  return prisma.whatsappConfig.findMany({
    include: {
      projects: true,
      documents: true
    }
  })
}

export async function createWhatsappConfig(name: string, phoneNumber: string, code: string, useAI: boolean, projectIds: string[], documentIds: string[]) {
  await requirePermission("config:manage")
  if (!phoneNumber) return { error: "El número es requerido" }

  await prisma.whatsappConfig.create({
    data: {
      name,
      phoneNumber,
      code,
      useAI,
      projects: {
        connect: projectIds.map(id => ({ id }))
      },
      documents: {
        connect: documentIds.map(id => ({ id }))
      }
    }
  })

  revalidatePath("/admin/config")
  return { success: true }
}

export async function updateWhatsappConfig(id: string, name: string, phoneNumber: string, code: string, useAI: boolean, projectIds: string[], documentIds: string[]) {
  await requirePermission("config:manage")
  if (!phoneNumber) return { error: "El número es requerido" }

  await prisma.whatsappConfig.update({
    where: { id },
    data: {
      name,
      phoneNumber,
      code,
      useAI,
      projects: {
        set: [],
        connect: projectIds.map(projectId => ({ id: projectId }))
      },
      documents: {
        set: [],
        connect: documentIds.map(docId => ({ id: docId }))
      }
    }
  })

  revalidatePath("/admin/config")
  return { success: true }
}

export async function deleteWhatsappConfig(id: string) {
  await requirePermission("config:manage")

  await prisma.whatsappConfig.delete({ where: { id } })
  revalidatePath("/admin/config")
  return { success: true }
}
