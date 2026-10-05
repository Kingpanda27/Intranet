/**
 * Utilidades para el formateo de fecha, hora y registros de auditoría en Solicitudes de Vacaciones y Permisos.
 */

/**
 * Retorna fecha formateada en formato largo en español: "28 de julio de 2026".
 * Si no hay fecha o es inválida, retorna "No disponible".
 */
export function formatDateLong(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "No disponible"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "No disponible"
  
  return d.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric"
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
    year: "numeric"
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
    hour12: true
  })
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
