import { mkdir, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { resolve } from "path"
import { v4 as uuidv4 } from "uuid"

export const BASE_PRIVATE_STORAGE_DIR = resolve(
  process.env.PRIVATE_STORAGE_PATH || "/home/storage/private-uploads"
)
export const FALLBACK_PRIVATE_STORAGE_DIR = resolve(
  process.cwd(),
  "storage",
  "private-uploads"
)
export const LEGACY_UPLOADS_DIR = resolve(process.cwd(), "public", "uploads")

export type AllowedMimeType =
  | "application/pdf"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "application/vnd.ms-outlook"

export interface FileValidationResult {
  valid: boolean
  mimeType?: AllowedMimeType
  extension?: "pdf" | "png" | "jpg" | "webp" | "msg"
  error?: string
}

/**
 * Validación criptográfica y estructural de Magic Bytes para adjuntos sensibles.
 * Solo se admiten archivos genuinos de tipo PDF, PNG, JPG/JPEG, WEBP y MSG (Outlook OLE CFB).
 */
export function validateMagicBytes(buffer: Buffer): FileValidationResult {
  if (!buffer || buffer.length < 4) {
    return { valid: false, error: "El archivo adjunto está vacío o corrupto." }
  }

  // 1. PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D) dentro de los primeros 1024 bytes (ISO 32000-1)
  const headerSlice = buffer.subarray(0, Math.min(buffer.length, 1024))
  const pdfHeaderIndex = headerSlice.indexOf(Buffer.from("%PDF-"))
  if (pdfHeaderIndex !== -1) {
    return { valid: true, mimeType: "application/pdf", extension: "pdf" }
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { valid: true, mimeType: "image/png", extension: "png" }
  }

  // 3. JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xFF &&
    buffer[1] === 0xD8 &&
    buffer[2] === 0xFF
  ) {
    return { valid: true, mimeType: "image/jpeg", extension: "jpg" }
  }

  // 4. WEBP: RIFF at 0..3 y WEBP at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, mimeType: "image/webp", extension: "webp" }
  }

  // 5. MSG (Outlook OLE CFB): D0 CF 11 E0 A1 B1 1A E1
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xD0 &&
    buffer[1] === 0xCF &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xE0 &&
    buffer[4] === 0xA1 &&
    buffer[5] === 0xB1 &&
    buffer[6] === 0x1A &&
    buffer[7] === 0xE1
  ) {
    return { valid: true, mimeType: "application/vnd.ms-outlook", extension: "msg" }
  }

  return {
    valid: false,
    error: "Formato de archivo inválido. Solo se admiten archivos genuinos en formato PDF, PNG, JPG, WEBP o MSG."
  }
}

export interface SavedPrivateFile {
  relativePath: string
  fileName: string
  originalName: string
  mimeType: AllowedMimeType
  size: number
}

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024 // 25 MB

/**
 * Guarda un archivo sensible en el almacenamiento privado fuera de public/
 * (por defecto en /home/storage/private-uploads/medical/) aplicando sanitización de nombres con UUID
 * y prevención estricta de Path Traversal.
 */
export async function savePrivateAttachment(
  file: File,
  subfolder: string = "medical"
): Promise<SavedPrivateFile> {
  if (!file || file.size === 0) {
    throw new Error("No se ha proporcionado ningún archivo para almacenar.")
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("El archivo excede el tamaño máximo permitido de 15 MB.")
  }

  const rawBytes = await file.arrayBuffer()
  const buffer = Buffer.from(rawBytes)

  // Validación de Magic Bytes
  const validation = validateMagicBytes(buffer)
  if (!validation.valid || !validation.mimeType || !validation.extension) {
    throw new Error(validation.error || "Tipo de archivo no admitido.")
  }

  // Sanitización de carpeta y protección Path Traversal
  const safeSubfolder = subfolder.replace(/[^a-zA-Z0-9_-]/g, "") || "medical"
  const targetFolder = resolve(BASE_PRIVATE_STORAGE_DIR, safeSubfolder)

  if (!targetFolder.startsWith(BASE_PRIVATE_STORAGE_DIR)) {
    throw new Error("Ruta de destino inválida por violación de seguridad (Path Traversal detectado).")
  }

  await mkdir(targetFolder, { recursive: true })

  // Nombre único con UUID v4 y extensión validada
  const safeFileName = `${uuidv4()}.${validation.extension}`
  const targetFilePath = resolve(targetFolder, safeFileName)

  if (!targetFilePath.startsWith(targetFolder)) {
    throw new Error("Ruta de archivo no autorizada.")
  }

  await writeFile(targetFilePath, buffer)

  // Retornamos la ruta relativa interna para almacenar en la base de datos (nunca una URL pública)
  const relativePath = `${safeSubfolder}/${safeFileName}`

  return {
    relativePath,
    fileName: safeFileName,
    originalName: file.name,
    mimeType: validation.mimeType,
    size: file.size
  }
}

