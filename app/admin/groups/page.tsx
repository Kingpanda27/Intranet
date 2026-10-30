import { getServerSession } from "next-auth/next"
import { authOptions, isSuperAdminEmail } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getGroups, getAllUsersForGroups } from "@/app/actions/groupActions"
import { GroupManager } from "@/app/components/Admin/GroupManager"

export default async function AdminGroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = session.user as any
  const isMaster = isSuperAdminEmail(user.email) || user.isSuperAdmin
  const allowed = ["TECHNOLOGY", "IT_MANAGER", "TECHNOLOGY_ADMIN", "ADMIN"].includes(user.role) || isMaster
  if (!allowed) redirect("/")

  const [groups, allUsers] = await Promise.all([getGroups(), getAllUsersForGroups()])

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      <GroupManager groups={groups} allUsers={allUsers} />
    </div>
  )
}
