"use server"

import { requireAuth, requirePermission } from "@/lib/permissions"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { saveFile } from "./fileActions"
import { extractTextFromDocument } from "@/app/lib/documentParser"
import { generateNvidiaResponse } from "@/lib/supportAiLlamaService"
import { isTechnologyStaff } from "@/lib/authorizationRoles"

function isTechRole(userOrRole: any): boolean {
  if (typeof userOrRole === "object" && userOrRole !== null) {
    return isTechnologyStaff(userOrRole)
  }
  const r = (userOrRole || "").toString().toUpperCase().trim()
  return r === "TECHNOLOGY" || r === "IT_MANAGER" || r === "TECHNOLOGY_ADMIN" || r === "ADMIN" || r === "CEO" || r === "SUPERADMIN"
}

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
    if (process.env.NVIDIA_API_KEY) {
      try {
        const nvidiaResp = await generateNvidiaResponse(prompt)
        return { success: true, response: nvidiaResp }
      } catch (nErr: any) {
        console.error("NVIDIA fallback failed:", nErr)
      }
    }
    return { error: error.message || "Error de conexión" }
  }
}

export async function summarizeDocument(documentId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { error: "No autorizado" }

  let prompt = ""
  try {
    const doc = await prisma.document.findUnique({ where: { id: documentId } })
    if (!doc || !doc.url) return { error: "Documento no encontrado" }

    const configs = await (prisma as any).ollamaConfig.findMany();
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0];
    if (!globalConfig && !process.env.NVIDIA_API_KEY) return { error: "No hay configuración de IA disponible" }

    const content = await extractTextFromDocument(doc.url, 10000)
    if (!content) return { error: "No se pudo extraer texto del documento" }

    prompt = `Por favor, genera un resumen ejecutivo y los puntos más importantes del siguiente documento corporativo. 
Título: ${doc.title}
Contenido: ${content}

Devuelve el resultado en formato Markdown corto y conciso.`

    // 1. Prioridad: NVIDIA NIM AI
    if (process.env.NVIDIA_API_KEY) {
      try {
        const nvidiaResp = await generateNvidiaResponse(prompt)
        if (nvidiaResp && nvidiaResp.trim()) {
          return { success: true, summary: nvidiaResp.trim() }
        }
      } catch (nErr: any) {
        console.warn("[SummarizeDoc] NVIDIA error, intentando Ollama:", nErr.message)
      }
    }

    // 2. Fallback: Ollama local con timeout para no congelar
    if (globalConfig && globalConfig.url) {
      try {
        const response = await fetch(`${globalConfig.url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: globalConfig.modelName,
            prompt,
            stream: false
          }),
          signal: AbortSignal.timeout(4000)
        })

        if (response.ok) {
          const data = await response.json()
          return { success: true, summary: data.response }
        }
      } catch (ollamaErr: any) {
        console.warn("[SummarizeDoc] Ollama no disponible:", ollamaErr.message)
      }
    }

    throw new Error("No hay un servicio de IA disponible para generar el resumen.")
  } catch (e: any) {
    return { error: e.message || "Error resumiendo" }
  }
}

export async function generateTextWithAI(promptType: "POST" | "RECOGNITION", userPrompt: string, tone?: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { error: "No autorizado" }

  const trimmedPrompt = (userPrompt || "").trim()
  if (!trimmedPrompt) {
    return { error: "Por favor proporciona una idea o palabras clave para redactar." }
  }

  let fullPrompt = ""
  try {
    let systemPrompt = ""
    if (promptType === "POST") {
      systemPrompt = `Eres el asistente corporativo oficial de redacción de comunicados para la intranet de Telecom Networks.
Tu función es ayudar a colaboradores y líderes a redactar publicaciones de alta calidad, claras, profesionales y atractivas.
- Si el usuario proporciona pocas palabras o una idea básica, expándela en un comunicado corporativo completo con título destacado, cuerpo bien estructurado y cierre cordial.
- Utiliza emojis apropiados según el contexto para que sea dinámico y agradable de leer.
${tone ? `- Aplica un tono ${tone}.` : "- Utiliza un tono profesional, claro, colaborativo y positivo."}
- NO agregues introducciones conversacionales ("¡Hola!", "Aquí tienes:", etc.) ni notas al pie. Devuelve ÚNICAMENTE el texto final listo para publicar.`
    } else {
      systemPrompt = `Eres un asistente de Recursos Humanos de Telecom Networks especializado en reconocimiento laboral (Kudos).
Toma la idea del usuario y redacta un mensaje de felicitación y agradecimiento cálido, motivador y profesional (1 o 2 párrafos).
${tone ? `- Aplica un tono ${tone}.` : "- Utiliza un tono motivador, sincero y profesional."}
- NO agregues introducciones ni notas. Devuelve ÚNICAMENTE el mensaje de reconocimiento final.`
    }

    fullPrompt = `${systemPrompt}\n\nInstrucción o idea del colaborador:\n"${trimmedPrompt}"\n\nPublicación final redactada:`

    // 1. MOTOR PRINCIPAL: NVIDIA NIM (Llama 3.2 11B Vision / Instruct)
    const nvidiaKey = process.env.NVIDIA_API_KEY
    if (nvidiaKey && nvidiaKey.trim()) {
      try {
        console.log("[AI Assistant] Solicitando redacción a NVIDIA NIM...")
        const nvidiaResp = await generateNvidiaResponse(
          fullPrompt,
          process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
          systemPrompt
        )
        if (nvidiaResp && nvidiaResp.trim()) {
          return { success: true, generatedText: nvidiaResp.trim(), provider: "NVIDIA" }
        }
      } catch (nErr: any) {
        console.warn("[AI Assistant] Error en llamada a NVIDIA NIM:", nErr.message)
      }
    }

    // 2. MOTOR SECUNDARIO: Configuración de API en base de datos (si existe y está activa)
    try {
      const activeApi = await prisma.apiConfiguration.findFirst({
        where: { isActive: true }
      })
      if (activeApi && activeApi.apiKey) {
        const apiKey = activeApi.apiKey.trim()
        const model = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'
        const endpoint = activeApi.baseUrl || 'https://integrate.api.nvidia.com/v1/chat/completions'
        
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: trimmedPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1024
          }),
          signal: AbortSignal.timeout(8000)
        })
        if (resp.ok) {
          const data = await resp.json()
          const text = data.choices?.[0]?.message?.content?.trim()
          if (text) {
            return { success: true, generatedText: text, provider: activeApi.name || "API DB" }
          }
        }
      }
    } catch (dbApiErr: any) {
      console.warn("[AI Assistant] Error probando API de BD:", dbApiErr.message)
    }

    // 3. MOTOR DE CONTINGENCIA: Ollama local (con timeout estricto de 3.5s para no bloquear la app si está offline)
    try {
      const configs = await (prisma as any).ollamaConfig.findMany()
      const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0]
      if (globalConfig && globalConfig.url) {
        const response = await fetch(`${globalConfig.url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: globalConfig.modelName || 'llama3.2',
            prompt: fullPrompt,
            stream: false
          }),
          signal: AbortSignal.timeout(3500)
        })

        if (response.ok) {
          const data = await response.json()
          if (data.response) {
            return { success: true, generatedText: data.response.trim(), provider: "Ollama" }
          }
        }
      }
    } catch (ollamaErr: any) {
      console.warn("[AI Assistant] Ollama local no disponible:", ollamaErr.message)
    }

    return { error: "No se pudo conectar a los servicios de IA (NVIDIA NIM u Ollama). Por favor verifica la conexión." }
  } catch (e: any) {
    return { error: e.message || "Error inesperado al generar el texto" }
  }
}