export interface ResolvedAttachmentFile {
  fullPath: string
  mimeType: string
  exists: boolean
  isLegacy: boolean
}

/**
 * Resuelve la ruta física en disco de un adjunto a partir del valor almacenado en documentUrl.
 * Soporta /home/storage/private-uploads/, la ruta previa storage/private-uploads/ dentro del proyecto
 * y compatibilidad hacia atrás con registros antiguos en public/uploads/
 */
export function resolveAttachmentPath(documentUrl: string): ResolvedAttachmentFile {
  if (!documentUrl) {
    return { fullPath: "", mimeType: "application/octet-stream", exists: false, isLegacy: false }
  }

  const cleaned = documentUrl.replace(/\\/g, "/").trim()

  // 1. Compatibilidad con URLs antiguas /api/uploads/... o /uploads/...
  if (cleaned.startsWith("/api/uploads/")) {
    const subpath = cleaned.replace(/^\/api\/uploads\//, "")
    const fullPath = resolve(LEGACY_UPLOADS_DIR, subpath)
    if (fullPath.startsWith(LEGACY_UPLOADS_DIR) && existsSync(fullPath)) {
      return {
        fullPath,
        mimeType: getMimeTypeFromPath(fullPath),
        exists: true,
        isLegacy: true
      }
    }
  }

  if (cleaned.startsWith("/uploads/")) {
    const subpath = cleaned.replace(/^\/uploads\//, "")
    const fullPath = resolve(LEGACY_UPLOADS_DIR, subpath)
    if (fullPath.startsWith(LEGACY_UPLOADS_DIR) && existsSync(fullPath)) {
      return {
        fullPath,
        mimeType: getMimeTypeFromPath(fullPath),
        exists: true,
        isLegacy: true
      }
    }
  }

  // Normalizar ruta quitando barras iniciales
  let normalizedRelative = cleaned.replace(/^\/+/, "")

  // Si documentUrl contenía la ruta absoluta o el prefijo de storage
  if (normalizedRelative.startsWith("home/storage/private-uploads/")) {
    normalizedRelative = normalizedRelative.replace(/^home\/storage\/private-uploads\//, "")
  } else if (normalizedRelative.startsWith("storage/private-uploads/")) {
    normalizedRelative = normalizedRelative.replace(/^storage\/private-uploads\//, "")
  }

  // 2. Ruta privada principal en /home/storage/private-uploads/
  const primaryFullPath = resolve(BASE_PRIVATE_STORAGE_DIR, normalizedRelative)
  if (primaryFullPath.startsWith(BASE_PRIVATE_STORAGE_DIR) && existsSync(primaryFullPath)) {
    return {
      fullPath: primaryFullPath,
      mimeType: getMimeTypeFromPath(primaryFullPath),
      exists: true,
      isLegacy: false
    }
  }

  // 3. Fallback a la ruta previa en el directorio de la app (storage/private-uploads/)
  const fallbackFullPath = resolve(FALLBACK_PRIVATE_STORAGE_DIR, normalizedRelative)
  if (fallbackFullPath.startsWith(FALLBACK_PRIVATE_STORAGE_DIR) && existsSync(fallbackFullPath)) {
    return {
      fullPath: fallbackFullPath,
      mimeType: getMimeTypeFromPath(fallbackFullPath),
      exists: true,
      isLegacy: false
    }
  }

  // 4. Fallback en public/uploads si el registro legacy guardó solo la ruta relativa
  const legacyFallback = resolve(LEGACY_UPLOADS_DIR, normalizedRelative)
  if (legacyFallback.startsWith(LEGACY_UPLOADS_DIR) && existsSync(legacyFallback)) {
    return {
      fullPath: legacyFallback,
      mimeType: getMimeTypeFromPath(legacyFallback),
      exists: true,
      isLegacy: true
    }
  }

  return {
    fullPath: primaryFullPath,
    mimeType: getMimeTypeFromPath(primaryFullPath),
    exists: false,
    isLegacy: false
  }
}

export function getMimeTypeFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || ""
  switch (ext) {
    case "pdf":
      return "application/pdf"
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "webp":
      return "image/webp"
    case "msg":
      return "application/vnd.ms-outlook"
    default:
      return "application/octet-stream"
  }
}
