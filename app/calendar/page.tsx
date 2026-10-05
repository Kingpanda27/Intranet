"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  getCalendarData, 
  createCalendarEvent, 
  respondToEventRSVP, 
  addEventComment, 
  deleteCalendarEvent 
} from '@/app/actions/calendarActions'
import { getMyGroups } from '@/app/actions/teamActions'
import { getAllUsersCompact } from '@/app/actions/userActions'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CalendarDays,
  Users, 
  User, 
  PartyPopper, 
  Plus, 
  MapPin, 
  Clock, 
  Tag, 
  Eye, 
  Send, 
  Trash2, 
  Check, 
  X, 
  HelpCircle,
  MessageSquare,
  Info,
  ShieldCheck,
  Globe
} from 'lucide-react'
import { deduplicateHolidays, getHolidayMetadata } from '@/lib/holidayData'

// Iconos por tipo de evento
const TYPE_ICONS: Record<string, any> = {
  HOLIDAY: PartyPopper,
  LEAVE: User,
  VACATION: UmbrellaIcon,
  MEETING: Users,
  TRAINING: BookIcon,
  TEAM_BUILDING: HeartIcon,
  BIRTHDAY: PartyPopper,
  ACTIVITY: SparklesIcon,
  MAINTENANCE: WrenchIcon,
  NOTICE: AlertCircleIcon,
  OTHER: CalendarIcon
}

function UmbrellaIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2v20" />
      <path d="M12 2a10 10 0 0 1 10 10H2a10 10 0 0 1 10-10z" />
    </svg>
  )
}

function BookIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </svg>
  )
}

function HeartIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function SparklesIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

function WrenchIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function AlertCircleIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// Colores sugeridos premium
const PREMIUM_COLORS = [
  { hex: "#3b82f6", name: "Azul Eléctrico" },
  { hex: "#10b981", name: "Esmeralda" },
  { hex: "#f59e0b", name: "Ámbar" },
  { hex: "#ef4444", name: "Coral" },
  { hex: "#8b5cf6", name: "Amatista" },
  { hex: "#ec4899", name: "Rosa Vibrante" },
  { hex: "#06b6d4", name: "Turquesa" },
  { hex: "#64748b", name: "Pizarra" }
]

