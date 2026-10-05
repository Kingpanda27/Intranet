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
  X
} from "lucide-react"
import { createTimeOffRequest } from "@/app/actions/timeOffActions"
import { useTheme } from "@/app/Providers"
import { MIN_VACATION_DAYS } from "@/lib/vacationPolicy"

const REQUEST_TYPES = [
  { id: "VACATION", label: "Vacaciones", sub: "Días libres anuales", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary))", icon: CalendarDays },
  { id: "PERMISSION", label: "Permiso Especial", sub: "Causas justificadas", color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)", border: "1px solid #a855f7", icon: CheckCircle },
  { id: "HOURS_MAKEUP", label: "Reposición de Horas", sub: "Recuperar tiempo ausente", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.08)", border: "1px solid #06b6d4", icon: Clock },
  { id: "EARLY_LEAVE", label: "Salir Temprano", sub: "Horas específicas", color: "#f97316", bg: "rgba(249, 115, 22, 0.08)", border: "1px solid #f97316", icon: Clock },
  { id: "SICK_LEAVE", label: "Enfermedad", sub: "Licencia médica corta", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "1px solid #ef4444", icon: Stethoscope },
  { id: "MEDICAL_LEAVE", label: "Licencia Médica", sub: "Incapacidad oficial", color: "#dc2626", bg: "rgba(220, 38, 38, 0.08)", border: "1px solid #dc2626", icon: HeartPulse },
  { id: "MATERNITY_LEAVE", label: "Maternidad", sub: "Pre y post natal", color: "#ec4899", bg: "rgba(236, 72, 153, 0.08)", border: "1px solid #ec4899", icon: Baby },
  { id: "PATERNITY_LEAVE", label: "Paternidad", sub: "Nacimiento de hijo", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", border: "1px solid #3b82f6", icon: Baby },
  { id: "BEREAVEMENT_LEAVE", label: "Fallecimiento", sub: "Fallecimiento familiar", color: "#4b5563", bg: "rgba(75, 85, 99, 0.08)", border: "1px solid #4b5563", icon: HeartHandshake }
]

