"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, MessageSquare } from "lucide-react"
import { getAvailableContacts, getConversations, startConversation, searchUsers, addContact } from "@/app/actions/chatActions"

export function ChatSidebar({ onSelectConversation, activeConversationId }: { onSelectConversation: (id: string) => void, activeConversationId?: string }) {
  const [conversations, setConversations] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    const [convs, conts] = await Promise.all([getConversations(), getAvailableContacts()])
    setConversations(convs)
    setContacts(conts)
  }

  const isOnline = (lastSeen: Date | string | null) => {
    if (!lastSeen) return false
    const date = new Date(lastSeen)
    const now = new Date()
    return (now.getTime() - date.getTime()) < 5 * 60 * 1000 // 5 minutos
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      const results = await searchUsers(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleStartChat = async (userId: string) => {
    const conv = await startConversation(userId)
    onSelectConversation(conv.id)
    setShowSearch(false)
    setSearchQuery("")
    loadData()
  }

  return (
    <div style={{ width: "300px", borderRight: "1px solid hsl(var(--border))", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid hsl(var(--border))" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "hsl(var(--muted-foreground))" }} />
          <input 
            className="input" 
            placeholder="Buscar usuarios..." 
            style={{ paddingLeft: "2.25rem", fontSize: "0.85rem" }}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowSearch(true)}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {showSearch && searchResults.length > 0 && (
          <div style={{ padding: "0.5rem", borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--muted)/0.2)" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, margin: "0.5rem", color: "hsl(var(--muted-foreground))" }}>RESULTADOS DE BÚSQUEDA</p>
            {searchResults.map(user => (
              <button 
                key={user.id} 
                onClick={() => handleStartChat(user.id)}
                style={{ width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", border: "none", background: "none", cursor: "pointer", borderRadius: "0.5rem", textAlign: "left" }}
                className="hover-card"
              >
                <div style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", backgroundColor: "hsl(var(--primary)/0.1)", overflow: "visible" }}>
                  {user.image ? (
                    <img src={user.image} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{user.name?.[0]}</div>
                  )}
                  {isOnline(user.lastSeen) && (
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22c55e", border: "2px solid hsl(var(--card))" }}></div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--primary))" }}>{user.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "0.5rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, margin: "0.5rem", color: "hsl(var(--muted-foreground))" }}>CONVERSACIONES</p>
          {conversations.map(conv => {
            const otherUser = conv.user1Id === conv.user1.id ? conv.user2 : conv.user1
            const lastMessage = conv.messages[0]
            
            return (
              <button 
                key={conv.id} 
                onClick={() => onSelectConversation(conv.id)}
                style={{ 
                  width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", 
                  border: "none", background: conv.id === activeConversationId ? "hsl(var(--primary)/0.1)" : "none", 
                  cursor: "pointer", borderRadius: "0.5rem", textAlign: "left", marginBottom: "0.25rem"
                }}
                className="hover-card"
              >
                <div style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", backgroundColor: "hsl(var(--primary)/0.1)", overflow: "visible", flexShrink: 0 }}>
                  {otherUser.image ? (
                    <img src={otherUser.image} alt={otherUser.name || ""} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{otherUser.name?.[0]}</div>
                  )}
                  {isOnline(otherUser.lastSeen) && (
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22c55e", border: "2px solid hsl(var(--card))" }}></div>
                  )}
                </div>
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{otherUser.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lastMessage ? lastMessage.content : "Inicia una conversación"}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ padding: "0.5rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, margin: "0.5rem", color: "hsl(var(--muted-foreground))" }}>CONTACTOS DISPONIBLES</p>
          {contacts.map(user => (
            <button 
              key={user.id} 
              onClick={() => handleStartChat(user.id)}
              style={{ width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", border: "none", background: "none", cursor: "pointer", borderRadius: "0.5rem", textAlign: "left", marginBottom: "0.25rem" }}
              className="hover-card"
            >
              <div style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", backgroundColor: "hsl(var(--primary)/0.1)", overflow: "visible", flexShrink: 0 }}>
                {user.image ? (
                  <img src={user.image} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{user.name?.[0]}</div>
                )}
                {isOnline(user.lastSeen) && (
                  <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22c55e", border: "2px solid hsl(var(--card))" }}></div>
                )}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: "0.7rem", color: "hsl(var(--primary))" }}>{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
