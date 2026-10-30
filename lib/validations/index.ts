import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido").toLowerCase().trim(),
  password: z.string().min(1, "La contraseña es requerida")
})

export const userCreateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100).trim(),
  email: z.string().email("Correo inválido").toLowerCase().trim(),
  role: z.enum(["AGENT", "USER", "SUPERVISOR", "TEAM_LEAD", "MANAGER", "HR", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER", "NO_ROLE"])
})

export const userProfileUpdateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100).trim(),
  position: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  extension: z.string().max(20).optional().nullable(),
  aboutMe: z.string().max(1000).optional().nullable(),
  skills: z.string().max(500).optional().nullable(),
  socialLinkedIn: z.string().url("URL de LinkedIn inválida").or(z.literal("")).optional().nullable(),
  socialTeams: z.string().optional().nullable(),
  socialWebsite: z.string().url("URL de sitio web inválida").or(z.literal("")).optional().nullable(),
  showBirthday: z.boolean().default(true)
})

export const postCreateSchema = z.object({
  content: z.string().min(1, "El contenido de la publicación no puede estar vacío").max(5000).trim()
})

export const commentCreateSchema = z.object({
  content: z.string().min(1, "El comentario no puede estar vacío").max(1000).trim(),
  postId: z.string().min(1, "ID de publicación no válido")
})

export const timeOffRequestSchema = z.object({
  type: z.enum([
    "VACATION", "PERMISSION", "EARLY_LEAVE", "LATE_ARRIVAL", "SICK_LEAVE",
    "MEDICAL_LEAVE", "MATERNITY_LEAVE", "PATERNITY_LEAVE",
    "MATERNITY_PATERNITY", "BEREAVEMENT_LEAVE", "MARRIAGE_LEAVE", "HOURS_MAKEUP", "SPECIAL",
    "REMOTE_INTERNET", "REMOTE_POWER", "REMOTE_HARDWARE", "REMOTE_VPN"
  ]),
  startDate: z.string().min(1, "Fecha de inicio es obligatoria"),
  endDate: z.string().min(1, "Fecha final es obligatoria"),
  reason: z.string().min(3, "La razón debe tener al menos 3 caracteres").max(1000).trim()
})

export function sanitizeText(input: string): string {
  if (!input) return ""
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}
