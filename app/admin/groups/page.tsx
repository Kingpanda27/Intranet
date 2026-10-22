import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getGroups, getAllUsersForGroups } from "@/app/actions/groupActions"
import { GroupManager } from "@/app/components/Admin/GroupManager"
import { Users } from "lucide-react"

export default async function AdminGroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = session.user as any
  if (user.role !== "TECHNOLOGY" && user.role !== "IT_MANAGER" && user.role !== "TECHNOLOGY_ADMIN") redirect("/")

  const [groups, allUsers] = await Promise.all([getGroups(), getAllUsersForGroups()])

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <div 
            style={{ 
              padding: "0.75rem", 
              borderRadius: "1rem", 
              backgroundColor: "hsl(var(--primary) / 0.15)",
              border: "1px solid hsl(var(--primary) / 0.3)",
              boxShadow: "0 0 25px hsl(var(--primary) / 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Users size={26} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>Gestión de Grupos</h1>
              <span style={{ padding: "0.2rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.25)", fontSize: "0.75rem", fontWeight: 800 }}>
                Control Maestro
              </span>
            </div>
            <p style={{ color: "hsl(var(--muted-foreground))", margin: "0.35rem 0 0", fontSize: "0.95rem" }}>
              Administra escuadrones operativos, asigna liderazgos, sub-líderes e integra colaboradores en masa.
            </p>
          </div>
        </div>
      </header>

      <GroupManager groups={groups} allUsers={allUsers} />
    </div>
  )
}
