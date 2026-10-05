export interface HolidayMetadata {
  id: string
  canonicalName: string
  country: string
  countryCode: "RD" | "US" | "OTHER"
  flag: string
  category: string
  color: string
  description: string
  workImpact: string
  location: string
}

// Catálogo maestro de feriados Dominicanos y Estadounidenses con descripciones históricas y legales completas
export const HOLIDAYS_CATALOG: Record<string, Omit<HolidayMetadata, "id">> = {
  // ── REPUBLICA DOMINICANA 🇩🇴 ──
  rd_ano_nuevo: {
    canonicalName: "Año Nuevo",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Civil No Laborable (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Celebración oficial del inicio del nuevo año civil y familiar. Es un feriado de carácter nacional no laborable e inamovible establecido en el Código de Trabajo de la República Dominicana.",
    workImpact: "Día feriado oficial no laborable. No se deduce de los días de vacaciones reglamentarias del colaborador."
  },
  rd_santos_reyes: {
    canonicalName: "Día de los Santos Reyes",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado No Laborable (Ley 139-97)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Conmemoración tradicional de la Epifanía del Señor y la visita de los Reyes Magos. Es un día de fiesta familiar y entrega de regalos. Sujeto a traslado al lunes más cercano de conformidad con la Ley 139-97 sobre días feriados.",
    workImpact: "Día feriado oficial no laborable por traslado legal. Día libre remunerado que no afecta el balance de vacaciones."
  },
  rd_altagracia: {
    canonicalName: "Día de Nuestra Señora de la Altagracia",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Religioso No Laborable (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Celebración en honor a Nuestra Señora de la Altagracia, protectora y madre espiritual del pueblo dominicano. Feriado religioso de profundo fervor popular e inamovible en todo el territorio nacional.",
    workImpact: "Día feriado oficial no laborable inamovible. No se computa dentro de los días de vacaciones."
  },
  rd_duarte: {
    canonicalName: "Día del Patricio Juan Pablo Duarte",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Fiesta Patria No Laborable (Ley 139-97)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Homenaje al natalicio del Padre de la Patria y fundador de la República Dominicana, Juan Pablo Duarte y Díez (1813). Día de reverencia patria a los valores independentistas y democráticos.",
    workImpact: "Día feriado oficial no laborable (sujeto a traslado según la Ley 139-97). Libre remunerado."
  },
  rd_independencia: {
    canonicalName: "Día de la Independencia Nacional",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Fiesta Patria Magna (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Conmemoración de la proclamación de la Independencia Nacional dominicana el 27 de febrero de 1844 en la Puerta del Conde por los Trinitarios. Es la máxima fiesta patria de la nación e inamovible por mandato constitucional.",
    workImpact: "Fiesta patria nacional inamovible. Día no laborable oficial que no descuenta saldo de vacaciones."
  },
  rd_viernes_santo: {
    canonicalName: "Viernes Santo",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Religioso No Laborable (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Conmemoración solemne de la Pasión, Crucifixión y Muerte de Jesucristo en la Semana Mayor. Feriado religioso solemne de alcance nacional e inamovible.",
    workImpact: "Día no laborable de carácter religioso oficial. No se descuenta de vacaciones."
  },
  rd_trabajo: {
    canonicalName: "Día Internacional del Trabajo",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Internacional No Laborable (Ley 139-97)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Homenaje y reconocimiento a la clase trabajadora mundial y dominicana en conmemoración de las conquistas sociales y laborales. Sujeto a traslado oficial según el Ministerio de Trabajo y la Ley 139-97.",
    workImpact: "Día festivo laboral remunerado. Día libre oficial que no afecta el balance de vacaciones."
  },
  rd_corpus_christi: {
    canonicalName: "Corpus Christi",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Religioso No Laborable (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Solemnidad católica del Santísimo Cuerpo y Sangre de Cristo. Se conmemora el jueves posterior al domingo de la Santísima Trinidad. Feriado religioso oficial inamovible en República Dominicana.",
    workImpact: "Día feriado oficial no laborable. No se computa dentro de las vacaciones solicitadas."
  },
  rd_restauracion: {
    canonicalName: "Día de la Restauración de la República",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Fiesta Patria Magna (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Conmemoración del Grito de Capotillo de 1863 que inició la Guerra de la Restauración, restableciendo la soberanía nacional contra la anexión a España. Feriado patriótico inamovible.",
    workImpact: "Fiesta patria nacional inamovible. Día no laborable oficial."
  },
  rd_mercedes: {
    canonicalName: "Día de Nuestra Señora de las Mercedes",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Religioso No Laborable (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Celebración solemne en honor a la Virgen de las Mercedes, patrona espiritual de la República Dominicana, venerada históricamente en el Santo Cerro de La Vega. Feriado oficial inamovible.",
    workImpact: "Día feriado oficial no laborable. No afecta tus días de vacaciones acumulados."
  },
  rd_constitucion: {
    canonicalName: "Día de la Constitución",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Fiesta Cívico-Patria (Ley 139-97)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Conmemoración de la firma y proclamación de la primera Constitución de la República Dominicana en San Cristóbal el 6 de noviembre de 1844. Se traslada al lunes correspondiente de acuerdo con la Ley 139-97.",
    workImpact: "Día feriado oficial no laborable. No se descuenta de los días de vacaciones."
  },
  rd_navidad: {
    canonicalName: "Día de Navidad",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Religioso y Civil (Inamovible)",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Celebración del nacimiento de Jesucristo. Festividad universal de paz, fraternidad y unión familiar. Feriado oficial no laborable inamovible en todo el país.",
    workImpact: "Día feriado oficial no laborable inamovible."
  },

  // ── ESTADOS UNIDOS 🇺🇸 ──
  us_new_year: {
    canonicalName: "US New Year's Day (Año Nuevo US)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU. (5 U.S.C. 6103)",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Feriado Federal oficial en los Estados Unidos que celebra el inicio del nuevo año civil. Oficinas federales, mercados financieros y entidades corporativas suspenden labores.",
    workImpact: "Feriado Federal estadounidense. Aplica a operaciones y proyectos con clientes y cuentas de EE.UU."
  },
  us_mlk: {
    canonicalName: "US Martin Luther King Jr. Day",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Conmemoración en honor al líder histórico de los derechos civiles Dr. Martin Luther King Jr. Se celebra el tercer lunes de enero como día de reflexión ciudadana, servicio comunitario y no discriminación.",
    workImpact: "Feriado Federal estadounidense. Aplica a cuentas y soporte operativo para EE.UU."
  },
  us_presidents: {
    canonicalName: "US Presidents' Day (Washington's Birthday)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Feriado Federal celebrado el tercer lunes de febrero en conmemoración del natalicio del primer presidente George Washington y en reconocimiento al liderazgo de todos los mandatarios de la nación estadounidense.",
    workImpact: "Feriado Federal estadounidense. Aplica a operaciones y proyectos con clientes de EE.UU."
  },
  us_memorial: {
    canonicalName: "US Memorial Day (Día de los Caídos)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Día de los Caídos. Conmemoración solemne en honor a los hombres y mujeres que dieron su vida en servicio en las Fuerzas Armadas de los Estados Unidos. Se conmemora el último lunes de mayo.",
    workImpact: "Feriado Federal estadounidense. Aplica a operaciones y cuentas asociadas a EE.UU."
  },
  us_juneteenth: {
    canonicalName: "US Juneteenth National Independence Day",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Día de la Emancipación Nacional. Conmemora el 19 de junio de 1865, fecha en que los últimos esclavos en Galveston, Texas, fueron declarados libres tras la Guerra Civil estadounidense.",
    workImpact: "Feriado Federal estadounidense. Feriado oficial para clientes y sedes estadounidenses."
  },
  us_independence: {
    canonicalName: "US Independence Day (Día de la Independencia US)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Fiesta Nacional Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Día de la Independencia de los Estados Unidos de América. Conmemora la adopción formal de la Declaración de Independencia el 4 de julio de 1776, rompiendo los lazos políticos con la Corona Británica.",
    workImpact: "Fiesta nacional oficial en EE.UU. Aplica a cuentas y operaciones con clientes estadounidenses."
  },
  us_labor: {
    canonicalName: "US Labor Day (Día del Trabajo US)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Día del Trabajo en Estados Unidos. Se celebra el primer lunes de septiembre en tributo y honor a las contribuciones de los trabajadores a la fuerza, prosperidad y bienestar de la nación.",
    workImpact: "Feriado Federal estadounidense. Aplica a servicios y horarios vinculados con EE.UU."
  },
  us_columbus: {
    canonicalName: "US Columbus Day / Indigenous Peoples' Day",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Celebrado el segundo lunes de octubre. Conmemora la llegada de Cristóbal Colón a América y honra la historia, cultura y resiliencia de los pueblos indígenas americanos.",
    workImpact: "Feriado Federal estadounidense. Feriado en mercados y entidades de EE.UU."
  },
  us_veterans: {
    canonicalName: "US Veterans Day (Día de los Veteranos)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Día de los Veteranos. Feriado Federal oficial conmemorado anualmente el 11 de noviembre en honor y gratitud a todos los veteranos que han servido con patriotismo en las Fuerzas Armadas de los Estados Unidos.",
    workImpact: "Feriado Federal estadounidense. Aplica para clientes, cuentas y operaciones de EE.UU."
  },
  us_thanksgiving: {
    canonicalName: "US Thanksgiving Day (Día de Acción de Gracias)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Día de Acción de Gracias. Tradición nacional estadounidense celebrada el cuarto jueves de noviembre dedicada a dar gracias por las bendiciones, cosechas y la unión comunitaria y familiar.",
    workImpact: "Feriado Federal estadounidense mayor. Aplica a cuentas y soporte operativo para EE.UU."
  },
  us_christmas: {
    canonicalName: "US Christmas Day (Navidad US)",
    country: "Estados Unidos",
    countryCode: "US",
    flag: "🇺🇸",
    category: "Feriado Federal en EE.UU.",
    color: "#3b82f6",
    location: "Estados Unidos (EE.UU.)",
    description: "Celebración de la Navidad en los Estados Unidos. Feriado Federal oficial en todo el país que conmemora la festividad civil y religiosa del 25 de diciembre.",
    workImpact: "Feriado Federal estadounidense. Libre en todas las operaciones vinculadas a EE.UU."
  }
}

/**
 * Normaliza y obtiene metadatos enriquecidos de un feriado a partir de su título o nombre.
 */
export function getHolidayMetadata(title: string, date?: Date | string): HolidayMetadata {
  const t = (title || "").toLowerCase().trim()
  
  // Detección de Feriados de Estados Unidos
  const isUS = 
    title.includes("🇺🇸") || 
    t.includes("us ") || 
    t.includes("estados unidos") || 
    t.includes("ee.uu") || 
    t.includes("veterans") || 
    t.includes("thanksgiving") || 
    t.includes("acción de gracias") || 
    t.includes("martin luther") || 
    t.includes("presidents") || 
    t.includes("memorial day") || 
    t.includes("juneteenth") || 
    (t.includes("labor day") && (t.includes("us") || t.includes("ee.uu"))) ||
    (t.includes("columbus") || t.includes("indigenous"))

  if (isUS) {
    if (t.includes("veteran")) return { id: "us_veterans", ...HOLIDAYS_CATALOG.us_veterans }
    if (t.includes("thanksgiving") || t.includes("gracias")) return { id: "us_thanksgiving", ...HOLIDAYS_CATALOG.us_thanksgiving }
    if (t.includes("martin") || t.includes("mlk")) return { id: "us_mlk", ...HOLIDAYS_CATALOG.us_mlk }
    if (t.includes("president") || t.includes("washington")) return { id: "us_presidents", ...HOLIDAYS_CATALOG.us_presidents }
    if (t.includes("memorial") || t.includes("caídos")) return { id: "us_memorial", ...HOLIDAYS_CATALOG.us_memorial }
    if (t.includes("juneteenth") || t.includes("emancipaci")) return { id: "us_juneteenth", ...HOLIDAYS_CATALOG.us_juneteenth }
    if (t.includes("independen") || t.includes("4th")) return { id: "us_independence", ...HOLIDAYS_CATALOG.us_independence }
    if (t.includes("labor") || t.includes("trabajo")) return { id: "us_labor", ...HOLIDAYS_CATALOG.us_labor }
    if (t.includes("columbus") || t.includes("indigenous")) return { id: "us_columbus", ...HOLIDAYS_CATALOG.us_columbus }
    if (t.includes("navidad") || t.includes("christmas")) return { id: "us_christmas", ...HOLIDAYS_CATALOG.us_christmas }
    if (t.includes("año nuevo") || t.includes("new year")) return { id: "us_new_year", ...HOLIDAYS_CATALOG.us_new_year }

    return {
      id: "us_generic",
      canonicalName: title.replace(/^[🇺🇸\s]+/, '').trim() || "Feriado Federal EE.UU.",
      country: "Estados Unidos",
      countryCode: "US",
      flag: "🇺🇸",
      category: "Feriado Federal en EE.UU.",
      color: "#3b82f6",
      location: "Estados Unidos (EE.UU.)",
      description: "Feriado Federal en EE.UU.",
      workImpact: "Aplica según política operativa para cuentas estadounidenses."
    }
  }

  // Detección de Feriados de República Dominicana
  if (t.includes("constituci")) return { id: "rd_constitucion", ...HOLIDAYS_CATALOG.rd_constitucion }
  if (t.includes("altagracia")) return { id: "rd_altagracia", ...HOLIDAYS_CATALOG.rd_altagracia }
  if (t.includes("duarte")) return { id: "rd_duarte", ...HOLIDAYS_CATALOG.rd_duarte }
  if (t.includes("reyes")) return { id: "rd_santos_reyes", ...HOLIDAYS_CATALOG.rd_santos_reyes }
  if (t.includes("independencia")) return { id: "rd_independencia", ...HOLIDAYS_CATALOG.rd_independencia }
  if (t.includes("viernes santo") || t.includes("semana santa")) return { id: "rd_viernes_santo", ...HOLIDAYS_CATALOG.rd_viernes_santo }
  if (t.includes("trabajo") || t.includes("labor")) return { id: "rd_trabajo", ...HOLIDAYS_CATALOG.rd_trabajo }
  if (t.includes("corpus")) return { id: "rd_corpus_christi", ...HOLIDAYS_CATALOG.rd_corpus_christi }
  if (t.includes("restauraci")) return { id: "rd_restauracion", ...HOLIDAYS_CATALOG.rd_restauracion }
  if (t.includes("mercedes")) return { id: "rd_mercedes", ...HOLIDAYS_CATALOG.rd_mercedes }
  if (t.includes("navidad") || t.includes("nochebuena")) return { id: "rd_navidad", ...HOLIDAYS_CATALOG.rd_navidad }
  if (t.includes("año nuevo")) return { id: "rd_ano_nuevo", ...HOLIDAYS_CATALOG.rd_ano_nuevo }

  // Feriado personalizado o no catalogado
  return {
    id: "rd_generic",
    canonicalName: title.replace(/^[🇩🇴\s]+/, '').trim() || "Feriado Oficial",
    country: "República Dominicana",
    countryCode: "RD",
    flag: "🇩🇴",
    category: "Feriado Oficial No Laborable",
    color: "#ef4444",
    location: "República Dominicana",
    description: "Feriado oficial no laborable establecido en el calendario corporativo.",
    workImpact: "Día libre no laborable oficial. No descuenta del saldo de vacaciones."
  }
}

/**
 * Extrae la fecha normalizada YYYY-MM-DD garantizando que no haya desfasaje de zona horaria
 */
export function getNormalizedDateKey(dateInput: Date | string): string {
  if (!dateInput) return ""
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) return `${match[1]}-${match[2]}-${match[3]}`
  }
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ""
  
  // Extraer año, mes y día
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Función centralizada para deduplicar feriados de cualquier origen (Holiday table, CalendarEvent, o arrays locales).
 * Asegura que ningún feriado se repita el mismo día para el mismo país/motivo.
 */
export function deduplicateHolidays<T extends { 
  id?: string
  title?: string
  name?: string
  date?: Date | string
  startDate?: Date | string
  endDate?: Date | string
  description?: string | null
  color?: string | null
  location?: string | null
}>(holidays: T[]): T[] {
  if (!Array.isArray(holidays)) return []

  const dedupMap = new Map<string, T>()

  for (const item of holidays) {
    const rawTitle = item.title || item.name || ""
    const rawDate = item.startDate || item.date
    if (!rawTitle || !rawDate) continue

    const dateKey = getNormalizedDateKey(rawDate)
    const meta = getHolidayMetadata(rawTitle, rawDate)

    // Clave de unicidad estricta: fecha (YYYY-MM-DD) + país (RD/US) + identificador del feriado
    const uniqueKey = `${dateKey}_${meta.countryCode}_${meta.id}`

    if (!dedupMap.has(uniqueKey)) {
      // Formatear el título enriquecido con su bandera si aún no la tiene
      const hasFlag = rawTitle.includes("🇩🇴") || rawTitle.includes("🇺🇸")
      const formattedTitle = hasFlag ? rawTitle : `${meta.flag} ${rawTitle}`

      dedupMap.set(uniqueKey, {
        ...item,
        title: formattedTitle,
        name: formattedTitle,
        description: item.description || meta.description,
        color: item.color || meta.color,
        location: item.location || meta.location,
        country: meta.country,
        countryCode: meta.countryCode,
        flag: meta.flag,
        category: meta.category,
        workImpact: meta.workImpact
      } as T)
    } else {
      // Si ya existe, conservar o fusionar con la que tenga mejor información
      const existing = dedupMap.get(uniqueKey)!
      if (!existing.description && item.description) {
        existing.description = item.description
      }
      if (!existing.location && item.location) {
        existing.location = item.location
      }
      if (!existing.color && item.color) {
        existing.color = item.color
      }
    }
  }

  // Ordenar cronológicamente
  return Array.from(dedupMap.values()).sort((a, b) => {
    const dateA = new Date(a.startDate || a.date || 0).getTime()
    const dateB = new Date(b.startDate || b.date || 0).getTime()
    return dateA - dateB
  })
}
