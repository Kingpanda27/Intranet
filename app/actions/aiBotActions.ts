"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { extractTextFromDocument } from "@/app/lib/documentParser"

export async function getAvailableAgents() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  try {
    return await (prisma as any).ollamaConfig.findMany({
      select: { id: true, name: true, isGlobal: true }
    })
  } catch (error) {
    return []
  }
}

export async function askAITN(prompt: string, agentId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: "No autenticado" }

  try {
    let config = null

    if (agentId) {
      config = await (prisma as any).ollamaConfig.findUnique({
        where: { id: agentId },
        include: { documents: true }
      })
    }

    if (!config) {
      config = await (prisma as any).ollamaConfig.findFirst({
        where: { isGlobal: true },
        include: { documents: true }
      })
    }
    
    // Si no hay global, buscar la primera disponible
    if (!config) {
      config = await (prisma as any).ollamaConfig.findFirst({
        include: { documents: true }
      })
    }

    if (!config) {
        config = { url: "http://192.168.50.233:11434", modelName: "llama3.2", documents: [] }
    }

    // 2. Obtener contexto de los documentos vinculados a ESTE agente
    const docs = config.documents || []
    let contextStr = ""

    if (docs.length > 0) {
      for (const d of docs) {
        if (d.url) {
          const content = await extractTextFromDocument(d.url, 2000)
          contextStr += `--- DOCUMENTO ---\nTítulo: ${d.title}\nCategoría: ${d.category || "General"}\nContenido Extraído:\n${content}\n----------------\n\n`
        }
      }
    }

    if (!contextStr.trim()) {
      contextStr = "No hay documentos específicos de la empresa cargados. Responde como un asistente corporativo de Telecom Networks Outsourcing de forma amable y profesional."
    }

    const systemPrompt = `Eres "IA TN", el asistente virtual inteligente de Telecom Networks Outsourcing. 
Tu objetivo es ayudar a los empleados con dudas sobre la empresa de forma amable, profesional y eficiente.

Información y Contexto extraído de los manuales de la empresa:
${contextStr}

Instrucciones obligatorias:
1. Utiliza ESTRICTAMENTE la información proporcionada en el "Contexto" superior para responder.
2. Si la respuesta exacta a la pregunta no aparece en los documentos del contexto, responde: "Lo siento, no tengo esa información en mi base de conocimientos. Por favor consulta con Recursos Humanos o Tecnología." NO inventes respuestas.
3. Sé conciso, directo y amable.`

    const fullPrompt = `${systemPrompt}\n\nUsuario: ${prompt}\n\nIA TN:`

    const response = await fetch(`${config.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.modelName,
        prompt: fullPrompt,
        stream: false
      }),
    })

    if (!response.ok) throw new Error("Servidor de IA no disponible")
    
    const data = await response.json()
    return { success: true, response: data.response }

  } catch (error: any) {
    console.error("Error AI TN:", error)
    return { error: "Lo siento, la IA TN no está disponible en este momento. Intenta de nuevo más tarde." }
  }
}
