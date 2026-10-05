import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getRoleChangeRequests } from "@/app/actions/roleRequestActions"
import { RoleRequestManager } from "@/app/components/Admin/RoleRequestManager"
import { ShieldCheck, UserCheck } from "lucide-react"

export default async function AdminRoleRequestsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = session.user as any
  const allowedRoles = ["TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER", "SUPERVISOR", "MANAGER", "HR"]
  if (!allowedRoles.includes(user.role)) redirect("/")

  const requests = await getRoleChangeRequests()

  return (
    <div className="container" style={{ padding: "2rem 1.5rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{ padding: "0.6rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--primary) / 0.15)" }}>
            <ShieldCheck size={24} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>Solicitudes de Cambio de Rol</h1>
        </div>
        <p style={{ color: "hsl(var(--muted-foreground))", margin: 0 }}>
          Revisa y gestiona las solicitudes de asignación y cambio de roles de los colaboradores.
        </p>
      </header>

      <RoleRequestManager 
        initialRequests={JSON.parse(JSON.stringify(requests))} 
        currentUserRole={user.role} 
      />
    </div>
  )
}
