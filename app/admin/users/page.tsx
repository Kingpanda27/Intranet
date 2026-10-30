import { getServerSession } from "next-auth/next"
import { authOptions, isSuperAdminEmail } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAllUsers } from "@/app/actions/userActions"
import { UserManager } from "@/app/components/Admin/UserManager"

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = session.user as any
  const isMaster = isSuperAdminEmail(user.email) || user.isSuperAdmin
  const allowedRoles = ["TECHNOLOGY", "TECHNOLOGY_ADMIN", "IT_MANAGER", "SUPERVISOR", "MANAGER", "HR", "ADMIN"]
  if (!allowedRoles.includes(user.role) && !isMaster) redirect("/")

  const users = await getAllUsers()

  return (
    <div className="container" style={{ padding: "2rem 1.5rem" }}>
      <UserManager 
        users={users} 
        currentUserRole={user.role} 
        currentUserId={user.id} 
      />
    </div>
  )
}
