import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileView } from "@/app/components/Profile/ProfileView"
import { getProfileStats } from "@/app/actions/userActions"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { 
      id: true, name: true, email: true, image: true, role: true, vacationBalance: true, lastSeen: true,
      position: true, location: true, extension: true, aboutMe: true, skills: true,
      socialLinkedIn: true, socialTeams: true, socialWebsite: true, birthday: true, showBirthday: true, createdAt: true,
      project: { select: { name: true } },
      projects: { select: { id: true, name: true, color: true, icon: true } },
      requests: {
        where: { status: "APPROVED" },
        select: { type: true, startDate: true, endDate: true, status: true }
      }
    }
  }) as any

  const profileStats = user?.id ? await getProfileStats(user.id) : null

  return <ProfileView user={user} profileStats={profileStats} />
}
