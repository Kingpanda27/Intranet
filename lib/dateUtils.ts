/**
 * Utilidades para el formateo de fecha, hora y registros de auditoría en Solicitudes de Vacaciones y Permisos.
 */

/**
 * Retorna fecha formateada en formato largo en español: "28 de julio de 2026".
 * Si no hay fecha o es inválida, retorna "No disponible".
 */
export function formatDateLong(dateInput: Date | string | number | null | undefined, localeStr: string = "es-DO"): string {
  if (!dateInput) return "No disponible"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "No disponible"
  
  return d.toLocaleDateString(localeStr, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santo_Domingo"
  })
}

/**
 * Retorna fecha formateada en formato corto: "28/07/2026".
 * Si no hay fecha o es inválida, retorna "No disponible".
 */
export function formatDateShort(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "No disponible"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "No disponible"

  return d.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Santo_Domingo"
  })
}

/**
 * Retorna hora exacta en formato 12 horas con AM/PM: "4:09 PM".
 * Si no hay fecha o es inválida, retorna "No disponible".
 */
export function formatTime12h(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "No disponible"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "No disponible"

  return d.toLocaleTimeString("es-DO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Santo_Domingo"
  })
}

/**
 * Convierte una hora en formato "HH:mm" (ej: "13:30") a formato 12h con AM/PM (ej: "1:30 p. m.").
 * Totalmente determinista, sin desfase de zona horaria del navegador o servidor.
 */
export function formatTimeStr12h(timeInput?: string | null): string {
  if (!timeInput) return ""
  const str = String(timeInput).trim()
  if (!str) return ""

  // Si viene en formato HH:mm o HH:mm:ss
  const match = str.match(/^(\d{1,2}):(\d{2})/)
  if (match) {
    const h = parseInt(match[1], 10)
    const m = match[2]
    if (!isNaN(h)) {
      const ampm = h >= 12 ? "p. m." : "a. m."
      const h12 = h % 12 || 12
      return `${h12}:${m} ${ampm}`
    }
  }

  // Si viene como fecha ISO completa con 'T'
  if (str.includes("T")) {
    return formatTime12h(str)
  }

  return str
}

/**
 * Retorna texto de creación discreto para el historial: "Creada el 28 de julio de 2026 a las 4:09 PM".
 * Si se incluye creador por nombre, ej: "Creada el 28 de julio de 2026 a las 4:09 PM por Luis Pérez".
 * Si la fecha no está disponible, retorna "Creada: No disponible".
 */
export function formatCreatedInfo(dateInput: Date | string | number | null | undefined, creatorName?: string | null): string {
  if (!dateInput) return "Creada: No disponible"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "Creada: No disponible"

  const dateStr = formatDateLong(d)
  const timeStr = formatTime12h(d)

  let result = `Creada el ${dateStr} a las ${timeStr}`
  if (creatorName && creatorName.trim()) {
    result += ` por ${creatorName.trim()}`
  }
  return result
}

/**
 * Retorna texto corto para auditoría: "28/07/2026 - 4:09 PM".
 */
export function formatDateTimeShort(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "No disponible"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "No disponible"

  return `${formatDateShort(d)} - ${formatTime12h(d)}`
}
