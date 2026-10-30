import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { PeopleSearch } from "@/app/components/Social/PeopleSearch"
import { SocialStatCards } from "@/app/components/Social/SocialStatCards"
import { prisma } from "@/lib/prisma"
import { Users } from "lucide-react"
import { translate } from "@/lib/i18n/dictionaries"
import { Locale } from "@/lib/i18n/types"

export default async function SocialPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("intranet_locale")?.value as Locale | undefined
  const locale: Locale = (localeCookie === "en" || localeCookie === "es") ? localeCookie : "es"

  const currentUserId = (session.user as any).id

  const [totalUsers, myFriends, pendingCount] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.friendship.count({
      where: {
        status: { in: ["ACCEPTED", "ACCEP ED"] },
        OR: [{ senderId: currentUserId }, { receiverId: currentUserId }]
      }
    }),
    prisma.friendship.count({
      where: { receiverId: currentUserId, status: "PENDING" }
    })
  ])

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      {/* Page Header */}
      <header className="animate-in" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.35rem" }}>
              {translate(locale, "social.title")}
            </h1>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>
              {translate(locale, "social.subtitle")}
            </p>
          </div>
        </div>

        {/* Clickable Stats bar */}
        <SocialStatCards
          initialStats={{ totalUsers, myFriends, pendingCount }}
        />
      </header>

      {/* Main two-column layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "1.75rem",
        alignItems: "start"
      }} className="social-layout">
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .social-layout {
              grid-template-columns: 1fr 380px !important;
            }
          }
        `}} />
        {/* LEFT – People grid */}
        <div>
          <PeopleSearch />
        </div>

        {/* RIGHT – Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Tips card */}
          <div className="card glass animate-in" style={{ padding: "1.5rem" }}>
            <h4 style={{
              fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.05em",
              textTransform: "uppercase", color: "hsl(var(--primary))",
              display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem"
            }}>
              <Users size={13} /> {translate(locale, "social.howToConnect")}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { step: "1", text: translate(locale, "social.step1") },
                { step: "2", text: translate(locale, "social.step2") },
                { step: "3", text: translate(locale, "social.step3") },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: "hsl(var(--primary) / 0.12)",
                    color: "hsl(var(--primary))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem", fontWeight: 800
                  }}>{step}</div>
                  <p style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.5 }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Roles legend */}
          <div className="card glass animate-in" style={{ padding: "1.5rem" }}>
            <h4 style={{
              fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.05em",
              textTransform: "uppercase", color: "hsl(var(--muted-foreground))",
              marginBottom: "0.875rem"
            }}>
              {translate(locale, "social.companyRoles")}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { key: "MANAGER", label: translate(locale, "social.roles.MANAGER" as any) || "Manager", color: "#f97316" },
                { key: "SUPERVISOR", label: translate(locale, "social.roles.SUPERVISOR" as any) || "Supervisor", color: "#a855f7" },
                { key: "TECHNOLOGY", label: translate(locale, "social.roles.TECHNOLOGY" as any) || "Technology", color: "#06b6d4" },
                { key: "IT_MANAGER", label: translate(locale, "social.roles.IT_MANAGER" as any) || "IT Manager", color: "#3b82f6" },
                { key: "HR", label: translate(locale, "social.roles.HR" as any) || "HR", color: "#10b981" },
                { key: "EMPLOYEE", label: translate(locale, "social.roles.EMPLOYEE" as any) || "Employee", color: "#6b7280" },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{
                    display: "inline-block", width: 10, height: 10,
                    borderRadius: "50%", backgroundColor: color, flexShrink: 0
                  }} />
                  <span style={{ fontSize: "0.8rem", color: "hsl(var(--foreground))", fontWeight: 500 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

