import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTeamDashboard } from "@/app/actions/teamActions"
import { getAllUsersForGroups } from "@/app/actions/groupActions"
import { TeamDashboardView } from "./TeamDashboardView"

export default async function TeamDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params

  const session = await getServerSession(authOptions)
  const { team, upcomingBirthdays } = await getTeamDashboard(groupId)

  // Determinar permisos: Solo líderes del grupo y administradores del intranet
  const user = session?.user as any
  const userId = user?.id
  const userEmail = user?.email?.toLowerCase().trim()
  const userRole = user?.role

  const isMasterAdmin = userEmail === "ireyes@tnoutsourcing.com" || Boolean(user?.isSuperAdmin)
  const isIntranetAdmin = isMasterAdmin || userRole === "TECHNOLOGY" || userRole === "IT_MANAGER" || userRole === "TECHNOLOGY_ADMIN" || userRole === "ADMIN"

  const isGroupLeader = Boolean(
    userId && (
      team.supervisors?.some((s: any) => s.id === userId) ||
      team.subLeaders?.some((sl: any) => sl.id === userId)
    )
  )

  const canEditGroup = isIntranetAdmin || isGroupLeader

  // Obtener lista completa de usuarios solo si tiene permisos de edición (para agregar miembros o asignar líderes)
  const allUsers = canEditGroup ? await getAllUsersForGroups() : []

  // Serialización segura de fechas para componentes de cliente
  const serializedTeam = JSON.parse(JSON.stringify(team))
  const serializedBirthdays = JSON.parse(JSON.stringify(upcomingBirthdays))
  const serializedUsers = JSON.parse(JSON.stringify(allUsers))

  return (
    <TeamDashboardView
      team={serializedTeam}
      upcomingBirthdays={serializedBirthdays}
      allUsers={serializedUsers}
      canEditGroup={canEditGroup}
      isIntranetAdmin={isIntranetAdmin}
    />
  )
}
