"use server"

import { requireAuth, requirePermission } from "@/lib/permissions"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { saveFile } from "./fileActions"
import { extractTextFromDocument } from "@/app/lib/documentParser"

function isValidOllamaUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    const host = parsed.hostname.toLowerCase()
    if (host === "169.254.169.254" || host.endsWith(".internal")) return false
    return true
  } catch {
    return false
  }
}

export async function getOllamaConfigs() {
  await requirePermission("config:manage")
  
  return await (prisma as any).ollamaConfig.findMany({
    include: { documents: true },
    orderBy: { name: 'asc' }
  })
}

export async function createOllamaConfigWithFiles(formData: FormData) {
  const user = await requirePermission("config:manage")

  const name = formData.get("name") as string
  const url = formData.get("url") as string
  const modelName = formData.get("modelName") as string
  const isGlobal = formData.get("isGlobal") === "true"
  const documentIds = formData.getAll("documentIds") as string[]
  const files = formData.getAll("files") as File[] 

  if (!isValidOllamaUrl(url)) {
    return { error: "URL de servidor Ollama no válida o no permitida por seguridad." }
  }

  try {
    const uploadedDocsIds = []
    if (files) {
      for (const f of files) {
        if (f.size > 0) {
          const fileUrl = await saveFile(f, "documents")
          const doc = await prisma.document.create({
            data: {
              title: f.name,
              url: fileUrl!,
              category: "GENERAL",
              authorId: user.id
            }
          })
          uploadedDocsIds.push(doc.id)
        }
      }
    }

    const allDocs = [...documentIds, ...uploadedDocsIds]

    const config = await (prisma as any).ollamaConfig.create({
      data: {
        name, url, modelName, isGlobal,
        documents: allDocs.length > 0 ? { connect: allDocs.map(id => ({ id })) } : undefined
      }
    })
    revalidatePath("/admin/config")
    return { success: true, config }
  } catch (error) {
    return { error: "Error al crear la configuración" }
  }
}

export async function updateOllamaConfigWithFiles(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !isTechRole((session.user as any).role)) return { error: "No autorizado" }

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const url = formData.get("url") as string
  const modelName = formData.get("modelName") as string
  const isGlobal = formData.get("isGlobal") === "true"
  const documentIds = formData.getAll("documentIds") as string[]
  const files = formData.getAll("files") as File[]

  try {
    if (isGlobal) {
        await (prisma as any).ollamaConfig.updateMany({
            where: { NOT: { id } },
            data: { isGlobal: false }
        })
    }

    const uploadedDocsIds = []
    if (files) {
      for (const f of files) {
        if (f.size > 0) {
          const fileUrl = await saveFile(f, "documents")
          const doc = await prisma.document.create({
            data: {
              title: f.name,
              url: fileUrl!,
              category: "GENERAL",
              authorId: (session.user as any).id
            }
          })
          uploadedDocsIds.push(doc.id)
        }
      }
    }

    const allDocs = [...documentIds, ...uploadedDocsIds]

    await (prisma as any).ollamaConfig.update({
      where: { id },
      data: {
        name, url, modelName, isGlobal,
        documents: {
          set: [],
          connect: allDocs.map(docId => ({ id: docId }))
        }
      }
    })

    revalidatePath("/admin/config")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar la configuración" }
  }
}

export async function deleteOllamaConfig(id: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !isTechRole((session.user as any).role)) return { error: "No autorizado" }

  try {
    await (prisma as any).ollamaConfig.delete({ where: { id } })
    revalidatePath("/admin/config")
    return { success: true }
  } catch (error) {
    return { error: "Error al eliminar la configuración" }
  }
}

