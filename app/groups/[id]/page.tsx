import { getTeamDashboard } from "@/app/actions/teamActions"
import { Users, FileText, Calendar, Cake, Shield, Phone, Activity, Crown, History, CalendarDays } from "lucide-react"
import Link from "next/link"

const STATUS_MAP: Record<string, { label: string, color: string, icon: string }> = {
  VACATION: { label: "Vacaciones", color: "blue", icon: "🔵" },
  PERMISSION: { label: "Permiso Especial", color: "yellow", icon: "🟡" },
  SICK: { label: "Enfermedad", color: "red", icon: "🔴" },
  MEDICAL_LEAVE: { label: "Licencia Médica", color: "purple", icon: "🟣" },
  PATERNITY: { label: "Licencia por Paternidad", color: "cyan", icon: "🩵" },
  MATERNITY: { label: "Licencia por Maternidad", color: "pink", icon: "💜" },
  BEREAVEMENT: { label: "Licencia por Fallecimiento", color: "gray", icon: "⚫" }
}

function getUserStatus(user: any) {
  const activeRequest = user.requests?.find((r: any) => new Date(r.startDate) <= new Date() && new Date(r.endDate) >= new Date())
  if (activeRequest) {
    return {
      status: STATUS_MAP[activeRequest.type] || { label: "Ausente", color: "gray", icon: "⚪" },
      request: activeRequest
    }
  }
  return { status: { label: "Disponible", color: "green", icon: "🟢" }, request: null }
}

function Avatar({ user, size = 40 }: { user: any, size?: number }) {
  return (
    <div style={{ 
      width: size, height: size, borderRadius: "50%", 
      backgroundColor: "hsl(var(--primary)/0.1)", display: "flex", alignItems: "center", justifyContent: "center", 
      overflow: "hidden", flexShrink: 0, fontSize: `${size/2.5}px`, fontWeight: 700, 
      color: "hsl(var(--primary))", border: `2px solid hsl(var(--surface))`
    }}>
      {user.image ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.name?.[0] || "?")}
    </div>
  )
}

