import { getServerSession } from "next-auth/next"
import { authOptions, isSuperAdminEmail } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMyRequests, getHolidays, getEligibleEmployeesForTimeOff } from "@/app/actions/timeOffActions"
import { VacationForm } from "@/app/components/Vacations/VacationForm"
import { VacationList } from "@/app/components/Vacations/VacationList"
import { UpcomingHolidayCard, UpcomingHolidaysSidebarWidget } from "@/app/components/Vacations/UpcomingHolidaysWidget"
import { AssistantTriggerButton } from "@/app/components/AI/AssistantTriggerButton"
import { prisma } from "@/lib/prisma"
import { CalendarDays, Briefcase, Calendar as CalendarIcon, Info } from "lucide-react"
import { deduplicateHolidays } from "@/lib/holidayData"

import { cookies } from "next/headers"
import { translate } from "@/lib/i18n/dictionaries"
import { Locale, TranslationKey } from "@/lib/i18n/types"
import styles from "./vacations.module.css"

export default async function VacationsPage() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get("intranet_locale")?.value || "es") as Locale
  const t = (k: TranslationKey, params?: Record<string, string | number>) => translate(locale, k, params)

  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect("/")
  }

  const userDb = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { 
      vacationBalance: true,
      role: true,
      project: { select: { name: true } },
      projects: { select: { name: true } }
    }
  }) as any
  const projectName = (userDb?.projects && userDb.projects.length > 0)
    ? userDb.projects.map((p: any) => p.name).join(", ")
    : (userDb?.project?.name || "Sin Grupo Asignado")
  const balance = userDb?.vacationBalance || 0
  const isMasterAdmin = isSuperAdminEmail(session.user?.email) || (session.user as any)?.isSuperAdmin
  const canManage = [
    "SUPERVISOR",
    "TEAM_LEAD",
    "MANAGER",
    "IT_MANAGER",
    "HR",
    "TECHNOLOGY",
    "TECHNOLOGY_ADMIN",
    "ADMIN"
  ].includes(userDb?.role) || isMasterAdmin

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
    <main className={`${styles.vacationsContainer} animate-in`}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <CalendarDays size={32} color="hsl(var(--primary))" />
          {t("vacations.title")}
        </h1>
        <p className={styles.subtitle}>{t("vacations.subtitle")}</p>
      </header>

      {/* Fila 1: Balance y Métricas Rápidas */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>{t("vacations.availableDays")}</div>
          <div className={styles.metricValue} style={{ color: "hsl(var(--primary))" }}>{balance}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>{t("vacations.pendingDays")}</div>
          <div className={styles.metricValue} style={{ color: "#f97316" }}>{pendingDays}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>{t("vacations.approvedRequests")}</div>
          <div className={styles.metricValue} style={{ color: "#10b981" }}>
            {requests.filter((r: any) => r.status === "APPROVED").length}
          </div>
        </div>

        {/* Tarjeta Interactiva Próximo Feriado */}
        <UpcomingHolidayCard upcomingHolidays={holidayEvents as any} />
      </div>

      {/* Fila 2 & 3: Distribución Responsiva por Breakpoints */}
      <div className={styles.layoutGrid}>
        {/* Columna Principal: Formulario y Selector de Tipos (Jerarquía 2 en compactas) */}
        <section className={styles.formArea}>
          <VacationForm 
            projectName={projectName} 
            balance={balance} 
            holidays={holidayDates}
            canCreateForOthers={canManage}
            employees={eligibleEmployees}
          />
        </section>

        {/* Columna Lateral: Mi Perfil, Feriados y Políticas */}
        <aside className={styles.sidebarArea}>
          {/* User Info & Balance Summary Widget */}
          <div className={styles.sidebarCard}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase size={18} color="hsl(var(--primary))" />
              {t("vacations.myProfileBalance")}
            </h3>
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
              <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("vacations.department")}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>{projectName}</div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", fontWeight: 700 }}>{t("vacations.netRemainingBalance")}</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>{balance - pendingDays} <span style={{fontSize: "0.75rem", fontWeight: 600}}>{t("vacations.daysUnit")}</span></span>
              </div>
            </div>
          </div>

          {/* Widget Interactivo de Próximos Feriados */}
          <UpcomingHolidaysSidebarWidget upcomingHolidays={holidayEvents as any} />

          {/* Policies Widget */}
          <div className={styles.policiesCard}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(var(--primary))" }}>
              <Info size={18} />
              {t("vacations.policiesTitle")}
            </h3>
            <ul style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <li>{t("vacations.policy1")}</li>
              <li>{t("vacations.policy2")}</li>
              <li>{t("vacations.policy3")}</li>
              <li>{t("vacations.policy4")}</li>
              <li>{t("vacations.policy5")}</li>
            </ul>
            <AssistantTriggerButton />
          </div>
        </aside>

        {/* Fila / Sección Completa: Historial de Solicitudes (Jerarquía 3 en compactas) */}
        <section className={styles.historyArea}>
          <VacationList requests={requests as any} />
        </section>
      </div>
    </main>
  )
}
