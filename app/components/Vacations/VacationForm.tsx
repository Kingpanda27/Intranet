"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  Send, 
  CalendarDays, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  AlarmClock,
  Stethoscope,
  HeartPulse,
  Baby,
  HeartHandshake,
  UploadCloud,
  Trash2,
  FileText,
  Mail,
  Paperclip,
  Heart,
  Users,
  UserCheck,
  Search,
  X,
  WifiOff,
  ZapOff,
  Laptop,
  ShieldAlert,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Check,
  Info
} from "lucide-react"
import { createTimeOffRequest } from "@/app/actions/timeOffActions"
import { useTheme } from "@/app/Providers"
import { MIN_VACATION_DAYS } from "@/lib/vacationPolicy"
import { useTranslation } from "@/lib/i18n/LanguageContext"

export type CategoryId = "ALL" | "LEAVE" | "HEALTH_FAMILY" | "REMOTE_IT"

export interface CategoryTab {
  id: CategoryId
  label: string
  badge?: string
}

export const CATEGORIES: CategoryTab[] = [
  { id: "ALL", label: "Todas" },
  { id: "LEAVE", label: "Tiempo Libre" },
  { id: "HEALTH_FAMILY", label: "Salud y Familia" },
  { id: "REMOTE_IT", label: "Incidencias Remoto / IT" }
]

export interface RequestTypeItem {
  id: string
  label: string
  sub: string
  color: string
  category: "LEAVE" | "HEALTH_FAMILY" | "REMOTE_IT"
  icon: any
  isFrequent: boolean
  frequentOrder: number
  remoteContextLabel?: string
  remoteContextPlaceholder?: string
  hasHardwareReviewToggle?: boolean
}

export const REQUEST_TYPES: RequestTypeItem[] = [
  // 1. Vacaciones - Azul eléctrico (#3b82f6)
  {
    id: "VACATION",
    label: "Vacaciones",
    sub: "Días libres anuales remunerados",
    color: "#3b82f6",
    category: "LEAVE",
    icon: CalendarDays,
    isFrequent: true,
    frequentOrder: 1
  },
  // 2. Permiso Especial - Índigo (#6366f1)
  {
    id: "PERMISSION",
    label: "Permiso Especial",
    sub: "Causas justificadas por horas o día",
    color: "#6366f1",
    category: "LEAVE",
    icon: CheckCircle,
    isFrequent: true,
    frequentOrder: 2
  },
  // 3. Salir Temprano - Ámbar (#f59e0b)
  {
    id: "EARLY_LEAVE",
    label: "Salir Temprano",
    sub: "Horas específicas de salida anticipada",
    color: "#f59e0b",
    category: "LEAVE",
    icon: Clock,
    isFrequent: true,
    frequentOrder: 3
  },
  // 4. Llegar Tarde - Naranja (#f97316)
  {
    id: "LATE_ARRIVAL",
    label: "Llegar Tarde",
    sub: "Retraso justificado en la hora de entrada",
    color: "#f97316",
    category: "LEAVE",
    icon: AlarmClock,
    isFrequent: true,
    frequentOrder: 4
  },
  // 5. Reposición de Horas - Turquesa / Teal (#14b8a6)
  {
    id: "HOURS_MAKEUP",
    label: "Reposición de Horas",
    sub: "Recuperar tiempo ausente previamente",
    color: "#14b8a6",
    category: "LEAVE",
    icon: RotateCcw,
    isFrequent: true,
    frequentOrder: 5
  },
  // 5. Enfermedad (corta) - Esmeralda (#10b981)
  {
    id: "SICK_LEAVE",
    label: "Enfermedad (corta)",
    sub: "Afección médica o reposo breve",
    color: "#10b981",
    category: "HEALTH_FAMILY",
    icon: Stethoscope,
    isFrequent: true,
    frequentOrder: 5
  },
  // 6. Falla de Internet - Naranja advertencia (#f97316)
  {
    id: "REMOTE_INTERNET",
    label: "Falla de Internet",
    sub: "Caída o fallo de conexión local de red",
    color: "#f97316",
    category: "REMOTE_IT",
    icon: WifiOff,
    isFrequent: true,
    frequentOrder: 6,
    remoteContextLabel: "Proveedor de Internet (ISP) *",
    remoteContextPlaceholder: "Ej: Claro Dominicana, Altice, Starlink, etc."
  },
  // 7. Licencia Médica Oficial - Rosa / Carmesí (#f43f5e)
  {
    id: "MEDICAL_LEAVE",
    label: "Licencia Médica Oficial",
    sub: "Incapacidad médica formal certificada",
    color: "#f43f5e",
    category: "HEALTH_FAMILY",
    icon: HeartPulse,
    isFrequent: false,
    frequentOrder: 7
  },
  // 8. Maternidad / Paternidad - Fucsia (#ec4899)
  {
    id: "MATERNITY_PATERNITY",
    label: "Maternidad / Paternidad",
    sub: "Pre/post natal o nacimiento familiar",
    color: "#ec4899",
    category: "HEALTH_FAMILY",
    icon: Baby,
    isFrequent: false,
    frequentOrder: 8
  },
  // 9. Fallecimiento / Duelo - Violeta / Púrpura suave (#8b5cf6)
  {
    id: "BEREAVEMENT_LEAVE",
    label: "Fallecimiento / Duelo",
    sub: "Duelo familiar de primer/segundo grado",
    color: "#8b5cf6",
    category: "HEALTH_FAMILY",
    icon: HeartHandshake,
    isFrequent: false,
    frequentOrder: 9
  },
  // 10. Licencia por Matrimonio - Rosa Rubí (#e11d48)
  {
    id: "MARRIAGE_LEAVE",
    label: "Licencia por Matrimonio",
    sub: "5 días laborables remunerados (Art. 54 Ley 16-92)",
    color: "#e11d48",
    category: "HEALTH_FAMILY",
    icon: Heart,
    isFrequent: false,
    frequentOrder: 10
  },
  // 10. Corte de Energía Eléctrica - Amarillo relámpago (#eab308)
  {
    id: "REMOTE_POWER",
    label: "Corte de Energía Eléctrica",
    sub: "Interrupción de suministro o baterías",
    color: "#eab308",
    category: "REMOTE_IT",
    icon: ZapOff,
    isFrequent: false,
    frequentOrder: 10,
    remoteContextLabel: "Empresa Distribuidora Eléctrica *",
    remoteContextPlaceholder: "Ej: Edeeste, Edesur, Edenorte, falla en inversor..."
  },
  // 11. Avería de Hardware / PC - Rojo alerta (#ef4444)
  {
    id: "REMOTE_HARDWARE",
    label: "Avería de Hardware / PC",
    sub: "Fallo físico de computadora o periféricos",
    color: "#ef4444",
    category: "REMOTE_IT",
    icon: Laptop,
    isFrequent: false,
    frequentOrder: 11,
    remoteContextLabel: "Componente o Dispositivo Afectado *",
    remoteContextPlaceholder: "Ej: Laptop no enciende, cargador dañado, monitor...",
    hasHardwareReviewToggle: true
  },
  // 12. Fallo de VPN / Accesos - Púrpura eléctrico (#a855f7)
  {
    id: "REMOTE_VPN",
    label: "Fallo de VPN / Accesos",
    sub: "Bloqueo de túnel VPN, MFA o cuentas",
    color: "#a855f7",
    category: "REMOTE_IT",
    icon: ShieldAlert,
    isFrequent: false,
    frequentOrder: 12,
    remoteContextLabel: "Herramienta o Acceso Afectado *",
    remoteContextPlaceholder: "Ej: FortiClient VPN, credenciales de dominio, Intranet..."
  }
]

const DOCUMENT_GUIDELINES: Record<string, string[]> = {
  SICK_LEAVE: ["Certificado médico", "Incapacidad médica", "Constancia médica"],
  MEDICAL_LEAVE: ["Certificado médico", "Incapacidad médica", "Licencia médica oficial"],
  MATERNITY_PATERNITY: ["Certificado de maternidad", "Acta de nacimiento", "Certificación hospitalaria"],
  MATERNITY_LEAVE: ["Certificado médico", "Documento de maternidad emitido por el centro médico"],
  PATERNITY_LEAVE: ["Acta de nacimiento", "Certificación hospitalaria", "Documento justificativo correspondiente"],
  BEREAVEMENT_LEAVE: ["Acta de defunción", "Documento justificativo emitido por autoridad competente"],
  MARRIAGE_LEAVE: [
    "Acta o Certificado de Matrimonio Civil (Oficialía del Estado Civil)",
    "Constancia oficial de matrimonio debidamente celebrado",
    "Comprobante o certificado emitido por la autoridad civil competente"
  ]
}

const DOCUMENT_GUIDELINES_EN: Record<string, string[]> = {
  SICK_LEAVE: ["Medical certificate", "Medical disability note", "Doctor's note"],
  MEDICAL_LEAVE: ["Medical certificate", "Medical disability proof", "Official medical leave notice"],
  MATERNITY_PATERNITY: ["Maternity certificate", "Birth certificate", "Hospital certification"],
  MATERNITY_LEAVE: ["Medical certificate", "Maternity document issued by medical clinic"],
  PATERNITY_LEAVE: ["Birth certificate", "Hospital certification", "Official statutory justification"],
  BEREAVEMENT_LEAVE: ["Death certificate", "Official justification issued by competent authority"],
  MARRIAGE_LEAVE: [
    "Civil Marriage Certificate (Civil Registry Office)",
    "Official proof of legally solemnized civil marriage",
    "Marriage record issued by competent civil authority"
  ]
}

export interface EmployeeOption {
  id: string
  name: string | null
  email: string | null
  vacationBalance: number
  project?: { name: string } | null
}

