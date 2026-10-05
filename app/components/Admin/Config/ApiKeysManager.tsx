"use client"

import { useState } from "react"
import { Key, Save, Plus, Trash2, Settings2, HelpCircle, ChevronDown, Check, X, ShieldCheck, Globe } from "lucide-react"
import { createApiConfig, updateApiConfig, deleteApiConfig } from "@/app/actions/apiConfigurationActions"

export default function ApiKeysManager({ initialConfigs }: { initialConfigs: any[] }) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [loading, setLoading] = useState(false)
  
  // Create / Edit state
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [provider, setProvider] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setProvider("")
    setApiKey("")
    setBaseUrl("")
    setIsActive(true)
    setOpen(false)
  }

  const handleEdit = (config: any) => {
    setEditingId(config.id)
    setName(config.name)
    setProvider(config.provider)
    setApiKey("********************") // Don't show full key
    setBaseUrl(config.baseUrl || "")
    setIsActive(config.isActive)
    setOpen(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSave = async () => {
    if (!name.trim() || !provider.trim() || (!editingId && !apiKey.trim())) {
      return alert("El nombre, proveedor y la clave son obligatorios")
    }
    
    setLoading(true)
    
    const formData = new FormData()
    formData.append("name", name)
    formData.append("provider", provider)
    formData.append("baseUrl", baseUrl)
    formData.append("isActive", String(isActive))
    
    // Only send apiKey if it was modified (not asterisks)
    if (apiKey && apiKey !== "********************") {
      formData.append("apiKey", apiKey)
    }
    
    let res;
    if (editingId) {
      formData.append("id", editingId)
      res = await updateApiConfig(formData)
    } else {
      res = await createApiConfig(formData)
    }

    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta clave de API? Esta acción no se puede deshacer.")) return
    setLoading(true)
    const res = await deleteApiConfig(id)
    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem", letterSpacing: "-0.02em", color: "hsl(220 80% 60%)" }}>
        <Key size={24} />
        Claves de API Externas
      </h2>
      
      {/* Create / Edit Form Panel */}
      <div className="card animate-in" style={{ 
        overflow: "hidden",
        border: open ? "1px solid hsl(220 80% 60% / 0.4)" : "1px solid hsl(var(--border) / 0.6)",
        boxShadow: open ? "0 12px 32px hsl(220 80% 60% / 0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        backgroundColor: "hsl(var(--surface))",
        borderRadius: "1.25rem"
      }}>
        <button onClick={() => { if (!editingId) setOpen(!open) }} style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          width: "100%", border: "none", background: open ? "linear-gradient(90deg, hsl(220 80% 60% / 0.08), transparent)" : "transparent", 
          cursor: editingId ? "default" : "pointer", padding: "1.5rem 1.75rem", transition: "background 0.3s",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: "0.875rem", 
              background: "linear-gradient(135deg, hsl(220 80% 60%), hsl(220 80% 40%))", 
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px hsl(220 80% 60% / 0.3)",
              transform: (open && !editingId) ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              flexShrink: 0
            }}>
              {editingId ? <Settings2 size={22} color="white" /> : <Plus size={24} color="white" />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", justifyContent: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "hsl(var(--foreground))", letterSpacing: "-0.01em", lineHeight: "1" }}>
                {editingId ? "Configurando Clave API" : "Registrar Nueva API"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", lineHeight: "1" }}>
                {editingId ? "Editando propiedades de la clave" : "Añadir un proveedor de IA (OpenAI, Anthropic, etc) u otro servicio"}
              </div>
            </div>
          </div>
          {!editingId && (
            <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.4s" }}>
              <ChevronDown size={24} style={{ color: "hsl(220 80% 60%)" }} />
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>NOMBRE DE FANTASÍA</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: OpenAI Prod, Modelo Principal" style={{ fontSize: "0.95rem", borderRadius: "0.875rem", padding: "0.875rem 1.15rem" }} />
              </div>
              <div className="animate-in stagger-item-2">
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>PROVEEDOR</label>
                <input type="text" className="input" value={provider} onChange={e => setProvider(e.target.value)} placeholder="Ej: OpenAI, Anthropic, Gemini, Mistral" style={{ fontSize: "0.95rem", borderRadius: "0.875rem", padding: "0.875rem 1.15rem" }} />
              </div>
            </div>

            <div className="animate-in stagger-item-3">
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>CLAVE API (API KEY)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <ShieldCheck size={18} style={{ position: "absolute", left: "1rem", color: "hsl(var(--muted-foreground))" }} />
                    <input 
                      type={editingId && apiKey === "********************" ? "text" : "password"} 
                      className="input" 
                      value={apiKey} 
                      onChange={e => setApiKey(e.target.value)} 
                      placeholder="sk-..." 
                      style={{ fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem 0.75rem 2.5rem", fontFamily: "monospace", color: "hsl(220 80% 60%)", width: "100%" }} 
                    />
                </div>
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                    {editingId ? "Deja este campo intacto si no quieres modificar la clave." : "La clave se almacenará de forma segura y se utilizará para integrar los servicios a la intranet."}
                </p>
            </div>

            <div className="animate-in stagger-item-4">
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>BASE URL (OPCIONAL)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Globe size={18} style={{ position: "absolute", left: "1rem", color: "hsl(var(--muted-foreground))" }} />
                    <input type="text" className="input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="Ej: https://api.openai.com/v1" style={{ fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem 0.75rem 2.5rem", fontFamily: "monospace", width: "100%" }} />
                </div>
            </div>

            <div className="animate-in stagger-item-5" 
              style={{ 
                display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem", 
                backgroundColor: isActive ? "hsla(220, 80%, 60%, 0.08)" : "hsl(var(--surface))", 
                borderRadius: "0.875rem", border: isActive ? "1px solid hsla(220, 80%, 60%, 0.3)" : "1px solid hsl(var(--border))",
                transition: "all 0.3s", cursor: "pointer"
              }}
              onClick={() => setIsActive(!isActive)}
            >
               <div style={{ 
                 width: 20, height: 20, borderRadius: "0.25rem", 
                 border: isActive ? "none" : "2px solid hsl(var(--muted-foreground)/0.5)", 
                 backgroundColor: isActive ? "hsl(220 80% 60%)" : "transparent",
                 display: "flex", alignItems: "center", justifyContent: "center"
               }}>
                 {isActive && <Check size={14} color="white" />}
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isActive ? "hsl(220 80% 50%)" : "hsl(var(--foreground))", fontWeight: 700 }}>
                 <span>API Activa y disponible para su uso</span>
               </div>
            </div>

            <div className="animate-in stagger-item-6" style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ flex: 1, padding: "0.875rem", fontSize: "0.95rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "linear-gradient(135deg, hsl(220 80% 60%), hsl(220 80% 50%))", color: "white", border: "none", boxShadow: "0 6px 20px hsl(220 80% 60%/0.3)" }}>
                {loading ? <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span> : <Save size={18} />} 
                {loading ? "Guardando..." : (editingId ? "Actualizar API" : "Registrar API")}
              </button>
              {editingId ? (
                <button className="btn btn-surface" onClick={resetForm} disabled={loading} style={{ padding: "0.875rem 1.5rem", fontSize: "0.95rem", borderRadius: "0.75rem" }}>Cancelar</button>
              ) : (
                <button className="btn btn-surface" onClick={resetForm} disabled={loading} style={{ padding: "0.875rem 1.5rem", fontSize: "0.95rem", borderRadius: "0.75rem" }}>Cerrar</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginTop: "0.5rem" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Configuraciones Registradas ({configs.length})
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
            {configs.length === 0 && (
              <div className="card animate-in scale-in" style={{ textAlign: "center", padding: "3rem 1rem", border: "1px dashed hsl(var(--border))", background: "transparent", gridColumn: "1 / -1" }}>
                <Key size={36} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.2, margin: "0 auto 1rem", display: "block" }} />
                <p style={{ color: "hsl(var(--muted-foreground))", margin: 0, fontSize: "0.85rem" }}>No hay claves de API registradas.</p>
              </div>
            )}
            {configs.map((config, idx) => (
              <div 
                key={config.id} 
                className={`card animate-in stagger-item-${(idx % 5) + 1}`}
                style={{ 
                  padding: 0, display: "flex", flexDirection: "column", 
                  borderRadius: "1rem", border: "1px solid hsl(var(--border) / 0.6)",
                  overflow: "hidden", backgroundColor: "hsl(var(--surface))",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)", transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)" }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.02)" }}
              >
                <div style={{ height: 3, background: config.isActive ? "linear-gradient(90deg, hsl(220 80% 60%), hsl(220 80% 40%))" : "hsl(var(--muted-foreground)/0.2)" }} />
                
                <div style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem", color: "hsl(var(--foreground))", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {config.name}
                      </span>
                      {!config.isActive && (
                        <span style={{ fontSize: "0.6rem", padding: "0.15rem 0.4rem", borderRadius: "9999px", backgroundColor: "hsl(var(--muted-foreground)/0.1)", color: "hsl(var(--muted-foreground))", fontWeight: 800 }}>
                          INACTIVA
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600 }}>
                        <ShieldCheck size={14} /> Proveedor: {config.provider}
                      </div>
                      {config.baseUrl && (
                        <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.35rem", opacity: 0.8 }}>
                          <Globe size={12} /> {config.baseUrl}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                    <button className="btn btn-surface" onClick={() => handleEdit(config)} style={{ padding: "0.4rem", borderRadius: "0.5rem", color: "hsl(220 80% 60%)", border: "1px solid hsl(220 80% 60%/0.2)", backgroundColor: "hsl(220 80% 60%/0.05)" }}>
                      <Settings2 size={14} />
                    </button>
                    <button className="btn btn-surface" onClick={() => handleDelete(config.id)} style={{ padding: "0.4rem", color: "hsl(var(--destructive))", borderRadius: "0.5rem", border: "1px solid hsl(var(--destructive)/0.2)", backgroundColor: "hsl(var(--destructive)/0.05)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
