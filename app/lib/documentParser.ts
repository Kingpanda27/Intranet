import fs from "fs"
import path from "path"

/**
 * Lee un archivo dada su URL pública y extrae su texto.
 * @param fileNameOrUrl Ejemplo: "/uploads/documents/archivo.pdf"
 * @param maxChars Límite de caracteres para no desbordar el contexto de la IA
 */
export async function extractTextFromDocument(fileNameOrUrl: string, maxChars: number = 2000): Promise<string> {
  try {
    const relativePath = fileNameOrUrl.startsWith("/") ? fileNameOrUrl.substring(1) : fileNameOrUrl
    const publicDir = path.resolve(process.cwd(), "public")
    const filePath = path.resolve(publicDir, relativePath)

    if (!filePath.startsWith(publicDir)) {
      return "[Acceso denegado: Ruta fuera de directorio permitido]"
    }

    if (!fs.existsSync(filePath)) {
      return "[El archivo físico no se encontró]"
    }

    const ext = path.extname(filePath).toLowerCase()

    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath)
      const pdfParse = require("pdf-parse")
      const data = await pdfParse(dataBuffer)
      // Normalizamos saltos de línea y quitamos espacios en exceso
      const cleanText = data.text.replace(/\n+/g, '\n').trim()
      return cleanText.substring(0, maxChars)
    } else if (ext === ".txt" || ext === ".md" || ext === ".csv") {
      const text = fs.readFileSync(filePath, "utf-8")
      return text.substring(0, maxChars)
    } else {
      return `[Formato de archivo no soportado para lectura automática de IA: ${ext}]`
    }
  } catch (error) {
    console.error("Error extrayendo texto del documento:", error)
    return "[Error interno al leer el contenido del archivo]"
  }
}
