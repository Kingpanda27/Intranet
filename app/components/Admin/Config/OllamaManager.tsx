"use client"
// v3-modern - ultra animated redesign
import { useState } from "react"
import { Server, Save, Book, Play, MessageSquare, Loader2, Phone, Plus, Trash2, Globe, Settings2, ShieldCheck, HelpCircle, ChevronDown, Check, X, Code2 } from "lucide-react"
import { createOllamaConfigWithFiles, updateOllamaConfigWithFiles, deleteOllamaConfig, testOllamaPrompt } from "@/app/actions/ollamaActions"

export default function OllamaManager({ initialConfigs, documents, whatsappConfigs }: { initialConfigs: any[], documents: any[], whatsappConfigs: any[] }) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  
  // Create / Edit state
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("http://192.168.50.233:11434")
  const [modelName, setModelName] = useState("llama3.2")
  const [isGlobal, setIsGlobal] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [files, setFiles] = useState<FileList | null>(null)
  
  // Playground state
  const [testPrompt, setTestPrompt] = useState("")
  const [testResponse, setTestResponse] = useState("")
  const [testMode, setTestMode] = useState<"docs" | "whatsapp">("docs")
  const [selectedWA, setSelectedWA] = useState<string>("")
  const [testConfigId, setTestConfigId] = useState<string>(initialConfigs[0]?.id || "")

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setUrl("http://192.168.50.233:11434")
    setModelName("llama3.2")
    setIsGlobal(false)
    setSelectedDocs([])
    setFiles(null)
    setOpen(false)
  }

  const handleEdit = (config: any) => {
    setEditingId(config.id)
    setName(config.name)
    setUrl(config.url)
    setModelName(config.modelName)
    setIsGlobal(config.isGlobal)
    setSelectedDocs(config.documents?.map((d: any) => d.id) || [])
    setFiles(null)
    setOpen(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSave = async () => {
    if (!name.trim() || !url.trim() || !modelName.trim()) return alert("Todos los campos son obligatorios")
    setLoading(true)
    
    const formData = new FormData()
    formData.append("name", name)
    formData.append("url", url)
    formData.append("modelName", modelName)
    formData.append("isGlobal", String(isGlobal))
    selectedDocs.forEach(id => formData.append("documentIds", id))
    
    if (files && files.length > 0) {
      Array.from(files).forEach(f => formData.append("files", f))
    }

    let res;
    if (editingId) {
      formData.append("id", editingId)
      res = await updateOllamaConfigWithFiles(formData)
    } else {
      res = await createOllamaConfigWithFiles(formData)
    }

    if (res.success) {
      window.location.reload()
    } else {
      alert(res.error)
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este agente de IA?")) return
    setLoading(true)
    await deleteOllamaConfig(id)
    window.location.reload()
  }

  const handleTest = async () => {
    if (!testPrompt.trim()) return
    setTesting(true)
    setTestResponse("")
    
    const config = configs.find(c => c.id === testConfigId)
    if (!config) {
        setTestResponse("Error: Configuración no encontrada")
        setTesting(false)
        return
    }

    let docsToUse = config.documents?.map((d: any) => d.id) || []
    if (testMode === "whatsapp" && selectedWA) {
      const wa = whatsappConfigs.find(w => w.id === selectedWA)
      if (wa && wa.documents) {
        docsToUse = wa.documents.map((d: any) => d.id)
      }
    }

    const result = await testOllamaPrompt(testPrompt, docsToUse, { url: config.url, modelName: config.modelName })
    
    if (result.error) {
      setTestResponse("Error: " + result.error)
    } else {
      setTestResponse(result.response || "Sin respuesta del modelo.")
    }
    setTesting(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.6rem", letterSpacing: "-0.02em", color: "hsl(280 80% 60%)" }}>
        <Server size={24} />
        Agentes IA (Modelos)
      </h2>
      
      {/* Create / Edit Form Panel */}
      <div className="card animate-in" style={{ 
        overflow: "hidden",
        border: open ? "1px solid hsl(280 80% 60% / 0.4)" : "1px solid hsl(var(--border) / 0.6)",
        boxShadow: open ? "0 12px 32px hsl(280 80% 60% / 0.15)" : "0 4px 12px rgba(0,0,0,0.05)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        backgroundColor: "hsl(var(--surface))",
        borderRadius: "1.25rem"
      }}>
        <button onClick={() => { if (!editingId) setOpen(!open) }} style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          width: "100%", border: "none", background: open ? "linear-gradient(90deg, hsl(280 80% 60% / 0.08), transparent)" : "transparent", 
          cursor: editingId ? "default" : "pointer", padding: "1.5rem 1.75rem", transition: "background 0.3s",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: "0.875rem", 
              background: "linear-gradient(135deg, hsl(280 80% 60%), hsl(280 80% 40%))", 
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px hsl(280 80% 60% / 0.3)",
              transform: (open && !editingId) ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              flexShrink: 0
            }}>
              {editingId ? <Settings2 size={22} color="white" /> : <Plus size={24} color="white" />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", justifyContent: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "hsl(var(--foreground))", letterSpacing: "-0.01em", lineHeight: "1" }}>
                {editingId ? "Configurando Agente" : "Crear Nuevo Agente"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", lineHeight: "1" }}>
                {editingId ? "Editando propiedades del modelo" : "Haz clic para añadir un modelo nuevo"}
              </div>
            </div>
          </div>
          {!editingId && (
            <div style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.4s" }}>
              <ChevronDown size={24} style={{ color: "hsl(280 80% 60%)" }} />
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
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>NOMBRE DEL AGENTE</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Llama 3.2 Main" style={{ fontSize: "0.95rem", borderRadius: "0.875rem", padding: "0.875rem 1.15rem" }} />
              </div>
              <div className="animate-in stagger-item-2">
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>MODELO OLLAMA</label>
                <input type="text" className="input" value={modelName} onChange={e => setModelName(e.target.value)} placeholder="llama3.2" style={{ fontSize: "0.95rem", borderRadius: "0.875rem", padding: "0.875rem 1.15rem", fontFamily: "monospace" }} />
              </div>
            </div>

            <div className="animate-in stagger-item-3">
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, marginBottom: "0.4rem", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em" }}>URL DE SERVIDOR OLLAMA</label>
                <input type="text" className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="http://192.168.50.233:11434" style={{ fontSize: "0.9rem", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontFamily: "monospace", color: "hsl(280 80% 60%)" }} />
            </div>

            <div className="animate-in stagger-item-4" 
              style={{ 
                display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem 1.25rem", 
                backgroundColor: isGlobal ? "hsla(280, 80%, 60%, 0.08)" : "hsl(var(--surface))", 
                borderRadius: "0.875rem", border: isGlobal ? "1px solid hsla(280, 80%, 60%, 0.3)" : "1px solid hsl(var(--border))",
                transition: "all 0.3s", cursor: "pointer"
              }}
              onClick={() => setIsGlobal(!isGlobal)}
            >
               <div style={{ 
                 width: 20, height: 20, borderRadius: "0.25rem", 
                 border: isGlobal ? "none" : "2px solid hsl(var(--muted-foreground)/0.5)", 
                 backgroundColor: isGlobal ? "hsl(280 80% 60%)" : "transparent",
                 display: "flex", alignItems: "center", justifyContent: "center"
               }}>
                 {isGlobal && <Check size={14} color="white" />}
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isGlobal ? "hsl(280 80% 50%)" : "hsl(var(--foreground))", fontWeight: 700 }}>
                 <Globe size={20} />
                 <span>Configurar como Agente Global de la Intranet</span>
               </div>
            </div>

            <div className="animate-in stagger-item-5" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
              <div style={{ padding: "1rem", borderRadius: "0.875rem", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--surface))" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", fontWeight: 800, color: "hsl(165 60% 40%)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Book size={14} /> Contexto base del Agente
                </label>
                <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", paddingRight: "4px", marginBottom: "0.75rem" }}>
                  {documents.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", margin: 0, fontStyle: "italic", textAlign: "center", padding: "1rem" }}>No hay documentos en el sistema.</p>
                  ) : (
                    documents.map(d => (
                      <label key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", padding: "0.4rem 0.5rem", borderRadius: "0.5rem", backgroundColor: selectedDocs.includes(d.id) ? "hsla(165, 60%, 40%, 0.08)" : "transparent", cursor: "pointer", transition: "background 0.2s" }}>
                        <input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={(e) => { if (e.target.checked) setSelectedDocs([...selectedDocs, d.id]); else setSelectedDocs(selectedDocs.filter(id => id !== d.id)) }} style={{ width: 16, height: 16, cursor: "pointer" }} />
                        <span style={{ fontWeight: selectedDocs.includes(d.id) ? 700 : 500, color: selectedDocs.includes(d.id) ? "hsl(165 60% 35%)" : "hsl(var(--foreground))" }}>{d.title}</span>
                      </label>
                    ))
                  )}
                </div>
                
                <div style={{ borderTop: "1px dashed hsl(var(--border))", paddingTop: "0.75rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.4rem" }}>
                    <Plus size={13} color="hsl(var(--muted-foreground))" /> Subir documentos
                  </label>
                  <input type="file" multiple className="input" onChange={e => setFiles(e.target.files)} style={{ fontSize: "0.8rem", padding: "0.4rem", width: "100%" }} />
                </div>
              </div>
            </div>

            <div className="animate-in stagger-item-6" style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ flex: 1, padding: "0.875rem", fontSize: "0.95rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "linear-gradient(135deg, hsl(280 80% 60%), hsl(280 80% 50%))", color: "white", border: "none", boxShadow: "0 6px 20px hsl(280 80% 60%/0.3)" }}>
                {loading ? <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span> : <Save size={18} />} 
                {loading ? "Guardando..." : (editingId ? "Actualizar Agente" : "Registrar Agente")}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem", marginTop: "0.5rem" }}>
        
        {/* Left Column: Existing Agents */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Modelos Disponibles ({configs.length})
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {configs.length === 0 && (
              <div className="card animate-in scale-in" style={{ textAlign: "center", padding: "3rem 1rem", border: "1px dashed hsl(var(--border))", background: "transparent" }}>
                <Server size={36} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.2, margin: "0 auto 1rem", display: "block" }} />
                <p style={{ color: "hsl(var(--muted-foreground))", margin: 0, fontSize: "0.85rem" }}>Sin agentes configurados.</p>
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
                <div style={{ height: 3, background: config.isGlobal ? "linear-gradient(90deg, hsl(280 80% 60%), hsl(280 80% 40%))" : "hsl(var(--muted-foreground)/0.2)" }} />
                
                <div style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem", color: "hsl(var(--foreground))", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {config.name}
                      </span>
                      {config.isGlobal && (
                        <span style={{ fontSize: "0.6rem", padding: "0.15rem 0.4rem", borderRadius: "9999px", backgroundColor: "hsl(280 80% 60%/0.1)", color: "hsl(280 80% 60%)", fontWeight: 800 }}>
                          GLOBAL
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.35rem", fontFamily: "monospace" }}>
                        <Code2 size={12} /> {config.modelName}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "0.35rem", opacity: 0.8 }}>
                        <Globe size={12} /> {config.url}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                    <button className="btn btn-surface" onClick={() => handleEdit(config)} style={{ padding: "0.4rem", borderRadius: "0.5rem", color: "hsl(280 80% 60%)", border: "1px solid hsl(280 80% 60%/0.2)", backgroundColor: "hsl(280 80% 60%/0.05)" }}>
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

        {/* Right column: Playground Simulator */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Simulador de IA
          </h3>

          <div className="card glass animate-in" style={{ padding: "1.5rem", borderRadius: "1.25rem", border: "1px solid hsl(var(--border)/0.8)", display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, hsl(var(--primary)/0.1) 0%, transparent 70%)", zIndex: 0 }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", marginBottom: "0.4rem", letterSpacing: "0.05em" }}>AGENTE</label>
              <select className="input" value={testConfigId} onChange={e => setTestConfigId(e.target.value)} style={{ fontSize: "0.85rem", padding: "0.6rem 0.75rem", borderRadius: "0.75rem" }}>
                  {configs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", position: "relative", zIndex: 1 }}>
              <button 
                onClick={() => setTestMode("docs")}
                style={{ 
                  padding: "0.5rem", fontSize: "0.75rem", flex: 1, borderRadius: "0.75rem", fontWeight: 600, transition: "all 0.2s",
                  backgroundColor: testMode === "docs" ? "hsl(var(--primary))" : "hsl(var(--surface))",
                  color: testMode === "docs" ? "white" : "hsl(var(--muted-foreground))",
                  border: testMode === "docs" ? "1px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                  boxShadow: testMode === "docs" ? "0 4px 12px hsl(var(--primary)/0.25)" : "none"
                }}
              >
                Contexto
              </button>
              <button 
                onClick={() => setTestMode("whatsapp")}
                style={{ 
                  padding: "0.5rem", fontSize: "0.75rem", flex: 1, borderRadius: "0.75rem", fontWeight: 600, transition: "all 0.2s",
                  backgroundColor: testMode === "whatsapp" ? "hsl(145 60% 45%)" : "hsl(var(--surface))",
                  color: testMode === "whatsapp" ? "white" : "hsl(var(--muted-foreground))",
                  border: testMode === "whatsapp" ? "1px solid hsl(145 60% 45%)" : "1px solid hsl(var(--border))",
                  boxShadow: testMode === "whatsapp" ? "0 4px 12px hsl(145 60% 45%/0.25)" : "none"
                }}
              >
                WhatsApp
              </button>
            </div>

            {testMode === "whatsapp" && (
              <div className="animate-in slide-in-bottom-sm" style={{ padding: "1rem", backgroundColor: "hsl(var(--muted)/0.3)", borderRadius: "0.75rem", border: "1px dashed hsl(var(--border))", position: "relative", zIndex: 1 }}>
                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", marginBottom: "0.4rem", letterSpacing: "0.05em" }}>CANAL VINCULADO</label>
                <select className="input" value={selectedWA} onChange={e => setSelectedWA(e.target.value)} style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem" }}>
                  <option value="">Seleccione canal...</option>
                  {whatsappConfigs.map(wa => (
                    <option key={wa.id} value={wa.id}>{wa.name || wa.phoneNumber} ({wa.documents?.length || 0} docs)</option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <textarea 
                className="input" 
                placeholder="Ej: ¿Cuáles son las políticas de vacaciones?" 
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                style={{ minHeight: "100px", resize: "none", fontSize: "0.85rem", borderRadius: "0.75rem", padding: "0.875rem 1rem", backgroundColor: "hsl(var(--surface))" }}
              />
            </div>
            
            <button className="btn btn-primary" onClick={handleTest} disabled={testing || !testPrompt.trim() || (testMode === "whatsapp" && !selectedWA)} style={{ width: "100%", padding: "0.875rem", borderRadius: "0.75rem", fontWeight: 800, position: "relative", zIndex: 1 }}>
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} 
              {testing ? "Pensando..." : "Enviar Prueba"}
            </button>

            {testResponse && (
              <div className="animate-in zoom-in-sm" style={{ marginTop: "0.5rem", padding: "1.25rem", backgroundColor: "hsl(var(--surface))", borderRadius: "0.875rem", border: "1px solid hsl(var(--primary)/0.2)", fontSize: "0.85rem", whiteSpace: "pre-wrap", color: testResponse.startsWith("Error") ? "#ef4444" : "hsl(var(--foreground))", lineHeight: "1.6", position: "relative", zIndex: 1, boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
                <div style={{ fontWeight: 800, marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid hsl(var(--border)/0.5)", display: "flex", alignItems: "center", gap: "0.4rem", color: testResponse.startsWith("Error") ? "#ef4444" : "hsl(var(--primary))" }}>
                  {testResponse.startsWith("Error") ? <AlertCircle size={16} /> : <Bot size={16} />}
                  Respuesta Simulada
                </div>
                <div>{testResponse}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
