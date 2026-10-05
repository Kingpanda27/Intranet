import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMyRequests, getHolidays, getEligibleEmployeesForTimeOff } from "@/app/actions/timeOffActions"
import { VacationForm } from "@/app/components/Vacations/VacationForm"
import { VacationList } from "@/app/components/Vacations/VacationList"
import { UpcomingHolidayCard, UpcomingHolidaysSidebarWidget } from "@/app/components/Vacations/UpcomingHolidaysWidget"
import { AssistantTriggerButton } from "@/app/components/AI/AssistantTriggerButton"
import { prisma } from "@/lib/prisma"
import { CalendarDays, Briefcase, Calendar as CalendarIcon, Info } from "lucide-react"
import { deduplicateHolidays } from "@/lib/holidayData"

export default async function VacationsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect("/")
  }

  const userDb = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { 
      vacationBalance: true,
      role: true,
      project: { select: { name: true } } 
    }
  }) as any
  const projectName = userDb?.project?.name || "Sin Grupo Asignado"
  const balance = userDb?.vacationBalance || 0
  const canManage = ["SUPERVISOR", "MANAGER", "IT_MANAGER", "HR", "TECHNOLOGY"].includes(userDb?.role)

  const eligibleEmployees = canManage ? await getEligibleEmployeesForTimeOff() : []

  const allHolidays = await getHolidays()
  const holidayDates = allHolidays.map((h: any) => h.date.toISOString().split('T')[0])

  // Obtener eventos feriados del calendario con sus descripciones y detalles completos
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rawHolidayEvents = await prisma.calendarEvent.findMany({
    where: { 
      type: "HOLIDAY",
      startDate: { gte: today }
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      color: true,
      location: true
    }
  })

  const holidayEvents = deduplicateHolidays(rawHolidayEvents)

  const requests = await getMyRequests()
  const pendingDays = (requests as any[])
    .filter(r => r.status === "PENDING" && r.type === "VACATION")
    .reduce((sum, r) => sum + (r.requestedDays || 0), 0)

  return (
    <main className="container animate-in" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: "1200px" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <CalendarDays size={32} color="hsl(var(--primary))" />
          Vacaciones y Permisos
        </h1>
        <p style={{ color: "hsl(var(--muted-foreground))" }}>Gestiona, programa y consulta tus solicitudes de tiempo libre corporativo.</p>
      </header>

      {/* Fila 1: Métricas Principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div className="card glass" style={{ padding: "1.25rem", borderRadius: "1rem", border: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase" }}>Días Disponibles</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "hsl(var(--primary))", marginTop: "0.5rem" }}>{balance}</div>
        </div>
        <div className="card glass" style={{ padding: "1.25rem", borderRadius: "1rem", border: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase" }}>Días en Proceso</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f97316", marginTop: "0.5rem" }}>{pendingDays}</div>
        </div>
        <div className="card glass" style={{ padding: "1.25rem", borderRadius: "1rem", border: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase" }}>Solicitudes Aprobadas</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981", marginTop: "0.5rem" }}>
            {requests.filter((r: any) => r.status === "APPROVED").length}
          </div>
        </div>

        {/* Tarjeta Interactiva Próximo Feriado */}
        <UpcomingHolidayCard upcomingHolidays={holidayEvents as any} />
      </div>

      {/* Fila 2: Formulario (70%) y Widgets (30%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2.5rem", alignItems: "flex-start", marginBottom: "2.5rem" }} className="vacations-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .vacations-grid {
              grid-template-columns: 1fr 360px !important;
            }
          }
        `}} />
        {/* Main Content Area (Form) */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <VacationForm 
            projectName={projectName} 
            balance={balance} 
            holidays={holidayDates}
            canCreateForOthers={canManage}
            employees={eligibleEmployees}
          />
        </div>

        {/* Sidebar Area */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* User Info & Balance Summary Widget */}
          <div className="card glass" style={{ padding: "1.5rem", borderRadius: "1.25rem", border: "1px solid hsl(var(--border))" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase size={18} color="hsl(var(--primary))" />
              Mi Perfil & Balance
            </h3>
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
              <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Departamento</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>{projectName}</div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", fontWeight: 700 }}>Saldo Neto Restante</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>{balance - pendingDays} <span style={{fontSize: "0.75rem", fontWeight: 600}}>días</span></span>
              </div>
            </div>
          </div>

          {/* Widget Interactivo de Próximos Feriados */}
          <UpcomingHolidaysSidebarWidget upcomingHolidays={holidayEvents as any} />

          {/* Policies Widget */}
          <div className="card glass" style={{ padding: "1.5rem", borderRadius: "1.25rem", border: "1px solid hsl(var(--primary) / 0.2)", backgroundColor: "hsl(var(--primary) / 0.03)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(var(--primary))" }}>
              <Info size={18} />
              Políticas y Normas (Ley de Rep. Dom.)
            </h3>
            <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <li>Las vacaciones deben solicitarse con al menos <strong>25 días de anticipación</strong>.</li>
              <li>De 1 a 5 años en la empresa corresponden <strong>14 días laborables</strong> de vacaciones (Art. 177).</li>
              <li>A partir de 5 años continuos corresponden <strong>18 días laborables</strong> de vacaciones.</li>
              <li>Los permisos médicos requieren la <strong>carga obligatoria</strong> de un certificado válido.</li>
              <li>Las salidas tempranas están limitadas a un máximo de <strong>4 horas</strong>.</li>
            </ul>
            <AssistantTriggerButton />
          </div>
        </aside>
      </div>

      {/* Fila 3: Historial de Solicitudes (Ancho Completo) */}
      <div>
        <VacationList requests={requests as any} />
      </div>
    </main>
  )
}
