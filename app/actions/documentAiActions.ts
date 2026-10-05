"use server"

import { prisma } from "@/lib/prisma"
import { semanticSearch, generateEmbedding } from "./embeddingActions"
import { extractTextFromDocument } from "@/app/lib/documentParser"

export async function askDocumentAI(query: string, documentId?: string) {
  try {
    // 1. Obtener la configuración global o primera de Ollama
    const configs = await (prisma as any).ollamaConfig.findMany()
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0]
    if (!globalConfig) {
      return { error: "No hay configuración de Ollama configurada en la intranet." }
    }

    let contextChunks: any[] = []
    let sourceDocuments: any[] = []

    if (documentId) {
      // Búsqueda en un documento específico
      const doc = await prisma.document.findUnique({ where: { id: documentId } })
      if (!doc) return { error: "Documento no encontrado." }
      
      // Intentar obtener de embeddings del documento
      const docEmbeddings = await (prisma as any).documentEmbedding.findMany({
        where: { documentId }
      })

      if (docEmbeddings.length > 0) {
        // Búsqueda semántica dentro de los fragmentos del documento
        const queryVector = await generateEmbedding(query)
        if (queryVector) {
          const cosineSimilarity = require('cosine-similarity')
          const scored = docEmbeddings.map((emb: any) => {
            const vec = JSON.parse(emb.vector)
            const score = cosineSimilarity(queryVector, vec)
            return { ...emb, score }
          })
          scored.sort((a: any, b: any) => b.score - a.score)
          contextChunks = scored.slice(0, 4) // Tomar los 4 fragmentos más relevantes
        } else {
          contextChunks = docEmbeddings.slice(0, 4)
        }
      } else {
        // Fallback: extraer texto si no hay embeddings creados
        const text = await extractTextFromDocument(doc.url, 15000)
        if (text) {
          contextChunks = [{
            content: text,
            document: doc
          }]
        }
      }
      
      // Mapear la relación del document en cada chunk si no existe
      contextChunks = contextChunks.map(c => ({
        ...c,
        document: c.document || doc
      }))
      
      sourceDocuments = [doc]
    } else {
      // Búsqueda semántica global en todos los documentos de la biblioteca
      const searchResults = await semanticSearch(query, 5)
      
      if (searchResults && searchResults.length > 0) {
        contextChunks = searchResults
        // Extraer documentos únicos utilizados como fuentes
        const docMap = new Map()
        searchResults.forEach((res: any) => {
          if (res.document && !docMap.has(res.document.id)) {
            docMap.set(res.document.id, res.document)
          }
        })
        sourceDocuments = Array.from(docMap.values())
      }
    }

    if (contextChunks.length === 0) {
      return {
        success: true,
        answer: "No encontré información relacionada con esa consulta dentro de los documentos disponibles.",
        sources: [],
        chunks: []
      }
    }

    // 2. Construir el Prompt para RAG
    const contextText = contextChunks
      .map((c: any, index: number) => {
        const title = c.document?.title || "Documento"
        return `[Fragmento ${index + 1} de "${title}"]: ${c.content}`
      })
      .join("\n\n")

    const systemPrompt = `Eres un asistente de Inteligencia Artificial para la intranet corporativa.
Tu objetivo es responder a las preguntas de los empleados basándote ÚNICAMENTE en el contenido de los documentos proporcionados como contexto.

Contexto de los documentos internos:
${contextText}

Pregunta del usuario: ${query}

Instrucciones críticas:
1. Responde de manera profesional, clara y estructurada utilizando formato Markdown.
2. Basate EXCLUSIVAMENTE en la información del contexto provisto. No inventes información.
3. Si el contexto no contiene suficiente información para responder a la pregunta, debes responder exactamente: "No encontré información relacionada con esa consulta dentro de los documentos disponibles."
4. Mantén tus respuestas precisas y directamente relacionadas con lo que se pregunta.`

    // 3. Consultar a Ollama
    const response = await fetch(`${globalConfig.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: globalConfig.modelName,
        prompt: systemPrompt,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error("No se pudo obtener respuesta del servidor local de Ollama.")
    }

    const data = await response.json()
    
    return {
      success: true,
      answer: data.response,
      sources: sourceDocuments.map((d: any) => ({ id: d.id, title: d.title, url: d.url })),
      chunks: contextChunks.map((c: any) => ({
        content: c.content,
        documentTitle: c.document?.title || "Documento"
      }))
    }
  } catch (error: any) {
    console.error("Error en askDocumentAI:", error)
    const errMsg = error.message?.includes("fetch failed")
      ? "No se pudo establecer conexión con el servidor de IA Ollama. Verifica que el servicio esté encendido."
      : (error.message || "Error al procesar la consulta con IA.")
    return { error: errMsg }
  }
}

export async function summarizeDocumentStructured(documentId: string) {
  try {
    const doc = await prisma.document.findUnique({ where: { id: documentId } })
    if (!doc || !doc.url) return { error: "Documento no encontrado." }

    const configs = await (prisma as any).ollamaConfig.findMany()
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0]
    if (!globalConfig) return { error: "No hay configuración de Ollama." }

    const content = await extractTextFromDocument(doc.url, 15000)
    if (!content) return { error: "No se pudo extraer texto del documento." }

    const prompt = `Actúa como un analista de información experto. Por favor, genera un análisis y resumen sumamente estructurado y detallado del siguiente documento corporativo.
Título del documento: ${doc.title}

Contenido:
${content}

Genera tu respuesta en formato Markdown respetando estrictamente la siguiente estructura de secciones con títulos claros:

# Resumen Ejecutivo
(Un resumen ejecutivo conciso del contenido del documento)

# Puntos Principales
(Lista de los puntos más relevantes del documento)

# Responsabilidades
(Qué personas, departamentos o roles son responsables de qué tareas, si aplica)

# Requisitos
(Requisitos técnicos, de procesos, fechas o condiciones mencionadas)

# Acciones Importantes
(Pasos o acciones clave que se deben tomar según el documento)

# Conclusiones
(Conclusiones finales del documento)`

    const response = await fetch(`${globalConfig.url}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: globalConfig.modelName,
        prompt,
        stream: false
      })
    })

    if (!response.ok) throw new Error("Error en el servidor de Ollama al resumir.")
    const data = await response.json()

    return { success: true, summary: data.response }
  } catch (error: any) {
    console.error("Error en resumen estructurado:", error)
    const errMsg = error.message?.includes("fetch failed")
      ? "No se pudo establecer conexión con el servidor de IA Ollama. Verifica que el servicio esté encendido."
      : (error.message || "Error al generar el resumen estructurado.")
    return { error: errMsg }
  }
}
