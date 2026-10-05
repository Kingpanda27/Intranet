"use client"
import { useState, useRef, useMemo, useEffect, Fragment } from "react"
import { createPortal } from "react-dom"
import { Upload, Trash2, ExternalLink, CheckCircle, HardDrive, FolderOpen, Tag, Users, CloudUpload, FileType, Search, Filter, Briefcase, Plus, FileText, Calendar, Clock, BarChart3, Building2, UserCircle2, Bot, Sparkles, X, Copy, Check } from "lucide-react"
import { deleteDocument } from "@/app/actions/kbActions"
import { summarizeDocumentStructured, askDocumentAI } from "@/app/actions/documentAiActions"

type Document = {
  id: string; title: string; url: string; category: string | null; department: string
  createdAt: Date; author: { name: string | null }; authorId: string
}
type Project = { id: string; name: string }

const DEPARTMENTS = [
  { id: "General", name: "General", icon: "🏢", color: "#64748b" },
  { id: "Recursos Humanos", name: "Recursos Humanos", icon: "👥", color: "#10b981" },
  { id: "IT", name: "IT", icon: "💻", color: "#3b82f6" },
  { id: "Operaciones", name: "Operaciones", icon: "⚙️", color: "#f59e0b" },
  { id: "Finanzas", name: "Finanzas", icon: "💰", color: "#14b8a6" },
  { id: "Marketing", name: "Marketing", icon: "📣", color: "#ec4899" },
  { id: "Ventas", name: "Ventas", icon: "📈", color: "#8b5cf6" },
  { id: "Legal", name: "Legal", icon: "⚖️", color: "#ef4444" },
  { id: "Administración", name: "Administración", icon: "📋", color: "#6366f1" }
]

const DEFAULT_CLASSES = ["Procedimientos", "Políticas", "Manuales", "Formularios", "Capacitaciones", "Contratos", "Guías", "Reportes", "General"]

// Renderizador Markdown personalizado ultraligero sin dependencias externas
function renderMarkdown(text: string) {
  if (!text) return null
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (line.startsWith("# ")) {
      return <h1 key={i} style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "1rem", marginBottom: "0.5rem", color: "hsl(var(--primary))", borderBottom: "1px solid hsl(var(--border) / 0.3)", paddingBottom: "0.25rem" }}>{line.substring(2)}</h1>
    }
    if (line.startsWith("## ")) {
      return <h2 key={i} style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.85rem", marginBottom: "0.4rem", color: "hsl(var(--primary))" }}>{line.substring(3)}</h2>
    }
    if (line.startsWith("### ")) {
      return <h3 key={i} style={{ fontSize: "0.95rem", fontWeight: 700, marginTop: "0.75rem", marginBottom: "0.3rem", color: "hsl(var(--foreground))" }}>{line.substring(4)}</h3>
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} style={{ marginLeft: "1.25rem", marginBottom: "0.25rem", fontSize: "0.85rem", color: "hsl(var(--foreground) / 0.9)" }}>{parseInlineMarkdown(line.substring(2))}</li>
    }
    if (line.trim() === "") {
      return <div key={i} style={{ height: "0.5rem" }} />
    }
    return <p key={i} style={{ margin: "0.4rem 0", lineHeight: 1.5, fontSize: "0.85rem", color: "hsl(var(--foreground) / 0.9)" }}>{parseInlineMarkdown(line)}</p>
  })
}

function parseInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function DocCard({ doc, canDelete, onDelete, deleting, idx, onOpenAskDoc }: {
  doc: Document; canDelete: boolean; onDelete: (id: string, title: string) => void; deleting: string | null; idx: number; onOpenAskDoc: (id: string, title: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const deptInfo = DEPARTMENTS.find(d => d.id === doc.department) || DEPARTMENTS[0]

  const handleSummarize = async () => {
    setLoadingSummary(true)
    const result = await summarizeDocumentStructured(doc.id)
    if (result.success) setSummary(result.summary)
    else alert(result.error)
    setLoadingSummary(false)
  }

  return (
    <div
      className={`animate-in fade-in stagger-item-${(idx % 5) + 1}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", 
        flexDirection: "column",
        borderRadius: "1.25rem", 
        padding: "1.25rem",
        border: `1px solid ${hovered ? deptInfo.color + "50" : "hsl(var(--border) / 0.6)"}`,
        backgroundColor: "hsl(var(--surface))",
        boxShadow: hovered ? `0 12px 24px -10px ${deptInfo.color}30` : "0 2px 8px rgba(0,0,0,0.02)",
        transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
        transform: hovered ? "translateY(-2px)" : "none",
        gap: "1rem"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        
        {/* Left column: Icon and info */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1, minWidth: "220px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "10px",
            backgroundColor: `${deptInfo.color}15`, color: deptInfo.color,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0
          }}>
            {deptInfo.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "hsl(var(--foreground))", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {doc.title}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>{deptInfo.name}</span>
              <span style={{ width: "3px", height: "3px", borderRadius: "50%", backgroundColor: "hsl(var(--muted-foreground)/0.5)" }} />
              <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {doc.category || "General"}
              </span>
            </div>
          </div>
        </div>

        {/* Center column: Author & Date metadata */}
        <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignItems: "center", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Calendar size={12} /> {new Date(doc.createdAt).toLocaleDateString()}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <UserCircle2 size={12} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{doc.author?.name || "Desconocido"}</span>
          </div>
        </div>

        {/* Right column: Actions */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => onOpenAskDoc(doc.id, doc.title)}
            className="btn btn-surface"
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "hsl(var(--primary))",
              border: "1px dashed hsl(var(--primary)/0.25)"
            }}
          >
            <Sparkles size={12} />
            Preguntar
          </button>
          
          <button
            onClick={handleSummarize}
            disabled={loadingSummary}
            className="btn btn-surface"
            style={{ padding: "0.45rem", borderRadius: "0.5rem", color: "hsl(var(--primary))", display: "flex", alignItems: "center" }}
            title="Generar Resumen con IA"
          >
            {loadingSummary ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <FileText size={15} />}
          </button>
          
          {canDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(doc.id, doc.title); }}
              disabled={deleting === doc.id}
              className="btn btn-ghost"
              style={{ padding: "0.45rem", color: "hsl(var(--destructive))", borderRadius: "0.5rem", display: "flex", alignItems: "center" }}
              title="Eliminar documento"
            >
              <Trash2 size={15} />
            </button>
          )}
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.75rem", gap: "0.3rem", borderRadius: "0.5rem", display: "flex", alignItems: "center" }}
          >
            <ExternalLink size={12} /> Abrir
          </a>
        </div>
      </div>
      
      {summary && (
        <div className="animate-in slide-in-top" style={{ padding: "1.25rem", backgroundColor: "hsl(var(--primary)/0.03)", borderRadius: "0.75rem", border: "1px solid hsl(var(--primary)/0.15)", fontSize: "0.85rem", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 800, marginBottom: "0.75rem", color: "hsl(var(--primary))", display: "flex", alignItems: "center", gap: "0.4rem", borderBottom: "1px solid hsl(var(--primary)/0.1)", paddingBottom: "0.35rem" }}>
            <Bot size={15}/> 
            Análisis Estructurado del Documento
          </div>
          <div style={{ color: "hsl(var(--foreground))" }}>{renderMarkdown(summary)}</div>
        </div>
      )}
    </div>
  )
}

export function KBList({ initialDocuments, userRole, currentUserId, onUpload, projects = [] }: {
  initialDocuments: Document[]; userRole: string; currentUserId?: string
  onUpload: (fd: FormData) => Promise<any>; projects?: Project[]
}) {
  const [docs, setDocs] = useState(initialDocuments)
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState("ALL")
  const [filterClass, setFilterClass] = useState("ALL")
  const [filterType, setFilterType] = useState<"ALL" | "MINE" | "RECENT">("ALL")
  
  const [deleting, setDeleting] = useState<string | null>(null)

  // Portal & AI Chat/RAG Drawer State
  const [mounted, setMounted] = useState(false)
  const [copiedAI, setCopiedAI] = useState(false)
  const [isOpenAI, setIsOpenAI] = useState(false)
  const [queryAI, setQueryAI] = useState("")
  const [loadingAI, setLoadingAI] = useState(false)
  const [answerAI, setAnswerAI] = useState<string | null>(null)
  const [sourcesAI, setSourcesAI] = useState<{ id: string, title: string, url: string }[]>([])
  const [chunksAI, setChunksAI] = useState<{ content: string, documentTitle: string }[]>([])
  const [selectedDocIdAI, setSelectedDocIdAI] = useState<string | null>(null)
  const [selectedDocTitleAI, setSelectedDocTitleAI] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpenAI) {
        setIsOpenAI(false)
      }
    }
    if (isOpenAI) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpenAI])

  // Cargar búsquedas recientes en el cliente
  useEffect(() => {
    const saved = localStorage.getItem("intranet_kb_recent_searches")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  const addRecentSearch = (q: string) => {
    if (!q.trim()) return
    const next = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 5)
    setRecentSearches(next)
    localStorage.setItem("intranet_kb_recent_searches", JSON.stringify(next))
  }

  const handleAISubmit = async (customQuery?: string) => {
    const q = customQuery || queryAI
    if (!q.trim()) return
    setLoadingAI(true)
    setAnswerAI(null)
    setSourcesAI([])
    setChunksAI([])
    if (!customQuery) {
      addRecentSearch(q)
    }
    
    const res = await askDocumentAI(q, selectedDocIdAI || undefined)
    if (res.success) {
      setAnswerAI(res.answer || null)
      setSourcesAI(res.sources || [])
      setChunksAI(res.chunks || [])
    } else {
      setAnswerAI(`Error: ${res.error || "No se pudo obtener una respuesta de la IA documental."}`)
    }
    setLoadingAI(false)
  }

  const handleOpenAskDoc = (id: string, title: string) => {
    setSelectedDocIdAI(id)
    setSelectedDocTitleAI(title)
    setQueryAI("")
    setAnswerAI(null)
    setSourcesAI([])
    setChunksAI([])
    setIsOpenAI(true)
  }
  
  // Upload state
  const [loading, setLoading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [selectedProjects, setSP] = useState<string[]>([])
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0].id)
  const [selectedClass, setSelectedClass] = useState("General")
  const [isNewClass, setIsNewClass] = useState(false)
  const [newClassVal, setNewClassVal] = useState("")

  const isPrivileged = userRole !== "USER" && userRole !== "EMPLOYEE"
  const canDelete = ["MANAGER", "TECHNOLOGY", "IT_MANAGER", "ADMIN"].includes(userRole)

  // Derived classifications from docs + defaults
  const allClassifications = useMemo(() => {
    const set = new Set([...DEFAULT_CLASSES, ...docs.map(d => d.category).filter(Boolean)])
    return Array.from(set) as string[]
  }, [docs])

  // Metrics
  const metrics = useMemo(() => {
    const total = docs.length
    const depts = new Set(docs.map(d => d.department).filter(Boolean)).size
    const classes = new Set(docs.map(d => d.category).filter(Boolean)).size
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonth = docs.filter(d => {
      const date = new Date(d.createdAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length

    return { total, depts, classes, thisMonth }
  }, [docs])

  // Active Departments
  const activeDepts = useMemo(() => {
    const map = new Map<string, number>()
    docs.forEach(d => {
      const dept = d.department || "General"
      map.set(dept, (map.get(dept) || 0) + 1)
    })
    return DEPARTMENTS.filter(d => map.has(d.id)).map(d => ({ ...d, count: map.get(d.id) || 0 }))
  }, [docs])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append("projectIds", selectedProjects.join(","))
    formData.append("department", selectedDept)
    formData.append("category", isNewClass && newClassVal ? newClassVal : selectedClass)
    
    const result = await onUpload(formData)
    if (result.success) {
      setUploadDone(true)
      setTimeout(() => window.location.reload(), 1200)
    } else { alert(result.error) }
    setLoading(false)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    setDeleting(id)
    const result = await deleteDocument(id)
    if (result.success) setDocs(prev => prev.filter(d => d.id !== id))
    else alert(result.error || "Error al eliminar.")
    setDeleting(null)
  }

  // Upload handlers
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover") }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0]; setFileName(file.name)
      const fi = document.getElementById("kb-file-input") as HTMLInputElement
      if (fi) { const dt = new DataTransfer(); dt.items.add(file); fi.files = dt.files }
    }
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileName(e.target.files[0].name)
  }

  // Filter logic
  let filtered = docs.filter(d => {
    if (filterDept !== "ALL" && d.department !== filterDept) return false
    if (filterClass !== "ALL" && d.category !== filterClass) return false
    if (search) {
      const q = search.toLowerCase()
      if (!d.title.toLowerCase().includes(q) && !(d.author?.name || "").toLowerCase().includes(q)) return false
    }
    if (filterType === "MINE" && d.authorId !== currentUserId) return false
    return true
  })

  if (filterType === "RECENT") {
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
  }

  return (
    <div style={{ padding: "2rem 1.5rem" }}>
      
      {/* ── 1. HEADER & METRICS ──────────────────────── */}
      <header className="animate-in fade-in" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FolderOpen size={32} color="hsl(var(--primary))" />
            Biblioteca Corporativa
          </h1>
          <button 
            onClick={() => {
              setSelectedDocIdAI(null)
              setSelectedDocTitleAI(null)
              setQueryAI("")
              setAnswerAI(null)
              setSourcesAI([])
              setChunksAI([])
              setIsOpenAI(true)
            }}
            className="btn btn-primary"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              padding: "0.6rem 1.2rem", 
              borderRadius: "0.75rem",
              fontWeight: 700,
              boxShadow: "0 4px 12px hsl(var(--primary) / 0.25)"
            }}
          >
            <Bot size={18} />
            🤖 Preguntar a la IA
          </button>
        </div>
        <p style={{ color: "hsl(var(--muted-foreground))", margin: "0 0 2rem", fontSize: "1rem" }}>
          Encuentra, organiza y comparte documentos con toda la empresa.
        </p>

        {/* Dashboard Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Documentos", value: metrics.total, icon: <FileText size={20} />, color: "#3b82f6" },
            { label: "Departamentos", value: metrics.depts, icon: <Building2 size={20} />, color: "#10b981" },
            { label: "Clasificaciones", value: metrics.classes, icon: <Tag size={20} />, color: "#a855f7" },
            { label: "Nuevos este mes", value: metrics.thisMonth, icon: <BarChart3 size={20} />, color: "#f59e0b" },
          ].map((m, i) => (
            <div key={i} className="card glass" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "12px", backgroundColor: `${m.color}15`, color: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── 2. DEPARTMENT CARDS ──────────────────────── */}
      {activeDepts.length > 0 && (
        <div style={{ marginBottom: "2.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Departamentos Activos</h3>
          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }} className="hide-scroll">
            <button
               onClick={() => setFilterDept("ALL")}
               className="card"
               style={{ 
                 minWidth: "160px", padding: "1.25rem", cursor: "pointer", border: filterDept === "ALL" ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                 backgroundColor: filterDept === "ALL" ? "hsl(var(--primary)/0.05)" : "hsl(var(--surface))"
               }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🏢</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Todos</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{metrics.total} documentos</div>
            </button>
            {activeDepts.map(dept => (
              <button
                key={dept.id}
                onClick={() => setFilterDept(dept.id)}
                className="card"
                style={{ 
                  minWidth: "160px", padding: "1.25rem", cursor: "pointer", border: filterDept === dept.id ? `2px solid ${dept.color}` : "1px solid hsl(var(--border))",
                  backgroundColor: filterDept === dept.id ? `${dept.color}10` : "hsl(var(--surface))"
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{dept.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{dept.name}</div>
                <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{dept.count} documentos</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. MAIN LAYOUT ──────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isPrivileged ? "1fr 380px" : "1fr", gap: "2rem", alignItems: "start" }}>
        
        {/* Left: Document List */}
        <div>
          {/* Filters Bar */}
          <div className="card glass" style={{ padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
              <input type="text" placeholder="Buscar por nombre o autor..." className="input" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "2.5rem" }} />
            </div>
            
            <select className="input" style={{ width: "auto", minWidth: "150px" }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              <option value="ALL">Todas las clasificaciones</option>
              {allClassifications.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "hsl(var(--muted))", padding: "0.25rem", borderRadius: "0.5rem" }}>
              <button onClick={() => setFilterType("ALL")} className="btn" style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", backgroundColor: filterType === "ALL" ? "hsl(var(--surface))" : "transparent", color: filterType === "ALL" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", border: "none", boxShadow: filterType === "ALL" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Todos</button>
              <button onClick={() => setFilterType("MINE")} className="btn" style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", backgroundColor: filterType === "MINE" ? "hsl(var(--surface))" : "transparent", color: filterType === "MINE" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", border: "none", boxShadow: filterType === "MINE" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Mis Docs</button>
              <button onClick={() => setFilterType("RECENT")} className="btn" style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", backgroundColor: filterType === "RECENT" ? "hsl(var(--surface))" : "transparent", color: filterType === "RECENT" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", border: "none", boxShadow: filterType === "RECENT" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Recientes</button>
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="card glass" style={{ textAlign: "center", padding: "4rem", color: "hsl(var(--muted-foreground))" }}>
              <FolderOpen size={48} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron documentos.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filtered.map((doc, idx) => (
                <DocCard key={doc.id} doc={doc} idx={idx} canDelete={canDelete} onDelete={handleDelete} deleting={deleting} onOpenAskDoc={handleOpenAskDoc} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Upload Box */}
        {isPrivileged && (
          <div className="card glass" style={{ position: "sticky", top: "100px", padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem", borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--primary)/0.05)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <CloudUpload size={24} color="hsl(var(--primary))" />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Subir Documento</h3>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>Añade recursos a la biblioteca</p>
              </div>
            </div>

            <form onSubmit={handleUpload} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Dept */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>Departamento</label>
                <select className="input" value={selectedDept} onChange={e => setSelectedDept(e.target.value)} required>
                  {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                </select>
              </div>

              {/* Class */}
              <div>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Clasificación
                  <button type="button" onClick={() => setIsNewClass(!isNewClass)} className="btn btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", color: "hsl(var(--primary))" }}>
                    {isNewClass ? "Seleccionar existente" : "+ Nueva"}
                  </button>
                </label>
                {isNewClass ? (
                  <input type="text" className="input" placeholder="Nombre de la nueva clasificación" value={newClassVal} onChange={e => setNewClassVal(e.target.value)} required />
                ) : (
                  <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} required>
                    {allClassifications.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>Título del documento</label>
                <input name="title" className="input" required placeholder="Ej: Manual de Empleado" />
              </div>

              {/* File */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>Archivo</label>
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                  onClick={() => document.getElementById("kb-file-input")?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                    borderRadius: "1rem", padding: "2rem 1rem", textAlign: "center",
                    backgroundColor: dragActive ? "hsl(var(--primary)/0.05)" : "hsl(var(--surface))",
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {fileName ? (
                    <div style={{ color: "hsl(var(--primary))", fontWeight: 700, fontSize: "0.85rem" }}><CheckCircle size={20} style={{ margin: "0 auto 0.5rem", display: "block" }}/>{fileName}</div>
                  ) : (
                    <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem" }}><Upload size={20} style={{ margin: "0 auto 0.5rem", display: "block", opacity: 0.5 }}/>Arrastra o haz clic para subir</div>
                  )}
                  <input id="kb-file-input" name="file" type="file" required onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              </div>

              {isPrivileged && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", padding: "0.75rem", backgroundColor: "hsl(var(--muted))", borderRadius: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" name="isGlobal" value="true" defaultChecked />
                  🌐 Documento Global (Visible para todos)
                </label>
              )}

              <button type="submit" disabled={loading || uploadDone} className="btn btn-primary" style={{ width: "100%", padding: "1rem" }}>
                {loading ? "Subiendo..." : uploadDone ? "¡Completado!" : "Publicar Documento"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── 4. PANEL LATERAL (DRAWER) DE IA CON PORTAL ──────────────────────── */}
      {mounted && isOpenAI && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsOpenAI(false)} 
            style={{ 
              position: "fixed", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: "rgba(0, 0, 0, 0.65)", 
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 99999
            }} 
          />

          {/* Drawer Container */}
          <div 
            style={{ 
              position: "fixed", 
              top: 0, 
              right: 0, 
              bottom: 0,
              height: "100vh", 
              width: "540px", 
              maxWidth: "100vw", 
              backgroundColor: "hsl(var(--surface))", 
              borderLeft: "1px solid hsl(var(--border))",
              zIndex: 100000, 
              boxShadow: "-12px 0 50px rgba(0, 0, 0, 0.4)", 
              display: "flex", 
              flexDirection: "column", 
              overflow: "hidden"
            }}
          >
            {/* Header del Drawer */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "hsl(var(--surface))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "12px", backgroundColor: "hsl(var(--primary)/0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--primary))" }}>
                  <Bot size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "hsl(var(--foreground))" }}>Asistente de Documentos IA</h3>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                    {selectedDocIdAI ? `Consultando sobre: ${selectedDocTitleAI}` : "Consultas inteligentes sobre toda la biblioteca"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpenAI(false)} 
                className="btn btn-ghost" 
                style={{ padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--muted-foreground))" }}
                title="Cerrar (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido principal del Drawer (Scrollable) */}
            <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }} className="hide-scroll">
              {/* Si está filtrado por un documento específico, mostrar banner */}
              {selectedDocIdAI && (
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "hsl(var(--primary)/0.08)", borderRadius: "0.75rem", border: "1px solid hsl(var(--primary)/0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={14} color="hsl(var(--primary))" />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--primary))" }}>
                      Documento activo: <span style={{ fontWeight: 800 }}>{selectedDocTitleAI}</span>
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDocIdAI(null)
                      setSelectedDocTitleAI(null)
                    }}
                    style={{ fontSize: "0.72rem", color: "hsl(var(--destructive))", border: "none", backgroundColor: "transparent", fontWeight: 700, cursor: "pointer" }}
                  >
                    Quitar filtro
                  </button>
                </div>
              )}

              {/* Formulario de búsqueda */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  className="input" 
                  autoFocus
                  placeholder={selectedDocIdAI ? "Pregunta sobre este documento..." : "Pregunta sobre cualquier documento..."}
                  value={queryAI} 
                  onChange={e => setQueryAI(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === "Enter" && !loadingAI) {
                      handleAISubmit()
                    }
                  }}
                  style={{ flex: 1, borderRadius: "0.75rem", fontSize: "0.9rem", padding: "0.75rem 1rem" }}
                />
                <button 
                  onClick={() => handleAISubmit()} 
                  disabled={loadingAI || !queryAI.trim()} 
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.25rem", borderRadius: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {loadingAI ? "Buscando..." : "Preguntar"}
                </button>
              </div>

              {/* Sugerencias de búsqueda rápida */}
              {!answerAI && !loadingAI && (
                <div>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {selectedDocIdAI ? "Preguntas Frecuentes sobre este documento" : "Sugerencias de búsqueda"}
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {(selectedDocIdAI 
                      ? [
                          "Hazme un resumen.",
                          "¿Cuáles son los puntos más importantes?",
                          "¿Qué responsabilidades menciona?",
                          "¿Qué fechas importantes contiene?",
                          "Explícame este procedimiento de forma sencilla."
                        ]
                      : [
                          "¿Cómo solicito vacaciones?",
                          "¿Qué dice la política de asistencia?",
                          "¿Dónde encuentro el procedimiento de VPN?",
                          "¿Qué documento habla sobre licencias médicas?",
                          "Buscar políticas corporativas",
                          "Buscar procesos de TI"
                        ]
                    ).map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQueryAI(sug)
                          handleAISubmit(sug)
                        }}
                        className="btn btn-surface"
                        style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "1px solid hsl(var(--border))" }}
                      >
                        <Sparkles size={12} style={{ color: "hsl(var(--primary))" }} /> {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultas recientes (Historial) */}
              {recentSearches.length > 0 && !answerAI && !loadingAI && (
                <div>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>Consultas Recientes</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQueryAI(term)
                          handleAISubmit(term)
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.6rem 0.85rem",
                          borderRadius: "0.5rem",
                          backgroundColor: "hsl(var(--surface))",
                          border: "1px solid hsl(var(--border)/0.6)",
                          fontSize: "0.8rem",
                          textAlign: "left",
                          color: "hsl(var(--foreground))",
                          cursor: "pointer",
                          width: "100%",
                          transition: "all 0.2s"
                        }}
                      >
                        <Clock size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pantalla de Carga */}
              {loadingAI && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", gap: "1rem" }}>
                  <div className="spinner" style={{ width: 36, height: 36, border: "3px solid hsl(var(--primary)/0.2)", borderTopColor: "hsl(var(--primary))" }} />
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>Analizando documentos corporativos...</p>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>Buscando información e invocando la IA local</p>
                  </div>
                </div>
              )}

              {/* Respuesta Generada por IA */}
              {answerAI && !loadingAI && (
                <div className="animate-in fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Sección de respuesta */}
                  <div style={{ padding: "1.25rem", backgroundColor: "hsl(var(--primary)/0.04)", borderRadius: "1rem", border: "1px solid hsl(var(--primary)/0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", borderBottom: "1px solid hsl(var(--primary)/0.15)", paddingBottom: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 800, color: "hsl(var(--primary))", fontSize: "0.9rem" }}>
                        <Bot size={18} /> Respuesta de la IA
                      </div>
                      <button
                        onClick={() => {
                          if (answerAI) {
                            navigator.clipboard.writeText(answerAI)
                            setCopiedAI(true)
                            setTimeout(() => setCopiedAI(false), 2000)
                          }
                        }}
                        className="btn btn-ghost"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", color: "hsl(var(--primary))" }}
                      >
                        {copiedAI ? <Check size={13} /> : <Copy size={13} />}
                        {copiedAI ? "¡Copiado!" : "Copiar"}
                      </button>
                    </div>
                    <div style={{ lineHeight: 1.6, fontSize: "0.88rem", color: "hsl(var(--foreground))" }}>
                      {renderMarkdown(answerAI)}
                    </div>
                  </div>

                  {/* Fuentes Utilizadas */}
                  {sourcesAI.length > 0 && (
                    <div>
                      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>Documentos Consultados</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {sourcesAI.map((src) => (
                          <div 
                            key={src.id} 
                            style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center", 
                              padding: "0.75rem 1rem", 
                              borderRadius: "0.75rem", 
                              backgroundColor: "hsl(var(--surface))", 
                              border: "1px solid hsl(var(--border))" 
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
                              <FileText size={16} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
                              <span style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {src.title}
                              </span>
                            </div>
                            <a 
                              href={src.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-surface" 
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", textDecoration: "none" }}
                            >
                              <ExternalLink size={12} /> Abrir Documento
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fragmentos Utilizados */}
                  {chunksAI.length > 0 && (
                    <div>
                      <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", fontWeight: 800, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fragmentos Citados</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {chunksAI.map((chunk, i) => (
                          <div 
                            key={i} 
                            style={{ 
                              padding: "0.85rem 1rem", 
                              borderRadius: "0.75rem", 
                              backgroundColor: "hsl(var(--muted)/0.3)", 
                              borderLeft: "3px solid hsl(var(--primary)/0.6)",
                              fontSize: "0.78rem",
                              lineHeight: 1.4,
                              color: "hsl(var(--foreground))"
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Tag size={10} /> De: {chunk.documentTitle}
                            </div>
                            <p style={{ margin: 0, fontStyle: "italic" }}>
                              "{chunk.content}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
