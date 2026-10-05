import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAuditLogs } from "@/app/actions/auditActions"
import { AuditLogViewer } from "@/app/components/Admin/AuditLogViewer"
import { Activity, ShieldAlert } from "lucide-react"

export default async function AdminAuditLogsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = session.user as any
  const allowedRoles = ["TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER"]
  if (!allowedRoles.includes(user.role)) redirect("/")

  const logs = await getAuditLogs({ limit: 150 })

  return (
    <div className="container" style={{ padding: "2rem 1.5rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{ padding: "0.6rem", borderRadius: "0.75rem", backgroundColor: "hsl(var(--primary) / 0.15)" }}>
            <Activity size={24} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>Registro de Auditoría (Audit Logs)</h1>
        </div>
        <p style={{ color: "hsl(var(--muted-foreground))", margin: 0 }}>
          Historial de eventos de autenticación, cambios de roles, aprobaciones y modificaciones del sistema.
        </p>
      </header>

      <AuditLogViewer initialLogs={JSON.parse(JSON.stringify(logs))} />
    </div>
  )
}
