"use client"

import { useState, useEffect } from "react"
import { MessageSquare, X, Minus, Search, Send, Image as ImageIcon, Circle } from "lucide-react"
import { getFriends } from "@/app/actions/friendActions"
import { getConversation, sendMessageToUser, getMessages } from "@/app/actions/chatActions"
import styles from "./SocialChatBar.module.css"

export function SocialChatBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [activeChats, setActiveChats] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const fetchFriends = async () => {
    const data = await getFriends()
    setFriends(data)
  }

  useEffect(() => {
    fetchFriends()
    const interval = setInterval(fetchFriends, 30000)
    return () => clearInterval(interval)
  }, [])

  const openChat = (friend: any) => {
    if (activeChats.find(c => c.id === friend.id)) return
    setActiveChats([...activeChats, friend])
    setIsOpen(false)
  }

  const closeChat = (friendId: string) => {
    setActiveChats(activeChats.filter(c => c.id !== friendId))
  }

  return (
    <>
      {/* Floating Chat Pill */}
      <div className={styles.container}>
        <div className={styles.bar} onClick={() => setIsOpen(!isOpen)}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className={styles.iconBadge}>
              <MessageSquare size={18} />
              {friends.some(f => {
                const lastSeen = f.lastSeen ? new Date(f.lastSeen) : null
                return lastSeen && (Date.now() - lastSeen.getTime() < 3 * 60 * 1000)
              }) && <span className={styles.onlineDot} />}
            </div>
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Contactos</span>
          </div>
          <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>{friends.length}</span>
        </div>

        {isOpen && (
          <div className={styles.friendList}>
            <div className={styles.listHeader}>
              <div style={{ position: "relative", width: "100%" }}>
                <Search size={14} style={{ position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
                <input 
                  type="text" 
                  placeholder="Buscar amigos..." 
                  className={styles.search} 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>
            <div className={styles.listContent}>
              {friends.filter(f => f.name?.toLowerCase().includes(search.toLowerCase())).map(friend => {
                const lastSeen = friend.lastSeen ? new Date(friend.lastSeen) : null
                const isOnline = lastSeen && (Date.now() - lastSeen.getTime() < 3 * 60 * 1000)
                
                return (
                  <div key={friend.id} className={styles.friendItem} onClick={() => openChat(friend)}>
                    <div style={{ position: "relative" }}>
                      <img src={friend.image || "/default-avatar.png"} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                      {isOnline && <span className={styles.statusDot} />}
                    </div>
                    <span style={{ fontSize: "0.85rem", flex: 1 }}>{friend.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chat Windows Area */}
      <div className={styles.windowsContainer}>
        {activeChats.map(friend => (
          <ChatWindow key={friend.id} friend={friend} onClose={() => closeChat(friend.id)} />
        ))}
      </div>
    </>
  )
}

function ChatWindow({ friend, onClose }: { friend: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)

  const fetchMessages = async () => {
    if (isMinimized) return
    try {
      const conv = await getConversation(friend.id)
      if (conv) {
        setConvId(conv.id)
        const msgs = await getMessages(conv.id)
        setMessages(msgs)
      }
    } catch (error) {
      console.error("Chat error:", error)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [isMinimized])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return
    const res = await sendMessageToUser(friend.id, inputText)
    if (res.success) {
      setInputText("")
      fetchMessages()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const res = await sendMessageToUser(friend.id, "", file)
    if (res.success) fetchMessages()
  }

  return (
    <div className={`${styles.chatWindow} ${isMinimized ? styles.minimized : ""}`}>
      <div className={styles.windowHeader} onClick={() => setIsMinimized(!isMinimized)}>
        <img src={friend.image || "/default-avatar.png"} style={{ width: 24, height: 24, borderRadius: "50%" }} />
        <span style={{ fontSize: "0.85rem", fontWeight: 700, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{friend.name}</span>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button className={styles.winBtn} onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}><Minus size={14}/></button>
          <button className={styles.winBtn} onClick={(e) => { e.stopPropagation(); onClose() }}><X size={14}/></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className={styles.windowContent}>
            {messages.map(msg => {
              const fromMe = msg.authorId !== friend.id
              return (
                <div key={msg.id} className={`${styles.msgWrapper} ${fromMe ? styles.msgMe : styles.msgThem}`}>
                  {msg.imageUrl ? (
                    <img src={msg.imageUrl} className={styles.msgImg} />
                  ) : (
                    <div className={styles.msgBubble}>{msg.content}</div>
                  )}
                </div>
              )
            })}
          </div>
          <div className={styles.windowFooter}>
            <label className={styles.footerIcon}>
              <ImageIcon size={18} />
              <input type="file" hidden accept="image/*" onChange={handleFileChange} />
            </label>
            <form onSubmit={handleSend} style={{ flex: 1 }}>
              <input 
                type="text" 
                placeholder="Aa" 
                className={styles.miniInput} 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
              />
            </form>
          </div>
        </>
      )}
    </div>
  )
}
