import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PeopleSearch } from "@/app/components/Social/PeopleSearch"
import { SocialStatCards } from "@/app/components/Social/SocialStatCards"
import { prisma } from "@/lib/prisma"
import { Users } from "lucide-react"

export default async function SocialPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/")

  const currentUserId = (session.user as any).id

  const [totalUsers, myFriends, pendingCount] = await Promise.all([
    prisma.user.count(),
    prisma.friendship.count({
      where: {
        status: "ACCEPTED",
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
              Centro Social
            </h1>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>
              Conecta con tus compañeros y expande tu red interna.
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
              <Users size={13} /> ¿Cómo conectar?
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { step: "1", text: "Busca a un compañero por nombre o rol." },
                { step: "2", text: "Haz clic en «Conectar» para enviarle una solicitud." },
                { step: "3", text: "Una vez aceptada, podrás chatear directamente." },
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
              Roles en la empresa
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "Manager",    color: "#f97316", bg: "rgba(249,115,22,0.1)" },
                { label: "Supervisor", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
                { label: "Technology", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
                { label: "IT Manager", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
                { label: "RRHH",       color: "#10b981", bg: "rgba(16,185,129,0.1)" },
                { label: "Empleado",   color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
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

