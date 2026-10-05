"use client"
// v3-modern - ultra animated redesign
import { useState } from "react"
import { Phone, Key, Users, Plus, Trash2, Save, Bot, Tag, Book, Settings, AlertCircle, ChevronDown, Check, Settings2, ShieldCheck, Sparkles, X } from "lucide-react"
import { createWhatsappConfig, updateWhatsappConfig, deleteWhatsappConfig } from "@/app/actions/whatsappActions"
import { useTheme } from "@/app/Providers"
import WhatsappQR from "./WhatsappQR"

export default function WhatsappManager({ initialConfigs, projects, documents }: { initialConfigs: any[], projects: any[], documents: any[] }) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [loading, setLoading] = useState(false)
  
  // Create / Edit state
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [code, setCode] = useState("")
  const [useAI, setUseAI] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])

  const handleEdit = (config: any) => {
    setEditingId(config.id)
    setName(config.name || "")
    setPhoneNumber(config.phoneNumber)
    setCode(config.code || "")
    setUseAI(config.useAI || false)
    setSelectedProjects(config.projects.map((p: any) => p.id))
    setSelectedDocs(config.documents?.map((d: any) => d.id) || [])
    setOpen(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => {
    setEditingId(null)
    setName("")
    setPhoneNumber("")
    setCode("")
    setUseAI(false)
    setSelectedProjects([])
    setSelectedDocs([])
    setOpen(false)
  }

  const handleSave = async () => {
    if (!phoneNumber.trim()) return alert("El número es requerido")
    
    setLoading(true)
    if (editingId) {
      await updateWhatsappConfig(editingId, name, phoneNumber, code, useAI, selectedProjects, selectedDocs)
    } else {
      await createWhatsappConfig(name, phoneNumber, code, useAI, selectedProjects, selectedDocs)
    }
    
    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar configuración de Whatsapp?")) return
    setLoading(true)
    await deleteWhatsappConfig(id)
    window.location.reload()
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem", letterSpacing: "-0.02em" }}>
        <Phone size={24} color="hsl(var(--primary))" />
        Configuración WhatsApp
      </h2>
      
      {/* Create / Edit Form Panel */}
      <div className="card animate-in" style={{ 
        overflow: "hidden",
        border: open ? "1px solid hsl(var(--primary) / 0.4)" : "1px solid hsl(var(--border) / 0.6)",
        boxShadow: open ? "0 12px 32px hsl(var(--primary) / 0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        backgroundColor: "hsl(var(--surface))",
        borderRadius: "1.25rem"
      }}>
        <button onClick={() => { if (!editingId) setOpen(!open) }} style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          width: "100%", border: "none", background: open ? "linear-gradient(90deg, hsl(var(--primary) / 0.08), transparent)" : "transparent", 
          cursor: editingId ? "default" : "pointer", padding: "1.5rem 1.75rem", transition: "background 0.3s",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: "0.875rem", 
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))", 
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px hsl(var(--primary) / 0.3)",
              transform: (open && !editingId) ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              flexShrink: 0
            }}>
              {editingId ? <Settings2 size={22} color="white" /> : <Plus size={24} color="white" />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", justifyContent: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "hsl(var(--foreground))", letterSpacing: "-0.01em", lineHeight: "1" }}>
                {editingId ? "Editando Canal" : "Añadir Nuevo Canal"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", lineHeight: "1" }}>
                {editingId ? "Modificando la configuración de WhatsApp" : "Haz clic para configurar un número nuevo"}
              </div>
            </div>
          </div>
          {!editingId && (
            <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.4s" }}>
              <ChevronDown size={24} style={{ color: "hsl(var(--primary))" }} />
            </div>
          )}
        </button>

        <div style={{ 
          maxHeight: open ? "1200px" : "0", 
          opacity: open ? 1 : 0, 
          overflow: "hidden", 
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ padding: "0 1.75rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
               <div className="animate-in stagger-item-1">
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                  ALIAS / NOMBRE
                </label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Canal Soporte" style={{ fontSize: "0.95rem", borderRadius: "0.875rem", padding: "0.875rem 1.15rem" }} />
              </div>
              <div className="animate-in stagger-item-2">
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>
                  NÚMERO DE TELÉFONO (CON CÓDIGO PAÍS)
                </label>
                <input type="text" className="input" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Ej: +18095551234" style={{ fontSize: "0.95rem", borderRadius: "0.875rem", padding: "0.875rem 1.15rem" }} />
              </div>
            </div>
            
            <div className="animate-in stagger-item-3" style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", backgroundColor: "hsl(var(--muted)/0.3)", padding: "1.25rem", borderRadius: "0.875rem", border: "1px solid hsl(var(--border)/0.5)" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>CÓDIGO DE VINCULACIÓN</label>
                <input type="text" className="input" value={code} onChange={e => setCode(e.target.value)} placeholder="Código de emparejamiento..." style={{ fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem" }} />
              </div>
              <div style={{ flexShrink: 0 }}>
                <WhatsappQR onLinked={(newCode) => setCode(newCode)} />
              </div>
            </div>

            <div className="animate-in stagger-item-4" 
              style={{ 
                display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem", 
                backgroundColor: useAI ? "hsla(145, 60%, 45%, 0.08)" : "hsl(var(--surface))", 
                borderRadius: "0.875rem", border: useAI ? "1px solid hsla(145, 60%, 45%, 0.3)" : "1px solid hsl(var(--border))",
                transition: "all 0.3s", cursor: "pointer"
              }}
              onClick={() => setUseAI(!useAI)}
            >
               <div style={{ 
                 width: 20, height: 20, borderRadius: "0.25rem", 
                 border: useAI ? "none" : "2px solid hsl(var(--muted-foreground)/0.5)", 
                 backgroundColor: useAI ? "hsl(145 60% 45%)" : "transparent",
                 display: "flex", alignItems: "center", justifyContent: "center"
               }}>
                 {useAI && <Check size={14} color="white" />}
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: useAI ? "hsl(145 60% 35%)" : "hsl(var(--foreground))", fontWeight: 700 }}>
                 <Bot size={20} />
                 <span>Responder automáticamente con Inteligencia Artificial (Llama 3.2)</span>
                 {useAI && <Sparkles size={16} />}
               </div>
            </div>

            <div className="animate-in stagger-item-5" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div style={{ padding: "1rem", borderRadius: "0.875rem", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", fontWeight: 800, color: "hsl(var(--primary))", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Users size={14} /> Asignar a Grupos
                </label>
                <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", paddingRight: "4px" }}>
                  {projects.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", margin: 0, fontStyle: "italic", textAlign: "center", padding: "1rem" }}>No hay grupos creados.</p>
                  ) : (
                    projects.map(p => (
                      <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", padding: "0.4rem 0.5rem", borderRadius: "0.5rem", backgroundColor: selectedProjects.includes(p.id) ? "hsl(var(--primary)/0.08)" : "transparent", cursor: "pointer", transition: "background 0.2s" }}>
                        <input type="checkbox" checked={selectedProjects.includes(p.id)} onChange={(e) => { if (e.target.checked) setSelectedProjects([...selectedProjects, p.id]); else setSelectedProjects(selectedProjects.filter(id => id !== p.id)) }} style={{ width: 16, height: 16, cursor: "pointer" }} />
                        <span style={{ fontWeight: selectedProjects.includes(p.id) ? 700 : 500, color: selectedProjects.includes(p.id) ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}>{p.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              
              <div style={{ padding: "1rem", borderRadius: "0.875rem", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", fontWeight: 800, color: "hsl(165 60% 40%)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Book size={14} /> Contexto de Conocimiento
                </label>
                <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", paddingRight: "4px" }}>
                  {documents.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", margin: 0, fontStyle: "italic", textAlign: "center", padding: "1rem" }}>No hay documentos disponibles.</p>
                  ) : (
                    documents.map(d => (
                      <label key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", padding: "0.4rem 0.5rem", borderRadius: "0.5rem", backgroundColor: selectedDocs.includes(d.id) ? "hsla(165, 60%, 40%, 0.08)" : "transparent", cursor: "pointer", transition: "background 0.2s" }}>
                        <input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={(e) => { if (e.target.checked) setSelectedDocs([...selectedDocs, d.id]); else setSelectedDocs(selectedDocs.filter(id => id !== d.id)) }} style={{ width: 16, height: 16, cursor: "pointer" }} />
                        <span style={{ fontWeight: selectedDocs.includes(d.id) ? 700 : 500, color: selectedDocs.includes(d.id) ? "hsl(165 60% 35%)" : "hsl(var(--foreground))" }}>{d.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="animate-in stagger-item-6" style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ flex: 1, padding: "0.875rem", fontSize: "0.95rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 6px 20px hsl(var(--primary)/0.25)" }}>
                {loading ? <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span> : <Save size={18} />} 
                {loading ? "Guardando..." : (editingId ? "Guardar Cambios" : "Vincular Canal")}
              </button>
              {editingId ? (
                <button className="btn btn-surface" onClick={handleCancel} disabled={loading} style={{ padding: "0.875rem 1.5rem", fontSize: "0.95rem", borderRadius: "0.75rem" }}>Cancelar</button>
              ) : (
                <button className="btn btn-surface" onClick={handleCancel} disabled={loading} style={{ padding: "0.875rem 1.5rem", fontSize: "0.95rem", borderRadius: "0.75rem" }}>Cerrar</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Existing channels grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Canales Activos ({configs.length})
          </h3>
        </div>
        
        {configs.length === 0 ? (
          <div className="card animate-in scale-in" style={{ textAlign: "center", padding: "4rem 1rem", border: "1px dashed hsl(var(--border))", background: "transparent" }}>
            <Phone size={48} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.2, margin: "0 auto 1rem", display: "block" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "hsl(var(--foreground))" }}>Sin líneas activas</h3>
            <p style={{ color: "hsl(var(--muted-foreground))", margin: "0.5rem 0 0", fontSize: "0.9rem" }}>Configura tu primer canal de WhatsApp arriba.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {configs.map((cfg, idx) => (
              <div 
                key={cfg.id} 
                className={`card animate-in stagger-item-${(idx % 5) + 1}`}
                style={{ 
                  padding: 0, display: "flex", flexDirection: "column", 
                  borderRadius: "1.25rem", border: "1px solid hsl(var(--border) / 0.6)",
                  overflow: "hidden", backgroundColor: "hsl(var(--surface))",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)", transition: "transform 0.3s, box-shadow 0.3s"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)" }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.03)" }}
              >
                {/* Header Ribbon */}
                <div style={{ height: 4, background: cfg.useAI ? "linear-gradient(90deg, hsl(145 60% 45%), hsl(145 60% 55%))" : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)/0.5))" }} />

                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "hsl(var(--foreground))", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cfg.name || "Canal sin nombre"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Phone size={14} /> {cfg.phoneNumber}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                      <button className="btn btn-surface" onClick={() => handleEdit(cfg)} style={{ padding: "0.5rem", borderRadius: "0.5rem", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)", backgroundColor: "hsl(var(--primary)/0.05)" }}>
                        <Settings2 size={16} />
                      </button>
                      <button className="btn btn-surface" onClick={() => handleDelete(cfg.id)} title="Eliminar canal" style={{ padding: "0.5rem", color: "hsl(var(--destructive))", borderRadius: "0.5rem", border: "1px solid hsl(var(--destructive)/0.2)", backgroundColor: "hsl(var(--destructive)/0.05)" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {cfg.useAI && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", backgroundColor: "hsla(145, 60%, 45%, 0.08)", border: "1px solid hsla(145, 60%, 45%, 0.15)" }}>
                        <Bot size={16} color="hsl(145 60% 40%)" />
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(145 60% 35%)" }}>IA Llama 3.2 Activa</span>
                        <span style={{ fontSize: "0.7rem", color: "hsl(145 60% 30%)", opacity: 0.8, marginLeft: "auto", fontWeight: 600 }}>{cfg.documents?.length || 0} Docs</span>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", backgroundColor: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border)/0.5)" }}>
                      <Users size={16} color="hsl(var(--muted-foreground))" />
                      <span style={{ fontSize: "0.8rem", fontWeight: 550, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cfg.projects.length > 0 ? cfg.projects.map((p:any) => p.name).join(", ") : <span style={{ fontStyle: "italic", color: "hsl(var(--muted-foreground))" }}>Sin grupos asignados</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
