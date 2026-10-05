import { getServerSession } from "next-auth/next"
// Force HMR reload
import { authOptions } from "@/lib/auth"
import { LoginForm } from "./components/Auth/LoginForm"
import { CreatePost } from "./components/Feed/CreatePost"
import { PostCard } from "./components/Feed/PostCard"
import { RightPanel } from "./components/Feed/RightPanel"
import { prisma } from "@/lib/prisma"
import { getAbsentEmployeesToday } from "@/app/actions/userActions"
import { getRecentRecognitions } from "@/app/actions/recognitionActions"
import { getUpcomingEvents } from "@/app/actions/calendarActions"
import { computeUserStatus } from "@/lib/userUtils"
import { getHomeMetrics, getCorporateActivity, getUpcomingAbsences, getTodaysBirthdays, getPersonalSummary } from "@/app/actions/homeActions"
import { Users, UserX, Calendar, Award, FileText, Bell, Plus, CalendarPlus, FolderOpen, UserCircle, Zap } from "lucide-react"
import Link from "next/link"
import { MetricsInteractiveCards } from "./components/Dashboard/MetricsInteractiveCards"
import { DailySummary } from "./components/Dashboard/DailySummary"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return <LoginForm />
  }

  const currentUserId = (session.user as any).id
  const currentUserRole = (session.user as any).role

  // Fetch posts
  const rawPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { 
        select: { 
          id: true, name: true, image: true, lastSeen: true,
          requests: { where: { status: "APPROVED" }, select: { type: true, startDate: true, endDate: true, status: true } }
        } 
      },
      likes: { select: { id: true, authorId: true, reaction: true } },
      comments: { 
        include: { 
          author: { 
            select: { 
              name: true, image: true, lastSeen: true,
              requests: { where: { status: "APPROVED" }, select: { type: true, startDate: true, endDate: true, status: true } }
            } 
          } 
        },
        orderBy: { createdAt: "asc" }
      },
    }
  })

  // Sanitizar fechas para componentes cliente y calcular estados
  const posts = rawPosts.map((post: any) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    author: {
      ...post.author,
      currentStatus: computeUserStatus(post.author.requests || [], post.author.lastSeen)
    },
    comments: post.comments.map((comment: any) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      author: {
        ...comment.author,
        currentStatus: computeUserStatus(comment.author.requests || [], comment.author.lastSeen)
      }
    }))
  }))

  const absentEmployees = await getAbsentEmployeesToday()
  const recognitions = await getRecentRecognitions()
  const upcomingEvents = await getUpcomingEvents()

  // New Data
  const metrics = await getHomeMetrics()
  const corporateActivity = await getCorporateActivity()
  const upcomingAbsences = await getUpcomingAbsences()
  const todaysBirthdays = await getTodaysBirthdays()
  const personalSummary = await getPersonalSummary(currentUserId)
  

  const featuredPosts = posts.filter((p: any) => p.isFeatured)
  const normalPosts = posts.filter((p: any) => !p.isFeatured)

  // Obtener la hora actual en zona horaria UTC-5 (Eastern Time / US & Canada)
  const easternHourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false
  }).format(new Date())
  
  const currentHour = parseInt(easternHourStr, 10)
  const greeting = currentHour < 12 ? "Buenos días" : currentHour < 19 ? "Buenas tardes" : "Buenas noches"

  return (
    <div className="container" style={{ padding: "1.5rem" }}>
      
      {/* Personalized Welcome */}
      <div className="animate-in slide-in-bottom-sm" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", letterSpacing: "-0.02em", fontWeight: 800 }}>
            {greeting}, {(session.user as any).name?.split(" ")[0]}! 👋
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.95rem", display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
            <span>{personalSummary.nextAbsence ? `Próxima ausencia: ${new Date(personalSummary.nextAbsence.startDate).toLocaleDateString("es-ES")}` : "Sin ausencias programadas"}</span>
          </p>
        </div>
      </div>

      {/* Top Metrics Cards - Interactive */}
      <MetricsInteractiveCards metrics={metrics} />

      {/* AI Daily Summary */}
      <DailySummary />

      {/* Quick Access Row */}
      <div className="animate-in slide-in-bottom-sm" style={{ display: "flex", gap: "1rem", marginBottom: "2.5rem", overflowX: "auto", paddingBottom: "0.5rem", animationDelay: "200ms" }}>
        {[
          { label: "Nueva Publicación", icon: Plus, href: "#create-post", primary: true },
          { label: "Solicitar Tiempo", icon: CalendarPlus, href: "/vacations", primary: false },
          { label: "Documentos", icon: FolderOpen, href: "/knowledge-base", primary: false },
          { label: "Mi Perfil", icon: UserCircle, href: "/profile", primary: false }
        ].map((btn, i) => (
          <Link key={i} href={btn.href} className={`btn ${btn.primary ? 'btn-primary' : 'btn-surface'} hover-scale`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", borderRadius: "9999px", flexShrink: 0, fontWeight: 700, fontSize: "0.85rem" }}>
            <btn.icon size={16} /> {btn.label}
          </Link>
        ))}
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr", 
        gap: "2.5rem",
        alignItems: "start" 
      }} className="feed-layout">
        
        {/* CSS inline solo para la responsividad, lo ideal sería moverlo a globals.css pero lo dejamos aquí por simplicidad */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .feed-layout {
              grid-template-columns: 1fr 380px !important;
            }
          }
        `}} />

        {/* Central Feed Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
          
          <div id="create-post">
            <CreatePost />
          </div>

          {/* Featured Posts Section */}
          {featuredPosts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 800, color: "hsl(340 80% 60%)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Zap size={16} /> Destacados
              </div>
              {featuredPosts.map((post: any) => {
                const userLike = post.likes.find((like: any) => like.authorId === currentUserId)
                return (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    hasLiked={!!userLike}
                    userReaction={userLike?.reaction}
                    index={0}
                  />
                )
              })}
              <div style={{ borderBottom: "1px solid hsl(var(--border)/0.5)", margin: "0.5rem 0 1rem" }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {normalPosts.length === 0 && featuredPosts.length === 0 ? (
              <div className="card glass animate-in" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: "1.25rem" }}>
                <p style={{ margin: 0, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>Aún no hay publicaciones. ¡Sé el primero en compartir algo!</p>
              </div>
            ) : (
              normalPosts.map((post: any, index: number) => {
                const userLike = post.likes.find((like: any) => like.authorId === currentUserId)
                
                return (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    hasLiked={!!userLike}
                    userReaction={userLike?.reaction}
                    index={index} // Para el stagger animation
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="right-panel-wrapper" style={{ display: "none", position: "sticky", top: "24px", alignSelf: "start" }}>
          <RightPanel 
            absentEmployees={absentEmployees} 
            recognitions={recognitions} 
            upcomingEvents={upcomingEvents} 
            todaysBirthdays={todaysBirthdays}
            upcomingAbsences={upcomingAbsences}
            corporateActivity={corporateActivity}
            personalSummary={personalSummary}
          />
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .right-panel-wrapper {
              display: block !important;
            }
          }
        `}} />
      </div>
    </div>
  );
}
