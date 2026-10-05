export type UserStatus = {
  status: "AVAILABLE" | "OFFLINE" | "VACATION" | "SICK_LEAVE" | "MEDICAL_LEAVE" | "MATERNITY_LEAVE" | "PATERNITY_LEAVE" | "BEREAVEMENT_LEAVE" | "SPECIAL_PERMISSION"
  label: string
  color: string
  returnDate: Date | null
  type: string
}

export function computeUserStatus(requests: any[], lastSeen?: Date | null | undefined): UserStatus {
  // Determine if online
  let isOnline = false;
  if (lastSeen) {
    const now = new Date();
    // Consider online if lastSeen was within the last 5 minutes
    const diffMinutes = (now.getTime() - new Date(lastSeen).getTime()) / 60000;
    isOnline = diffMinutes <= 5;
  }

  if (!requests || requests.length === 0) {
    if (isOnline) {
      return { status: "AVAILABLE", label: "Disponible", color: "#10b981", returnDate: null, type: "AVAILABLE" }
    } else {
      return { status: "OFFLINE", label: "Ausente", color: "#9ca3af", returnDate: null, type: "OFFLINE" }
    }
  }
  
  const today = new Date()
  today.setHours(0,0,0,0)

  // Filter approved requests that are currently active
  const activeRequests = requests.filter(req => {
    if (req.status !== "APPROVED") return false
    const start = new Date(req.startDate)
    start.setHours(0,0,0,0)
    const end = new Date(req.endDate)
    end.setHours(23,59,59,999)
    return today >= start && today <= end
  })

  if (activeRequests.length === 0) {
    if (isOnline) {
      return { status: "AVAILABLE", label: "Disponible", color: "#10b981", returnDate: null, type: "AVAILABLE" }
    } else {
      return { status: "OFFLINE", label: "Ausente", color: "#9ca3af", returnDate: null, type: "OFFLINE" }
    }
  }

  // If multiple, pick the first one (most critical usually)
  const current = activeRequests[0]
  const returnDate = new Date(current.endDate)
  returnDate.setDate(returnDate.getDate() + 1) // next day after end date

  switch (current.type) {
    case "VACATION":
      return { status: "VACATION", label: "De vacaciones", color: "#3b82f6", returnDate, type: current.type }
    case "SICK_LEAVE":
      return { status: "SICK_LEAVE", label: "Ausencia médica", color: "#fca5a5", returnDate, type: current.type }
    case "MEDICAL_LEAVE":
      return { status: "MEDICAL_LEAVE", label: "Licencia médica activa", color: "#ef4444", returnDate, type: current.type }
    case "MATERNITY_LEAVE":
      return { status: "MATERNITY_LEAVE", label: "Licencia por maternidad", color: "#a855f7", returnDate, type: current.type }
    case "PATERNITY_LEAVE":
      return { status: "PATERNITY_LEAVE", label: "Licencia por paternidad", color: "#0ea5e9", returnDate, type: current.type }
    case "BEREAVEMENT_LEAVE":
      return { status: "BEREAVEMENT_LEAVE", label: "Licencia por fallecimiento", color: "#52525b", returnDate, type: current.type }
    case "PERMISSION":
    case "EARLY_LEAVE":
      return { status: "SPECIAL_PERMISSION", label: "Permiso especial", color: "#f59e0b", returnDate, type: current.type }
    default:
      if (isOnline) {
        return { status: "AVAILABLE", label: "Disponible", color: "#10b981", returnDate: null, type: "AVAILABLE" }
      } else {
        return { status: "OFFLINE", label: "Ausente", color: "#9ca3af", returnDate: null, type: "OFFLINE" }
      }
  }
}
