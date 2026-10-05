"use client"

import { useState, useEffect } from "react"
import { Bot, Sparkles, RefreshCw } from "lucide-react"
import { generateDailySummary } from "@/app/actions/ollamaActions"

export function DailySummary() {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    const result = await generateDailySummary()
    if (result.success) {
      setSummary(result.summary)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isExpanded) {
      setIsExpanded(true)
      if (!summary && !loading) {
        loadSummary()
      }
    } else {
      setIsExpanded(false)
    }
  }

  return (
    <div className="card glass" style={{ padding: "1.5rem", marginBottom: "2rem", borderRadius: "1.25rem", border: "1px solid hsl(var(--primary)/0.2)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.05, transform: "rotate(15deg)", pointerEvents: "none" }}>
        <Bot size={150} color="hsl(var(--primary))" />
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "hsl(var(--primary))" }}>
          <Sparkles size={20} />
          Resumen Diario por IA
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button 
            type="button"
            onClick={handleButtonClick}
            disabled={loading}
            className="btn btn-surface hover-scale"
            style={{ padding: "0.4rem 0.85rem", borderRadius: "999px", fontSize: "0.85rem", color: "hsl(var(--primary))", cursor: "pointer" }}
          >
            {loading ? "Generando..." : isExpanded ? "Ocultar" : "Generar Resumen"}
          </button>
          {isExpanded && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); loadSummary(); }} 
              disabled={loading}
              className="btn btn-ghost hover-scale" 
              style={{ padding: "0.5rem", borderRadius: "50%", color: "hsl(var(--muted-foreground))", cursor: "pointer" }}
              title="Actualizar resumen"
            >
              <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div style={{ position: "relative", zIndex: 1, marginTop: "1.5rem" }}>
          {loading && !summary ? (
            <div style={{ display: "flex", gap: "1rem", color: "hsl(var(--muted-foreground))", alignItems: "center", padding: "1rem 0" }}>
              <div className="spinner" style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: "0.9rem" }}>Analizando novedades de la empresa...</span>
            </div>
          ) : error ? (
            <div style={{ color: "hsl(var(--destructive))", fontSize: "0.9rem" }}>{error}</div>
          ) : (
            <div className="animate-in fade-in" style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "hsl(var(--foreground))", whiteSpace: "pre-wrap", backgroundColor: "hsl(var(--surface))", padding: "1.25rem", borderRadius: "1rem", border: "1px solid hsl(var(--border))" }}>
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
