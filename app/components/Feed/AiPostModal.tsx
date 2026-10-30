"use client"

import React, { useState } from "react"
import { Bot, Sparkles, X, Loader2, Check, RefreshCw, Cpu, MessageSquare, ArrowRight } from "lucide-react"
import { generateTextWithAI } from "@/app/actions/ollamaActions"

interface AiPostModalProps {
  isOpen: boolean
  onClose: () => void
  initialText: string
  onApply: (generatedText: string) => void
}

const TEMPLATES = [
  { label: "📢 Comunicado General", prompt: "Comunicado oficial para todo el equipo sobre novedades y actualizaciones importantes." },
  { label: "🎯 Logro o Meta", prompt: "Felicitar al equipo por el gran esfuerzo y por superar las metas del periodo." },
  { label: "⏰ Recordatorio", prompt: "Recordatorio importante sobre horarios, entregas pendientes y seguimiento de tareas." },
  { label: "🎉 Celebración / Integración", prompt: "Invitación cordial a todo el equipo para participar en una actividad de integración." },
  { label: "🛠️ Mantenimiento TI", prompt: "Aviso de mantenimiento programado en sistemas y plataformas para este fin de semana." },
  { label: "💡 Nueva Iniciativa", prompt: "Presentación de una nueva iniciativa o mejora en los procesos de trabajo del equipo." }
]

const TONES = [
  { id: "profesional", label: "👔 Profesional", desc: "Formal e institucional" },
  { id: "motivador", label: "🚀 Motivador", desc: "Enérgico y positivo" },
  { id: "informativo", label: "📋 Informativo", desc: "Claro y estructurado" },
  { id: "breve", label: "⚡ Breve y Directo", desc: "Al grano sin rodeos" }
]

export function AiPostModal({ isOpen, onClose, initialText, onApply }: AiPostModalProps) {
  const [idea, setIdea] = useState(initialText || "")
  const [selectedTone, setSelectedTone] = useState("profesional")
  const [loading, setLoading] = useState(false)
  const [generatedResult, setGeneratedResult] = useState("")
  const [providerUsed, setProviderUsed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenerate = async (promptToUse?: string) => {
    const textToGenerate = promptToUse || idea
    if (!textToGenerate.trim()) {
      setError("Escribe una idea o selecciona una sugerencia rápida.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = await generateTextWithAI("POST", textToGenerate, selectedTone)
      if (result.success && result.generatedText) {
        setGeneratedResult(result.generatedText)
        setProviderUsed(result.provider || "NVIDIA")
      } else {
        setError(result.error || "No se pudo generar la publicación.")
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servicio de IA.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (prompt: string) => {
    setIdea(prompt)
    setError(null)
  }

  const handleApply = () => {
    if (generatedResult.trim()) {
      onApply(generatedResult.trim())
      onClose()
    }
  }

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="card glass animate-in zoom-in-95"
        style={{
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "hsl(var(--surface))",
          borderRadius: "24px",
          border: "1px solid hsl(var(--border)/0.6)",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.5)",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 16px rgba(16, 185, 129, 0.25)"
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "hsl(var(--foreground))" }}>
                  Asistente de Redacción IA
                </h2>
                <span style={{
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "99px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}>
                  <Cpu size={11} /> NVIDIA NIM
                </span>
              </div>
              <p style={{ fontSize: "0.825rem", color: "hsl(var(--muted-foreground))", margin: "0.15rem 0 0" }}>
                Escribe una idea breve o palabras clave y la IA redactará un comunicado profesional para el equipo.
              </p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-ghost hover-scale"
            style={{ padding: "0.5rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Plantillas / Ideas Rápidas */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", display: "block" }}>
            💡 Ideas Rápidas (Haz clic para usar)
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.prompt)}
                className="btn btn-surface hover-scale"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "99px",
                  backgroundColor: idea === tmpl.prompt ? "hsl(var(--primary)/0.15)" : "hsl(var(--surface))",
                  borderColor: idea === tmpl.prompt ? "hsl(var(--primary))" : "hsl(var(--border)/0.5)",
                  color: idea === tmpl.prompt ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                  fontWeight: 600
                }}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Idea / Palabras Clave */}
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "0.4rem", display: "block" }}>
            ¿Qué deseas comunicar al equipo?
          </label>
          <textarea
            className="input custom-scrollbar"
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ej: Recordar a todos la entrega de métricas este viernes antes de las 5pm y agradecer el compromiso..."
            style={{
              width: "100%",
              borderRadius: "14px",
              padding: "0.75rem 1rem",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              resize: "vertical"
            }}
          />
        </div>

        {/* Selector de Tono */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", display: "block" }}>
            Tono de la redacción
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
            {TONES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTone(t.id)}
                className="btn btn-surface"
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "12px",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                  border: selectedTone === t.id ? "2px solid #10b981" : "1px solid hsl(var(--border)/0.5)",
                  backgroundColor: selectedTone === t.id ? "rgba(16, 185, 129, 0.1)" : "hsl(var(--surface))",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: selectedTone === t.id ? "#10b981" : "hsl(var(--foreground))" }}>
                  {t.label}
                </span>
                <span style={{ fontSize: "0.68rem", color: "hsl(var(--muted-foreground))" }}>
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Botón Generar */}
        <div>
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading || !idea.trim()}
            className="btn btn-primary hover-scale"
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: "14px",
              fontWeight: 800,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              color: "white",
              boxShadow: "0 8px 20px rgba(16, 185, 129, 0.3)"
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                <span>Redactando con NVIDIA AI...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{generatedResult ? "Regenerar Publicación" : "Generar Publicación con IA"}</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Resultado Generado */}
        {generatedResult && (
          <div className="animate-in fade-in slide-in-bottom-sm" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Check size={16} color="#10b981" />
                Mensaje Redactado por IA:
              </label>
              <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 600 }}>
                Generado por {providerUsed || "NVIDIA"}
              </span>
            </div>

            <textarea
              className="input custom-scrollbar"
              rows={6}
              value={generatedResult}
              onChange={(e) => setGeneratedResult(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "14px",
                padding: "0.85rem 1rem",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                backgroundColor: "hsl(var(--muted)/0.2)",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))"
              }}
            />

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading}
                className="btn btn-surface hover-scale"
                style={{
                  borderRadius: "12px",
                  padding: "0.6rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <RefreshCw size={14} />
                Probar otra opción
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="btn btn-primary hover-scale"
                style={{
                  borderRadius: "12px",
                  padding: "0.6rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(280 80% 60%))",
                  border: "none",
                  color: "white"
                }}
              >
                <span>Usar en la publicación</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