export async function testOllamaPrompt(prompt: string, documentIds: string[], config: { url: string, modelName: string }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !isTechRole((session.user as any).role)) return { error: "No autorizado" }

  try {
    const docs = await prisma.document.findMany({
      where: { id: { in: documentIds } }
    })
    
    let contextStr = ""
    for (const d of docs) {
      if (d.url) {
        const content = await extractTextFromDocument(d.url, 2000)
        contextStr += `--- DOCUMENTO ---\nTítulo: ${d.title}\nCategoría: ${d.category || "General"}\nContenido Extraído:\n${content}\n----------------\n\n`
      }
    }

    const systemPrompt = `Eres un agente de Inteligencia Artificial evaluando configuraciones corporativas.
Se ha proveído el siguiente conocimiento interno para tu análisis:
${contextStr}

Pregunta del usuario: ${prompt}

Instrucciones: Utiliza EXCLUSIVAMENTE el conocimiento provisto. Si la respuesta no está resuelta por los documentos, indica que no la sabes.
Respuesta:`

    const response = await fetch(`${config.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.modelName,
        prompt: systemPrompt,
        stream: false
      }),
    })

    if (!response.ok) throw new Error("Error al conectar con Ollama")
    
    const data = await response.json()
    return { success: true, response: data.response }
  } catch (error: any) {
    return { error: error.message || "Error de conexión" }
  }
}

export async function summarizeDocument(documentId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { error: "No autorizado" }

  try {
    const doc = await prisma.document.findUnique({ where: { id: documentId } })
    if (!doc || !doc.url) return { error: "Documento no encontrado" }

    const configs = await (prisma as any).ollamaConfig.findMany();
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0];
    if (!globalConfig) return { error: "No hay configuración de Ollama" }

    const content = await extractTextFromDocument(doc.url, 10000)
    if (!content) return { error: "No se pudo extraer texto del documento" }

    const prompt = `Por favor, genera un resumen ejecutivo y los puntos más importantes del siguiente documento corporativo. 
Título: ${doc.title}
Contenido: ${content}

Devuelve el resultado en formato Markdown corto y conciso.`

    const response = await fetch(`${globalConfig.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: globalConfig.modelName,
        prompt,
        stream: false
      })
    })

    if (!response.ok) throw new Error("Ollama api error")
    
    const data = await response.json()
    return { success: true, summary: data.response }
  } catch (e: any) {
    return { error: e.message || "Error resumiendo" }
  }
}

export async function generateTextWithAI(promptType: "POST" | "RECOGNITION", userPrompt: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { error: "No autorizado" }

  try {
    const configs = await (prisma as any).ollamaConfig.findMany();
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0];
    if (!globalConfig) return { error: "No hay configuración de Ollama" }

    let systemPrompt = ""
    if (promptType === "POST") {
      systemPrompt = `Eres un asistente de redacción corporativo. El usuario quiere publicar un anuncio o comunicado en la intranet. Toma su idea informal y redacta un comunicado profesional, claro y empático. No agregues preámbulos, solo devuelve el texto final.`
    } else {
      systemPrompt = `Eres un asistente de Recursos Humanos. El usuario quiere dar un reconocimiento (Kudo) a un compañero. Toma su idea y redacta un mensaje de reconocimiento motivador, profesional y breve (1 o 2 párrafos). No agregues preámbulos, solo devuelve el texto final.`
    }

    const fullPrompt = `${systemPrompt}\n\nIdea del usuario: ${userPrompt}\nTexto final:`

    const response = await fetch(`${globalConfig.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: globalConfig.modelName,
        prompt: fullPrompt,
        stream: false
      })
    })

    if (!response.ok) throw new Error("Ollama api error")
    
    const data = await response.json()
    return { success: true, generatedText: data.response }
  } catch (e: any) {
    return { error: e.message || "Error generando texto" }
  }
}

export async function generateDailySummary() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { error: "No autorizado" }

  try {
    const configs = await (prisma as any).ollamaConfig.findMany();
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0];
    if (!globalConfig) return { error: "No hay configuración de Ollama" }

    // Fetch context data
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { content: true, author: { select: { name: true } } }
    })
    
    const docs = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true }
    })

    let prompt = `Eres el asistente corporativo de la intranet. Genera un resumen breve, profesional y motivador (máximo 2 párrafos) de las novedades del día. 
Aquí tienes los datos recientes:
Publicaciones recientes:
${posts.map(p => `- ${p.author.name}: ${p.content.substring(0, 50)}...`).join('\n')}

Nuevos documentos:
${docs.map(d => `- ${d.title}`).join('\n')}

Escribe un resumen en primera persona del plural (nosotros) de forma natural, sin decir "Aquí tienes los datos" o "Publicaciones recientes". Dirígete al equipo en tono corporativo pero amigable.`

    const response = await fetch(`${globalConfig.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: globalConfig.modelName,
        prompt: prompt,
        stream: false
      })
    })

    if (!response.ok) throw new Error("Ollama api error")
    
    const data = await response.json()
    return { success: true, summary: data.response }
  } catch (e: any) {
    return { error: e.message || "Error generando resumen" }
  }
}
