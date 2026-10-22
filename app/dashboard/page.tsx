import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminDashboard from "@/app/components/Admin/AdminDashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect("/")
  }

  const user = session.user as any
  const allowedRoles = ["SUPERVISOR", "MANAGER", "IT_MANAGER", "TECHNOLOGY", "TECHNOLOGY_ADMIN", "HR"]
  const isMaster = user.email?.toLowerCase().trim() === "ireyes@tnoutsourcing.com" || user.isSuperAdmin
  if (!allowedRoles.includes(user.role) && !isMaster) {
    redirect("/")
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "hsl(var(--background))" }}>
      <AdminDashboard />
    </main>
  )
}
