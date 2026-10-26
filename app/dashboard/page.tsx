import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminDashboard from "@/app/components/Admin/AdminDashboard"

import { canAccessApprovalsPanel } from "@/lib/requestAuthorization"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect("/")
  }

  const user = session.user as any
  if (!canAccessApprovalsPanel(user)) {
    redirect("/acceso-denegado")
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "hsl(var(--background))" }}>
      <AdminDashboard />
    </main>
  )
}
