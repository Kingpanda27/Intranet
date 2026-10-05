"use client"

import { useState, useRef, useEffect } from "react"
import { createPost } from "@/app/actions/postActions"
import { generateTextWithAI } from "@/app/actions/ollamaActions"
import { Send, Image as ImageIcon, X, Smile, BarChart2, Paperclip, Loader2, Sparkles, Award, Bot } from "lucide-react"
import { GiveRecognitionModal } from "../Social/GiveRecognitionModal"

export function CreatePost() {
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showRecognition, setShowRecognition] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setIsFocused(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.max(60, textareaRef.current.scrollHeight)}px`
    }
  }, [content])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !image) return

    setLoading(true)
    const formData = new FormData()
    formData.append("content", content)
    if (image) {
      formData.append("image", image)
    }
    
    await createPost(formData)
    setContent("")
    setImage(null)
    setPreview(null)
    setLoading(false)
    setIsFocused(false)
  }

  const handleAIGenerate = async () => {
    if (!content.trim()) return alert("Escribe una idea breve primero para que la IA la convierta en un comunicado profesional.")
    setGeneratingAI(true)
    const result = await generateTextWithAI("POST", content)
    if (result.success) {
      setContent(result.generatedText)
    } else {
      alert(result.error)
    }
    setGeneratingAI(false)
  }

  return (
    <div 
      className={`card glass animate-in slide-in-bottom-sm ${isFocused ? 'composer-focused' : ''}`} 
      style={{ 
        marginBottom: "1rem", 
        padding: "1.5rem",
        borderRadius: "1.25rem",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        border: isFocused ? "1px solid hsl(var(--primary)/0.4)" : "1px solid hsl(var(--border)/0.5)",
        boxShadow: isFocused ? "0 12px 40px rgba(0,0,0,0.08), 0 0 0 4px hsl(var(--primary)/0.05)" : "0 4px 12px rgba(0,0,0,0.02)",
        backgroundColor: "hsl(var(--surface))",
        position: "relative",
        zIndex: isFocused ? 10 : 1
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))",
            color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px hsl(var(--primary)/0.3)",
            fontWeight: 800, fontSize: "1.2rem"
          }}>
            T
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              ref={textareaRef}
              className="input custom-scrollbar"
              placeholder="¿Qué está pasando en el equipo?..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                if (!content.trim() && !image && !e.relatedTarget) {
                  // Slight delay to allow clicking on buttons
                  setTimeout(() => setIsFocused(false), 200)
                }
              }}
              style={{ 
                resize: "none", 
                border: "none", 
                boxShadow: "none", 
                padding: "0.5rem 0", 
                fontSize: "1.1rem",
                backgroundColor: "transparent",
                outline: "none",
                minHeight: "60px",
                lineHeight: "1.6",
                color: "hsl(var(--foreground))"
              }}
            />
          </div>
        </div>
        
        {preview && (
          <div className="animate-in zoom-in-sm" style={{ 
            position: "relative", 
            marginBottom: "1.25rem",
            marginLeft: "3.75rem",
            borderRadius: "1rem", 
            overflow: "hidden", 
            maxHeight: "350px",
            border: "1px solid hsl(var(--border))",
            boxShadow: "var(--shadow-md)"
          }}>
            <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button 
              type="button" 
              onClick={() => { setImage(null); setPreview(null); }}
              style={{ 
                position: "absolute", top: "0.75rem", right: "0.75rem", 
                backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", 
                width: "32px", height: "32px", cursor: "pointer", 
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s"
              }}
              className="hover-scale"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginTop: isFocused ? "1rem" : "0.5rem",
          paddingLeft: "3.75rem",
          transition: "all 0.3s",
          opacity: (isFocused || content.trim() || image) ? 1 : 0.6
        }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <label className="btn btn-ghost hover-scale" style={{ padding: "0.5rem", borderRadius: "50%", cursor: "pointer", color: "hsl(var(--primary))", backgroundColor: "hsl(var(--primary) / 0.1)" }} title="Añadir imagen">
              <ImageIcon size={20} />
              <input type="file" accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg" onChange={handleImageChange} style={{ display: "none" }} />
            </label>
            
            {/* Visual placeholders for future features */}
            <button type="button" onClick={() => setShowRecognition(true)} className="btn btn-ghost hover-scale" style={{ padding: "0.5rem", borderRadius: "50%", color: "hsl(var(--primary))", backgroundColor: "hsl(var(--primary) / 0.1)" }} title="Reconocer compañero">
              <Award size={20} />
            </button>
            <button type="button" className="btn btn-ghost hover-scale" style={{ padding: "0.5rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))" }} title="Añadir encuesta">
              <BarChart2 size={20} />
            </button>
            <button type="button" className="btn btn-ghost hover-scale" style={{ padding: "0.5rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))" }} title="Añadir emoji">
              <Smile size={20} />
            </button>
            
            {isFocused && (
              <button 
                type="button" 
                onClick={handleAIGenerate}
                disabled={generatingAI || !content.trim()}
                className="btn btn-surface hover-scale" 
                style={{ marginLeft: "0.5rem", padding: "0.5rem 1rem", borderRadius: "99px", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)", display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.8rem", fontWeight: 700 }}
              >
                {generatingAI ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Bot size={16} />}
                Redactar con IA
              </button>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary hover-scale"
            disabled={loading || (!content.trim() && !image)}
            style={{ 
              minWidth: "120px", 
              borderRadius: "9999px",
              padding: "0.6rem 1.25rem",
              opacity: (!content.trim() && !image) ? 0.4 : 1,
              transition: "all 0.3s",
              background: (!content.trim() && !image) ? "hsl(var(--muted))" : "linear-gradient(135deg, hsl(var(--primary)), hsl(280 80% 60%))",
              color: (!content.trim() && !image) ? "hsl(var(--muted-foreground))" : "white",
              border: "none",
              boxShadow: (!content.trim() && !image) ? "none" : "0 8px 20px hsl(var(--primary)/0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                <span>Enviando</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span style={{ fontWeight: 700 }}>Publicar</span>
              </>
            )}
          </button>
        </div>
      </form>
      
      {showRecognition && (
        <GiveRecognitionModal onClose={() => setShowRecognition(false)} />
      )}
    </div>
  )
}
