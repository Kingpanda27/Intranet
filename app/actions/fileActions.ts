"use server"

import { writeFile, mkdir } from "fs/promises"
import { join, resolve } from "path"
import { v4 as uuidv4 } from "uuid"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "pdf", "txt", "docx", "xlsx", "csv"])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function saveFile(file: File, folder: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Acceso no autorizado: debes iniciar sesión.")
  }

  if (!file || file.size === 0) return null

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("El archivo excede el tamaño máximo permitido de 10 MB.")
  }

  const rawExtension = file.name.split(".").pop()?.toLowerCase() || ""
  if (!ALLOWED_EXTENSIONS.has(rawExtension)) {
    throw new Error("Extensión de archivo no permitida por políticas de seguridad.")
  }

  // Sanitizar el nombre de carpeta para prevenir Path Traversal en la creación
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "") || "general"
  const fileName = `${uuidv4()}.${rawExtension}`
  
  const baseUploadsDir = resolve(process.cwd(), "public", "uploads")
  const uploadDir = resolve(baseUploadsDir, safeFolder)

  if (!uploadDir.startsWith(baseUploadsDir)) {
    throw new Error("Ruta de destino inválida.")
  }

  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (e) {}

  const filePath = join(uploadDir, fileName)
  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))
  
  return `/api/uploads/${safeFolder}/${fileName}`
}