const DOCUMENT_GUIDELINES: Record<string, string[]> = {
  SICK_LEAVE: ["Certificado médico", "Incapacidad médica", "Constancia médica"],
  MEDICAL_LEAVE: ["Certificado médico", "Incapacidad médica", "Licencia médica oficial"],
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
  const [requestType, setRequestType] = useState<string>("VACATION")
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
  
  // Solicitar en nombre de otro empleado (para Managers/Supervisores)
  const [onBehalf, setOnBehalf] = useState(false)
  const [targetUserId, setTargetUserId] = useState("")
  const [autoApprove, setAutoApprove] = useState(true)

  // Búsqueda autocompletada de empleados
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const employeeDropdownRef = useRef<HTMLDivElement>(null)

  // Auto-calcular cantidad de horas al cambiar HORA INICIO u HORA FINAL
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedEmployee = employees.find(e => e.id === targetUserId)
  const effectiveBalance = (onBehalf && selectedEmployee) ? selectedEmployee.vacationBalance : balance

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (onBehalf && !targetUserId) {
      setMessage({ type: "error", text: "Debes buscar y seleccionar un empleado de la lista para registrar la solicitud." })
      setLoading(false)
      return
    }

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

    // Validación de mínimo de días (política empresarial - legislación dominicana)
    if (requestType === "VACATION") {
      const currentBalance = effectiveBalance
      if (currentBalance >= MIN_VACATION_DAYS) {
        // Saldo suficiente: exigir el mínimo
        if (requestedDays < MIN_VACATION_DAYS) {
          setMessage({
            type: "error",
            text: `Las solicitudes de vacaciones deben ser de un mínimo de ${MIN_VACATION_DAYS} días laborables consecutivos, de acuerdo con la política de la empresa. Si únicamente te quedan menos de ${MIN_VACATION_DAYS} días disponibles, el sistema permitirá solicitarlos automáticamente.`
          })
          setLoading(false)
          return
        }
      } else {
        // Saldo menor al mínimo: solo se permite solicitar la totalidad
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

    if (requestType === "PERMISSION") {
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
          text: onBehalf 
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
        setTargetUserId("")
        setSearchTerm("")
        setOnBehalf(false)
        handleFileChange(null)
      }
    } catch (err: any) {
      setLoading(false)
      setMessage({ type: "error", text: "Error inesperado al enviar" })
    }
  }

  return (
    <div className="card glass animate-in" style={{ height: "fit-content", padding: "0", overflow: "visible", borderRadius: "1.25rem", border: "1px solid hsl(var(--border) / 0.8)", position: "relative", zIndex: 10 }}>
      {/* Header */}
      <div style={{
        padding: "1.5rem 1.75rem",
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))",
        borderBottom: "1px solid hsl(var(--primary) / 0.15)",
        display: "flex", alignItems: "center", gap: "0.875rem",
        borderTopLeftRadius: "1.25rem",
        borderTopRightRadius: "1.25rem"
      }}>
        <div style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
          borderRadius: "0.75rem", padding: "0.5rem",
          boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)"
        }}>
          <CalendarDays size={18} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Nueva Solicitud
          </h2>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
            {onBehalf ? "Registrando solicitud a nombre de un empleado" : "Completa los detalles para procesar tu tiempo libre"}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem", overflow: "visible" }}>
        
        <input type="hidden" name="projectName" value={projectName || ""} />
        <input type="hidden" name="type" value={requestType} />

        {/* Control On-Behalf para Managers / Supervisores */}
        {canCreateForOthers && employees.length > 0 && (
          <div className="animate-in" style={{
            padding: "1.15rem",
            borderRadius: "0.875rem",
            backgroundColor: "hsl(var(--primary) / 0.04)",
            border: "1px solid hsl(var(--primary) / 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            position: "relative",
            zIndex: 50
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, fontSize: "0.75rem", color: "hsl(var(--primary))", textTransform: "uppercase" }}>
                <Users size={16} />
                <span>Modo de Registro Administrado</span>
              </div>
              <span style={{ fontSize: "0.68rem", backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", padding: "0.2rem 0.5rem", borderRadius: "0.5rem", fontWeight: 700 }}>
                Supervisión / IT / RRHH
              </span>
            </div>

            <div style={{ display: "flex", gap: "1.25rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", fontWeight: !onBehalf ? 700 : 500 }}>
                <input 
                  type="radio" 
                  name="onBehalfMode" 
                  checked={!onBehalf} 
                  onChange={() => { setOnBehalf(false); setTargetUserId(""); setSearchTerm(""); }} 
                />
                <span>Para mí mismo</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", fontWeight: onBehalf ? 700 : 500, color: onBehalf ? "hsl(var(--primary))" : "inherit" }}>
                <input 
                  type="radio" 
                  name="onBehalfMode" 
                  checked={onBehalf} 
                  onChange={() => setOnBehalf(true)} 
                />
                <span>Registrar en nombre de un empleado</span>
              </label>
            </div>

            {onBehalf && (
              <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.25rem", borderTop: "1px solid hsl(var(--primary) / 0.15)", paddingTop: "0.85rem" }}>
                {/* Autocompletado buscador de empleados */}
                <div ref={employeeDropdownRef} style={{ position: "relative" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase" }}>
                    Buscar o Seleccionar Empleado *
                  </label>

                  <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: "1rem", color: "hsl(var(--muted-foreground))", pointerEvents: "none" }} />
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
                        fontSize: "0.875rem",
                        borderRadius: "0.75rem",
                        padding: "0.75rem 2.5rem 0.75rem 2.5rem",
                        width: "100%",
                        fontWeight: 600,
                        border: selectedEmployee ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--primary) / 0.4)",
                        backgroundColor: selectedEmployee ? "hsl(var(--primary) / 0.05)" : "hsl(var(--surface))"
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
                          right: "0.75rem",
                          background: "none",
                          border: "none",
                          color: "hsl(var(--muted-foreground))",
                          cursor: "pointer",
                          padding: "0.25rem"
                        }}
                        title="Limpiar búsqueda"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown flotante con resultados filtrados */}
                  {isDropdownOpen && !selectedEmployee && (
                    <div 
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.35rem)",
                        left: 0,
                        right: 0,
                        maxHeight: "260px",
                        overflowY: "auto",
                        backgroundColor: "#111827",
                        color: "#f8fafc",
                        border: "1px solid hsl(var(--primary) / 0.4)",
                        borderRadius: "0.875rem",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1)",
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
                              padding: "0.75rem 0.85rem",
                              borderRadius: "0.65rem",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "all 0.15s ease",
                              backgroundColor: targetUserId === emp.id ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.3)",
                              border: "1px solid hsl(var(--border) / 0.4)"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "hsl(var(--primary) / 0.15)"
                              e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = targetUserId === emp.id ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.3)"
                              e.currentTarget.style.borderColor = "hsl(var(--border) / 0.4)"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                backgroundColor: "hsl(var(--primary) / 0.18)",
                                color: "hsl(var(--primary))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                flexShrink: 0
                              }}>
                                {(emp.name || emp.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(var(--foreground))", lineHeight: 1.2 }}>
                                  {emp.name || emp.email}
                                </div>
                                {emp.email && <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>{emp.email}</div>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.15rem" }}>
                              <span style={{ 
                                fontSize: "0.72rem", 
                                fontWeight: 800, 
                                backgroundColor: "hsl(var(--primary) / 0.12)", 
                                color: "hsl(var(--primary))",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.4rem"
                              }}>
                                {emp.vacationBalance} días
                              </span>
                              {emp.project?.name && (
                                <div style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
                                  {emp.project.name}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "1rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", textAlign: "center", fontWeight: 600 }}>
                          No se encontraron empleados coincidentes.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedEmployee && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "hsl(var(--surface))", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <UserCheck size={16} color="hsl(var(--primary))" />
                      <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Empleado: {selectedEmployee.name}</span>
                    </div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>{selectedEmployee.vacationBalance} <span style={{ fontSize: "0.75rem" }}>días disponibles</span></span>
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.8rem", cursor: "pointer", color: "hsl(var(--foreground))", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "hsl(var(--primary))" }}
                  />
                  <span>Aprobar automáticamente e impactar el saldo (Recomendado para ausencias ya tomadas)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Type selection */}
        <div>
          <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Tipo de Solicitud
          </label>
          <style>
            {`
              .type-card-hover:hover {
                transform: translateY(-2px);
                border-color: hsl(var(--border));
              }
            `}
          </style>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
            gap: "0.75rem", 
            width: "100%"
          }}>
            {REQUEST_TYPES.map((t) => {
              const IconComponent = t.icon
              const isActive = requestType === t.id
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setRequestType(t.id)}
                  className={isActive ? "" : "type-card-hover"}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    padding: "1rem",
                    borderRadius: "0.875rem",
                    border: isActive ? t.border : "1px solid hsl(var(--border) / 0.6)",
                    backgroundColor: isActive ? t.bg : "hsl(var(--surface))",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: isActive ? `0 4px 12px ${t.color}22` : "0 2px 5px rgba(0,0,0,0.02)",
                    position: "relative",
                    outline: "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                    <div style={{ 
                      backgroundColor: isActive ? t.color : "hsl(var(--muted))", 
                      color: isActive ? "white" : "hsl(var(--muted-foreground))",
                      padding: "0.35rem",
                      borderRadius: "0.5rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s"
                    }}>
                      <IconComponent size={16} />
                    </div>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: "0.8rem", 
                      color: isActive ? t.color : "hsl(var(--foreground))",
                      lineHeight: 1.2
                    }}>
                      {t.label}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: "0.65rem", 
                    color: "hsl(var(--muted-foreground))", 
                    marginTop: "0.25rem",
                    lineHeight: 1.3 
                  }}>
                    {t.sub}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Warning Banner for Guidelines */}
        {DOCUMENT_GUIDELINES[requestType] && (
          <div className="animate-in" style={{
            padding: "1rem",
            borderRadius: "0.875rem",
            backgroundColor: "hsl(var(--primary) / 0.05)",
            border: "1px solid hsl(var(--primary) / 0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, fontSize: "0.8rem", color: "hsl(var(--primary))" }}>
              <Paperclip size={14} />
              <span>Documentación de Respaldo Requerida</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.4 }}>
              Es obligatorio adjuntar uno de los siguientes documentos de respaldo:
            </p>
            <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0, fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
              {DOCUMENT_GUIDELINES[requestType].map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Campos Condicionales de Permiso Especial */}
        {requestType === "PERMISSION" && (
          <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid hsl(var(--border)/0.5)", padding: "1rem", borderRadius: "0.875rem", backgroundColor: "hsl(var(--surface))" }}>
            <div className="animate-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>HORA INICIO</label>
                <input type="time" className="input" required value={exitTime} onChange={(e) => setExitTime(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", colorScheme: theme === "dark" ? "dark" : "light" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>HORA FINAL</label>
                <input type="time" className="input" required value={returnTime} onChange={(e) => setReturnTime(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", colorScheme: theme === "dark" ? "dark" : "light" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>CANTIDAD HORAS</label>
                <input 
                  type="text" 
                  readOnly 
                  className="input" 
                  value={hoursRequested ? `${hoursRequested} hrs` : "--"} 
                  style={{ 
                    fontSize: "0.875rem", 
                    borderRadius: "0.75rem", 
                    padding: "0.75rem 1rem", 
                    backgroundColor: "hsl(var(--muted) / 0.25)", 
                    cursor: "not-allowed",
                    fontWeight: 800,
                    color: "hsl(var(--primary))",
                    border: "1px solid hsl(var(--border) / 0.6)"
                  }} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Campos Condicionales de Reposición de Horas */}
        {requestType === "HOURS_MAKEUP" && (
          <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", border: "1px solid hsl(var(--border)/0.5)", padding: "1.25rem", borderRadius: "0.875rem", backgroundColor: "hsl(var(--surface))" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>FECHA AUSENCIA ORIGINAL</label>
                <input type="date" className="input" required value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>CANTIDAD DE HORAS A REPONER</label>
                <input type="number" step="0.5" min="0.5" className="input" placeholder="Ej: 4" required value={hoursToMakeUp} onChange={(e) => setHoursToMakeUp(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
              </div>
            </div>

            <div style={{ borderTop: "1px solid hsl(var(--border)/0.3)", paddingTop: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 800, fontSize: "0.75rem", color: "hsl(var(--primary))", letterSpacing: "0.02em" }}>
                Propuesta de Recuperación de Horas
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>FECHA PROPUESTA</label>
                  <input type="date" className="input" required value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>HORA INICIO</label>
                  <input type="time" className="input" required value={makeupStartTime} onChange={(e) => setMakeupStartTime(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>HORA FINAL</label>
                  <input type="time" className="input" required value={makeupEndTime} onChange={(e) => setMakeupEndTime(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fechas de Solicitud Estándar */}
        {requestType !== "HOURS_MAKEUP" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: requestType === "PERMISSION" ? "1fr" : "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>
                  {requestType === "EARLY_LEAVE" || requestType === "PERMISSION" ? "FECHA" : "FECHA INICIO"}
                </label>
                <input 
                  name="startDate" 
                  type="date" 
                  className="input" 
                  required 
                  min={requestType === "VACATION" && !onBehalf ? minVacationNoticeStr : undefined}
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", border: isVacationNoticeInsufficient ? "1.5px solid #ef4444" : undefined }} 
                />
              </div>
              {requestType === "EARLY_LEAVE" ? (
                <div key="leave-time">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>HORA DE SALIDA</label>
                  <input name="leaveTime" type="time" className="input" required value={leaveTime} onChange={(e) => setLeaveTime(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", colorScheme: theme === "dark" ? "dark" : "light" }} />
                </div>
              ) : requestType === "PERMISSION" ? null : (
                <div key="end-date">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>FECHA FIN</label>
                  <input name="endDate" type="date" className="input" required value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
                </div>
              )}
            </div>

            {requestType === "VACATION" && !onBehalf && (
              <div style={{ padding: "0.6rem 0.85rem", borderRadius: "0.625rem", backgroundColor: isVacationNoticeInsufficient ? "rgba(239, 68, 68, 0.1)" : "hsl(var(--primary) / 0.08)", border: isVacationNoticeInsufficient ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid hsl(var(--primary) / 0.2)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                {isVacationNoticeInsufficient ? <AlertTriangle size={14} color="#ef4444" /> : <Clock size={14} color="hsl(var(--primary))" />}
                <span style={{ color: isVacationNoticeInsufficient ? "#ef4444" : "hsl(var(--foreground))", fontWeight: 600 }}>
                  {isVacationNoticeInsufficient 
                    ? `No se pueden solicitar vacaciones para esta fecha. Deben solicitarse con al menos 25 días de anticipación (Fecha mínima permitida: ${minVacationNoticeDate.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}).`
                    : `Norma de la empresa: Las vacaciones deben solicitarse con un mínimo de 25 días de anticipación (Fecha mínima disponible: ${minVacationNoticeDate.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}).`
                  }
                </span>
              </div>
            )}
          </div>
        )}

        {/* Warning / Summary */}
        {requestType === "VACATION" && requestedDays > 0 && (
          <div className="animate-in" style={{ 
            padding: "1rem 1.25rem", 
            borderRadius: "0.875rem", 
            backgroundColor: requestedDays > effectiveBalance ? "rgba(239, 68, 68, 0.08)" : "hsl(var(--primary) / 0.06)", 
            border: requestedDays > effectiveBalance ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid hsl(var(--primary) / 0.15)",
            display: "flex", gap: "0.75rem", alignItems: "flex-start"
          }}>
            <div style={{ marginTop: "0.1rem" }}>
              {requestedDays > effectiveBalance ? <AlertTriangle size={18} color="#ef4444" /> : <CheckCircle size={18} color="hsl(var(--primary))" />}
            </div>
            {requestedDays > effectiveBalance ? (
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#ef4444", fontWeight: 700 }}>Balance insuficiente</p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "rgba(239, 68, 68, 0.8)", lineHeight: 1.4 }}>
                  {onBehalf ? `El empleado dispone de ${effectiveBalance} días laborales e intentas solicitar ${requestedDays}.` : `Estás solicitando ${requestedDays} días laborales, pero solo dispones de ${effectiveBalance}.`}
                </p>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "hsl(var(--foreground))", fontWeight: 700 }}>Resumen de Solicitud</p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.4 }}>
                  Días hábiles solicitados: <strong style={{ color: "hsl(var(--foreground))" }}>{requestedDays}</strong>. Saldo proyectado restante: <strong style={{ color: "hsl(var(--foreground))" }}>{effectiveBalance - requestedDays}</strong> días.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Documentación de Soporte {DOCUMENT_GUIDELINES[requestType] ? (
              <span style={{ color: "#ef4444" }}>* (Obligatorio)</span>
            ) : (
              <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 600, textTransform: "none" }}>(Opcional)</span>
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
                ? "2px dashed hsl(var(--primary))" 
                : DOCUMENT_GUIDELINES[requestType] && !file 
                  ? "2px dashed rgba(239, 68, 68, 0.4)" 
                  : "2px dashed hsl(var(--border) / 0.8)",
              backgroundColor: dragActive 
                ? "hsl(var(--primary) / 0.04)" 
                : DOCUMENT_GUIDELINES[requestType] && !file 
                  ? "rgba(239, 68, 68, 0.02)" 
                  : "hsl(var(--surface) / 0.5)",
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
                  <div style={{ width: 44, height: 44, borderRadius: "0.5rem", overflow: "hidden", border: "1px solid hsl(var(--border))", flexShrink: 0 }}>
                    <img src={filePreviewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: "0.5rem", backgroundColor: "hsl(var(--primary) / 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))", flexShrink: 0 }}>
                    <FileText size={20} />
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "hsl(var(--muted-foreground))" }}>
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
                    backgroundColor: "transparent",
                    color: "hsl(var(--destructive))",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  title="Eliminar archivo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <UploadCloud size={28} style={{ color: DOCUMENT_GUIDELINES[requestType] ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  Arrastra tu archivo aquí o <span style={{ color: "hsl(var(--primary))", textDecoration: "underline" }}>búscalo en tu equipo</span>
                </div>
                <div style={{ fontSize: "0.65rem", color: "hsl(var(--muted-foreground))" }}>
                  PDF, PNG, JPG, JPEG (Máx. 25MB)
                </div>
              </div>
            )}
          </div>
          {fileError && (
            <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem", fontWeight: 500 }}>
              {fileError}
            </div>
          )}
        </div>
        
        {/* Reason */}
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 800, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em" }}>COMENTARIOS / MOTIVO (OPCIONAL)</label>
          <textarea name="reason" className="input" rows={3} placeholder="Detalles o justificación sobre tu ausencia..." style={{ resize: "none", fontSize: "0.875rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }}></textarea>
        </div>

        {/* Message */}
        {message && (
          <div className="animate-in" style={{ 
            padding: "0.875rem 1.25rem", 
            borderRadius: "0.75rem", 
            backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
            color: message.type === "success" ? "#10b981" : "#ef4444",
            border: message.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            {message.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button 
          type="submit" 
          disabled={loading || (requestType === "VACATION" && requestedDays > effectiveBalance)} 
          style={{ 
            marginTop: "0.5rem", width: "100%", padding: "1rem", 
            fontSize: "0.95rem", borderRadius: "0.875rem", border: "none",
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
            color: "white", fontWeight: 800,
            cursor: loading || (requestType === "VACATION" && requestedDays > effectiveBalance) ? "not-allowed" : "pointer",
            opacity: loading || (requestType === "VACATION" && requestedDays > effectiveBalance) ? 0.6 : 1,
            boxShadow: "0 6px 20px hsl(var(--primary) / 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {loading ? (
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
          ) : <Send size={16} />}
          <span>{loading ? "Enviando Solicitud..." : (requestType === "VACATION" && requestedDays > effectiveBalance ? "Saldo Insuficiente" : "Enviar Solicitud")}</span>
        </button>
      </form>
    </div>
  )
}
