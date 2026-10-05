"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, Phone, MoreVertical, Image as ImageIcon, X } from "lucide-react"
import { getChatMessages, sendMessage, updateLastSeen } from "@/app/actions/chatActions"

export function ChatView({ conversationId, currentUserId }: { conversationId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      <form onSubmit={handleSend} style={{ padding: "1rem 1.5rem", borderTop: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {imagePreview && (
          <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "0.5rem", overflow: "hidden", border: "2px solid hsl(var(--primary))" }}>
            <img src={imagePreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button 
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: "none" }} 
          />
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "0.6rem", color: "hsl(var(--muted-foreground))" }}
          >
            <ImageIcon size={22} />
          </button>
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || (!inputValue.trim() && !imageFile)} style={{ padding: "0.6rem 1.25rem" }}>
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
