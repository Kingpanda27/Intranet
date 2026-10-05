"use client"

import { TrendingUp, Gift, Zap, Hash, Star, CalendarX, Award, Calendar, Cake, Briefcase, Activity, Plane, FileText } from "lucide-react"

export function RightPanel({ 
  absentEmployees = [], 
  recognitions = [], 
  upcomingEvents = [],
  todaysBirthdays = [],
  upcomingAbsences = [],
  corporateActivity = { posts: 0, docs: 0, recs: 0, requests: 0 },
  personalSummary = { vacationBalance: 0, nextAbsence: null, recognitions: 0 }
}: { 
  absentEmployees?: any[], 
  recognitions?: any[], 
  upcomingEvents?: any[],
  todaysBirthdays?: any[],
  upcomingAbsences?: any[],
  corporateActivity?: any,
  personalSummary?: any
}) {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "1.5rem"
    }}>
      {/* Absent Employees Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <CalendarX size={20} color="hsl(var(--primary))" /> 
          Personal Ausente Hoy
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {absentEmployees.length === 0 ? (
            <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", opacity: 0.8, textAlign: "center", padding: "1rem 0" }}>
              Todo el equipo está disponible hoy.
            </div>
          ) : (
            absentEmployees.map((emp) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: "50%", 
                  backgroundColor: "hsl(var(--muted))", 
                  color: emp.currentStatus.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", fontWeight: 800, overflow: "hidden"
                }}>
                  {emp.image ? (
                    <img src={emp.image} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    emp.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: emp.currentStatus.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: emp.currentStatus.color }} />
                    {emp.currentStatus.label}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recognitions Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Award size={20} color="hsl(var(--primary))" /> 
          Reconocimientos Recientes
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {recognitions.length === 0 ? (
            <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", opacity: 0.8, textAlign: "center", padding: "1rem 0" }}>
              Aún no hay reconocimientos. ¡Sé el primero en otorgar uno!
            </div>
          ) : (
            recognitions.map(rec => (
              <div key={rec.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.75rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Star size={14} color="#f59e0b" />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{rec.receiver.name}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                  Por <span style={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>{rec.type.replace('_', ' ')}</span>
                  <br />De: {rec.sender.name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Events Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDelay: "150ms",
        animationDuration: "500ms",
        animationFillMode: "backwards",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Calendar size={20} color="hsl(340 80% 60%)" /> 
          Próximos Eventos
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {upcomingEvents.length === 0 ? (
            <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", opacity: 0.8, textAlign: "center", padding: "1rem 0" }}>
              No hay eventos programados.
            </div>
          ) : (
            upcomingEvents.map((ev, i) => (
              <div key={`${ev.id}-${i}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.5rem", borderBottom: i === upcomingEvents.length - 1 ? 'none' : "1px dashed hsl(var(--border))" }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: "8px", 
                  backgroundColor: ev.isHoliday ? "hsl(340 80% 60% / 0.15)" : "hsl(var(--primary)/0.15)",
                  color: ev.isHoliday ? "hsl(340 80% 60%)" : "hsl(var(--primary))",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, lineHeight: 1
                }}>
                  <span style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                    {ev.date.toLocaleDateString("es-ES", { month: "short" })}
                  </span>
                  <span style={{ fontSize: "1rem" }}>
                    {ev.date.getDate()}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>{ev.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                    {ev.isHoliday ? "Feriado" : "Evento Corporativo"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Today's Birthdays Widget */}
      {todaysBirthdays.length > 0 && (
        <div className="card glass animate-in fade-in zoom-in-95" style={{ 
          padding: "1.5rem", 
          border: "1px solid hsl(var(--border)/0.5)",
          borderRadius: "20px",
          backgroundColor: "hsla(340, 80%, 60%, 0.05)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
          animationDuration: "500ms",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "hsl(340 80% 60%)" }}>
            <Cake size={20} /> 
            Cumpleaños Hoy
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {todaysBirthdays.map((emp) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", backgroundColor: "hsl(var(--surface))", borderRadius: "12px", border: "1px solid hsl(340 80% 60% / 0.2)" }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: "50%", 
                  backgroundColor: "hsl(340 80% 60% / 0.2)", color: "hsl(340 80% 60%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem", fontWeight: 800, overflow: "hidden", flexShrink: 0
                }}>
                  {emp.image ? (
                    <img src={emp.image} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    emp.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                    ¡Es su día especial! 🎉
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Absences Widget */}
      {upcomingAbsences.length > 0 && (
        <div className="card glass animate-in fade-in zoom-in-95" style={{ 
          padding: "1.5rem", 
          border: "1px solid hsl(var(--border)/0.5)",
          borderRadius: "20px",
          backgroundColor: "hsl(var(--surface))",
          boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
          animationDuration: "500ms",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Plane size={20} color="hsl(var(--primary))" /> 
            Próximas Vacaciones
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {upcomingAbsences.map((req) => (
              <div key={req.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: "50%", 
                  backgroundColor: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.85rem", fontWeight: 800, overflow: "hidden", flexShrink: 0
                }}>
                  {req.user.image ? (
                    <img src={req.user.image} alt={req.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    req.user.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {req.user.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
                    {new Date(req.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - {new Date(req.endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corporate Activity Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Activity size={20} color="#10b981" /> 
          Actividad 7 Días
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.posts}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>Posts</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.docs}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>Documentos</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.requests}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>Solicitudes</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>{corporateActivity.recs}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", fontWeight: 600 }}>Kudos</div>
          </div>
        </div>
      </div>

      {/* My Summary Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
        animationDuration: "500ms",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Briefcase size={20} color="hsl(var(--primary))" /> 
          Mi Resumen
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.5rem" }}><Calendar size={14} /> Días de Vacaciones</span>
            <span style={{ fontSize: "1rem", fontWeight: 800 }}>{personalSummary.vacationBalance}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.5rem" }}><Award size={14} /> Reconocimientos</span>
            <span style={{ fontSize: "1rem", fontWeight: 800 }}>{personalSummary.recognitions}</span>
          </div>
          {personalSummary.nextAbsence && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "hsl(var(--primary)/0.1)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.85rem", color: "hsl(var(--primary))", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}><Plane size={14} /> Próxima Ausencia</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "hsl(var(--primary))" }}>{new Date(personalSummary.nextAbsence.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links Widget */}
      <div className="card glass animate-in fade-in zoom-in-95" style={{ 
        padding: "1.5rem", 
        border: "1px solid hsl(var(--border)/0.5)",
        borderRadius: "20px",
        backgroundColor: "hsl(var(--surface))",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        animationDelay: "300ms",
        animationDuration: "500ms",
        animationFillMode: "backwards",
        background: "linear-gradient(145deg, hsl(var(--surface)), hsl(var(--primary)/0.03))",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Zap size={20} color="hsl(45 90% 50%)" /> 
          Enlaces Rápidos
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {["Políticas", "Beneficios", "Soporte IT", "Directorio"].map((link, i) => (
            <button key={i} style={{ 
              fontSize: "0.8rem", fontWeight: 600, padding: "0.5rem 0.85rem", 
              borderRadius: "12px", 
              backgroundColor: "hsl(var(--muted)/0.4)",
              color: "hsl(var(--foreground))", cursor: "pointer",
              border: "1px solid transparent",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--primary)/0.1)";
              e.currentTarget.style.color = "hsl(var(--primary))";
              e.currentTarget.style.borderColor = "hsl(var(--primary)/0.2)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px hsl(var(--primary)/0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--muted)/0.4)";
              e.currentTarget.style.color = "hsl(var(--foreground))";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
            }}
            >
              {link}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ textAlign: "center", fontSize: "0.75rem", color: "hsl(var(--muted-foreground)/0.6)", marginTop: "0.5rem", opacity: 0.8 }}>
        Telecom Networks Outsourcing © 2026<br/>
        Privacidad · Términos
      </div>
    </div>
  )
}