export async function generateDailySummary() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return { error: "No autorizado" }

  let prompt = ""
  try {
    const configs = await (prisma as any).ollamaConfig.findMany();
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0];

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

    prompt = `Eres el asistente corporativo de la intranet. Genera un resumen breve, profesional y motivador (máximo 2 párrafos) de las novedades del día. 
Aquí tienes los datos recientes:
Publicaciones recientes:
${posts.map(p => `- ${p.author.name}: ${p.content.substring(0, 50)}...`).join('\n')}

Nuevos documentos:
${docs.map(d => `- ${d.title}`).join('\n')}

Escribe un resumen en primera persona del plural (nosotros) de forma natural, sin decir "Aquí tienes los datos" o "Publicaciones recientes". Dirígete al equipo en tono corporativo pero amigable.`

    // 1. Prioridad: NVIDIA NIM
    if (process.env.NVIDIA_API_KEY) {
      try {
        const nvidiaResp = await generateNvidiaResponse(prompt)
        if (nvidiaResp && nvidiaResp.trim()) {
          return { success: true, summary: nvidiaResp.trim() }
        }
      } catch (nErr: any) {
        console.warn("[AI DailySummary] Error con NVIDIA, probando Ollama:", nErr.message)
      }
    }

    // 2. Fallback: Ollama local
    if (globalConfig && globalConfig.url) {
      try {
        const response = await fetch(`${globalConfig.url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: globalConfig.modelName,
            prompt: prompt,
            stream: false
          }),
          signal: AbortSignal.timeout(3500)
        })

        if (response.ok) {
          const data = await response.json()
          return { success: true, summary: data.response }
        }
      } catch (e: any) {
        console.warn("[AI DailySummary] Ollama no disponible:", e.message)
      }
    }

    return { error: "Servicio de IA no disponible en este momento." }
  } catch (e: any) {
    return { error: e.message || "Error generando resumen" }
  }
}
