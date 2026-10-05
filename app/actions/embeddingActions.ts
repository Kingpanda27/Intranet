"use server"

import { prisma } from "@/lib/prisma"
import { extractTextFromDocument } from "@/app/lib/documentParser"
import { getOllamaConfigs } from "./ollamaActions"

// Chunks text into roughly similar sized pieces
function chunkText(text: string, maxCharLength = 1500) {
  const chunks = []
  let currentIndex = 0
  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxCharLength
    if (endIndex < text.length) {
      // Try to find a natural break (period, newline)
      let breakIndex = text.lastIndexOf('\n', endIndex)
      if (breakIndex > currentIndex) {
        endIndex = breakIndex
      } else {
        breakIndex = text.lastIndexOf('.', endIndex)
        if (breakIndex > currentIndex) {
          endIndex = breakIndex + 1
        }
      }
    }
    chunks.push(text.substring(currentIndex, endIndex).trim())
    currentIndex = endIndex
  }
  return chunks.filter(c => c.length > 50)
}

// Generate embedding using Ollama
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const configs = await getOllamaConfigs()
    const globalConfig = configs.find(c => c.isGlobal) || configs[0]
    if (!globalConfig) return null

    const response = await fetch(`${globalConfig.url}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: globalConfig.modelName,
        prompt: text
      })
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.embedding as number[]
  } catch (error) {
    console.error("Error generating embedding:", error)
    return null
  }
}

// Extract, chunk, embed, and save to DB
export async function processDocumentEmbeddings(documentId: string, url: string) {
  try {
    const text = await extractTextFromDocument(url, 20000) // increase max length to 20k chars
    if (!text) return

    const chunks = chunkText(text)
    
    // Process sequentially to not overload Ollama
    for (const chunk of chunks) {
      const vector = await generateEmbedding(chunk)
      if (vector) {
        await (prisma as any).documentEmbedding.create({
          data: {
            documentId,
            content: chunk,
            vector: JSON.stringify(vector)
          }
        })
      }
    }
  } catch (error) {
    console.error("Error processing document embeddings:", error)
  }
}

// Perform semantic search over document embeddings
export async function semanticSearch(query: string, topK: number = 3) {
  try {
    const queryVector = await generateEmbedding(query)
    if (!queryVector) return []

    // Fetch all embeddings (this is ok for a small intranet, but for large ones we'd use a vector DB)
    const allEmbeddings = await (prisma as any).documentEmbedding.findMany({
      include: { document: true }
    })

    const cosineSimilarity = require('cosine-similarity')
    
    const scored = allEmbeddings.map((emb: any) => {
      const vec = JSON.parse(emb.vector)
      const score = cosineSimilarity(queryVector, vec)
      return { ...emb, score }
    })

    // Sort by descending score
    scored.sort((a: any, b: any) => b.score - a.score)

    return scored.slice(0, topK)
  } catch (error) {
    console.error("Semantic search error:", error)
    return []
  }
}
