import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAuditLogs } from "@/app/actions/auditActions"
import { AuditLogViewer } from "@/app/components/Admin/AuditLogViewer"
import { canViewAuditLogs } from "@/lib/auditPermissions"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Logs de Auditoría | TN Intranet",
  description: "Registro de auditoría y trazabilidad de eventos del sistema"
}

export default async function AdminAuditLogsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = session.user as any

  let allowed = canViewAuditLogs(user)
  if (!allowed && user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, position: true, project: { select: { name: true } } }
    }).catch(() => null)

    if (dbUser) {
      allowed = canViewAuditLogs({
        ...user,
        role: dbUser.role,
        position: dbUser.position,
        projectName: dbUser.project?.name
      })
    }
  }

  if (!allowed) {
    redirect("/")
  }

  const initialData = await getAuditLogs({ limit: 150 })

  return (
    <div className="container" style={{ padding: "2rem 1.5rem", maxWidth: "1500px", margin: "0 auto" }}>
      <AuditLogViewer 
        initialData={JSON.parse(JSON.stringify(initialData))} 
        currentUser={JSON.parse(JSON.stringify(user))}
      />
    </div>
  )
}
