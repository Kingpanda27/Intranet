"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, Phone, MoreVertical, Image as ImageIcon, X, Mic } from "lucide-react"
import { getChatMessages, sendMessage, updateLastSeen } from "@/app/actions/chatActions"

export function ChatView({ conversationId, currentUserId }: { conversationId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!conversationId) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    
    // Heartbeat for online status
    updateLastSeen()
    const presenceInterval = setInterval(updateLastSeen, 60000) // Every 1 min

    return () => {
      clearInterval(interval)
      clearInterval(presenceInterval)
    }
  }, [conversationId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const data = await getChatMessages(conversationId)
      setMessages(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputValue.trim() && !imageFile) || loading) return

    setLoading(true)
    const result = await sendMessage(conversationId, inputValue, imageFile || undefined)
    if (result.success) {
      setInputValue("")
      setImageFile(null)
      setImagePreview(null)
      fetchMessages()
    }
    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.lang = "es-ES"
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onstart = () => {
          setIsRecording(true)
        }

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("")
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }

        recognition.onerror = () => {
          setIsRecording(false)
        }

        recognition.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current = recognition
        recognition.start()
      } catch (e) {
        console.warn("Speech recognition error:", e)
        setIsRecording(false)
      }
    } else {
      alert("El dictado por voz no está soportado en este navegador.")
    }
  }

  if (!conversationId) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", color: "hsl(var(--muted-foreground))" }}>
        <MessageSquare size={64} style={{ opacity: 0.2 }} />
        <p>Selecciona una conversación para empezar a chatear</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      <header style={{ padding: "1rem", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "hsl(var(--primary)/0.1)", overflow: "hidden" }}>
             {/* Aquí podríamos poner la foto del otro usuario si la pasamos como prop */}
             <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={20} /></div>
          </div>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Conversación</h2>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-ghost" style={{ padding: "0.5rem" }}><Phone size={20} /></button>
          <button className="btn btn-ghost" style={{ padding: "0.5rem" }}><MoreVertical size={20} /></button>
        </div>
      </header>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.map((msg) => {
          const isOwn = msg.authorId === currentUserId
          
          return (
            <div key={msg.id} style={{ 
              display: "flex", 
              justifyContent: isOwn ? "flex-end" : "flex-start",
              gap: "0.75rem",
              alignItems: "start" 
            }}>
              {!isOwn && (
                <div style={{ 
                  width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", 
                  backgroundColor: "hsl(var(--primary) / 0.1)", flexShrink: 0 
                }}>
                  {msg.author.image ? (
                    <img src={msg.author.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                      {msg.author.name?.[0]}
                    </div>
                  )}
                </div>
              )}
              <div style={{ 
                backgroundColor: isOwn ? "hsl(var(--primary))" : "hsl(var(--card))", 
                color: isOwn ? "white" : "inherit",
                padding: "0.5rem", 
                borderRadius: isOwn ? "0.75rem 0.75rem 0 0.75rem" : "0 0.75rem 0.75rem 0.75rem", 
                maxWidth: "70%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                border: isOwn ? "none" : "1px solid hsl(var(--border))"
              }}>
                {msg.imageUrl && (
                  <div style={{ marginBottom: "0.5rem", borderRadius: "0.5rem", overflow: "hidden" }}>
                    <img 
                      src={msg.imageUrl} 
                      alt="Shared image" 
                      style={{ maxWidth: "100%", display: "block", cursor: "pointer" }} 
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                    />
                  </div>
                )}
                {msg.content && <p style={{ margin: "0.25rem 0.5rem", fontSize: "0.95rem", lineHeight: 1.4, wordBreak: "break-word" }}>{msg.content}</p>}
                <div style={{ fontSize: "0.6rem", opacity: 0.7, marginTop: "0.2rem", textAlign: "right", marginRight: "0.25rem" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form 
        onSubmit={handleSend} 
        style={{ 
          padding: "0.85rem 1.25rem", 
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)", 
          display: "flex", 
          flexDirection: "column", 
          gap: "0.5rem" 
        }}
      >
        {imagePreview && (
          <div style={{ position: "relative", width: "70px", height: "70px", borderRadius: "12px", overflow: "hidden", border: "2px solid rgba(59, 130, 246, 0.6)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
            <img src={imagePreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button 
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              style={{ position: "absolute", top: 3, right: 3, backgroundColor: "rgba(0,0,0,0.65)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Quitar imagen"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: "none" }} 
          />
          <button 
            type="button" 
            className="hover-scale" 
            onClick={() => fileInputRef.current?.click()}
            title="Adjuntar imagen o archivo"
            style={{ 
              background: "transparent",
              border: "none",
              color: "#94a3b8", 
              cursor: "pointer",
              padding: "0.5rem", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
          >
            <ImageIcon size={22} />
          </button>

          {/* Input Capsule with Mic inside */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: isRecording ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            padding: "0.35rem 0.65rem 0.35rem 1rem",
            minHeight: "42px",
            transition: "all 0.25s ease"
          }}>
            <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isRecording ? "Escuchando dictado..." : "Escribe un mensaje..."}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: isRecording ? "#ef4444" : "#f8fafc",
                fontSize: "0.95rem"
              }}
            />
            <button
              type="button"
              onClick={handleToggleRecording}
              style={{
                background: "transparent",
                border: "none",
                color: isRecording ? "#ef4444" : "#94a3b8",
                cursor: "pointer",
                padding: "0.3rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              title={isRecording ? "Detener dictado" : "Grabar nota de voz o dictado"}
              onMouseEnter={(e) => { if (!isRecording) e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={(e) => { if (!isRecording) e.currentTarget.style.color = "#94a3b8"; }}
            >
              <Mic size={20} />
            </button>
          </div>

          {/* Send Button with gradient */}
          <button 
            type="submit" 
            disabled={loading || (!inputValue.trim() && !imageFile)} 
            style={{ 
              borderRadius: "50%", 
              width: "42px", 
              height: "42px", 
              padding: 0, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              background: "linear-gradient(135deg, #2563eb, #6366f1)",
              color: "#ffffff",
              border: "none",
              cursor: (!inputValue.trim() && !imageFile) ? "not-allowed" : "pointer",
              opacity: (!inputValue.trim() && !imageFile) ? 0.45 : 1,
              boxShadow: (!inputValue.trim() && !imageFile) ? "none" : "0 4px 14px rgba(37, 99, 235, 0.35)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            className="hover-scale"
            title="Enviar mensaje"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
