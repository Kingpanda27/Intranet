import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileForm } from "../components/Profile/ProfileForm"
import { UserCircle, Shield, Briefcase, CalendarDays, Key, Activity, Fingerprint, Award, Clock, Star, MapPin, Phone, Mail, FileText, MessageSquare, Linkedin, Globe, Users } from "lucide-react"
import { computeUserStatus } from "@/lib/userUtils"
import { UserStatusBadge } from "@/app/components/UI/UserStatusBadge"
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
      requests: {
        where: { status: "APPROVED" },
        select: { type: true, startDate: true, endDate: true, status: true }
      }
    }
  }) as any

  if (!user) return <div style={{ padding: "3rem", textAlign: "center" }}>Usuario no encontrado en la base de datos.</div>

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      USER: "hsl(220 10% 50%)",
      SUPERVISOR: "hsl(var(--primary))",
      MANAGER: "hsl(262 60% 55%)",
      HR: "hsl(165 60% 40%)",
      TECHNOLOGY: "hsl(25 90% 55%)",
      IT_MANAGER: "hsl(200 80% 50%)"
    }
    return map[role] || "hsl(0,0%,50%)"
  }

  const roleColor = getRoleColor(user.role)
  const currentStatus = computeUserStatus(user.requests || [], user.lastSeen)
  const profileStats = await getProfileStats(user.id) as any
  const recognitions = profileStats?.recognitions || []
  const skillsArray = user.skills ? user.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  
  const calculateAntiquity = (date: Date) => {
    if (!date) return "Reciente"
    const diff = new Date().getTime() - new Date(date).getTime()
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))
    if (years === 0) return "Menos de un año"
    return `${years} año${years > 1 ? 's' : ''}`
  }

  return (
    <div className="container animate-in" style={{ padding: "0 0 4rem", maxWidth: "1200px" }}>
      
      {/* Banner Superior Elegante */}
      <div style={{ 
        height: "200px", 
        background: `linear-gradient(135deg, ${roleColor}, hsl(var(--background)))`,
        borderBottomLeftRadius: "2rem",
        borderBottomRightRadius: "2rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.1)"
      }}>
        <div style={{ position: "absolute", top: "10%", right: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", mixBlendMode: "overlay" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", mixBlendMode: "overlay" }} />
      </div>

      <div style={{ padding: "0 2rem", marginTop: "-80px", position: "relative", zIndex: 10 }}>
        <div className="profile-layout-main">
          
          {/* Columna Izquierda: Identidad y Contacto */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Tarjeta Principal de Identidad */}
            <div className="card glass animate-in slide-in-bottom-sm" style={{ 
              padding: "2rem", 
              border: "1px solid hsl(var(--border)/0.6)",
              borderRadius: "1.5rem",
              textAlign: "center",
              boxShadow: "0 12px 40px rgba(0,0,0,0.08)"
            }}>
              <div style={{ 
                width: 160, height: 160, borderRadius: "50%", 
                backgroundColor: "hsl(var(--surface))", color: roleColor, 
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem", fontSize: "4rem", fontWeight: 800,
                overflow: "hidden",
                border: `6px solid hsl(var(--background))`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              }}>
                {user.image ? (
                  <img src={user.image} alt={user.name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user.name?.charAt(0).toUpperCase() || "U"
                )}
              </div>

              <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{user.name}</h1>
              <div style={{ fontSize: "1.1rem", color: "hsl(var(--primary))", fontWeight: 600, marginBottom: "0.25rem" }}>
                {user.position || "Miembro del Equipo"}
              </div>
              <div style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <Briefcase size={14} /> {user.project?.name || "Sin Grupo Asignado"}
              </div>
              
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
                <UserStatusBadge status={currentStatus} style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }} />
              </div>

              {/* Redes y Contacto */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.9rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "hsl(var(--muted)/0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mail size={16} color="hsl(var(--foreground))" />
                  </div>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", fontWeight: 700 }}>EMAIL</div>
                    <div style={{ fontWeight: 500 }}>{user.email}</div>
                  </div>
                </div>
                
                {(user.location || user.extension) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.9rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "hsl(var(--muted)/0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MapPin size={16} color="hsl(var(--foreground))" />
                    </div>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", fontWeight: 700 }}>UBICACIÓN / EXT</div>
                      <div style={{ fontWeight: 500 }}>{user.location || "Oficina"} {user.extension ? ` - Ext. ${user.extension}` : ""}</div>
                    </div>
                  </div>
                )}

                {user.showBirthday && user.birthday && (
                   <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.9rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "hsl(var(--muted)/0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Star size={16} color="hsl(var(--foreground))" />
                    </div>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", fontWeight: 700 }}>CUMPLEAÑOS</div>
                      <div style={{ fontWeight: 500 }}>{new Date(user.birthday).toLocaleDateString("es-ES", { day: 'numeric', month: 'long' })}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(user.socialLinkedIn || user.socialTeams || user.socialWebsite) && (
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px dashed hsl(var(--border))" }}>
                  {user.socialLinkedIn && (
                    <a href={user.socialLinkedIn} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#0A66C2", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "transform 0.2s" }} className="hover-scale">
                      <Linkedin size={20} />
                    </a>
                  )}
                  {user.socialTeams && (
                    <a href={`https://teams.microsoft.com/l/chat/0/0?users=${user.socialTeams}`} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#5B5FC7", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "transform 0.2s" }} className="hover-scale">
                      <Users size={20} />
                    </a>
                  )}
                  {user.socialWebsite && (
                    <a href={user.socialWebsite} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "hsl(var(--foreground))", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--background))", transition: "transform 0.2s" }} className="hover-scale">
                      <Globe size={20} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Tarjeta de Estadísticas Rápidas */}
            <div className="card glass animate-in stagger-item-2" style={{ padding: "1.5rem", borderRadius: "1.5rem", border: "1px solid hsl(var(--border)/0.6)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={18} color="hsl(var(--primary))" /> Impacto en Intranet
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ padding: "1rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "hsl(var(--primary))" }}>{profileStats?.stats?.docsCount || 0}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginTop: "0.25rem" }}>DOCUMENTOS</div>
                </div>
                <div style={{ padding: "1rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "hsl(280 80% 60%)" }}>{profileStats?.stats?.postsCount || 0}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginTop: "0.25rem" }}>PUBLICACIONES</div>
                </div>
                <div style={{ padding: "1rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10b981" }}>{profileStats?.stats?.recognitionsCount || 0}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginTop: "0.25rem" }}>MEDALLAS</div>
                </div>
                <div style={{ padding: "1rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "1rem", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{calculateAntiquity(profileStats?.stats?.createdAt)}</div>
                  <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginTop: "0.25rem" }}>ANTIGÜEDAD</div>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Contenido y Edición */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Formulario de Perfil (Con pestañas o integrado) */}
            <ProfileForm user={user} />

            {/* Acerca de mí y Habilidades */}
            <div className="profile-layout-details">
              <div className="card glass animate-in stagger-item-3" style={{ padding: "2rem", borderRadius: "1.5rem", border: "1px solid hsl(var(--border)/0.6)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileText size={20} color="hsl(var(--primary))" /> Acerca de Mí
                </h3>
                {user.aboutMe ? (
                  <p style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.7, fontSize: "0.95rem" }}>
                    {user.aboutMe}
                  </p>
                ) : (
                  <p style={{ color: "hsl(var(--muted-foreground))", fontStyle: "italic", opacity: 0.7 }}>
                    Este usuario aún no ha agregado una descripción personal.
                  </p>
                )}
              </div>

              <div className="card glass animate-in stagger-item-4" style={{ padding: "2rem", borderRadius: "1.5rem", border: "1px solid hsl(var(--border)/0.6)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Award size={20} color="#f59e0b" /> Habilidades
                </h3>
                {skillsArray.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {skillsArray.map((skill: string, i: number) => (
                      <span key={i} style={{ 
                        padding: "0.4rem 0.8rem", 
                        backgroundColor: "hsl(var(--muted)/0.4)", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "hsl(var(--foreground))"
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "hsl(var(--muted-foreground))", fontStyle: "italic", opacity: 0.7, fontSize: "0.9rem" }}>
                    No se han registrado habilidades.
                  </p>
                )}
              </div>
            </div>

            {/* Reconocimientos Visuales */}
            <div className="card glass animate-in stagger-item-5" style={{ padding: "2rem", borderRadius: "1.5rem", border: "1px solid hsl(var(--border)/0.6)" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Star size={20} color="#10b981" /> Reconocimientos Recibidos
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {recognitions.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "hsl(var(--muted-foreground))" }}>
                    Aún no has recibido reconocimientos. ¡Sigue dando lo mejor de ti!
                  </div>
                ) : (
                  recognitions.map((rec: any) => (
                    <div key={rec.id} style={{ 
                      padding: "1.5rem", 
                      borderRadius: "1.25rem", 
                      backgroundColor: "hsl(var(--surface))", 
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                      display: "flex", flexDirection: "column"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div style={{ fontWeight: 800, color: "hsl(var(--foreground))", fontSize: "1rem" }}>{rec.type.replace('_', ' ')}</div>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "hsla(145, 60%, 45%, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Award size={20} color="hsl(145 60% 45%)" />
                        </div>
                      </div>
                      {rec.message && (
                        <p style={{ fontSize: "0.9rem", color: "hsl(var(--muted-foreground))", marginBottom: "1.25rem", fontStyle: "italic", flex: 1 }}>
                          "{rec.message}"
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "auto", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", borderTop: "1px solid hsl(var(--border)/0.5)", paddingTop: "1rem" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "hsl(var(--primary)/0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))", fontWeight: 700, fontSize: "0.6rem" }}>
                          {rec.sender?.name?.charAt(0) || "U"}
                        </div>
                        <div>Otorgado por <strong style={{ color: "hsl(var(--foreground))" }}>{rec.sender?.name}</strong></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-scale:hover { transform: scale(1.1); }
        .profile-layout-main { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media (min-width: 1024px) { .profile-layout-main { grid-template-columns: 400px 1fr; gap: 3rem; } }
        .profile-layout-details { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media (min-width: 768px) { .profile-layout-details { grid-template-columns: 1.5fr 1fr; } }
      `}} />
    </div>
  )
}
