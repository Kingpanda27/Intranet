import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAllUsers } from "@/app/actions/userActions"
import { UserManager } from "@/app/components/Admin/UserManager"
import { Shield, Users } from "lucide-react"

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = session.user as any
  const allowedRoles = ["TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER", "SUPERVISOR", "MANAGER", "HR"]
  if (!allowedRoles.includes(user.role)) redirect("/")

  const users = await getAllUsers()

  return (
    <div className="container" style={{ padding: "2rem 1.5rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{ padding: "0.6rem", borderRadius: "0.75rem", backgroundColor: "hsl(25 90% 55% / 0.15)" }}>
            <Users size={24} style={{ color: "hsl(25 90% 55%)" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>Gestión y Directorio de Usuarios</h1>
        </div>
        <p style={{ color: "hsl(var(--muted-foreground))", margin: 0 }}>
          Directorio corporativo y administración de roles según privilegios asignados.
        </p>
      </header>

      <UserManager 
        users={users} 
        currentUserRole={user.role} 
        currentUserId={user.id} 
      />
    </div>
  )
}