export default function CalendarPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const role = user?.role || "USER"

  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [activeFilters, setActiveFilters] = useState<string[]>([
    "ALL", "HOLIDAY", "VACATION", "PERMISSION", "SICK", "MEDICAL_LEAVE", "EVENT", "TEAM", "MINE"
  ])

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null)

  // Estados del Formulario de Evento
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventStartDate, setNewEventStartDate] = useState('')
  const [newEventEndDate, setNewEventEndDate] = useState('')
  const [newEventType, setNewEventType] = useState('MEETING')
  const [newEventColor, setNewEventColor] = useState('#3b82f6')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventResponsible, setNewEventResponsible] = useState('')
  const [newEventScope, setNewEventScope] = useState('PUBLIC')
  const [newEventProjectId, setNewEventProjectId] = useState('')
  const [newEventParticipantsScope, setNewEventParticipantsScope] = useState('ALL')
  const [newEventSelectedUsers, setNewEventSelectedUsers] = useState<string[]>([])
  const [newEventSendNotification, setNewEventSendNotification] = useState(true)
  const [newEventAllowComments, setNewEventAllowComments] = useState(true)
  const [newEventAllowRSVP, setNewEventAllowRSVP] = useState(true)

  // Comentarios y RSVP
  const [commentText, setCommentText] = useState('')

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()

  // Determinar si el usuario tiene permisos para crear eventos
  const isLeader = myGroups.some(g => g.isLeader)
  const isSupervisorOrAdmin = role !== "USER" || isLeader

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [month, year])

  useEffect(() => {
    applyFilters()
  }, [events, activeFilters, session])

  const fetchInitialData = async () => {
    const groups = await getMyGroups()
    setMyGroups(groups)
    const users = await getAllUsersCompact()
    setAllUsers(users)
  }

  const fetchData = async () => {
    setLoading(true)
    const data = await getCalendarData(month, year)
    if (data) {
      const toLocalDate = (dateStr: string | Date) => {
        const d = new Date(dateStr)
        return new Date(d.getTime() + d.getTimezoneOffset() * 60000)
      }

      const parsedEvents: any[] = []
      
      // Recolectar feriados tanto de data.holidays como de cualquier evento tipo HOLIDAY residual
      const rawHolidays: any[] = []
      if (Array.isArray(data.holidays)) {
        rawHolidays.push(...data.holidays)
      }
      if (Array.isArray(data.manualEvents)) {
        data.manualEvents.forEach((e: any) => {
          if (e.type === 'HOLIDAY') {
            rawHolidays.push({
              id: e.id,
              title: e.title,
              name: e.title,
              date: e.startDate,
              startDate: e.startDate,
              endDate: e.endDate,
              description: e.description,
              location: e.location,
              color: e.color
            })
          }
        })
      }

      // Deduplicar estrictamente los feriados para asegurar que cada motivo aparezca una sola vez por día
      const uniqueHolidays = deduplicateHolidays(rawHolidays)
      uniqueHolidays.forEach((h: any) => {
        const sDate = toLocalDate(h.startDate || h.date)
        const eDate = toLocalDate(h.endDate || h.date || h.startDate)
        const meta = getHolidayMetadata(h.title || h.name, sDate)

        parsedEvents.push({
          id: h.id?.startsWith('hol-') ? h.id : `hol-${h.id}`, 
          title: h.title || h.name || meta.canonicalName, 
          name: h.name || h.title || meta.canonicalName,
          startDate: sDate, 
          endDate: eDate,
          type: 'HOLIDAY', 
          color: h.color || meta.color, 
          icon: PartyPopper,
          isManual: false,
          isHoliday: true,
          country: meta.country,
          countryCode: meta.countryCode,
          flag: meta.flag,
          category: meta.category,
          description: h.description || meta.description,
          location: h.location || meta.location,
          workImpact: meta.workImpact
        })
      })

      // Manual Events (excluyendo cualquier evento tipo HOLIDAY para no duplicar)
      data.manualEvents.filter((e: any) => e.type !== 'HOLIDAY').forEach((e: any) => {
        parsedEvents.push({
          id: `ev-${e.id}`, 
          title: e.title, 
          description: e.description,
          startDate: toLocalDate(e.startDate), 
          endDate: toLocalDate(e.endDate), 
          type: 'EVENT', 
          color: e.color, 
          icon: TYPE_ICONS[e.type] || CalendarIcon,
          isManual: true,
          isHoliday: false,
          originalEvent: e
        })
      })

      // TimeOffRequests
      data.timeOff.forEach((t: any) => {
        const start = toLocalDate(t.startDate)
        const end = toLocalDate(t.endDate)
        
        parsedEvents.push({
          id: `to-${t.id}`,
          title: `${t.user.name} (${t.type.replace('_', ' ')})`,
          startDate: start,
          endDate: end,
          type: t.type,
          color: t.type === 'VACATION' ? '#3b82f6' : t.type === 'SICK' ? '#ef4444' : '#8b5cf6',
          icon: User,
          isManual: false,
          isHoliday: false,
          user: t.user
        })
      })

      setEvents(parsedEvents)
    }
    setLoading(false)
  }

  const applyFilters = () => {
    if (activeFilters.includes("ALL")) {
      setFilteredEvents(events)
      return
    }

    const currentUserId = user?.id

    const filtered = events.filter(e => {
      // Filtros de Tipo
      if (e.type === 'HOLIDAY' && !activeFilters.includes('HOLIDAY')) return false
      if (e.type === 'VACATION' && !activeFilters.includes('VACATION')) return false
      if (e.type === 'SPECIAL' && !activeFilters.includes('PERMISSION')) return false
      if (e.type === 'HOURS_MAKEUP' && !activeFilters.includes('PERMISSION')) return false
      if (e.type === 'SICK' && !activeFilters.includes('SICK')) return false
      if (e.type === 'MEDICAL_LEAVE' && !activeFilters.includes('MEDICAL_LEAVE')) return false
      if (e.type === 'EVENT' && !activeFilters.includes('EVENT')) return false

      // Filtro Mi Equipo (solo eventos del grupo de pertenencia)
      if (activeFilters.includes('TEAM')) {
        if (e.type === 'HOLIDAY') return false
        const userGroupIds = myGroups.map(g => g.id)
        if (e.isManual && e.originalEvent?.projectId && !userGroupIds.includes(e.originalEvent.projectId)) {
          return false
        }
        if (!e.isManual && e.user?.projectId && !userGroupIds.includes(e.user.projectId)) {
          return false
        }
      }

      // Filtro Solo Mis Eventos / Ausencias
      if (activeFilters.includes('MINE')) {
        if (e.type === 'HOLIDAY') return false
        if (e.isManual && e.originalEvent?.createdById !== currentUserId && e.originalEvent?.participantIds && !e.originalEvent.participantIds.includes(currentUserId)) {
          return false
        }
        if (!e.isManual && e.user?.id !== currentUserId) {
          return false
        }
      }

      return true
    })

    setFilteredEvents(filtered)
  }

  const toggleFilter = (filterKey: string) => {
    if (filterKey === "ALL") {
      setActiveFilters(["ALL"])
    } else {
      let updated = activeFilters.filter(f => f !== "ALL")
      if (updated.includes(filterKey)) {
        updated = updated.filter(f => f !== filterKey)
      } else {
        updated.push(filterKey)
      }
      if (updated.length === 0) updated = ["ALL"]
      setActiveFilters(updated)
    }
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  // Grid de Calendario
  let firstDayOfMonth = new Date(year, month, 1).getDay()
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 // Lunes a Domingo

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDaysInMonth = new Date(year, month, 0).getDate()
  
  const days = []
  // Rellenar días del mes anterior
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevDaysInMonth - i, isCurrentMonth: false })
  }
  // Rellenar días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true })
  }
  // Rellenar días del mes siguiente para completar la cuadrícula (múltiplo de 7)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false })
  }

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Comprobar si una fecha específica cae en un rango de fechas
  const isDateInRange = (checkDate: Date, start: Date, end: Date) => {
    const check = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()).getTime()
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
    return check >= s && check <= e
  }

  const handleOpenDetail = (event: any) => {
    if (event.isHoliday || event.type === 'HOLIDAY') {
      setSelectedHoliday(event)
      setIsHolidayModalOpen(true)
      return
    }
    if (event.isManual && event.originalEvent) {
      setSelectedEvent(event.originalEvent)
      setIsDetailModalOpen(true)
      return
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle) return

    try {
      const sDate = new Date(newEventStartDate)
      const eDate = new Date(newEventEndDate)

      await createCalendarEvent({
        title: newEventTitle,
        description: newEventDesc,
        startDate: sDate,
        endDate: eDate,
        type: newEventType,
        color: newEventColor,
        location: newEventLocation,
        responsible: newEventResponsible,
        scope: newEventScope,
        projectId: newEventProjectId || undefined,
        participantsScope: newEventParticipantsScope,
        participantIds: newEventSelectedUsers.join(',') || undefined,
        sendNotification: newEventSendNotification,
        allowComments: newEventAllowComments,
        allowRSVP: newEventAllowRSVP
      })

      // Resetear formulario
      setNewEventTitle('')
      setNewEventDesc('')
      setNewEventStartDate('')
      setNewEventEndDate('')
      setNewEventType('MEETING')
      setNewEventLocation('')
      setNewEventResponsible('')
      setNewEventScope('PUBLIC')
      setNewEventProjectId('')
      setNewEventParticipantsScope('ALL')
      setNewEventSelectedUsers([])
      
      setIsCreateModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Error al crear evento')
    }
  }

  const handleRSVP = async (status: string) => {
    if (!selectedEvent) return
    try {
      const updated = await respondToEventRSVP(selectedEvent.id, status)
      // Recargar datos locales del evento seleccionado
      const data = await getCalendarData(month, year)
      const freshEvent = data?.manualEvents.find((e: any) => e.id === selectedEvent.id)
      if (freshEvent) {
        setSelectedEvent(freshEvent)
      }
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !selectedEvent) return

    try {
      await addEventComment(selectedEvent.id, commentText)
      setCommentText('')
      
      // Recargar datos del evento
      const data = await getCalendarData(month, year)
      const freshEvent = data?.manualEvents.find((e: any) => e.id === selectedEvent.id)
      if (freshEvent) {
        setSelectedEvent(freshEvent)
      }
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    if (!confirm('¿Estás seguro de que deseas eliminar este evento permanentemente?')) return

    try {
      await deleteCalendarEvent(selectedEvent.id)
      setIsDetailModalOpen(false)
      setSelectedEvent(null)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="container animate-in" style={{ paddingBottom: "4rem" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', fontWeight: 800 }}>
            <CalendarIcon size={32} className="text-primary" />
            Calendario Corporativo
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Visualiza eventos, feriados y ausencias del equipo de forma inteligente.</p>
        </div>

        {isSupervisorOrAdmin && (
          <button 
            onClick={() => {
              // Inicializar fechas con hoy
              const now = new Date()
              const formatLocal = (d: Date) => {
                const pad = (num: number) => String(num).padStart(2, '0')
                return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
              }
              setNewEventStartDate(formatLocal(now))
              const later = new Date(now.getTime() + 60*60*1000)
              setNewEventEndDate(formatLocal(later))
              setIsCreateModalOpen(true)
            }}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', padding: '0.6rem 1.25rem', boxShadow: '0 4px 14px hsl(var(--primary)/0.3)' }}
          >
            <Plus size={18} />
            <span>Nuevo Evento</span>
          </button>
        )}
      </div>

      {/* Panel de Filtros rápidos */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}>
        <button 
          onClick={() => toggleFilter("ALL")} 
          className={`btn ${activeFilters.includes("ALL") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem' }}
        >
          Todos
        </button>
        <button 
          onClick={() => toggleFilter("HOLIDAY")} 
          className={`btn ${activeFilters.includes("HOLIDAY") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem', borderLeft: '3px solid #ef4444' }}
        >
          🎉 Feriados
        </button>
        <button 
          onClick={() => toggleFilter("VACATION")} 
          className={`btn ${activeFilters.includes("VACATION") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem', borderLeft: '3px solid #3b82f6' }}
        >
          Vacaciones
        </button>
        <button 
          onClick={() => toggleFilter("PERMISSION")} 
          className={`btn ${activeFilters.includes("PERMISSION") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem', borderLeft: '3px solid #8b5cf6' }}
        >
          Permisos
        </button>
        <button 
          onClick={() => toggleFilter("SICK")} 
          className={`btn ${activeFilters.includes("SICK") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem', borderLeft: '3px solid #ef4444' }}
        >
          Enfermedad
        </button>
        <button 
          onClick={() => toggleFilter("EVENT")} 
          className={`btn ${activeFilters.includes("EVENT") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem', borderLeft: '3px solid #10b981' }}
        >
          Eventos
        </button>
        <button 
          onClick={() => toggleFilter("TEAM")} 
          className={`btn ${activeFilters.includes("TEAM") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem' }}
        >
          👥 Mi Equipo
        </button>
        <button 
          onClick={() => toggleFilter("MINE")} 
          className={`btn ${activeFilters.includes("MINE") ? "btn-primary" : "btn-surface"}`}
          style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.4rem 1rem' }}
        >
          👤 Solo Míos
        </button>
      </div>

      {/* Calendar Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))', borderRadius: '1.25rem', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--surface))' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {monthNames[month]} <span style={{ color: 'hsl(var(--primary))' }}>{year}</span>
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={prevMonth} className="btn btn-surface" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="btn btn-surface" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0.5rem' }}>Hoy</button>
            <button onClick={nextMonth} className="btn btn-surface" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Grid Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', backgroundColor: 'hsl(var(--muted)/0.15)', borderBottom: '1px solid hsl(var(--border))' }}>
          {dayNames.map(day => (
            <div key={day} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        {loading ? (
          <div style={{ padding: '8rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid hsl(var(--primary)/0.2)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Cargando calendario inteligente...</span>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
            gridAutoRows: 'minmax(130px, auto)',
            backgroundColor: 'hsl(var(--border)/0.5)', gap: '1px'
          }}>
            {days.map((dObj, idx) => {
              const checkDate = new Date(year, dObj.isCurrentMonth ? month : (idx < 7 ? month - 1 : month + 1), dObj.day)
              
              const isToday = new Date().getDate() === dObj.day && new Date().getMonth() === month && new Date().getFullYear() === year && dObj.isCurrentMonth
              
              // Filtrar eventos de este día
              const dayEvents = filteredEvents.filter(ev => isDateInRange(checkDate, ev.startDate, ev.endDate))

              return (
                <div key={idx} style={{ 
                  backgroundColor: dObj.isCurrentMonth ? 'hsl(var(--surface))' : 'hsl(var(--muted)/0.03)', 
                  padding: '0.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.35rem',
                  opacity: dObj.isCurrentMonth ? 1 : 0.4
                }}>
                  <div style={{ 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: isToday ? 'hsl(var(--primary))' : 'transparent',
                    color: isToday ? 'white' : 'hsl(var(--foreground))',
                    fontWeight: isToday ? 800 : 600,
                    fontSize: '0.8rem',
                    marginBottom: '0.25rem',
                    alignSelf: 'flex-end',
                    boxShadow: isToday ? '0 2px 6px hsl(var(--primary)/0.4)' : 'none'
                  }}>
                    {dObj.day}
                  </div>
                  
                  {/* Events List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto', maxHeight: '110px' }}>
                    {dayEvents.map(ev => {
                      const Icon = ev.icon || CalendarIcon
                      const isClickable = ev.isManual || ev.isHoliday || ev.type === 'HOLIDAY'
                      return (
                        <div 
                          key={ev.id} 
                          onClick={() => handleOpenDetail(ev)}
                          title={ev.isHoliday || ev.type === 'HOLIDAY' ? `${ev.title} (Haz clic para ver detalles)` : ev.title} 
                          style={{
                            fontSize: '0.65rem', 
                            padding: '0.3rem 0.5rem', 
                            borderRadius: '6px',
                            backgroundColor: (ev.isHoliday || ev.type === 'HOLIDAY')
                              ? (ev.countryCode === 'US' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)')
                              : `${ev.color}15`, 
                            borderLeft: `3px solid ${ev.color}`,
                            color: 'hsl(var(--foreground))', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.3rem',
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            cursor: isClickable ? 'pointer' : 'default',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                            border: `1px solid ${ev.color}40`,
                            userSelect: 'none'
                          }}
                          className={isClickable ? "event-hover" : ""}
                        >
                          <Icon size={11} color={ev.color} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL: NUEVO EVENTO */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={() => setIsCreateModalOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
          
          <div className="card" style={{ width: '100%', maxWidth: '600px', zIndex: 10, borderRadius: '1.25rem', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', padding: '1rem 1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>➕ Programar Nuevo Evento</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Título del Evento</label>
                <input 
                  type="text" 
                  value={newEventTitle} 
                  onChange={e => setNewEventTitle(e.target.value)} 
                  className="form-input" 
                  placeholder="Ej: Reunión Mensual de KPIs"
                  required
                />
              </div>

              <div>
                <label className="form-label">Descripción</label>
                <textarea 
                  value={newEventDesc} 
                  onChange={e => setNewEventDesc(e.target.value)} 
                  className="form-input" 
                  placeholder="Detalles sobre el evento..."
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Inicio</label>
                  <input 
                    type="datetime-local" 
                    value={newEventStartDate} 
                    onChange={e => setNewEventStartDate(e.target.value)} 
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Fin</label>
                  <input 
                    type="datetime-local" 
                    value={newEventEndDate} 
                    onChange={e => setNewEventEndDate(e.target.value)} 
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Tipo de Evento</label>
                  <select value={newEventType} onChange={e => setNewEventType(e.target.value)} className="form-input">
                    <option value="MEETING">Reunión</option>
                    <option value="TRAINING">Capacitación</option>
                    <option value="TEAM_BUILDING">Team Building</option>
                    <option value="BIRTHDAY">Cumpleaños</option>
                    <option value="ACTIVITY">Actividad</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="NOTICE">Aviso General</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Responsable</label>
                  <input 
                    type="text" 
                    value={newEventResponsible} 
                    onChange={e => setNewEventResponsible(e.target.value)} 
                    className="form-input"
                    placeholder="Nombre del responsable"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Ubicación</label>
                <input 
                  type="text" 
                  value={newEventLocation} 
                  onChange={e => setNewEventLocation(e.target.value)} 
                  className="form-input"
                  placeholder="Ej: Sala A, Virtual, Teams"
                />
              </div>

              {/* Selector de Color Premium */}
              <div>
                <label className="form-label">Color Distintivo</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {PREMIUM_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewEventColor(c.hex)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        border: newEventColor === c.hex ? '3px solid white' : 'none',
                        boxShadow: newEventColor === c.hex ? '0 0 0 2px hsl(var(--primary))' : 'none',
                        cursor: 'pointer'
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Alcance y Participantes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Alcance de Visibilidad</label>
                  <select value={newEventScope} onChange={e => {
                    setNewEventScope(e.target.value)
                    if (e.target.value === "GROUP" && myGroups.length > 0 && !newEventProjectId) {
                      setNewEventProjectId(myGroups[0].id)
                    }
                  }} className="form-input">
                    <option value="PUBLIC">Público (Toda la empresa)</option>
                    <option value="GROUP">Solo Mi Grupo</option>
                    <option value="SUPERVISORS">Solo Supervisores</option>
                    <option value="HR">RRHH</option>
                  </select>
                </div>

                {newEventScope === "GROUP" && (
                  <div>
                    <label className="form-label">Seleccionar Grupo</label>
                    <select value={newEventProjectId} onChange={e => setNewEventProjectId(e.target.value)} className="form-input" required>
                      {myGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Participantes */}
              <div>
                <label className="form-label">Destinatarios / Participación</label>
                <select value={newEventParticipantsScope} onChange={e => setNewEventParticipantsScope(e.target.value)} className="form-input">
                  <option value="ALL">Toda la empresa / Todos los del alcance</option>
                  <option value="GROUP">Todo el grupo</option>
                  <option value="SPECIFIC">Personas específicas</option>
                </select>

                {newEventParticipantsScope === "SPECIFIC" && (
                  <div style={{ marginTop: '0.75rem', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', padding: '0.75rem', maxHeight: '120px', overflowY: 'auto' }}>
                    {allUsers.map(u => (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', padding: '0.25rem 0', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={newEventSelectedUsers.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewEventSelectedUsers([...newEventSelectedUsers, u.id])
                            } else {
                              setNewEventSelectedUsers(newEventSelectedUsers.filter(id => id !== u.id))
                            }
                          }}
                        />
                        <span>{u.name} <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.7rem' }}>({u.position || "N/A"})</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkboxes de opciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={newEventSendNotification} onChange={e => setNewEventSendNotification(e.target.checked)} />
                  <span>Enviar notificación interna inmediata a los participantes</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={newEventAllowComments} onChange={e => setNewEventAllowComments(e.target.checked)} />
                  <span>Habilitar foro de comentarios y debate en el evento</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={newEventAllowRSVP} onChange={e => setNewEventAllowRSVP(e.target.checked)} />
                  <span>Permitir a los invitados confirmar asistencia (RSVP)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-surface">Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLES DE FERIADO CORPORATIVO (RD O US) */}
      {isHolidayModalOpen && selectedHoliday && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div 
            onClick={() => { setIsHolidayModalOpen(false); setSelectedHoliday(null); }} 
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} 
          />
          
          <div className="card animate-in" style={{ 
            width: '100%', 
            maxWidth: '540px', 
            zIndex: 10, 
            borderRadius: '1.5rem', 
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)', 
            overflow: 'hidden',
            padding: 0,
            border: `1px solid ${selectedHoliday.color}40`,
            backgroundColor: 'hsl(var(--surface))'
          }}>
            {/* Header con gradiente temático según país */}
            <div style={{ 
              borderLeft: `6px solid ${selectedHoliday.color}`, 
              padding: '1.5rem', 
              background: `linear-gradient(135deg, ${selectedHoliday.color}18 0%, ${selectedHoliday.color}05 100%)`,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              borderBottom: '1px solid hsl(var(--border))'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '9999px', 
                    backgroundColor: selectedHoliday.color, 
                    color: 'white', 
                    fontWeight: 800, 
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    {selectedHoliday.flag || (selectedHoliday.countryCode === 'US' ? '🇺🇸' : '🇩🇴')} {selectedHoliday.country || 'Feriado Oficial'}
                  </span>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '9999px', 
                    backgroundColor: 'hsl(var(--muted)/0.3)', 
                    color: 'hsl(var(--muted-foreground))', 
                    fontWeight: 700
                  }}>
                    {selectedHoliday.category || "Feriado No Laborable"}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0', letterSpacing: '-0.02em', color: 'hsl(var(--foreground))' }}>
                  {selectedHoliday.title}
                </h2>
              </div>
              <button 
                onClick={() => { setIsHolidayModalOpen(false); setSelectedHoliday(null); }} 
                className="btn btn-ghost" 
                style={{ borderRadius: '50%', padding: '0.4rem', color: 'hsl(var(--muted-foreground))' }}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido / Detalles */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Bloque Fecha y Cobertura */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem', 
                padding: '1rem', 
                backgroundColor: 'hsl(var(--muted)/0.15)', 
                borderRadius: '0.85rem',
                border: '1px solid hsl(var(--border)/0.5)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <CalendarDays size={20} color={selectedHoliday.color} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Fecha Oficial</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--foreground))', textTransform: 'capitalize' }}>
                      {new Date(selectedHoliday.startDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <MapPin size={20} color={selectedHoliday.color} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Ámbito Geográfico</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {selectedHoliday.location || selectedHoliday.country}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reseña / Motivo del Feriado */}
              <div style={{ backgroundColor: 'hsl(var(--muted)/0.1)', padding: '1rem 1.15rem', borderRadius: '0.85rem', border: '1px solid hsl(var(--border)/0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'hsl(var(--foreground))' }}>
                  <Info size={16} color={selectedHoliday.color} />
                  <span>Motivo y Significado</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', color: 'hsl(var(--foreground))', opacity: 0.9 }}>
                  {selectedHoliday.description || "Día festivo y no laborable establecido en el calendario corporativo oficial."}
                </p>
              </div>

              {/* Disposición Laboral y Vacaciones */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.6rem', 
                padding: '0.85rem 1rem', 
                borderRadius: '0.85rem', 
                backgroundColor: selectedHoliday.countryCode === 'US' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${selectedHoliday.color}25`
              }}>
                <ShieldCheck size={18} color={selectedHoliday.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <span style={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Política Laboral: </span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {selectedHoliday.workImpact || "Día oficial no laborable. No se deduce del saldo de vacaciones anuales."}
                  </span>
                </div>
              </div>

              {/* Botón de Cierre */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => { setIsHolidayModalOpen(false); setSelectedHoliday(null); }}
                  className="btn btn-primary"
                  style={{ borderRadius: '0.75rem', padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DEL EVENTO INTERACTIVO */}
      {isDetailModalOpen && selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={() => setIsDetailModalOpen(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
          
          <div className="card" style={{ width: '100%', maxWidth: '650px', zIndex: 10, borderRadius: '1.25rem', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflowY: 'auto', maxHeight: '90vh', padding: 0 }}>
            {/* Header del Evento */}
            <div style={{ borderLeft: `6px solid ${selectedEvent.color}`, padding: '1.5rem', backgroundColor: `${selectedEvent.color}08`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', backgroundColor: selectedEvent.color, color: 'white', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedEvent.type}
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', letterSpacing: '-0.02em' }}>{selectedEvent.title}</h2>
                <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>{selectedEvent.description || "Sin descripción proporcionada."}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Detalles del Evento */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', backgroundColor: 'hsl(var(--muted)/0.15)', borderRadius: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Clock size={16} color={selectedEvent.color} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Horario</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(selectedEvent.startDate).toLocaleString()} -<br/>
                      {new Date(selectedEvent.endDate).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <MapPin size={16} color={selectedEvent.color} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Ubicación</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{selectedEvent.location || "No especificada"}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <User size={16} color={selectedEvent.color} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Responsable / Creado por</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {selectedEvent.responsible || selectedEvent.createdBy?.name || "N/A"}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Tag size={16} color={selectedEvent.color} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Alcance de Visibilidad</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {selectedEvent.scope === "PUBLIC" ? "Empresarial" : selectedEvent.scope === "GROUP" ? "De Grupo" : selectedEvent.scope === "SUPERVISORS" ? "Supervisores" : "RRHH"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmación de Asistencia (RSVP) */}
              {selectedEvent.allowRSVP && (
                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 800 }}>🙋 Confirmar Asistencia (RSVP)</h4>
                  
                  {/* Botones de RSVP para el usuario logueado */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button 
                      onClick={() => handleRSVP("ACCEPTED")} 
                      className={`btn ${selectedEvent.attendances?.find((a: any) => a.userId === user?.id && a.status === "ACCEPTED") ? "btn-primary" : "btn-surface"}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem' }}
                    >
                      <Check size={16} /> Asistiré
                    </button>
                    <button 
                      onClick={() => handleRSVP("DECLINED")} 
                      className={`btn ${selectedEvent.attendances?.find((a: any) => a.userId === user?.id && a.status === "DECLINED") ? "btn-primary" : "btn-surface"}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem', borderLeft: '3px solid #ef4444' }}
                    >
                      <X size={16} /> No asistiré
                    </button>
                    <button 
                      onClick={() => handleRSVP("TENTATIVE")} 
                      className={`btn ${selectedEvent.attendances?.find((a: any) => a.userId === user?.id && a.status === "TENTATIVE") ? "btn-primary" : "btn-surface"}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem', borderLeft: '3px solid #f59e0b' }}
                    >
                      <HelpCircle size={16} /> Quizás
                    </button>
                  </div>

                  {/* Lista de Confirmaciones */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                    <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>Asisten ({selectedEvent.attendances?.filter((a: any) => a.status === "ACCEPTED").length || 0})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {selectedEvent.attendances?.filter((a: any) => a.status === "ACCEPTED").map((a: any) => (
                          <div 
                            key={a.id} 
                            title={a.user?.name}
                            style={{ 
                              width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary)/0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, overflow: 'hidden'
                            }}
                          >
                            {a.user?.image ? <img src={a.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (a.user?.name?.[0] || "?")}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(239,68,68,0.05)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.25rem' }}>No asisten ({selectedEvent.attendances?.filter((a: any) => a.status === "DECLINED").length || 0})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {selectedEvent.attendances?.filter((a: any) => a.status === "DECLINED").map((a: any) => (
                          <div 
                            key={a.id} 
                            title={a.user?.name}
                            style={{ 
                              width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary)/0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, overflow: 'hidden'
                            }}
                          >
                            {a.user?.image ? <img src={a.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (a.user?.name?.[0] || "?")}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(245,158,11,0.05)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '0.25rem' }}>Quizás ({selectedEvent.attendances?.filter((a: any) => a.status === "TENTATIVE").length || 0})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {selectedEvent.attendances?.filter((a: any) => a.status === "TENTATIVE").map((a: any) => (
                          <div 
                            key={a.id} 
                            title={a.user?.name}
                            style={{ 
                              width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary)/0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, overflow: 'hidden'
                            }}
                          >
                            {a.user?.image ? <img src={a.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (a.user?.name?.[0] || "?")}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Foro de Comentarios */}
              {selectedEvent.allowComments && (
                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={16} /> Foro del Evento
                  </h4>

                  {/* Listado de comentarios */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
                    {selectedEvent.comments && selectedEvent.comments.length > 0 ? (
                      selectedEvent.comments.map((comment: any) => (
                        <div key={comment.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <div style={{ 
                            width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary)/0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0
                          }}>
                            {comment.user?.image ? <img src={comment.user.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (comment.user?.name?.[0] || "?")}
                          </div>
                          <div style={{ backgroundColor: 'hsl(var(--muted)/0.2)', padding: '0.6rem 0.8rem', borderRadius: '0.8rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{comment.user?.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem' }}>Aún no hay comentarios. ¡Sé el primero en iniciar el debate!</div>
                    )}
                  </div>

                  {/* Escribir Comentario */}
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={commentText} 
                      onChange={e => setCommentText(e.target.value)} 
                      className="form-input" 
                      placeholder="Escribe tu opinión, propuesta o pregunta..." 
                      style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}><Send size={16} /></button>
                  </form>
                </div>
              )}

              {/* Botón de Eliminación (para personas autorizadas) */}
              {(role !== "USER" || selectedEvent.createdById === user?.id) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                  <button 
                    onClick={handleDeleteEvent}
                    className="btn btn-ghost" 
                    style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}
                  >
                    <Trash2 size={16} />
                    <span>Eliminar Evento</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
