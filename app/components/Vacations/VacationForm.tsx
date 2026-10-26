"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Send, 
  CalendarDays, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Stethoscope,
  HeartPulse,
  Baby,
  HeartHandshake,
  UploadCloud,
  Trash2,
  FileText,
  Paperclip,
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
  // 4. Reposición de Horas - Turquesa / Teal (#14b8a6)
  {
    id: "HOURS_MAKEUP",
    label: "Reposición de Horas",
    sub: "Recuperar tiempo ausente previamente",
    color: "#14b8a6",
    category: "LEAVE",
    icon: RotateCcw,
    isFrequent: true,
    frequentOrder: 4
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
  
  // Solicitar en nombre de otro empleado (para Managers/Supervisores)
  const [onBehalf, setOnBehalf] = useState(false)
  const [targetUserId, setTargetUserId] = useState("")
  const [autoApprove, setAutoApprove] = useState(true)

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

  const selectedEmployee = employees.find(e => e.id === targetUserId)
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
    return nameMatch || emailMatch || projectMatch
  })

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
      setFileError("El tamaño del archivo supera el límite permitido de 25MB.")
      setFile(null)
      return
    }

    const ext = selectedFile.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"]
    if (!ext || !allowedExtensions.includes(ext)) {
      setFileError("Formato de archivo no permitido. Solo se aceptan PDF, JPG, JPEG y PNG.")
      setFile(null)
      return
    }

    setFile(selectedFile)

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile)
      setFilePreviewUrl(url)
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
    if (!startDate || !endDate || requestType !== "VACATION") return 0
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

  const requestedDays = calculateDays()

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (onBehalf && !targetUserId) {
      setMessage({ type: "error", text: "Debes buscar y seleccionar un empleado de la lista para registrar la solicitud." })
      setLoading(false)
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
        setLoading(false)
        return
      }
    }

    if (requestType === "VACATION") {
      const currentBalance = effectiveBalance
      if (currentBalance >= MIN_VACATION_DAYS) {
        if (requestedDays < MIN_VACATION_DAYS) {
          setMessage({
            type: "error",
            text: `Las solicitudes de vacaciones deben ser de un mínimo de ${MIN_VACATION_DAYS} días laborables consecutivos, de acuerdo con la política de la empresa.`
          })
          setLoading(false)
          return
        }
      } else {
        if (requestedDays !== currentBalance) {
          setMessage({
            type: "error",
            text: `Tu saldo disponible es de ${currentBalance} día${currentBalance !== 1 ? 's' : ''}. Cuando el saldo es menor a ${MIN_VACATION_DAYS} días, debes solicitar la totalidad de los días restantes (${currentBalance} día${currentBalance !== 1 ? 's' : ''}).`
          })
          setLoading(false)
          return
        }
      }
    }

    // Documentación requerida
    const isDocumentRequired = !!DOCUMENT_GUIDELINES[requestType]
    if (isDocumentRequired && !file) {
      setMessage({ type: "error", text: "La documentación de respaldo es obligatoria para este tipo de solicitud." })
      setLoading(false)
      return
    }
    
    const formData = new FormData(e.currentTarget)
    if (file) {
      formData.set("document", file)
    }

    if (onBehalf) {
      formData.set("targetUserId", targetUserId)
      formData.set("autoApprove", autoApprove ? "true" : "false")
    }

    if (isRemoteIncident) {
      if (!incidentDate) {
        setMessage({ type: "error", text: "Debes seleccionar la fecha de la falla." })
        setLoading(false)
        return
      }
      if (!incidentStartTime || !incidentEndTime) {
        setMessage({ type: "error", text: "Debes ingresar la hora en que empezó y la hora en que terminó la falla." })
        setLoading(false)
        return
      }

      formData.set("incidentDate", incidentDate)
      formData.set("incidentStartTime", incidentStartTime)
      formData.set("incidentEndTime", incidentEndTime)
      formData.set("incidentExactHours", incidentExactHours)
      formData.set("startDate", `${incidentDate}T${incidentStartTime}`)
      formData.set("endDate", `${incidentDate}T${incidentEndTime}`)
      formData.set("incidentContext", incidentContext)
      formData.set("incidentNeedsItReview", incidentNeedsItReview ? "true" : "false")
    } else if (requestType === "PERMISSION") {
      formData.set("specialType", specialType)
      if (specialType === "HOURS") {
        formData.set("exitTime", exitTime)
        formData.set("returnTime", returnTime)
        formData.set("hoursRequested", hoursRequested)
      }
    } else if (requestType === "HOURS_MAKEUP") {
      formData.set("absenceDate", absenceDate)
      formData.set("hoursToMakeUp", hoursToMakeUp)
      formData.set("makeupDate", makeupDate)
      formData.set("makeupStartTime", makeupStartTime)
      formData.set("makeupEndTime", makeupEndTime)
    }

    try {
      const result = await createTimeOffRequest(formData)
      
      setLoading(false)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ 
          type: "success", 
          text: isRemoteIncident
            ? "Reporte de incidencia enviado con éxito a tu supervisor y soporte IT."
            : onBehalf 
              ? `Solicitud enviada exitosamente para ${selectedEmployee?.name || "el empleado"}.`
              : "Solicitud enviada correctamente." 
        })
        setStartDate("")
        setEndDate("")
        setLeaveTime("")
        setSpecialType("FULL")
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
        setTargetUserId("")
        setSearchTerm("")
        setOnBehalf(false)
        handleFileChange(null)
      }
    } catch (err: any) {
      setLoading(false)
      setMessage({ type: "error", text: "Error inesperado al enviar la solicitud." })
    }
  }

  return (
    <div 
      className="card glass animate-in" 
      style={{ 
        height: "fit-content", 
        padding: "0", 
        overflow: "visible", 
        borderRadius: "1.25rem", 
        border: "1px solid #1e293b", 
        backgroundColor: "#0b0f19",
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        position: "relative", 
        zIndex: 10 
      }}
    >
      {/* Header Corporativo Moderno */}
      <div style={{
        padding: "1.5rem 1.75rem",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
        borderBottom: "1px solid #1e293b",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        borderTopLeftRadius: "1.25rem",
        borderTopRightRadius: "1.25rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: "0.875rem", 
            padding: "0.65rem",
            boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <CalendarDays size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "#f8fafc", letterSpacing: "-0.02em" }}>
              Nueva Solicitud
            </h2>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "14px", color: "#94a3b8" }}>
              {onBehalf ? "Registrando solicitud a nombre de un empleado" : "Selecciona el tipo de gestión y completa los detalles requeridos"}
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
      
      <form onSubmit={handleSubmit} style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.75rem", overflow: "visible" }}>
        
        <input type="hidden" name="projectName" value={projectName || ""} />
        <input type="hidden" name="type" value={requestType} />

        {/* Control On-Behalf para Managers / Supervisores */}
        {canCreateForOthers && employees.length > 0 && (
          <div className="animate-in" style={{
            padding: "1.25rem",
            borderRadius: "1rem",
            backgroundColor: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            position: "relative",
            zIndex: 50
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "14px", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                <Users size={17} />
                <span>Modo de Registro Administrado</span>
              </div>
              <span style={{ fontSize: "12px", backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#93c5fd", padding: "0.25rem 0.65rem", borderRadius: "9999px", fontWeight: 700, border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                Supervisión / IT / RRHH
              </span>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "15px", cursor: "pointer", fontWeight: !onBehalf ? 700 : 500, color: !onBehalf ? "#f8fafc" : "#94a3b8" }}>
                <input 
                  type="radio" 
                  name="onBehalfMode" 
                  checked={!onBehalf} 
                  onChange={() => { setOnBehalf(false); setTargetUserId(""); setSearchTerm(""); }} 
                  style={{ width: "17px", height: "17px", accentColor: "#3b82f6" }}
                />
                <span>Para mí mismo</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "15px", cursor: "pointer", fontWeight: onBehalf ? 700 : 500, color: onBehalf ? "#60a5fa" : "#94a3b8" }}>
                <input 
                  type="radio" 
                  name="onBehalfMode" 
                  checked={onBehalf} 
                  onChange={() => setOnBehalf(true)} 
                  style={{ width: "17px", height: "17px", accentColor: "#3b82f6" }}
                />
                <span>Registrar en nombre de un empleado</span>
              </label>
            </div>

            {onBehalf && (
              <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.25rem", borderTop: "1px solid rgba(51, 65, 85, 0.5)", paddingTop: "1rem" }}>
                <div ref={employeeDropdownRef} style={{ position: "relative" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "15px", color: "#e2e8f0" }}>
                    Buscar o Seleccionar Empleado *
                  </label>

                  <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "1.1rem", color: "#94a3b8", pointerEvents: "none" }} />
                    <input
                      type="text"
                      className="input"
                      placeholder="Escribe el nombre o correo del empleado..."
                      value={selectedEmployee ? (selectedEmployee.name || selectedEmployee.email || "") : searchTerm}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        if (targetUserId) setTargetUserId("")
                        setIsDropdownOpen(true)
                      }}
                      style={{
                        fontSize: "15px",
                        borderRadius: "0.75rem",
                        padding: "0.85rem 2.75rem 0.85rem 3rem",
                        width: "100%",
                        fontWeight: 600,
                        border: selectedEmployee ? "2px solid #3b82f6" : "1px solid #334155",
                        backgroundColor: "#0f172a",
                        color: "#f8fafc"
                      }}
                    />
                    {(selectedEmployee || searchTerm) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetUserId("")
                          setSearchTerm("")
                          setIsDropdownOpen(true)
                        }}
                        style={{
                          position: "absolute",
                          right: "0.85rem",
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "0.35rem"
                        }}
                        title="Limpiar búsqueda"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown flotante con resultados filtrados */}
                  {isDropdownOpen && !selectedEmployee && (
                    <div 
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.45rem)",
                        left: 0,
                        right: 0,
                        maxHeight: "280px",
                        overflowY: "auto",
                        backgroundColor: "#0f172a",
                        color: "#f8fafc",
                        border: "1px solid #3b82f6",
                        borderRadius: "0.875rem",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.95)",
                        zIndex: 9999,
                        padding: "0.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem"
                      }}
                    >
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setTargetUserId(emp.id)
                              setSearchTerm(emp.name || emp.email || "")
                              setIsDropdownOpen(false)
                            }}
                            style={{
                              padding: "0.85rem 1rem",
                              borderRadius: "0.65rem",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "all 0.15s ease",
                              backgroundColor: targetUserId === emp.id ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.5)",
                              border: targetUserId === emp.id ? "1px solid #3b82f6" : "1px solid rgba(51, 65, 85, 0.4)"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                              <div style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                color: "#60a5fa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "15px",
                                flexShrink: 0
                              }}>
                                {(emp.name || emp.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>
                                  {emp.name || emp.email}
                                </div>
                                {emp.email && <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "0.2rem" }}>{emp.email}</div>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                              <span style={{ 
                                fontSize: "13px", 
                                fontWeight: 800, 
                                backgroundColor: "rgba(59, 130, 246, 0.2)", 
                                color: "#93c5fd",
                                padding: "0.25rem 0.6rem",
                                borderRadius: "0.5rem"
                              }}>
                                {emp.vacationBalance} días
                              </span>
                              {emp.project?.name && (
                                <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                                  {emp.project.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "1.25rem", fontSize: "14px", color: "#94a3b8", textAlign: "center", fontWeight: 600 }}>
                          No se encontraron empleados coincidentes.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedEmployee && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "0.85rem 1.15rem", borderRadius: "0.75rem", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <UserCheck size={18} color="#3b82f6" />
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>Empleado: {selectedEmployee.name}</span>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#10b981" }}>{selectedEmployee.vacationBalance} <span style={{ fontSize: "13px" }}>días disponibles</span></span>
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "14px", cursor: "pointer", color: "#e2e8f0", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#3b82f6" }}
                  />
                  <span>Aprobar automáticamente e impactar el saldo (Recomendado para ausencias ya tomadas)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* 1. Selector de Categorías (Pills / Segmented Tabs) */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <label style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#e2e8f0", letterSpacing: "0.02em", textTransform: "uppercase" }}>
              Categoría de Solicitud
            </label>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              Mostrando {displayedTypes.length} de {REQUEST_TYPES.length} opciones
            </span>
          </div>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            padding: "0.35rem",
            borderRadius: "0.875rem",
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b"
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
                    border: isSelected ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid transparent",
                    backgroundColor: isSelected ? "#1e293b" : "transparent",
                    color: isSelected ? "#ffffff" : "#94a3b8",
                    boxShadow: isSelected ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = "#f8fafc"
                      e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = "#94a3b8"
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  <span>{cat.label}</span>
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
            <label style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#e2e8f0", letterSpacing: "0.02em", textTransform: "uppercase" }}>
              Tipo de Gestión Específica
            </label>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
            gap: "0.85rem", 
            width: "100%"
          }}>
            {displayedTypes.map((t) => {
              const IconComponent = t.icon
              const isSelected = requestType === t.id
              const isHovered = hoveredCardId === t.id

              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setRequestType(t.id)}
                  onMouseEnter={() => setHoveredCardId(t.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    padding: "1.1rem 1.15rem",
                    borderRadius: "0.875rem",
                    border: isSelected 
                      ? `2px solid ${t.color}` 
                      : isHovered 
                        ? `1px solid ${t.color}88` 
                        : "1px solid rgba(51, 65, 85, 0.6)",
                    backgroundColor: isSelected 
                      ? "rgba(30, 41, 59, 0.95)" 
                      : isHovered 
                        ? "rgba(30, 41, 59, 0.7)" 
                        : "rgba(17, 24, 39, 0.7)",
                    backgroundImage: isSelected ? `radial-gradient(circle at top right, ${t.color}22, transparent 70%)` : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: (isHovered && !isSelected) ? "translateY(-3px)" : "none",
                    boxShadow: isSelected 
                      ? `0 12px 28px -4px ${t.color}40, 0 4px 12px -2px ${t.color}25` 
                      : isHovered 
                        ? `0 10px 22px -4px ${t.color}22` 
                        : "0 2px 6px rgba(0,0,0,0.25)",
                    position: "relative",
                    outline: "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                      <div style={{ 
                        backgroundColor: isSelected ? t.color : `${t.color}22`, 
                        color: isSelected ? "#ffffff" : t.color,
                        width: "38px",
                        height: "38px",
                        borderRadius: "0.65rem",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: isSelected ? `0 4px 12px ${t.color}60` : "none"
                      }}>
                        <IconComponent size={20} />
                      </div>
                      
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: "17px", 
                        color: "#f8fafc",
                        lineHeight: 1.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {t.label}
                      </span>
                    </div>

                    {/* Indicador de seleccionado */}
                    {isSelected && (
                      <div style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: t.color,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 2px 8px ${t.color}66`
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <span style={{ 
                    fontSize: "13.5px", 
                    fontWeight: 500,
                    color: "#cbd5e1", 
                    lineHeight: 1.4,
                    display: "block",
                    width: "100%"
                  }}>
                    {t.sub}
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
                backgroundColor: "rgba(30, 41, 59, 0.6)",
                border: "1px dashed rgba(148, 163, 184, 0.35)",
                color: "#cbd5e1",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
                marginTop: "1rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.95)"
                e.currentTarget.style.borderColor = "#3b82f6"
                e.currentTarget.style.color = "#ffffff"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.6)"
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.35)"
                e.currentTarget.style.color = "#cbd5e1"
              }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={18} />
                  <span>Mostrar menos ↑</span>
                </>
              ) : (
                <>
                  <ChevronDown size={18} />
                  <span>Mostrar más incidencias (6) ↓</span>
                </>
              )}
            </button>
          )}
        </div>

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
              <span>Documentación de Respaldo Obligatoria</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#e2e8f0", lineHeight: 1.5 }}>
              Para procesar esta solicitud es obligatorio adjuntar al menos uno de los siguientes justificantes oficiales:
            </p>
            <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.6 }}>
              {DOCUMENT_GUIDELINES[requestType].map((doc, idx) => (
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
            backgroundColor: "rgba(30, 41, 59, 0.4)",
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
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                  Reporte Prioritario de Teletrabajo
                </div>
                <div style={{ fontSize: "13.5px", color: "#cbd5e1", marginTop: "0.15rem" }}>
                  Esta incidencia técnica se notificará inmediatamente para justificar la interrupción de labores. No aplica la regla de 25 días.
                </div>
              </div>
            </div>

            {/* Fecha de la Falla (Izquierda) y Horario Exacto con Cálculo de Horas (Derecha) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1.25rem", alignItems: "flex-start" }} className="remote-incident-time-grid">
              <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                  .remote-incident-time-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}} />
              {/* Columna Izquierda: Fecha de la Falla */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
                  Fecha de la Falla *
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
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    color: "#f8fafc",
                    colorScheme: "dark"
                  }} 
                />
              </div>

              {/* Columna Derecha: Hora en que Empezó, Hora en que Terminó y Horas Exactas */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.15fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0", whiteSpace: "nowrap" }}>
                      Hora Inicio *
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
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        color: "#f8fafc",
                        colorScheme: "dark"
                      }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0", whiteSpace: "nowrap" }}>
                      Hora Término *
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
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        color: "#f8fafc",
                        colorScheme: "dark"
                      }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0", whiteSpace: "nowrap" }}>
                      Horas Exactas
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
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        border: incidentExactHours && incidentExactHours !== "--" ? "1px solid #f97316" : "1px solid #334155",
                        color: incidentExactHours && incidentExactHours !== "--" ? "#fb923c" : "#94a3b8",
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
                  {activeTypeItem.remoteContextLabel}
                </label>
                <input 
                  type="text" 
                  name="incidentContext" 
                  required 
                  placeholder={activeTypeItem.remoteContextPlaceholder} 
                  value={incidentContext} 
                  onChange={(e) => setIncidentContext(e.target.value)} 
                  style={{ 
                    fontSize: "15px", 
                    borderRadius: "0.75rem", 
                    padding: "0.85rem 1rem", 
                    width: "100%",
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    color: "#f8fafc"
                  }} 
                />
              </div>
            )}

            {/* Toggle Condicional para Avería de Hardware/PC */}
            {activeTypeItem.hasHardwareReviewToggle && (
              <div style={{
                padding: "1rem 1.25rem",
                borderRadius: "0.75rem",
                backgroundColor: incidentNeedsItReview ? "rgba(239, 68, 68, 0.15)" : "rgba(15, 23, 42, 0.6)",
                border: incidentNeedsItReview ? "1px solid #ef4444" : "1px solid #334155",
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
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                      Requiere reemplazo o revisión de equipo por IT
                    </div>
                    <div style={{ fontSize: "13.5px", color: "#cbd5e1", marginTop: "0.2rem" }}>
                      Marca esta casilla si tu PC, laptop o cargador sufrió daño que amerita entrega de equipo de relevo o servicio técnico presencial.
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
              <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: "1px solid #334155", padding: "1.25rem", borderRadius: "0.875rem", backgroundColor: "rgba(30, 41, 59, 0.35)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>HORA INICIO</label>
                    <input type="time" className="input" required value={exitTime} onChange={(e) => setExitTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>HORA FINAL</label>
                    <input type="time" className="input" required value={returnTime} onChange={(e) => setReturnTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>CANTIDAD HORAS</label>
                    <input 
                      type="text" 
                      readOnly 
                      className="input" 
                      value={hoursRequested ? `${hoursRequested} hrs` : "--"} 
                      style={{ 
                        fontSize: "15px", 
                        borderRadius: "0.75rem", 
                        padding: "0.85rem 1rem", 
                        backgroundColor: "rgba(15, 23, 42, 0.8)", 
                        cursor: "not-allowed",
                        fontWeight: 800,
                        color: "#818cf8",
                        border: "1px solid #334155"
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campos Condicionales de Reposición de Horas */}
            {requestType === "HOURS_MAKEUP" && (
              <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: "1px solid #334155", padding: "1.25rem", borderRadius: "0.875rem", backgroundColor: "rgba(30, 41, 59, 0.35)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>FECHA AUSENCIA ORIGINAL</label>
                    <input type="date" className="input" required value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>CANTIDAD DE HORAS A REPONER</label>
                    <input type="number" step="0.5" min="0.5" className="input" placeholder="Ej: 4" required value={hoursToMakeUp} onChange={(e) => setHoursToMakeUp(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc" }} />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #334155", paddingTop: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 700, fontSize: "15px", color: "#2dd4bf" }}>
                    Propuesta de Recuperación de Horas
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>FECHA PROPUESTA</label>
                      <input type="date" className="input" required value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>HORA INICIO</label>
                      <input type="time" className="input" required value={makeupStartTime} onChange={(e) => setMakeupStartTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>HORA FINAL</label>
                      <input type="time" className="input" required value={makeupEndTime} onChange={(e) => setMakeupEndTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fechas de Solicitud Estándar */}
            {requestType !== "HOURS_MAKEUP" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: requestType === "PERMISSION" ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
                      {requestType === "EARLY_LEAVE" || requestType === "PERMISSION" ? "FECHA" : "FECHA INICIO *"}
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
                        border: isVacationNoticeInsufficient ? "1.5px solid #ef4444" : "1px solid #334155",
                        backgroundColor: "#0f172a",
                        color: "#f8fafc",
                        colorScheme: "dark"
                      }} 
                    />
                  </div>

                  {requestType === "EARLY_LEAVE" ? (
                    <div key="leave-time">
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>HORA DE SALIDA *</label>
                      <input name="leaveTime" type="time" className="input" required value={leaveTime} onChange={(e) => setLeaveTime(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                    </div>
                  ) : requestType === "PERMISSION" ? null : (
                    <div key="end-date">
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>FECHA FIN *</label>
                      <input name="endDate" type="date" className="input" required value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ fontSize: "15px", borderRadius: "0.75rem", padding: "0.85rem 1rem", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f8fafc", colorScheme: "dark" }} />
                    </div>
                  )}
                </div>

                {/* Alerta de Norma de la Empresa: 25 días de anticipación */}
                {requestType === "VACATION" && !onBehalf && (
                  <div style={{ 
                    padding: "0.85rem 1.15rem", 
                    borderRadius: "0.75rem", 
                    backgroundColor: isVacationNoticeInsufficient ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.12)", 
                    border: isVacationNoticeInsufficient ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(59, 130, 246, 0.3)", 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: "0.75rem", 
                    fontSize: "14px" 
                  }}>
                    {isVacationNoticeInsufficient ? <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "0.1rem" }} /> : <Clock size={18} color="#60a5fa" style={{ flexShrink: 0, marginTop: "0.1rem" }} />}
                    <span style={{ color: isVacationNoticeInsufficient ? "#fca5a5" : "#e2e8f0", fontWeight: 500, lineHeight: 1.5 }}>
                      {isVacationNoticeInsufficient 
                        ? `No se pueden solicitar vacaciones para esta fecha. Deben solicitarse con al menos 25 días de anticipación (Fecha mínima permitida: ${minVacationNoticeDate.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}).`
                        : `Norma de la empresa: Las vacaciones deben solicitarse con un mínimo de 25 días de anticipación (Fecha mínima disponible: ${minVacationNoticeDate.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}).`
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
                backgroundColor: requestedDays > effectiveBalance ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.1)", 
                border: requestedDays > effectiveBalance ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(59, 130, 246, 0.3)",
                display: "flex", 
                gap: "0.85rem", 
                alignItems: "flex-start"
              }}>
                <div style={{ marginTop: "0.1rem" }}>
                  {requestedDays > effectiveBalance ? <AlertTriangle size={20} color="#ef4444" /> : <CheckCircle size={20} color="#3b82f6" />}
                </div>
                {requestedDays > effectiveBalance ? (
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "15px", color: "#f87171", fontWeight: 700 }}>Balance insuficiente</p>
                    <p style={{ margin: "0.3rem 0 0 0", fontSize: "14px", color: "#fca5a5", lineHeight: 1.5 }}>
                      {onBehalf ? `El empleado dispone de ${effectiveBalance} días laborales e intentas solicitar ${requestedDays}.` : `Estás solicitando ${requestedDays} días laborales, pero solo dispones de ${effectiveBalance}.`}
                    </p>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "15px", color: "#f8fafc", fontWeight: 700 }}>Resumen de Solicitud</p>
                    <p style={{ margin: "0.3rem 0 0 0", fontSize: "14px", color: "#cbd5e1", lineHeight: 1.5 }}>
                      Días hábiles solicitados: <strong style={{ color: "#ffffff" }}>{requestedDays}</strong>. Saldo proyectado restante: <strong style={{ color: "#34d399" }}>{effectiveBalance - requestedDays}</strong> días.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Zona de Documentación Adjunta (Drag & Drop) */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
            Documentación de Soporte {DOCUMENT_GUIDELINES[requestType] ? (
              <span style={{ color: "#f87171" }}>* (Obligatorio)</span>
            ) : (
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>(Opcional)</span>
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
                  : "2px dashed #334155",
              backgroundColor: dragActive 
                ? "rgba(59, 130, 246, 0.08)" 
                : DOCUMENT_GUIDELINES[requestType] && !file 
                  ? "rgba(239, 68, 68, 0.04)" 
                  : "#0f172a",
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
              accept=".pdf,image/png,image/jpeg,image/jpg"
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
                  <div style={{ width: 48, height: 48, borderRadius: "0.65rem", overflow: "hidden", border: "1px solid #334155", flexShrink: 0 }}>
                    <img src={filePreviewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "0.65rem", backgroundColor: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", flexShrink: 0 }}>
                    <FileText size={24} />
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "0.15rem" }}>
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
                  title="Eliminar archivo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
                <UploadCloud size={32} style={{ color: DOCUMENT_GUIDELINES[requestType] ? "#60a5fa" : "#94a3b8" }} />
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#f8fafc" }}>
                  Arrastra tu archivo aquí o <span style={{ color: "#60a5fa", textDecoration: "underline" }}>búscalo en tu equipo</span>
                </div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                  Formatos aceptados: PDF, PNG, JPG, JPEG (Máx. 25MB)
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
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>
            {isRemoteIncident ? "DETALLES O NOTAS ADICIONALES (OPCIONAL)" : "COMENTARIOS / MOTIVO (OPCIONAL)"}
          </label>
          <textarea 
            name="reason" 
            className="input" 
            rows={3} 
            placeholder={isRemoteIncident ? "Información adicional para soporte IT o supervisor..." : "Detalles o justificación sobre tu ausencia..."} 
            style={{ 
              resize: "none", 
              fontSize: "15px", 
              borderRadius: "0.75rem", 
              padding: "0.85rem 1rem",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              color: "#f8fafc",
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
          disabled={loading || (requestType === "VACATION" && requestedDays > effectiveBalance)} 
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
            cursor: loading || (requestType === "VACATION" && requestedDays > effectiveBalance) ? "not-allowed" : "pointer",
            opacity: loading || (requestType === "VACATION" && requestedDays > effectiveBalance) ? 0.6 : 1,
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
              ? "Enviando solicitud..." 
              : requestType === "VACATION" && requestedDays > effectiveBalance 
                ? "Saldo Insuficiente" 
                : isRemoteIncident 
                  ? "Reportar Incidencia de Teletrabajo" 
                  : "Enviar Solicitud"}
          </span>
        </button>
      </form>
    </div>
  )
}
