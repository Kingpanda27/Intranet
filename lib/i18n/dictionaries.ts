import es from "@/locales/es.json"
import en from "@/locales/en.json"
import { Locale, TranslationKey } from "./types"

const dictionaries: Record<Locale, any> = {
  es,
  en
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries.es
}

/**
 * Accede a un valor anidado con dot-notation (ej: 'nav.home' o 'vacations.types.EARLY_LEAVE.label')
 * Si no existe en el idioma actual, hace fallback automáticamente al español ('es').
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const keys = key.split(".")
  
  // 1. Intentar resolver en el idioma solicitado
  let current: any = dictionaries[locale]
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = current[k]
    } else {
      current = undefined
      break
    }
  }

  // 2. Si no se encontró y el idioma es distinto a 'es', fallback a español
  if (current === undefined && locale !== "es") {
    current = dictionaries.es
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k]
      } else {
        current = undefined
        break
      }
    }
  }

  // 3. Si aún así no se encuentra, retornar la clave directamente
  if (typeof current !== "string") {
    return String(key)
  }

  let text = current

  // 4. Interpolación de parámetros (ej: {count}, {shown}, {total})
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replaceAll(`{${paramKey}}`, String(paramValue))
    })
  }

  return text
}