export default async function TeamDashboard({ params }: { params: { id: string } }) {
  const { team, upcomingBirthdays } = await getTeamDashboard(params.id)

  const allMembers = [...team.supervisors, ...team.subLeaders, ...team.members]
  const membersWithStatus = allMembers.map(u => ({ ...u, statusInfo: getUserStatus(u) }))
  
  const absents = membersWithStatus.filter(u => u.statusInfo.request)
  const availableCount = membersWithStatus.length - absents.length
  
  const color = team.color || "hsl(var(--primary))"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", paddingBottom: "4rem" }}>
      
      {/* Back Button */}
      <div>
        <Link href="/admin/groups" className="btn btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>
          <span style={{ fontSize: "1.2rem" }}>&larr;</span> Volver a Gestión de Grupos
        </Link>
      </div>

      {/* Header Panel */}
      <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: "1.5rem", border: "none", boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ height: "80px", background: `linear-gradient(135deg, ${color}, ${color}80)` }} />
        <div style={{ padding: "0 1.5rem 1.5rem", position: "relative" }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: "0.8rem", backgroundColor: "hsl(var(--surface))",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem",
            marginTop: "-28px", border: "3px solid hsl(var(--surface))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            marginBottom: "1rem", overflow: "hidden"
          }}>
            {team.image ? <img src={team.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (team.icon || "🛡️")}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.02em" }}>{team.name}</h1>
              <p style={{ color: "hsl(var(--muted-foreground))", margin: 0, fontSize: "1rem", maxWidth: "600px" }}>{team.description || "Un escuadrón sin misión declarada aún."}</p>
            </div>
            {team.email && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: 600 }}>
                📧 {team.email}
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "1rem", border: "1px solid hsl(var(--border)/0.5)" }}>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Integrantes</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{allMembers.length}</div>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "rgba(16,185,129,0.1)", borderRadius: "1rem", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Disponibles</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669" }}>{availableCount}</div>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "1rem", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Ausentes</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626" }}>{absents.length}</div>
            </div>
            <div style={{ padding: "1rem", backgroundColor: "hsl(var(--primary)/0.1)", borderRadius: "1rem", border: "1px solid hsl(var(--primary)/0.2)" }}>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--primary))", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>Documentos</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "hsl(var(--primary))" }}>{team.documents.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }} className="team-grid">
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Organigrama Visual / Miembros */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={20} color="hsl(var(--primary))" /> Estructura del Equipo
            </h3>

            {/* Líderes */}
            {team.supervisors.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Crown size={14} color="hsl(45, 100%, 50%)" /> Líderes de Escuadrón
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                  {team.supervisors.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "1rem", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
                      <div style={{ position: "relative" }}>
                        <Avatar user={u} size={48} />
                        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: "1rem" }}>{getUserStatus(u).status.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{u.position || "Líder"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Líderes */}
            {team.subLeaders.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Shield size={14} color="hsl(var(--primary))" /> Sub-Líderes
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                  {team.subLeaders.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "1rem", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
                      <div style={{ position: "relative" }}>
                        <Avatar user={u} size={48} />
                        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: "1rem" }}>{getUserStatus(u).status.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{u.position || "Sub-Líder"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Miembros */}
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                Integrantes
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                {team.members.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderRadius: "1rem", border: "1px solid hsl(var(--border)/0.5)", backgroundColor: "hsl(var(--muted)/0.1)" }}>
                    <div style={{ position: "relative" }}>
                      <Avatar user={u} size={40} />
                      <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: "0.8rem" }}>{getUserStatus(u).status.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{u.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{u.position || "Miembro"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documentos del Equipo */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={20} color="hsl(var(--primary))" /> Documentos del Equipo
            </h3>
            {team.documents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--muted-foreground))" }}>
                <FileText size={40} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
                No hay documentos asignados a este equipo.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {team.documents.map(doc => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    padding: "1rem", borderRadius: "1rem", border: "1px solid hsl(var(--border)/0.5)",
                    textDecoration: "none", color: "inherit", transition: "all 0.2s"
                  }} className="hover-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "0.5rem", backgroundColor: "hsl(var(--primary)/0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))" }}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{doc.title}</div>
                        <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{doc.category || "General"}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "hsl(var(--primary))" }}>Abrir &rarr;</span>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Ausentes Actualmente */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "1.5rem", border: "1px solid rgba(239,68,68,0.2)" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}>
              <CalendarDays size={20} /> Ausentes Actualmente
            </h3>
            {absents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "hsl(var(--muted-foreground))" }}>
                Todo el equipo está disponible hoy.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {absents.map(u => (
                  <div key={u.id} style={{ display: "flex", gap: "1rem", padding: "1rem", borderRadius: "1rem", backgroundColor: "hsl(var(--muted)/0.2)", border: "1px solid hsl(var(--border)/0.5)" }}>
                    <Avatar user={u} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", fontSize: "0.85rem" }}>
                        <span>{u.statusInfo.status.icon}</span>
                        <span style={{ fontWeight: 600 }}>{u.statusInfo.status.label}</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginTop: "0.4rem" }}>
                        Regresa el: {new Date(u.statusInfo.request.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximos Cumpleaños */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cake size={20} color="hsl(320, 80%, 55%)" /> Próximos Cumpleaños
            </h3>
            {upcomingBirthdays.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "hsl(var(--muted-foreground))" }}>
                No hay cumpleaños en los próximos 30 días.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {upcomingBirthdays.map((u: any) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", borderRadius: "1rem", backgroundColor: "hsl(var(--surface))", border: "1px solid hsl(var(--border))" }}>
                    <Avatar user={u} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "hsl(320, 80%, 55%)", fontWeight: 600 }}>
                        {new Date(u.nextBirthday).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                      </div>
                    </div>
                    {u.daysUntil === 0 ? (
                      <div style={{ padding: "0.25rem 0.75rem", backgroundColor: "hsl(320,80%,55%,0.1)", color: "hsl(320,80%,55%)", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 800 }}>¡Hoy! 🎉</div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>En {u.daysUntil} d</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de Actividad */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={20} color="hsl(var(--primary))" /> Historial de Actividad
            </h3>
            {team.activities.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "hsl(var(--muted-foreground))" }}>
                Sin actividad reciente.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative" }}>
                <div style={{ position: "absolute", left: "15px", top: 10, bottom: 10, width: "2px", backgroundColor: "hsl(var(--border))" }} />
                {team.activities.map((act: any) => (
                  <div key={act.id} style={{ display: "flex", gap: "1rem", position: "relative", zIndex: 1 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "hsl(var(--surface))", border: "2px solid hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <History size={14} color="hsl(var(--primary))" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.9rem", color: "hsl(var(--foreground))", lineHeight: "1.4" }}>{act.content}</div>
                      <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .team-grid { grid-template-columns: 1fr; }
        @media (min-width: 1024px) { .team-grid { grid-template-columns: 1.5fr 1fr; } }
        .hover-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: hsl(var(--primary)/0.3) !important; }
      `}} />
    </div>
  )
}
