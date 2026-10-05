"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Minus, MessageSquare, Sparkles } from "lucide-react"
import { askAITN, getAvailableAgents } from "@/app/actions/aiBotActions"

interface Message {
  role: "user" | "bot"
  content: string
}

export function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "¡Hola! Soy un Asistente IA. ¿En qué puedo ayudarte hoy?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<{id: string, name: string}[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAvailableAgents().then(data => {
      setAgents(data)
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await askAITN(userMsg, selectedAgentId || undefined)
      if (res.success) {
        setMessages(prev => [...prev, { role: "bot", content: res.response }])
      } else {
        setMessages(prev => [...prev, { role: "bot", content: res.error || "Algo salió mal." }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", content: "Error de conexión." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-bot-container" style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "hsl(var(--primary))",
            color: "white",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            transition: "transform 0.2s",
          }}
          className="hover-scale"
        >
          <Bot size={30} />
          <div style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            backgroundColor: "hsl(var(--accent))",
            padding: "2px 6px",
            borderRadius: "10px",
            fontSize: "10px",
            fontWeight: "bold"
          }}>
            IA TN
          </div>
        </button>
      ) : (
        <div 
          className="card glass animate-in" 
          style={{ 
            width: "350px", 
            height: "500px", 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.4)",
            border: "1px solid hsl(var(--border))",
            borderRadius: "1.5rem"
          }}
        >
          {/* Header */}
          <div style={{
            padding: "1rem 1.5rem",
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 60% 55%))",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={16} />
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>IA Corporativa</span>
              </div>
              {agents.length > 0 && (
                <select 
                  value={selectedAgentId} 
                  onChange={e => setSelectedAgentId(e.target.value)}
                  style={{ 
                    background: "rgba(255,255,255,0.2)", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px",
                    padding: "2px 4px",
                    fontSize: "0.75rem",
                    outline: "none",
                    cursor: "pointer",
                    width: "fit-content",
                    maxWidth: "200px"
                  }}
                >
                  <option style={{color: "black"}} value="">Agente Global (IA TN)</option>
                  {agents.map(a => (
                    <option style={{color: "black"}} key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", marginLeft: "1rem" }}
            >
              <Minus size={20} />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            style={{ 
              flex: 1, 
              padding: "1.5rem", 
              overflowY: "auto", 
              display: "flex", 
              flexDirection: "column", 
              gap: "1rem",
              backgroundColor: "hsl(var(--background) / 0.5)"
            }}
          >
            {messages.map((m, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "0.75rem 1rem",
                  borderRadius: m.role === "user" ? "1rem 1rem 0 1rem" : "1rem 1rem 1rem 0",
                  backgroundColor: m.role === "user" ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                  color: m.role === "user" ? "white" : "hsl(var(--secondary-foreground))",
                  fontSize: "0.9rem",
                  lineHeight: 1.4,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", padding: "0.5rem" }}>
                <span className="dot-typing"></span>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "1rem", borderTop: "1px solid hsl(var(--border))", display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Haz una pregunta..."
              className="input"
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "1rem",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                fontSize: "0.9rem"
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "hsl(var(--primary))",
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