const getInitialIncidentDateTime = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day}T${h}:${min}`
}

export function VacationForm({ 
  projectName, 
  balance, 
  holidays = [],
  canCreateForOthers = false,
  employees = []
}: { 
  projectName?: string
  balance: number
  holidays: string[]
  canCreateForOthers?: boolean
  employees?: EmployeeOption[]
}) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { t, locale } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  
  // Categoría activa y estado colapsable
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("ALL")
  const [isExpanded, setIsExpanded] = useState(false)

  // Tipo de solicitud activa
  const [requestType, setRequestType] = useState<string>("VACATION")
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)

  // Fechas y horas estándar
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [leaveTime, setLeaveTime] = useState("")
  const [arrivalTime, setArrivalTime] = useState("")
  const [isPreApproved, setIsPreApproved] = useState(false)

  // Permisos especiales por horas
  const [specialType, setSpecialType] = useState<string>("HOURS")
  const [exitTime, setExitTime] = useState("")
  const [returnTime, setReturnTime] = useState("")
  const [hoursRequested, setHoursRequested] = useState("")

  // Reposición de horas
  const [absenceDate, setAbsenceDate] = useState("")
  const [hoursToMakeUp, setHoursToMakeUp] = useState("")
  const [makeupDate, setMakeupDate] = useState("")
  const [makeupStartTime, setMakeupStartTime] = useState("")
  const [makeupEndTime, setMakeupEndTime] = useState("")

  // Incidencias de Teletrabajo / IT
  const [incidentDate, setIncidentDate] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  })
  const [incidentStartTime, setIncidentStartTime] = useState("")
  const [incidentEndTime, setIncidentEndTime] = useState("")
  const [incidentExactHours, setIncidentExactHours] = useState("")
  const [incidentContext, setIncidentContext] = useState("")
  const [incidentNeedsItReview, setIncidentNeedsItReview] = useState(false)
  
  // Solicitar en nombre de equipo / colaboradores (para Managers/Supervisores)
  const [onBehalf, setOnBehalf] = useState(false)
  const [selectionMethod, setSelectionMethod] = useState<"GROUP" | "INDIVIDUAL">("GROUP")
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [isExceptionListOpen, setIsExceptionListOpen] = useState(false)
  const [showMassConfirmModal, setShowMassConfirmModal] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [autoApprove, setAutoApprove] = useState(true)
  const [affectsBonus, setAffectsBonus] = useState(false)

  // Búsqueda autocompletada de empleados
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const employeeDropdownRef = useRef<HTMLDivElement>(null)

  // Subida de archivos
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedEmployee = selectedEmployeeIds.length === 1 
    ? employees.find(e => e.id === selectedEmployeeIds[0]) 
    : null
  const effectiveBalance = (onBehalf && selectedEmployee) ? selectedEmployee.vacationBalance : balance

  // Identificar si la tarjeta seleccionada es de Incidencia Remota
  const activeTypeItem = REQUEST_TYPES.find(t => t.id === requestType) || REQUEST_TYPES[0]
  const isRemoteIncident = activeTypeItem.category === "REMOTE_IT"

  // Auto-calcular cantidad de horas al cambiar HORA INICIO u HORA FINAL en permisos especiales
  useEffect(() => {
    if (requestType === "PERMISSION" && exitTime && returnTime) {
      const [startH, startM] = exitTime.split(':').map(Number)
      const [endH, endM] = returnTime.split(':').map(Number)
      
      let startMinutes = startH * 60 + startM
      let endMinutes = endH * 60 + endM
      
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60
      }
      
      const diffMinutes = endMinutes - startMinutes
      const hours = Math.round((diffMinutes / 60) * 10) / 10
      setHoursRequested(hours > 0 ? String(hours) : "0")
    }
  }, [exitTime, returnTime, requestType])

  // Auto-calcular cantidad de horas exactas para incidencias de teletrabajo
  useEffect(() => {
    if (incidentStartTime && incidentEndTime) {
      const [startH, startM] = incidentStartTime.split(':').map(Number)
      const [endH, endM] = incidentEndTime.split(':').map(Number)
      
      let startMinutes = startH * 60 + startM
      let endMinutes = endH * 60 + endM
      
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60
      }
      
      const diffMinutes = endMinutes - startMinutes
      const hours = Math.round((diffMinutes / 60) * 10) / 10
      const hrs = Math.floor(diffMinutes / 60)
      const mins = diffMinutes % 60
      
      let label = ""
      if (hrs > 0 && mins > 0) {
        label = `${hrs}h ${mins}m (${hours} hrs)`
      } else if (hrs > 0) {
        label = `${hrs} hr${hrs > 1 ? 's' : ''}`
      } else {
        label = `${mins} min`
      }
      
      setIncidentExactHours(diffMinutes > 0 ? label : "--")
    } else {
      setIncidentExactHours("")
    }
  }, [incidentStartTime, incidentEndTime])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fecha actual dinámica del sistema y regla de 25 días de anticipación
  const now = new Date()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const minVacationNoticeDate = new Date(todayDate)
  minVacationNoticeDate.setDate(todayDate.getDate() + 25)
  
  const formatYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const minVacationNoticeStr = formatYMD(minVacationNoticeDate)

  let isVacationNoticeInsufficient = false
  if (requestType === "VACATION" && !onBehalf && startDate) {
    const [sY, sM, sD] = startDate.split('-').map(Number)
    const selectedStart = new Date(sY, sM - 1, sD)
    if (selectedStart < minVacationNoticeDate) {
      isVacationNoticeInsufficient = true
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const nameMatch = emp.name?.toLowerCase().includes(term)
    const emailMatch = emp.email?.toLowerCase().includes(term)
    const projectMatch = emp.project?.name?.toLowerCase().includes(term)
    const idMatch = emp.id.toLowerCase().includes(term)
    return nameMatch || emailMatch || projectMatch || idMatch
  })

  // Grupos calculados dinámicamente desde la lista de colaboradores
  const availableGroups = useMemo(() => {
    const map = new Map<string, EmployeeOption[]>()
    employees.forEach(emp => {
      const gName = emp.project?.name?.trim() || "Sin Proyecto / General"
      if (!map.has(gName)) map.set(gName, [])
      map.get(gName)!.push(emp)
    })
    return Array.from(map.entries())
      .map(([name, members]) => ({ name, count: members.length, members }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [employees])

  const handleAddAllFromGroup = () => {
    if (!selectedGroup) return
    if (selectedGroup === "ALL") {
      const allIds = employees.map(e => e.id)
      setSelectedEmployeeIds(prev => Array.from(new Set([...prev, ...allIds])))
    } else {
      const grp = availableGroups.find(g => g.name === selectedGroup)
      if (grp) {
        const groupIds = grp.members.map(e => e.id)
        setSelectedEmployeeIds(prev => Array.from(new Set([...prev, ...groupIds])))
      }
    }
  }

  const handleRemoveIndividual = (empId: string) => {
    setSelectedEmployeeIds(prev => prev.filter(id => id !== empId))
  }

  const handleFileChange = (selectedFile: File | null) => {
    setFileError(null)
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl)
      setFilePreviewUrl(null)
    }

    if (!selectedFile) {
      setFile(null)
      return
    }

    const MAX_SIZE = 25 * 1024 * 1024
    if (selectedFile.size > MAX_SIZE) {
      setFileError(
        locale === "en"
          ? "File size exceeds the allowed limit of 25MB."
          : "El tamaño del archivo supera el límite permitido de 25MB."
      )
      setFile(null)
      return
    }

    const ext = selectedFile.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "msg"]
    if (!ext || !allowedExtensions.includes(ext)) {
      setFileError(
        locale === "en"
          ? "File format not allowed. Only PDF, PNG, JPG, WEBP, or MSG are accepted."
          : "Formato de archivo no permitido. Solo se aceptan PDF, PNG, JPG, WEBP o MSG."
      )
      setFile(null)
      return
    }

    setFile(selectedFile)

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile)
      setFilePreviewUrl(url)
    } else {
      setFilePreviewUrl(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    let start = new Date(startDate)
    let end = new Date(endDate)
    if (start > end) return 0
    
    let count = 0
    let cur = new Date(start)
    while (cur <= end) {
      const day = cur.getDay()
      const isWeekend = day === 0 || day === 6
      const dateStr = cur.toISOString().split('T')[0]
      const isHoliday = holidays.includes(dateStr)
      if (!isWeekend && !isHoliday) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  }

  const handleAutoFillMarriageDays = () => {
    if (!startDate) return
    const [y, m, d] = startDate.split("-").map(Number)
    let cur = new Date(y, m - 1, d)
    let workingDaysFound = 0
    let finalDate = new Date(cur)

    while (workingDaysFound < 5) {
      const day = cur.getDay()
      const isWeekend = day === 0 || day === 6
      const yStr = cur.getFullYear()
      const mStr = String(cur.getMonth() + 1).padStart(2, "0")
      const dStr = String(cur.getDate()).padStart(2, "0")
      const dateStr = `${yStr}-${mStr}-${dStr}`
      const isHoliday = holidays.includes(dateStr)
      if (!isWeekend && !isHoliday) {
        workingDaysFound++
        finalDate = new Date(cur)
      }
      if (workingDaysFound < 5) {
        cur.setDate(cur.getDate() + 1)
      }
    }

    const resY = finalDate.getFullYear()
    const resM = String(finalDate.getMonth() + 1).padStart(2, "0")
    const resD = String(finalDate.getDate()).padStart(2, "0")
    setEndDate(`${resY}-${resM}-${resD}`)
  }

  const requestedDays = calculateDays()
  const isBalanceExceeded = !onBehalf && requestType === "VACATION" && requestedDays > effectiveBalance

  // Manejar cambio de pestañas de categoría
  const handleCategoryChange = (catId: CategoryId) => {
    setSelectedCategory(catId)
    if (catId !== "ALL") {
      const firstInCat = REQUEST_TYPES.find(t => t.category === catId)
      const currentInCat = REQUEST_TYPES.find(t => t.id === requestType && t.category === catId)
      if (firstInCat && !currentInCat) {
        setRequestType(firstInCat.id)
      }
    }
  }

  // Filtrado de tarjetas a mostrar según categoría y estado colapsable
  const displayedTypes = REQUEST_TYPES.filter((t) => {
    if (selectedCategory === "ALL") {
      if (isExpanded) return true
      return t.isFrequent // Las 6 más frecuentes
    }
    return t.category === selectedCategory
  })

  const executeSubmission = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await createTimeOffRequest(formData)
      setLoading(false)
      setShowMassConfirmModal(false)
      setPendingFormData(null)

      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        const isMass = onBehalf && selectedEmployeeIds.length > 1
        setMessage({ 
          type: "success", 
          text: result.message || (isMass
            ? `Se aplicó la incidencia/solicitud exitosamente a ${selectedEmployeeIds.length} colaboradores del equipo.`
            : isRemoteIncident
              ? "Reporte de incidencia enviado con éxito a tu supervisor y soporte IT."
              : onBehalf 
                ? `Solicitud enviada exitosamente para ${selectedEmployee?.name || "el colaborador"}.`
                : "Solicitud enviada correctamente.")
        })
        setStartDate("")
        setEndDate("")
        setLeaveTime("")
        setArrivalTime("")
        setIsPreApproved(false)
        setSpecialType("HOURS")
        setExitTime("")
        setReturnTime("")
        setHoursRequested("")
        setAbsenceDate("")
        setHoursToMakeUp("")
        setMakeupDate("")
        setMakeupStartTime("")
        setMakeupEndTime("")
        setIncidentStartTime("")
        setIncidentEndTime("")
        setIncidentExactHours("")
        setIncidentContext("")
        setIncidentNeedsItReview(false)
        setSelectedEmployeeIds([])
        setSearchTerm("")
        setSelectedGroup("")
        setIsExceptionListOpen(false)
        setOnBehalf(false)
        setAutoApprove(true)
        setAffectsBonus(false)
        handleFileChange(null)
      }
    } catch (err: any) {
      setLoading(false)
      setShowMassConfirmModal(false)
      setPendingFormData(null)
      setMessage({ type: "error", text: "Error inesperado al enviar la solicitud." })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    if (onBehalf && selectedEmployeeIds.length === 0) {
      setMessage({ type: "error", text: "Debes seleccionar al menos un colaborador para registrar en nombre del equipo." })
      return
    }

    // Validaciones específicas para Vacaciones
    if (requestType === "VACATION" && !onBehalf && startDate) {
      const [sY, sM, sD] = startDate.split('-').map(Number)
      const selectedStart = new Date(sY, sM - 1, sD)
      if (selectedStart < minVacationNoticeDate) {
        const dateFormatted = minVacationNoticeDate.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })
        setMessage({ 
          type: "error", 
          text: `Por políticas de la empresa, las solicitudes de vacaciones deben realizarse con al menos 25 días de anticipación. La fecha de inicio mínima permitida a partir de hoy es el ${dateFormatted}.` 
        })
        return
      }
    }

    if (requestType === "VACATION" && !onBehalf) {
      const currentBalance = effectiveBalance
      if (currentBalance >= MIN_VACATION_DAYS) {
        if (requestedDays < MIN_VACATION_DAYS) {
          setMessage({
            type: "error",
            text: `Las solicitudes de vacaciones deben ser de un mínimo de ${MIN_VACATION_DAYS} días laborables consecutivos, de acuerdo con la política de la empresa.`
          })
          return
        }
      } else {
        if (requestedDays !== currentBalance) {
          setMessage({
            type: "error",
            text: `Tu saldo disponible es de ${currentBalance} día${currentBalance !== 1 ? 's' : ''}. Cuando el saldo es menor a ${MIN_VACATION_DAYS} días, debes solicitar la totalidad de los días restantes (${currentBalance} día${currentBalance !== 1 ? 's' : ''}).`
          })
          return
        }
      }
    }

    // Documentación requerida
    const isDocumentRequired = !!DOCUMENT_GUIDELINES[requestType]
    if (isDocumentRequired && !file) {
      setMessage({ type: "error", text: "La documentación de respaldo es obligatoria para este tipo de solicitud." })
      return
    }

    if (isRemoteIncident) {
      if (!incidentDate) {
        setMessage({ type: "error", text: "Debes seleccionar la fecha de la falla." })
        return
      }
      if (!incidentStartTime || !incidentEndTime) {
        setMessage({ type: "error", text: "Debes ingresar la hora en que empezó y la hora en que terminó la falla." })
        return
      }
    }

    const formData = new FormData(e.currentTarget)
    if (file) {
      formData.set("document", file)
    }

    if (onBehalf) {
      formData.set("assigned_employee_ids", JSON.stringify(selectedEmployeeIds))
      if (selectedEmployeeIds.length > 0) {
        formData.set("targetUserId", selectedEmployeeIds[0])
      }
      formData.set("autoApprove", autoApprove ? "true" : "false")
      formData.set("affectsBonus", affectsBonus ? "true" : "false")
    }

    if (isRemoteIncident) {
      formData.set("incidentDate", incidentDate)
      formData.set("incidentStartTime", incidentStartTime)
      formData.set("incidentEndTime", incidentEndTime)
      formData.set("incidentExactHours", incidentExactHours)
      formData.set("startDate", `${incidentDate}T${incidentStartTime}`)
      formData.set("endDate", `${incidentDate}T${incidentEndTime}`)
      formData.set("incidentContext", incidentContext)
      formData.set("incidentNeedsItReview", incidentNeedsItReview ? "true" : "false")
    } else if (requestType === "EARLY_LEAVE") {
      formData.set("leaveTime", leaveTime)
      formData.set("exitTime", leaveTime)
    } else if (requestType === "LATE_ARRIVAL") {
      formData.set("arrivalTime", arrivalTime)
      formData.set("returnTime", arrivalTime)
      formData.set("isPreApproved", isPreApproved ? "true" : "false")
      formData.set("specialType", isPreApproved ? "PRE_APPROVED" : "NOT_PRE_APPROVED")
    } else if (requestType === "PERMISSION") {
      formData.set("specialType", specialType || "HOURS")
      formData.set("exitTime", exitTime)
      formData.set("returnTime", returnTime)
      formData.set("hoursRequested", hoursRequested)
    } else if (requestType === "HOURS_MAKEUP") {
      formData.set("absenceDate", absenceDate)
      formData.set("hoursToMakeUp", hoursToMakeUp)
      formData.set("makeupDate", makeupDate)
      formData.set("makeupStartTime", makeupStartTime)
      formData.set("makeupEndTime", makeupEndTime)
    }

    // Diálogo de confirmación claro si hay más de 1 persona seleccionada
    if (onBehalf && selectedEmployeeIds.length > 1) {
      setPendingFormData(formData)
      setShowMassConfirmModal(true)
      return
    }

    await executeSubmission(formData)
  }

  return (
    <div 
      className="card glass animate-in" 
      style={{ 
        height: "fit-content", 
        padding: "0", 
        overflow: "visible", 
        borderRadius: "1.25rem", 
        border: isDark ? "1px solid #1e293b" : "1px solid hsl(var(--border))", 
        backgroundColor: isDark ? "#0b0f19" : "hsl(var(--surface))",
        boxShadow: isDark 
          ? "0 20px 40px -15px rgba(0, 0, 0, 0.7)" 
          : "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
        position: "relative", 
        zIndex: 10,
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box"
      }}
    >
      {/* Header Corporativo Moderno */}
      <div style={{
        padding: "clamp(1rem, 2.5vw, 1.5rem) clamp(1rem, 2.5vw, 1.75rem)",
        background: isDark
          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))"
          : "linear-gradient(135deg, #f8fafc, #ffffff)",
        borderBottom: isDark ? "1px solid #1e293b" : "1px solid hsl(var(--border))",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        borderTopLeftRadius: "1.25rem",
        borderTopRightRadius: "1.25rem",
        flexWrap: "wrap",
        gap: "1rem",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: "0.875rem", 
            padding: "0.65rem",
            boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <CalendarDays size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: "clamp(1.15rem, 2vw, 1.35rem)", fontWeight: 800, margin: 0, color: isDark ? "#f8fafc" : "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>
              {t("vacations.requestButton")}
            </h2>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "14px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>
              {onBehalf ? t("vacations.onBehalfTitle") : t("vacations.subtitle")}
            </p>
          </div>
        </div>

        {/* Badge identificador rápido */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 0.85rem",
          borderRadius: "9999px",
          backgroundColor: `${activeTypeItem.color}15`,
          border: `1px solid ${activeTypeItem.color}40`,
          color: activeTypeItem.color,
          fontSize: "13px",
          fontWeight: 700
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: activeTypeItem.color }} />
          <span>{activeTypeItem.label}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ padding: "clamp(1rem, 2.5vw, 1.75rem)", display: "flex", flexDirection: "column", gap: "1.75rem", overflow: "visible", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
        
        <input type="hidden" name="projectName" value={projectName || ""} />
        <input type="hidden" name="type" value={requestType} />

        {/* Control On-Behalf para Managers / Supervisores */}
        {canCreateForOthers && employees.length > 0 && (
          <div className="animate-in" style={{
            padding: "1.25rem",
            borderRadius: "1rem",
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.4)" : "hsl(var(--muted) / 0.35)",
            border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid rgba(59, 130, 246, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            position: "relative",
            zIndex: 50
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "14px", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                <Users size={17} />
                <span>{t("vacations.adminRegistrationMode")}</span>
              </div>
              <span style={{ fontSize: "12px", backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)", color: isDark ? "#93c5fd" : "#2563eb", padding: "0.25rem 0.65rem", borderRadius: "9999px", fontWeight: 700, border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                {t("vacations.supervisionBadge")}
              </span>
            </div>

            {/* 1. Selector de Ámbito de Registro */}
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "15px", cursor: "pointer", fontWeight: !onBehalf ? 700 : 500, color: !onBehalf ? (isDark ? "#f8fafc" : "hsl(var(--foreground))") : (isDark ? "#94a3b8" : "hsl(var(--muted-foreground))") }}>
                <input 
                  type="radio" 
                  name="onBehalfMode" 
                  checked={!onBehalf} 
                  onChange={() => { setOnBehalf(false); setSelectedEmployeeIds([]); setSearchTerm(""); setSelectedGroup(""); setIsExceptionListOpen(false); }} 
                  style={{ width: "17px", height: "17px", accentColor: "#3b82f6" }}
                />
                <span>{t("vacations.forMyself")}</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "15px", cursor: "pointer", fontWeight: onBehalf ? 700 : 500, color: onBehalf ? "#3b82f6" : (isDark ? "#94a3b8" : "hsl(var(--muted-foreground))") }}>
                <input 
                  type="radio" 
                  name="onBehalfMode" 
                  checked={onBehalf} 
                  onChange={() => setOnBehalf(true)} 
                  style={{ width: "17px", height: "17px", accentColor: "#3b82f6" }}
                />
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span>{t("vacations.onBehalfTeam")}</span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                    color: isDark ? "#93c5fd" : "#2563eb",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "9999px",
                    border: "1px solid rgba(59, 130, 246, 0.35)",
                    whiteSpace: "nowrap"
                  }}>
                    {t("vacations.roleSupervisor")}
                  </span>
                </span>
              </label>
            </div>

            {/* 2. Panel de Asignación Masiva (se muestra condicionalmente) */}
            {onBehalf && (
              <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.15rem", marginTop: "0.25rem", borderTop: isDark ? "1px solid rgba(51, 65, 85, 0.5)" : "1px solid hsl(var(--border))", paddingTop: "1rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                
                {/* Selector de Método de Selección (Sub-tabs / Toggle) */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  padding: "0.25rem",
                  borderRadius: "0.75rem",
                  backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "hsl(var(--surface))",
                  border: isDark ? "1px solid rgba(51, 65, 85, 0.7)" : "1px solid hsl(var(--border))",
                  width: "fit-content",
                  maxWidth: "100%",
                  gap: "0.35rem",
                  boxSizing: "border-box"
                }}>
                  <button
                    type="button"
                    onClick={() => setSelectionMethod("GROUP")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.55rem 1rem",
                      borderRadius: "0.6rem",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      transition: "all 0.15s ease",
                      backgroundColor: selectionMethod === "GROUP" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                      color: selectionMethod === "GROUP" ? "#3b82f6" : (isDark ? "#94a3b8" : "hsl(var(--muted-foreground))"),
                      boxShadow: selectionMethod === "GROUP" ? "0 2px 8px rgba(59, 130, 246, 0.25)" : "none",
                      outline: selectionMethod === "GROUP" ? "1px solid rgba(59, 130, 246, 0.5)" : "none"
                    }}
                  >
                    <Users size={16} />
                    <span>{t("vacations.bySquad")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectionMethod("INDIVIDUAL")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.55rem 1rem",
                      borderRadius: "0.6rem",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      transition: "all 0.15s ease",
                      backgroundColor: selectionMethod === "INDIVIDUAL" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                      color: selectionMethod === "INDIVIDUAL" ? "#3b82f6" : (isDark ? "#94a3b8" : "hsl(var(--muted-foreground))"),
                      boxShadow: selectionMethod === "INDIVIDUAL" ? "0 2px 8px rgba(59, 130, 246, 0.25)" : "none",
                      outline: selectionMethod === "INDIVIDUAL" ? "1px solid rgba(59, 130, 246, 0.5)" : "none"
                    }}
                  >
                    <Search size={16} />
                    <span>{t("vacations.byIndividual")}</span>
                  </button>
                </div>

                {/* Opción A: Por Grupo / Campaña / Turno */}
                {selectionMethod === "GROUP" && (
                  <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                    <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                      {t("vacations.chooseGroup")}
                    </label>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="input"
                        style={{
                          flex: "1 1 240px",
                          fontSize: "14px",
                          borderRadius: "0.75rem",
                          padding: "0.75rem 1rem",
                          fontWeight: 600,
                          backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                          color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
                          border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                          minWidth: 0,
                          maxWidth: "100%",
                          boxSizing: "border-box"
                        }}
                      >
                        <option value="">{t("vacations.selectGroupPlaceholder")}</option>
                        <option value="ALL">{t("vacations.allMyTeam", { count: employees.length })}</option>
                        {availableGroups.map((grp) => (
                          <option key={grp.name} value={grp.name}>
                            {t("vacations.groupOption", { name: grp.name, count: grp.count })}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={handleAddAllFromGroup}
                        disabled={!selectedGroup}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem 1.25rem",
                          borderRadius: "0.75rem",
                          backgroundColor: selectedGroup ? "#2563eb" : (isDark ? "rgba(30, 41, 59, 0.5)" : "hsl(var(--muted) / 0.5)"),
                          color: selectedGroup ? "#ffffff" : (isDark ? "#64748b" : "hsl(var(--muted-foreground))"),
                          border: selectedGroup ? "1px solid #3b82f6" : (isDark ? "1px solid #334155" : "1px solid hsl(var(--border))"),
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: selectedGroup ? "pointer" : "not-allowed",
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                          flexShrink: 0
                        }}
                        title="Añadir todos los miembros de este grupo a la asignación"
                      >
                        <Check size={16} />
                        <span>{t("vacations.selectAll")}</span>
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>
                      {t("vacations.selectAllHint")}
                    </p>
                  </div>
                )}

                {/* Opción B: Selección Individual Múltiple */}
                {selectionMethod === "INDIVIDUAL" && (
                  <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                    <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                      {t("vacations.searchColleague")}
                    </label>
                    <div ref={employeeDropdownRef} style={{ position: "relative", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                      <div style={{ display: "flex", alignItems: "center", position: "relative", width: "100%", minWidth: 0 }}>
                        <Search size={18} style={{ position: "absolute", left: "1.1rem", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
                        <input
                          type="text"
                          className="input"
                          placeholder={t("vacations.searchColleaguePlaceholder")}
                          value={searchTerm}
                          onFocus={() => setIsDropdownOpen(true)}
                          onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setIsDropdownOpen(true)
                          }}
                          style={{
                            fontSize: "14.5px",
                            borderRadius: "0.75rem",
                            padding: "0.8rem 2.75rem 0.8rem 3rem",
                            width: "100%",
                            minWidth: 0,
                            boxSizing: "border-box",
                            fontWeight: 600,
                            border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                            backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                            color: isDark ? "#f8fafc" : "hsl(var(--foreground))"
                          }}
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm("")
                              setIsDropdownOpen(false)
                            }}
                            style={{
                              position: "absolute",
                              right: "0.85rem",
                              background: "none",
                              border: "none",
                              color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))",
                              cursor: "pointer",
                              padding: "0.35rem"
                            }}
                            title="Limpiar búsqueda"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown predictivo de resultados */}
                      {isDropdownOpen && (
                        <div 
                          style={{
                            position: "absolute",
                            top: "calc(100% + 0.45rem)",
                            left: 0,
                            right: 0,
                            maxHeight: "260px",
                            overflowY: "auto",
                            backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                            color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
                            border: isDark ? "1px solid #3b82f6" : "1px solid hsl(var(--border))",
                            borderRadius: "0.875rem",
                            boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.95)" : "0 20px 35px -8px rgba(0, 0, 0, 0.15)",
                            zIndex: 9999,
                            padding: "0.5rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                            width: "100%",
                            boxSizing: "border-box"
                          }}
                        >
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.slice(0, 40).map((emp) => {
                              const isAlreadySelected = selectedEmployeeIds.includes(emp.id)
                              return (
                                <div
                                  key={emp.id}
                                  onClick={() => {
                                    if (isAlreadySelected) {
                                      handleRemoveIndividual(emp.id)
                                    } else {
                                      setSelectedEmployeeIds(prev => [...prev, emp.id])
                                    }
                                    setSearchTerm("")
                                  }}
                                  style={{
                                    padding: "0.7rem 0.9rem",
                                    borderRadius: "0.6rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    transition: "all 0.15s ease",
                                    backgroundColor: isAlreadySelected ? (isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)") : (isDark ? "rgba(30, 41, 59, 0.5)" : "hsl(var(--muted) / 0.4)"),
                                    border: isAlreadySelected ? "1px solid #3b82f6" : (isDark ? "1px solid rgba(51, 65, 85, 0.4)" : "1px solid hsl(var(--border))"),
                                    minWidth: 0,
                                    boxSizing: "border-box"
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: "1 1 auto" }}>
                                    <div style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                      backgroundColor: isAlreadySelected ? "#2563eb" : (isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"),
                                      color: isAlreadySelected ? "#ffffff" : "#2563eb",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 800,
                                      fontSize: "13px",
                                      flexShrink: 0
                                    }}>
                                      {(emp.name || emp.email || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                                      <div style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#f8fafc" : "hsl(var(--foreground))", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {emp.name || emp.email}
                                      </div>
                                      {emp.email && <div style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</div>}
                                    </div>
                                  </div>

                                  <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                    {isAlreadySelected ? (
                                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                        <Check size={14} /> {t("vacations.assigned")}
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>
                                        {t("vacations.addColleague")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div style={{ padding: "1.25rem", fontSize: "13.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", textAlign: "center", fontWeight: 600 }}>
                              {t("vacations.noColleaguesFound")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Chips de colaboradores seleccionados */}
                    {selectedEmployeeIds.length > 0 && (
                      <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        padding: "0.75rem",
                        backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "hsl(var(--surface))",
                        border: isDark ? "1px solid rgba(51, 65, 85, 0.6)" : "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        maxHeight: "150px",
                        overflowY: "auto",
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box"
                      }}>
                        {selectedEmployeeIds.map(empId => {
                          const emp = employees.find(e => e.id === empId)
                          return (
                            <div 
                              key={empId}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                padding: "0.3rem 0.65rem",
                                borderRadius: "0.5rem",
                                backgroundColor: isDark ? "rgba(30, 41, 59, 0.9)" : "hsl(var(--muted) / 0.5)",
                                border: isDark ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid rgba(59, 130, 246, 0.25)",
                                color: isDark ? "#f1f5f9" : "hsl(var(--foreground))",
                                fontSize: "13.5px",
                                fontWeight: 600,
                                maxWidth: "clamp(130px, 45vw, 240px)",
                                minWidth: 0,
                                boxSizing: "border-box"
                              }}
                            >
                              <div style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "50%",
                                backgroundColor: "#2563eb",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {(emp?.name || emp?.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                {emp?.name || emp?.email || empId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIndividual(empId)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))",
                                  cursor: "pointer",
                                  padding: "2px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "3px",
                                  flexShrink: 0
                                }}
                                title={t("common.delete")}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Barra de Resumen y Excepciones */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "hsl(var(--surface))",
                  border: isDark ? "1px solid rgba(51, 65, 85, 0.7)" : "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    <Users size={18} color="#3b82f6" />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#f8fafc" : "hsl(var(--foreground))" }}>
                      {t("vacations.totalAssigned")}
                    </span>
                    <span style={{
                      fontSize: "13.5px",
                      fontWeight: 800,
                      backgroundColor: selectedEmployeeIds.length > 0 ? "rgba(59, 130, 246, 0.2)" : "rgba(100, 116, 139, 0.2)",
                      color: selectedEmployeeIds.length > 0 ? "#93c5fd" : "#94a3b8",
                      border: `1px solid ${selectedEmployeeIds.length > 0 ? "rgba(59, 130, 246, 0.4)" : "rgba(100, 116, 139, 0.3)"}`,
                      padding: "0.2rem 0.65rem",
                      borderRadius: "9999px"
                    }}>
                      {t("vacations.coworkersCount", { count: selectedEmployeeIds.length, plural: selectedEmployeeIds.length !== 1 ? (locale === "en" ? "s" : "es") : "" })}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {selectedEmployeeIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsExceptionListOpen(prev => !prev)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: isExceptionListOpen ? "#3b82f6" : (isDark ? "#cbd5e1" : "hsl(var(--foreground))"),
                          background: isExceptionListOpen ? (isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)") : (isDark ? "rgba(30, 41, 59, 0.6)" : "hsl(var(--muted) / 0.5)"),
                          border: isExceptionListOpen ? "1px solid rgba(59, 130, 246, 0.4)" : (isDark ? "1px solid rgba(51, 65, 85, 0.8)" : "1px solid hsl(var(--border))"),
                          padding: "0.45rem 0.85rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <span>{t("vacations.manageExceptions")}</span>
                        {isExceptionListOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}

                    {selectedEmployeeIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeIds([])
                          setIsExceptionListOpen(false)
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#f87171",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        title={t("vacations.clearSelection")}
                      >
                        <RotateCcw size={14} />
                        <span>{t("vacations.clearSelection")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista desplegable para desmarcar excepciones */}
                {isExceptionListOpen && selectedEmployeeIds.length > 0 && (
                  <div className="animate-in" style={{
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "hsl(var(--surface))",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    boxShadow: isDark ? "none" : "0 10px 25px -5px rgba(0, 0, 0, 0.08)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "12.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", fontWeight: 600 }}>
                        {t("vacations.uncheckExceptionsHint")}
                      </div>
                      <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 700 }}>
                        {t("vacations.includedCount", { count: selectedEmployeeIds.length })}
                      </span>
                    </div>

                    <div style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                      paddingRight: "0.25rem"
                    }}>
                      {selectedEmployeeIds.map(empId => {
                        const emp = employees.find(e => e.id === empId)
                        return (
                          <label 
                            key={empId}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.55rem 0.75rem",
                              backgroundColor: isDark ? "rgba(30, 41, 59, 0.6)" : "hsl(var(--muted) / 0.4)",
                              border: isDark ? "1px solid rgba(51, 65, 85, 0.5)" : "1px solid hsl(var(--border))",
                              borderRadius: "0.5rem",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => handleRemoveIndividual(empId)}
                                style={{ width: "16px", height: "16px", accentColor: "#3b82f6", cursor: "pointer" }}
                              />
                              <div style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)",
                                color: "#3b82f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "12px"
                              }}>
                                {(emp?.name || emp?.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "13.5px", fontWeight: 700, color: isDark ? "#f8fafc" : "hsl(var(--foreground))" }}>
                                  {emp?.name || emp?.email || empId}
                                </div>
                                {emp?.email && <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>{emp.email}</div>}
                              </div>
                            </div>

                            {emp?.project?.name && (
                              <span style={{
                                fontSize: "11.5px",
                                fontWeight: 600,
                                color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))",
                                backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "hsl(var(--surface))",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.35rem",
                                border: isDark ? "1px solid rgba(51, 65, 85, 0.5)" : "1px solid hsl(var(--border))"
                              }}>
                                {emp.project.name}
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Opciones de Gestión del Supervisor / Manager */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                  gap: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  {/* 1. Checkbox: Aprobar Automáticamente */}
                  <div
                    onClick={() => setAutoApprove(!autoApprove)}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.875rem",
                      backgroundColor: autoApprove
                        ? (isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.08)")
                        : (isDark ? "rgba(15, 23, 42, 0.5)" : "hsl(var(--surface))"),
                      border: autoApprove
                        ? "1px solid rgba(59, 130, 246, 0.4)"
                        : (isDark ? "1px solid #334155" : "1px solid hsl(var(--border))"),
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="checkbox"
                      id="autoApprove"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: "18px", height: "18px", accentColor: "#3b82f6", marginTop: "0.15rem", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <label htmlFor="autoApprove" style={{ fontSize: "13.5px", fontWeight: 700, cursor: "pointer", display: "block", color: autoApprove ? (isDark ? "#93c5fd" : "#1d4ed8") : (isDark ? "#e2e8f0" : "hsl(var(--foreground))") }}>
                        {t("vacations.autoApproveLabel")}
                      </label>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.35 }}>
                        {t("vacations.autoApproveHelp")}
                      </p>
                    </div>
                  </div>

                  {/* 2. Checkbox: Impactar Bono */}
                  <div
                    onClick={() => setAffectsBonus(!affectsBonus)}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.875rem",
                      backgroundColor: affectsBonus
                        ? (isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.08)")
                        : (isDark ? "rgba(15, 23, 42, 0.5)" : "hsl(var(--surface))"),
                      border: affectsBonus
                        ? "1px solid rgba(245, 158, 11, 0.45)"
                        : (isDark ? "1px solid #334155" : "1px solid hsl(var(--border))"),
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="checkbox"
                      id="affectsBonus"
                      checked={affectsBonus}
                      onChange={(e) => setAffectsBonus(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: "18px", height: "18px", accentColor: "#f59e0b", marginTop: "0.15rem", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <label htmlFor="affectsBonus" style={{ fontSize: "13.5px", fontWeight: 700, cursor: "pointer", display: "block", color: affectsBonus ? (isDark ? "#fcd34d" : "#b45309") : (isDark ? "#e2e8f0" : "hsl(var(--foreground))") }}>
                        {t("vacations.affectsBonusLabel")}
                      </label>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.35 }}>
                        {t("vacations.affectsBonusHelp")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. Selector de Categorías (Pills / Segmented Tabs) */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <label style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))", letterSpacing: "0.02em", textTransform: "uppercase" }}>
              {t("vacations.categoryTitle")}
            </label>
            <span style={{ fontSize: "13px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>
              {t("vacations.showingTypes", { shown: displayedTypes.length, total: REQUEST_TYPES.length })}
            </span>
          </div>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            padding: "0.35rem",
            borderRadius: "0.875rem",
            backgroundColor: isDark ? "#0f172a" : "hsl(var(--muted) / 0.5)",
            border: isDark ? "1px solid #1e293b" : "1px solid hsl(var(--border))"
          }}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.65rem 1.15rem",
                    borderRadius: "0.65rem",
                    fontSize: "14px",
                    fontWeight: isSelected ? 700 : 600,
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    border: isSelected 
                      ? (isDark ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid #3b82f6") 
                      : "1px solid transparent",
                    backgroundColor: isSelected 
                      ? (isDark ? "#1e293b" : "#ffffff") 
                      : "transparent",
                    color: isSelected 
                      ? (isDark ? "#ffffff" : "#1d4ed8") 
                      : (isDark ? "#94a3b8" : "hsl(var(--muted-foreground))"),
                    boxShadow: isSelected 
                      ? (isDark ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.08)") 
                      : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = isDark ? "#f8fafc" : "hsl(var(--foreground))"
                      e.currentTarget.style.backgroundColor = isDark ? "rgba(30, 41, 59, 0.5)" : "hsl(var(--surface-hover))"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = isDark ? "#94a3b8" : "hsl(var(--muted-foreground))"
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  <span>{cat.id === "ALL" ? t("vacations.categories.all") : cat.id === "LEAVE" ? t("vacations.categories.leave") : cat.id === "HEALTH_FAMILY" ? t("vacations.categories.health") : t("vacations.categories.remote")}</span>
                  {cat.badge && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.35)"
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                      {cat.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2 & 3. Cuadrícula de Tarjetas con Identidad Visual Única */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <label style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))", letterSpacing: "0.02em", textTransform: "uppercase" }}>
              {t("vacations.specificType")}
            </label>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", 
            gap: "0.85rem", 
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box"
          }}>
            {displayedTypes.map((item) => {
              const IconComponent = item.icon
              const isSelected = requestType === item.id
              const isHovered = hoveredCardId === item.id
              const labelKey = `vacations.types.${item.id}.label` as any
              const subKey = `vacations.types.${item.id}.sub` as any
              const localizedLabel = t(labelKey)
              const localizedSub = t(subKey)
              const itemLabel = localizedLabel && localizedLabel !== labelKey ? localizedLabel : item.label
              const itemSub = localizedSub && localizedSub !== subKey ? localizedSub : item.sub

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setRequestType(item.id)}
                  onMouseEnter={() => setHoveredCardId(item.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    padding: "1.1rem 1.15rem",
                    borderRadius: "0.875rem",
                    border: isSelected 
                      ? `2px solid ${item.color}` 
                      : isHovered 
                        ? `1px solid ${item.color}88` 
                        : isDark ? "1px solid rgba(51, 65, 85, 0.6)" : "1px solid hsl(var(--border))",
                    backgroundColor: isSelected 
                      ? (isDark ? "rgba(30, 41, 59, 0.95)" : "hsl(var(--surface))") 
                      : isHovered 
                        ? (isDark ? "rgba(30, 41, 59, 0.7)" : "hsl(var(--surface-hover))") 
                        : (isDark ? "rgba(17, 24, 39, 0.7)" : "hsl(var(--surface))"),
                    backgroundImage: isSelected ? `radial-gradient(circle at top right, ${item.color}22, transparent 70%)` : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: (isHovered && !isSelected) ? "translateY(-3px)" : "none",
                    boxShadow: isSelected 
                      ? `0 12px 28px -4px ${item.color}40, 0 4px 12px -2px ${item.color}25` 
                      : isHovered 
                        ? `0 10px 22px -4px ${item.color}22` 
                        : isDark ? "0 2px 6px rgba(0,0,0,0.25)" : "0 2px 6px rgba(0,0,0,0.04)",
                    position: "relative",
                    outline: "none",
                    minWidth: 0,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "0.5rem", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: "1 1 auto" }}>
                      <div style={{ 
                        backgroundColor: isSelected ? item.color : `${item.color}22`, 
                        color: isSelected ? "#ffffff" : item.color,
                        width: "38px",
                        height: "38px",
                        borderRadius: "0.65rem",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: isSelected ? `0 4px 12px ${item.color}60` : "none"
                      }}>
                        <IconComponent size={20} />
                      </div>
                      
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: "clamp(14px, 1.05vw, 16.5px)", 
                        color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
                        lineHeight: 1.25,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        whiteSpace: "normal"
                      }}>
                        {itemLabel}
                      </span>
                    </div>

                    {/* Indicador de seleccionado */}
                    {isSelected && (
                      <div style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 2px 8px ${item.color}66`
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <span style={{ 
                    fontSize: "13px", 
                    fontWeight: 500,
                    color: isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))", 
                    lineHeight: 1.4,
                    display: "block",
                    width: "100%",
                    wordBreak: "break-word"
                  }}>
                    {itemSub}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Botón interactivo: Mostrar más / Mostrar menos (Solo en la pestaña "Todas") */}
          {selectedCategory === "ALL" && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem 1.5rem",
                borderRadius: "0.75rem",
                backgroundColor: isDark ? "rgba(30, 41, 59, 0.6)" : "hsl(var(--surface))",
                border: isDark ? "1px dashed rgba(148, 163, 184, 0.35)" : "1px dashed hsl(var(--border))",
                color: isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                marginTop: "1rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "rgba(30, 41, 59, 0.95)" : "hsl(var(--surface-hover))"
                e.currentTarget.style.borderColor = "#3b82f6"
                e.currentTarget.style.color = isDark ? "#ffffff" : "hsl(var(--foreground))"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "rgba(30, 41, 59, 0.6)" : "hsl(var(--surface))"
                e.currentTarget.style.borderColor = isDark ? "rgba(148, 163, 184, 0.35)" : "hsl(var(--border))"
                e.currentTarget.style.color = isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))"
              }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={18} />
                  <span>{t("vacations.showLess")}</span>
                </>
              ) : (
                <>
                  <ChevronDown size={18} />
                  <span>{t("vacations.showMore", { count: REQUEST_TYPES.length - 6 })}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Banner Informativo Especial: Licencia por Matrimonio (Ley 16-92 República Dominicana) */}
        {requestType === "MARRIAGE_LEAVE" && (
          <div className="animate-in" style={{
            padding: "1.35rem 1.45rem",
            borderRadius: "1rem",
            background: isDark
              ? "linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)"
              : "linear-gradient(135deg, rgba(225, 29, 72, 0.08) 0%, #fff1f2 100%)",
            border: isDark ? "1px solid rgba(225, 29, 72, 0.4)" : "1px solid rgba(225, 29, 72, 0.25)",
            boxShadow: "0 10px 25px -5px rgba(225, 29, 72, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Resplandor decorativo */}
            <div style={{
              position: "absolute",
              top: -35,
              right: -35,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(225, 29, 72, 0.3) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />

            {/* Cabecera del Marco Legal Dominicano */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span style={{ fontSize: "22px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>🇩🇴</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "#fb7185", letterSpacing: "-0.01em" }}>
                    {locale === "en"
                      ? "Dominican Labor Code · Law No. 16-92 (Article 54, item a)"
                      : "Código de Trabajo de la República Dominicana · Ley No. 16-92 (Art. 54, acápite a)"}
                  </div>
                  <div style={{ fontSize: "12px", color: isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))" }}>
                    {locale === "en"
                      ? "Official statutory leave framework for employee marriage"
                      : "Marco legal oficial de licencias remuneradas por matrimonio del trabajador"}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "0.3rem 0.75rem",
                borderRadius: "999px",
                backgroundColor: "rgba(225, 29, 72, 0.25)",
                color: isDark ? "#fda4af" : "#be185d",
                border: "1px solid rgba(225, 29, 72, 0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem"
              }}>
                <Heart size={12} fill={isDark ? "#fda4af" : "#be185d"} />
                {locale === "en" ? "100% Paid Leave" : "100% Remunerada"}
              </span>
            </div>

            {/* Cita de la Ley */}
            <div style={{
              margin: 0,
              fontSize: "13.5px",
              color: isDark ? "#f1f5f9" : "#4c0519",
              lineHeight: 1.6,
              backgroundColor: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.85)",
              padding: "0.85rem 1rem",
              borderRadius: "0.65rem",
              borderLeft: "3px solid #e11d48"
            }}>
              {locale === "en" ? (
                <>
                  <em>&ldquo;The employer is obligated to grant the worker <strong>five (5) days of leave with full salary</strong> on the occasion of celebrating their marriage...&rdquo;</em> (Art. 54).
                </>
              ) : (
                <>
                  <em>&ldquo;El empleador está obligado a conceder al trabajador <strong>cinco (5) días de licencia con disfrute de salario</strong>, con motivo de la celebración del matrimonio de éste...&rdquo;</em> (Art. 54).
                </>
              )}
            </div>

            {/* Puntos Clave de la Legislación */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
              gap: "0.75rem",
              marginTop: "0.2rem"
            }}>
              <div style={{
                padding: "0.75rem 0.9rem",
                borderRadius: "0.65rem",
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff",
                border: isDark ? "1px solid rgba(225, 29, 72, 0.25)" : "1px solid rgba(225, 29, 72, 0.2)"
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#fda4af" : "#be185d", textTransform: "uppercase" }}>
                  {locale === "en" ? "Statutory Duration" : "Duración Legal"}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#ffffff" : "hsl(var(--foreground))", marginTop: "0.2rem" }}>
                  {locale === "en" ? "5 Working Days" : "5 Días Laborables"}
                </div>
                <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>
                  {locale === "en" ? "Consecutive & 100% paid" : "Consecutivos y con disfrute de sueldo"}
                </div>
              </div>

              <div style={{
                padding: "0.75rem 0.9rem",
                borderRadius: "0.65rem",
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff",
                border: isDark ? "1px solid rgba(225, 29, 72, 0.25)" : "1px solid rgba(225, 29, 72, 0.2)"
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#fda4af" : "#be185d", textTransform: "uppercase" }}>
                  {locale === "en" ? "Vacation Balance" : "Balance de Vacaciones"}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#ffffff" : "hsl(var(--foreground))", marginTop: "0.2rem" }}>
                  {locale === "en" ? "Does NOT Deduct" : "NO se Descuenta"}
                </div>
                <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>
                  {locale === "en" ? "Independent statutory right" : "Derecho legal independiente de vacaciones"}
                </div>
              </div>

              <div style={{
                padding: "0.75rem 0.9rem",
                borderRadius: "0.65rem",
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.65)" : "#ffffff",
                border: isDark ? "1px solid rgba(225, 29, 72, 0.25)" : "1px solid rgba(225, 29, 72, 0.2)"
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#fda4af" : "#be185d", textTransform: "uppercase" }}>
                  {locale === "en" ? "Required Evidence" : "Soporte Obligatorio"}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#ffffff" : "hsl(var(--foreground))", marginTop: "0.2rem" }}>
                  {locale === "en" ? "Marriage Certificate" : "Acta de Matrimonio"}
                </div>
                <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>
                  {locale === "en" ? "PDF, images, or .msg email" : "Oficialía Civil, Iglesia o .msg"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Warning Banner for Medical & Family Guidelines */}
        {DOCUMENT_GUIDELINES[requestType] && (
          <div className="animate-in" style={{
            padding: "1.15rem 1.25rem",
            borderRadius: "0.875rem",
            backgroundColor: `${activeTypeItem.color}10`,
            border: `1px solid ${activeTypeItem.color}35`,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "15px", color: activeTypeItem.color }}>
              <Paperclip size={18} />
              <span>{t("vacations.mandatoryDocsTitle")}</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))", lineHeight: 1.5 }}>
              {t("vacations.mandatoryDocsDesc")}
            </p>
            <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, fontSize: "13.5px", color: isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
              {(locale === "en" ? (DOCUMENT_GUIDELINES_EN[requestType] || DOCUMENT_GUIDELINES[requestType]) : DOCUMENT_GUIDELINES[requestType]).map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Formulario Reactivo y Dinámico (UX Condicional) */}

        {/* CASO A: Incidencia de Teletrabajo / IT */}
        {isRemoteIncident ? (
          <div className="animate-in" style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            padding: "1.35rem",
            borderRadius: "1rem",
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.4)" : "hsl(var(--muted) / 0.3)",
            border: `1px solid ${activeTypeItem.color}40`,
            borderLeft: `4px solid ${activeTypeItem.color}`
          }}>
            {/* Banner de Prioridad Operativa */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "0.9rem 1.15rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(249, 115, 22, 0.12)",
              border: "1px solid rgba(249, 115, 22, 0.3)"
            }}>
              <AlertOctagon size={22} color="#f97316" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: isDark ? "#f8fafc" : "hsl(var(--foreground))" }}>
                  {t("vacations.remotePriorityTitle")}
                </div>
                <div style={{ fontSize: "13.5px", color: isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>
                  {t("vacations.remotePriorityDesc")}
                </div>
              </div>
            </div>

            {/* Fecha de la Falla (Izquierda) y Horario Exacto con Cálculo de Horas (Derecha) */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", 
              gap: "1.25rem", 
              alignItems: "flex-start",
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box"
            }}>
              {/* Columna: Fecha de la Falla */}
              <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                  {t("vacations.failureDate")}
                </label>
                <input 
                  type="date" 
                  name="incidentDate" 
                  required 
                  value={incidentDate} 
                  onChange={(e) => setIncidentDate(e.target.value)} 
                  style={{ 
                    fontSize: "15px", 
                    borderRadius: "0.75rem", 
                    padding: "0.85rem 1rem", 
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                    border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                    color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
                    colorScheme: isDark ? "dark" : "light"
                  }} 
                />
              </div>

              {/* Columna: Hora en que Empezó, Hora en que Terminó y Horas Exactas */}
              <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))", 
                  gap: "0.75rem",
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box"
                }}>
                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                      {t("vacations.startTime")}
                    </label>
                    <input 
                      type="time" 
                      name="incidentStartTime" 
                      required 
                      value={incidentStartTime} 
                      onChange={(e) => setIncidentStartTime(e.target.value)} 
                      style={{ 
                        fontSize: "15px", 
                        borderRadius: "0.75rem", 
                        padding: "0.85rem 0.75rem", 
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                        border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                        color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
                        colorScheme: isDark ? "dark" : "light"
                      }} 
                    />
                  </div>

                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                      {t("vacations.endTime")}
                    </label>
                    <input 
                      type="time" 
                      name="incidentEndTime" 
                      required 
                      value={incidentEndTime} 
                      onChange={(e) => setIncidentEndTime(e.target.value)} 
                      style={{ 
                        fontSize: "15px", 
                        borderRadius: "0.75rem", 
                        padding: "0.85rem 0.75rem", 
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                        border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                        color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
                        colorScheme: isDark ? "dark" : "light"
                      }} 
                    />
                  </div>

                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                      {t("vacations.exactHours")}
                    </label>
                    <input 
                      type="text" 
                      name="incidentExactHours"
                      readOnly
                      value={incidentExactHours || "--"} 
                      style={{ 
                        fontSize: "14px", 
                        borderRadius: "0.75rem", 
                        padding: "0.85rem 0.75rem", 
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "hsl(var(--muted) / 0.35)",
                        border: incidentExactHours && incidentExactHours !== "--" ? "1px solid #f97316" : (isDark ? "1px solid #334155" : "1px solid hsl(var(--border))"),
                        color: incidentExactHours && incidentExactHours !== "--" ? "#ea580c" : (isDark ? "#94a3b8" : "hsl(var(--muted-foreground))"),
                        fontWeight: 700,
                        cursor: "not-allowed",
                        textAlign: "center"
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Campo Contextual Dinámico según la tarjeta */}
            {activeTypeItem.remoteContextLabel && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                  {locale === "en" 
                    ? (activeTypeItem.id === "REMOTE_INTERNET" 
                        ? "Internet Service Provider (ISP) *" 
                        : activeTypeItem.id === "REMOTE_POWER" 
                          ? "Electric Utility Company *" 
                          : activeTypeItem.id === "REMOTE_HARDWARE" 
                            ? "Affected Component or Device *" 
                            : "Affected Tool or Access *")
                    : activeTypeItem.remoteContextLabel
                  }
                </label>
                <input 
                  type="text" 
                  name="incidentContext" 
                  required 
                  placeholder={locale === "en"
                    ? (activeTypeItem.id === "REMOTE_INTERNET" 
                        ? "e.g.: Claro Dominicana, Altice, Starlink, etc." 
                        : activeTypeItem.id === "REMOTE_POWER" 
                          ? "e.g.: Edeeste, Edesur, Edenorte, inverter failure..." 
                          : activeTypeItem.id === "REMOTE_HARDWARE" 
                            ? "e.g.: Laptop won't turn on, damaged charger, monitor..." 
                            : "e.g.: FortiClient VPN, domain credentials, Intranet...")
                    : activeTypeItem.remoteContextPlaceholder
                  } 
                  value={incidentContext} 
                  onChange={(e) => setIncidentContext(e.target.value)} 
                  style={{ 
                    fontSize: "15px", 
                    borderRadius: "0.75rem", 
                    padding: "0.85rem 1rem", 
                    width: "100%",
                    backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                    border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                    color: isDark ? "#f8fafc" : "hsl(var(--foreground))"
                  }} 
                />
              </div>
            )}

            {/* Toggle Condicional para Avería de Hardware/PC */}
            {activeTypeItem.hasHardwareReviewToggle && (
              <div style={{
                padding: "1rem 1.25rem",
                borderRadius: "0.75rem",
                backgroundColor: incidentNeedsItReview ? "rgba(239, 68, 68, 0.15)" : (isDark ? "rgba(15, 23, 42, 0.6)" : "hsl(var(--surface))"),
                border: incidentNeedsItReview ? "1px solid #ef4444" : (isDark ? "1px solid #334155" : "1px solid hsl(var(--border))"),
                transition: "all 0.2s ease"
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="incidentNeedsItReview"
                    checked={incidentNeedsItReview}
                    onChange={(e) => setIncidentNeedsItReview(e.target.checked)}
                    style={{ width: "20px", height: "20px", accentColor: "#ef4444" }}
                  />
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: isDark ? "#f8fafc" : "hsl(var(--foreground))" }}>
                      {t("vacations.itHardwareToggleTitle")}
                    </div>
                    <div style={{ fontSize: "13.5px", color: isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>
                      {t("vacations.itHardwareToggleDesc")}
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        ) : (
          /* CASO B: Vacaciones o Permisos Programados */
          <>
            {/* Campos Condicionales de Permiso Especial por Horas */}
            {requestType === "PERMISSION" && (
              <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", padding: "1.25rem", borderRadius: "0.875rem", backgroundColor: isDark ? "rgba(30, 41, 59, 0.35)" : "hsl(var(--muted) / 0.3)", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "1rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.startTime").toUpperCase()}</label>
                    <input type="time" className="input" required value={exitTime} onChange={(e) => setExitTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.endTime").toUpperCase()}</label>
                    <input type="time" className="input" required value={returnTime} onChange={(e) => setReturnTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.hoursCount").toUpperCase()}</label>
                    <input 
                      type="text" 
                      readOnly 
                      className="input" 
                      value={hoursRequested ? `${hoursRequested} hrs` : "--"} 
                      style={{ 
                        fontSize: "15px", 
                        borderRadius: "0.75rem", 
                        padding: "0.85rem 1rem", 
                        backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "hsl(var(--muted) / 0.4)", 
                        cursor: "not-allowed",
                        fontWeight: 800,
                        color: "#6366f1",
                        border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box"
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campos Condicionales de Reposición de Horas */}
            {requestType === "HOURS_MAKEUP" && (
              <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", padding: "1.25rem", borderRadius: "0.875rem", backgroundColor: isDark ? "rgba(30, 41, 59, 0.35)" : "hsl(var(--muted) / 0.3)", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.absenceDate").toUpperCase()}</label>
                    <input type="date" className="input" required value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.hoursToMakeUp").toUpperCase()}</label>
                    <input type="number" step="0.5" min="0.5" className="input" placeholder="Ej: 4" required value={hoursToMakeUp} onChange={(e) => setHoursToMakeUp(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ borderTop: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", paddingTop: "1rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                  <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 700, fontSize: "15px", color: "#0d9488" }}>
                    {locale === "en" ? "Proposed Hours Recovery Schedule" : "Propuesta de Recuperación de Horas"}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "1rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                    <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.makeupDate").toUpperCase()}</label>
                      <input type="date" className="input" required value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.makeupStartTime").toUpperCase()}</label>
                      <input type="time" className="input" required value={makeupStartTime} onChange={(e) => setMakeupStartTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "14px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.makeupEndTime").toUpperCase()}</label>
                      <input type="time" className="input" required value={makeupEndTime} onChange={(e) => setMakeupEndTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light", width: "100%", minWidth: 0, boxSizing: "border-box" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fechas de Solicitud Estándar */}
            {requestType !== "HOURS_MAKEUP" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                <div style={{ display: "grid", gridTemplateColumns: requestType === "PERMISSION" ? "1fr" : "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1.25rem", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                  <div style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
                      {requestType === "EARLY_LEAVE" || requestType === "LATE_ARRIVAL" || requestType === "PERMISSION" ? t("vacations.form.date").toUpperCase() : t("vacations.form.startDate").toUpperCase()}
                    </label>
                    <input 
                      name="startDate" 
                      type="date" 
                      className="input" 
                      required 
                      min={requestType === "VACATION" && !onBehalf ? minVacationNoticeStr : undefined}
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      style={{ 
                        fontSize: "15px", 
                        borderRadius: "0.75rem", 
                        padding: "0.85rem 1rem", 
                        border: isVacationNoticeInsufficient ? "1.5px solid #ef4444" : (isDark ? "1px solid #334155" : "1px solid hsl(var(--border))"),
                        backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
                        color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
                        colorScheme: isDark ? "dark" : "light"
                      }} 
                    />
                  </div>

                  {requestType === "EARLY_LEAVE" ? (
                    <div key="leave-time">
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.leaveTime").toUpperCase()}</label>
                      <input name="leaveTime" type="time" className="input" required value={leaveTime} onChange={(e) => setLeaveTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light" }} />
                    </div>
                  ) : requestType === "LATE_ARRIVAL" ? (
                    <div key="arrival-time">
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.arrivalTime").toUpperCase()}</label>
                      <input name="arrivalTime" type="time" className="input" required value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light" }} />
                    </div>
                  ) : requestType === "PERMISSION" ? null : (
                    <div key="end-date">
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>{t("vacations.form.endDate").toUpperCase()}</label>
                      <input name="endDate" type="date" className="input" required value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", colorScheme: isDark ? "dark" : "light" }} />
                    </div>
                  )}
                </div>

                {/* Checkbox Card de Aprobación Previa para Llegar Tarde */}
                {requestType === "LATE_ARRIVAL" && (
                  <div 
                    style={{
                      padding: "1rem 1.25rem",
                      borderRadius: "0.875rem",
                      backgroundColor: isPreApproved 
                        ? (isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.1)") 
                        : (isDark ? "rgba(249, 115, 22, 0.06)" : "rgba(249, 115, 22, 0.08)"),
                      border: isPreApproved 
                        ? (isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(16, 185, 129, 0.4)") 
                        : (isDark ? "1px solid rgba(249, 115, 22, 0.25)" : "1px solid rgba(249, 115, 22, 0.35)"),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setIsPreApproved(!isPreApproved)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <input
                        type="checkbox"
                        id="isPreApproved"
                        checked={isPreApproved}
                        onChange={(e) => setIsPreApproved(e.target.checked)}
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          accentColor: "#10b981"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <label 
                          htmlFor="isPreApproved" 
                          style={{ 
                            fontSize: "14px", 
                            fontWeight: 700, 
                            color: isPreApproved 
                              ? (isDark ? "#34d399" : "#059669") 
                              : (isDark ? "#fdba74" : "#c2410c"), 
                            cursor: "pointer",
                            display: "block"
                          }}
                        >
                          {t("vacations.form.preApprovedLabel")}
                        </label>
                        <p style={{ margin: "0.15rem 0 0", fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.4 }}>
                          {isPreApproved ? t("vacations.form.preApprovedHelpYes") : t("vacations.form.preApprovedHelpNo")}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "0.25rem 0.65rem",
                      borderRadius: "999px",
                      backgroundColor: isPreApproved 
                        ? (isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.15)") 
                        : (isDark ? "rgba(249, 115, 22, 0.15)" : "rgba(249, 115, 22, 0.15)"),
                      color: isPreApproved 
                        ? (isDark ? "#10b981" : "#059669") 
                        : (isDark ? "#f97316" : "#c2410c"),
                      border: isPreApproved 
                        ? "1px solid rgba(16, 185, 129, 0.3)" 
                        : "1px solid rgba(249, 115, 22, 0.3)",
                      whiteSpace: "nowrap"
                    }}>
                      {isPreApproved ? `✓ ${t("vacations.form.preApprovedBadgeYes")}` : `✕ ${t("vacations.form.preApprovedBadgeNo")}`}
                    </span>
                  </div>
                )}

                {/* Asistente y Resumen para Licencia por Matrimonio (5 días laborables RD) */}
                {requestType === "MARRIAGE_LEAVE" && (
                  <div className="animate-in" style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "0.875rem",
                    backgroundColor: isDark ? "rgba(225, 29, 72, 0.08)" : "rgba(225, 29, 72, 0.05)",
                    border: isDark ? "1px solid rgba(225, 29, 72, 0.25)" : "1px solid rgba(225, 29, 72, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "14px", fontWeight: 700, color: isDark ? "#fda4af" : "#be123c" }}>
                        <Heart size={16} fill={isDark ? "#fda4af" : "#e11d48"} color={isDark ? "#fda4af" : "#e11d48"} />
                        <span>{locale === "en" ? "Statutory Marriage Leave (5 working days)" : "Cálculo de Licencia por Matrimonio (5 días hábiles)"}</span>
                      </div>
                      {startDate && (!endDate || requestedDays !== 5) && (
                        <button
                          type="button"
                          onClick={handleAutoFillMarriageDays}
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "0.4rem 0.85rem",
                            borderRadius: "0.5rem",
                            backgroundColor: isDark ? "rgba(225, 29, 72, 0.2)" : "#e11d48",
                            color: "#ffffff",
                            border: isDark ? "1px solid rgba(225, 29, 72, 0.5)" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem"
                          }}
                        >
                          <span>📅</span>
                          <span>{locale === "en" ? "Auto-select 5 statutory days" : "Calcular 5 días de ley automáticamente"}</span>
                        </button>
                      )}
                    </div>

                    {requestedDays > 0 ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        fontSize: "13px",
                        color: requestedDays === 5 ? (isDark ? "#34d399" : "#059669") : (isDark ? "#fbbf24" : "#b45309"),
                        fontWeight: 600
                      }}>
                        {requestedDays === 5 ? <Check size={16} color={isDark ? "#34d399" : "#059669"} /> : <Info size={16} color={isDark ? "#fbbf24" : "#b45309"} />}
                        <span>
                          {requestedDays === 5
                            ? (locale === "en"
                                ? "Exact 5 business days selected according to Dominican Labor Law."
                                : "Has seleccionado exactamente los 5 días laborables continuos que otorga la ley.")
                            : (locale === "en"
                                ? `You have selected ${requestedDays} business day${requestedDays !== 1 ? 's' : ''}. (Statutory provision is 5 paid business days).`
                                : `Has seleccionado ${requestedDays} día${requestedDays !== 1 ? 's' : ''} laborable${requestedDays !== 1 ? 's' : ''}. (La ley dominicana concede 5 días laborables completos).`)}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>
                        {locale === "en"
                          ? "Select the start date of your marriage leave to automatically calculate the statutory 5 business days."
                          : "Selecciona la fecha de inicio del permiso para calcular los 5 días laborables de conformidad con la ley."}
                      </div>
                    )}
                  </div>
                )}

                {/* Alerta de Norma de la Empresa: 25 días de anticipación */}
                {requestType === "VACATION" && !onBehalf && (
                  <div style={{ 
                    padding: "0.85rem 1.15rem", 
                    borderRadius: "0.75rem", 
                    backgroundColor: isVacationNoticeInsufficient 
                      ? (isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)") 
                      : (isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.08)"), 
                    border: isVacationNoticeInsufficient 
                      ? (isDark ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(239, 68, 68, 0.25)") 
                      : (isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(59, 130, 246, 0.25)"), 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: "0.75rem", 
                    fontSize: "14px" 
                  }}>
                    {isVacationNoticeInsufficient ? <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "0.1rem" }} /> : <Clock size={18} color={isDark ? "#60a5fa" : "#2563eb"} style={{ flexShrink: 0, marginTop: "0.1rem" }} />}
                    <span style={{ color: isVacationNoticeInsufficient ? (isDark ? "#fca5a5" : "#b91c1c") : (isDark ? "#e2e8f0" : "#1e40af"), fontWeight: 500, lineHeight: 1.5 }}>
                      {isVacationNoticeInsufficient 
                        ? t("vacations.vacationPolicyInsufficient", { date: minVacationNoticeDate.toLocaleDateString(locale === "en" ? "en-US" : "es-DO", { day: "numeric", month: "long", year: "numeric" }) })
                        : t("vacations.vacationPolicyNotice", { date: minVacationNoticeDate.toLocaleDateString(locale === "en" ? "en-US" : "es-DO", { day: "numeric", month: "long", year: "numeric" }) })
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de Días Solicitados para Vacaciones */}
            {requestType === "VACATION" && requestedDays > 0 && (
              <div className="animate-in" style={{ 
                padding: "1.15rem 1.35rem", 
                borderRadius: "0.875rem", 
                backgroundColor: requestedDays > effectiveBalance 
                  ? (isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)") 
                  : (isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)"), 
                border: requestedDays > effectiveBalance 
                  ? (isDark ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(239, 68, 68, 0.25)") 
                  : (isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(59, 130, 246, 0.25)"),
                display: "flex", 
                gap: "0.85rem", 
                alignItems: "flex-start"
              }}>
                <div style={{ marginTop: "0.1rem" }}>
                  {requestedDays > effectiveBalance ? <AlertTriangle size={20} color="#ef4444" /> : <CheckCircle size={20} color="#3b82f6" />}
                </div>
                {requestedDays > effectiveBalance ? (
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "15px", color: isDark ? "#f87171" : "#dc2626", fontWeight: 700 }}>{t("vacations.insufficientBalanceTitle")}</p>
                    <p style={{ margin: "0.3rem 0 0 0", fontSize: "14px", color: isDark ? "#fca5a5" : "#b91c1c", lineHeight: 1.5 }}>
                      {onBehalf ? t("vacations.insufficientBalanceOnBehalf", { balance: effectiveBalance, requested: requestedDays }) : t("vacations.insufficientBalanceSelf", { balance: effectiveBalance, requested: requestedDays })}
                    </p>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "15px", color: isDark ? "#f8fafc" : "hsl(var(--foreground))", fontWeight: 700 }}>{t("vacations.requestSummaryTitle")}</p>
                    <p style={{ margin: "0.3rem 0 0 0", fontSize: "14px", color: isDark ? "#cbd5e1" : "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
                      {locale === "en" ? (
                        <>Working days requested: <strong style={{ color: isDark ? "#ffffff" : "hsl(var(--foreground))" }}>{requestedDays}</strong>. Projected remaining balance: <strong style={{ color: isDark ? "#34d399" : "#059669" }}>{effectiveBalance - requestedDays}</strong> days.</>
                      ) : (
                        <>Días hábiles solicitados: <strong style={{ color: isDark ? "#ffffff" : "hsl(var(--foreground))" }}>{requestedDays}</strong>. Saldo proyectado restante: <strong style={{ color: isDark ? "#34d399" : "#059669" }}>{effectiveBalance - requestedDays}</strong> días.</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Zona de Documentación Adjunta (Drag & Drop) */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
            {t("vacations.supportingDocs")} {DOCUMENT_GUIDELINES[requestType] ? (
              <span style={{ color: "#f87171" }}>* {t("vacations.required")}</span>
            ) : (
              <span style={{ color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", fontWeight: 500 }}>{t("vacations.optional")}</span>
            )}
          </label>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: dragActive 
                ? "2px dashed #3b82f6" 
                : DOCUMENT_GUIDELINES[requestType] && !file 
                  ? "2px dashed rgba(239, 68, 68, 0.5)" 
                  : isDark ? "2px dashed #334155" : "2px dashed hsl(var(--border))",
              backgroundColor: dragActive 
                ? (isDark ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.05)") 
                : DOCUMENT_GUIDELINES[requestType] && !file 
                  ? (isDark ? "rgba(239, 68, 68, 0.04)" : "rgba(239, 68, 68, 0.03)") 
                  : isDark ? "#0f172a" : "hsl(var(--surface))",
              padding: "1.5rem",
              borderRadius: "0.875rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.25s ease",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="document"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,.webp,.msg,application/vnd.ms-outlook"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0])
                }
              }}
            />
            
            {file ? (
              <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "1rem", textAlign: "left" }}>
                {filePreviewUrl ? (
                  <div style={{ width: 48, height: 48, borderRadius: "0.65rem", overflow: "hidden", border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))", flexShrink: 0 }}>
                    <img src={filePreviewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "0.65rem", backgroundColor: file.name.toLowerCase().endsWith(".msg") ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: file.name.toLowerCase().endsWith(".msg") ? "#fbbf24" : "#60a5fa", flexShrink: 0 }}>
                    {file.name.toLowerCase().endsWith(".msg") ? <Mail size={24} /> : <FileText size={24} />}
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: isDark ? "#f8fafc" : "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "13px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    handleFileChange(null)
                  }}
                  style={{
                    border: "none",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#f87171",
                    cursor: "pointer",
                    padding: "0.6rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  title={t("vacations.removeFile")}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
                <UploadCloud size={32} style={{ color: DOCUMENT_GUIDELINES[requestType] ? "#3b82f6" : (isDark ? "#94a3b8" : "hsl(var(--muted-foreground))") }} />
                <div style={{ fontSize: "15px", fontWeight: 600, color: isDark ? "#f8fafc" : "hsl(var(--foreground))" }}>
                  {locale === "en" ? (
                    <>Drag and drop your file here or <span style={{ color: "#3b82f6", textDecoration: "underline" }}>browse your device</span></>
                  ) : (
                    <>Arrastra tu archivo aquí o <span style={{ color: "#3b82f6", textDecoration: "underline" }}>búscalo en tu equipo</span></>
                  )}
                </div>
                <div style={{ fontSize: "13px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>
                  {t("vacations.acceptedFormats")}
                </div>
              </div>
            )}
          </div>
          {fileError && (
            <div style={{ color: "#f87171", fontSize: "14px", marginTop: "0.4rem", fontWeight: 500 }}>
              {fileError}
            </div>
          )}
        </div>
        
        {/* Comentarios / Motivo */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: isDark ? "#e2e8f0" : "hsl(var(--foreground))" }}>
            {isRemoteIncident ? t("vacations.additionalNotesOptional") : t("vacations.commentsOptional")}
          </label>
          <textarea 
            name="reason" 
            className="input" 
            rows={3} 
            placeholder={isRemoteIncident ? t("vacations.additionalNotesPlaceholder") : t("vacations.reasonNormalPlaceholder")} 
            style={{ 
              resize: "none", 
              fontSize: "15px", 
              borderRadius: "0.75rem", 
              padding: "0.85rem 1rem",
              backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
              border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
              color: isDark ? "#f8fafc" : "hsl(var(--foreground))",
              lineHeight: 1.5
            }}
          />
        </div>

        {/* Mensaje de Feedback */}
        {message && (
          <div className="animate-in" style={{ 
            padding: "1rem 1.35rem", 
            borderRadius: "0.875rem", 
            backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: message.type === "success" ? "#34d399" : "#f87171",
            border: message.type === "success" ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
            fontSize: "15px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            {message.type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Botón de Envío Dinámico */}
        <button 
          type="submit" 
          disabled={loading || isBalanceExceeded} 
          style={{ 
            marginTop: "0.5rem", 
            width: "100%", 
            padding: "1.1rem", 
            fontSize: "16px", 
            borderRadius: "0.875rem", 
            border: "none",
            background: isRemoteIncident
              ? "linear-gradient(135deg, #f97316, #ea580c)"
              : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: "#ffffff", 
            fontWeight: 800,
            cursor: loading || isBalanceExceeded ? "not-allowed" : "pointer",
            opacity: loading || isBalanceExceeded ? 0.6 : 1,
            boxShadow: isRemoteIncident
              ? "0 6px 20px rgba(249, 115, 22, 0.35)"
              : "0 6px 20px rgba(59, 130, 246, 0.35)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "0.65rem",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {loading ? (
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
          ) : isRemoteIncident ? (
            <AlertOctagon size={18} />
          ) : (
            <Send size={18} />
          )}
          <span>
            {loading 
              ? t("vacations.sending") 
              : onBehalf && selectedEmployeeIds.length > 1
                ? `(${selectedEmployeeIds.length}) ${t(`vacations.types.${activeTypeItem.id}.label` as any) || activeTypeItem.label}`
                : isBalanceExceeded 
                  ? t("vacations.insufficientBalanceBtn") 
                  : t("vacations.sendRequest")}
          </span>
        </button>
      </form>

      {/* Modal de Confirmación para Registro Masivo */}
      {showMassConfirmModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "clamp(0.75rem, 2.5vw, 1.5rem)",
          overflowY: "auto"
        }}>
          <div 
            className="animate-in"
            style={{
              maxWidth: "520px",
              width: "100%",
              maxHeight: "min(92vh, 720px)",
              overflowY: "auto",
              backgroundColor: isDark ? "#0f172a" : "hsl(var(--surface))",
              border: isDark ? "1px solid #3b82f6" : "1px solid hsl(var(--border))",
              borderRadius: "1.25rem",
              boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.9)" : "0 20px 45px -10px rgba(0, 0, 0, 0.15)",
              padding: "clamp(1.25rem, 3vw, 1.75rem)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              minWidth: 0,
              boxSizing: "border-box"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "1rem",
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <Users size={24} color="#60a5fa" />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: isDark ? "#f8fafc" : "hsl(var(--foreground))" }}>
                  {t("vacations.confirmMassTitle")}
                </h3>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "13px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))" }}>
                  {t("vacations.confirmMassSub")}
                </p>
              </div>
            </div>

            <div style={{
              padding: "1.1rem",
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.6)" : "hsl(var(--muted) / 0.4)",
              border: isDark ? "1px solid rgba(51, 65, 85, 0.6)" : "1px solid hsl(var(--border))",
              borderRadius: "0.875rem",
              fontSize: "14.5px",
              color: isDark ? "#cbd5e1" : "hsl(var(--foreground))",
              lineHeight: 1.5,
              wordBreak: "break-word"
            }}>
              {locale === "en" ? (
                <>Do you want to apply the request <strong style={{ color: activeTypeItem.color }}>{t(`vacations.types.${activeTypeItem.id}.label` as any) || activeTypeItem.label}</strong> to <strong style={{ color: "#60a5fa" }}>{selectedEmployeeIds.length} colleagues</strong> from the team?</>
              ) : (
                <>¿Deseas aplicar la incidencia <strong style={{ color: activeTypeItem.color }}>{activeTypeItem.label}</strong> a <strong style={{ color: "#60a5fa" }}>{selectedEmployeeIds.length} colaboradores</strong> del equipo?</>
              )}
              
              <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: isDark ? "1px solid rgba(51, 65, 85, 0.5)" : "1px solid hsl(var(--border))", fontSize: "12.5px", color: isDark ? "#94a3b8" : "hsl(var(--muted-foreground))", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div><strong>{t("vacations.confirmMassSchedule")}</strong> {isRemoteIncident ? `${incidentDate} (${incidentStartTime || "--"} a ${incidentEndTime || "--"}${incidentExactHours && incidentExactHours !== "--" ? ` - ${incidentExactHours}` : ""})` : (startDate ? `${startDate} al ${endDate || startDate}` : "Fecha actual")}</div>
                <div><strong>{t("vacations.confirmMassApproval")}</strong> {autoApprove ? t("vacations.confirmMassAutoApproved") : t("vacations.confirmMassPending")}</div>
                <div><strong>{locale === "en" ? "Bonus Impact:" : "Impacto en Bono:"}</strong> {affectsBonus ? (locale === "en" ? "⚠️ Affects Attendance/Punctuality Bonus" : "⚠️ Sí afecta bono de asistencia/puntualidad") : (locale === "en" ? "✓ No bonus impact" : "✓ No afecta bono")}</div>
                <div><strong>{t("vacations.confirmMassSelected")}</strong> {selectedEmployeeIds.slice(0, 5).map(id => employees.find(e => e.id === id)?.name || id).join(", ")}{selectedEmployeeIds.length > 5 ? t("vacations.confirmMassAndMore", { count: selectedEmployeeIds.length - 5 }) : ""}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setShowMassConfirmModal(false)
                  setLoading(false)
                }}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.75rem",
                  backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "hsl(var(--muted))",
                  border: isDark ? "1px solid #334155" : "1px solid hsl(var(--border))",
                  color: isDark ? "#cbd5e1" : "hsl(var(--foreground))",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flex: "1 1 auto",
                  textAlign: "center"
                }}
              >
                {t("vacations.confirmMassCancel")}
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (pendingFormData) {
                    await executeSubmission(pendingFormData)
                  }
                }}
                disabled={loading}
                style={{
                  padding: "0.75rem 1.35rem",
                  borderRadius: "0.75rem",
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                  flex: "1 1 auto"
                }}
              >
                {loading ? (
                  <span>{t("vacations.confirmMassSubmitting")}</span>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{t("vacations.confirmMassSubmit", { count: selectedEmployeeIds.length })}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
