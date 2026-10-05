"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { saveFile } from "./fileActions"
import nodemailer from "nodemailer"
import { processDocumentEmbeddings } from "./embeddingActions"

export async function getDocuments() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) return []

  const projectIdsAllowed: string[] = []
  if (user.projectId) projectIdsAllowed.push(user.projectId)

  const supervised = await (prisma.project as any).findMany({
    where: { supervisors: { some: { id: user.id } } },
    select: { id: true }
  })
  supervised.forEach((p: any) => {
    if (!projectIdsAllowed.includes(p.id)) projectIdsAllowed.push(p.id)
  })

  const whereClause = {
    OR: [
      { isGlobal: true },
      {
        projects: {
          some: {
            id: { in: projectIdsAllowed.length > 0 ? projectIdsAllowed : ["none"] }
          }
        }
      }
    ]
  }

  return await prisma.document.findMany({
    where: whereClause,
    include: {
      author: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  }) as any
}

export async function uploadDocument(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "No autorizado" }

  const user = session.user as any
  if (user.role === "USER" || user.role === "EMPLOYEE") {
    return { success: false, error: "Los empleados tienen acceso para ver y buscar documentos, pero no tienen permisos para subir archivos." }
  }

  const title = formData.get("title") as string
  const file = formData.get("file") as File
  const category = formData.get("category") as string || "GENERAL"
  const department = formData.get("department") as string || "General"
  const agentId = formData.get("agentId") as string | null
  const isGlobal = formData.get("isGlobal") === "true"
  const selectedProjectIds = formData.get("projectIds") as string // Comma separated

  try {
    const fileUrl = await saveFile(file, "documents")

    let projectIds: string[] = []
    if (selectedProjectIds) {
      projectIds = selectedProjectIds.split(",").filter(Boolean)
    }

    if (!isGlobal && projectIds.length === 0) {
      // Fallback 1: Buscar proyectos supervisados o del usuario
      const supervised = await (prisma.project as any).findMany({
        where: { supervisors: { some: { id: user.id } } },
        select: { id: true }
      })
      projectIds = supervised.map((p: any) => p.id)
      if (user.projectId && !projectIds.includes(user.projectId)) projectIds.push(user.projectId)

      // Fallback 2: Si aún no tiene proyectos asignados, usar todos los proyectos o marcarlo como Global
      if (projectIds.length === 0) {
        const allProjects = await (prisma.project as any).findMany({ select: { id: true } })
        projectIds = allProjects.map((p: any) => p.id)
      }
    }

    const effectiveIsGlobal = isGlobal || projectIds.length === 0

    const doc = await (prisma.document as any).create({
      data: {
        title,
        url: fileUrl!,
        category,
        department,
        authorId: user.id,
        isGlobal: effectiveIsGlobal,
        projects: projectIds.length > 0 ? {
          connect: projectIds.map((id: string) => ({ id }))
        } : undefined,
        ...(agentId ? { ollamaConfigs: { connect: { id: agentId } } } : {})
      }
    })

    // Procesar embeddings en segundo plano asíncronamente
    processDocumentEmbeddings(doc.id, doc.url).catch(err => {
      console.error("Error al procesar los embeddings del documento:", err)
    })

    // Notificación por correo asíncrona no bloqueante
    if (projectIds.length > 0 && process.env.SMTP_USER) {
      (async () => {
        try {
          const toEmails: string[] = []
          const targetProjects = await (prisma.project as any).findMany({
            where: { id: { in: projectIds } },
            include: { members: true }
          })
          targetProjects.forEach((p: any) => {
            p.members.forEach((m: any) => {
              if (m.email && !toEmails.includes(m.email)) toEmails.push(m.email)
            })
          })

          if (toEmails.length > 0) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || "smtp.gmail.com",
              port: parseInt(process.env.SMTP_PORT || "587"),
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            })

            await transporter.sendMail({
              from: process.env.SMTP_FROM || '"Intranet" <no-reply@tnoutsourcing.com>',
              to: toEmails.join(", "),
              subject: `Nuevo documento en Knowledge Base: ${title}`,
              text: `Se ha subido un nuevo documento titulado "${title}".\n\nPuedes verlo en la sección de Knowledge Base.`,
            })
          }
        } catch (emailErr) {
          console.error("Error no bloqueante enviando correo:", emailErr)
        }
      })()
    }

    revalidatePath("/knowledge-base")
    return { success: true }
  } catch (error: any) {
    console.error("Error uploading document:", error)
    return { success: false, error: error?.message || "Error al guardar el documento" }
  }
}

export async function deleteDocument(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return { success: false, error: "No autorizado" }

    const user = session.user as any
    if (!["MANAGER", "TECHNOLOGY", "IT_MANAGER", "HR"].includes(user.role)) {
      return { success: false, error: "No tienes permisos para eliminar documentos" }
    }

    await prisma.document.delete({ where: { id } })
    revalidatePath("/knowledge-base")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al eliminar" }
  }
}

export async function getDocumentMetrics(documents: any[]) {
  const total = documents.length;
  const uniqueDepartments = new Set(documents.map(d => d.department || "General")).size;
  const uniqueCategories = new Set(documents.map(d => d.category || "GENERAL")).size;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthCount = documents.filter(d => {
    const dDate = new Date(d.createdAt);
    return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
  }).length;

  return {
    total,
    uniqueDepartments,
    uniqueCategories,
    thisMonthCount
  };
}
