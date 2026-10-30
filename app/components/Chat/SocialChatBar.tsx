"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, X, Minus, Search, Send, Image as ImageIcon, Mic, CheckCheck, Maximize2 } from "lucide-react"
import { getFriends } from "@/app/actions/friendActions"
import { getConversation, sendMessageToUser, getMessages } from "@/app/actions/chatActions"
import { useSupportChat } from "@/app/components/SupportAILlama/SupportContext"
import { useTranslation } from "@/lib/i18n/LanguageContext"
import styles from "./SocialChatBar.module.css"

export function SocialChatBar() {
  const { t, locale } = useTranslation()
  const { isSupportOpen } = useSupportChat()
  const [isOpen, setIsOpen] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [activeChats, setActiveChats] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const containerRef = useRef<HTMLDivElement>(null)
  const windowsRef = useRef<HTMLDivElement>(null)

  const fetchFriends = async () => {
    try {
      const data = await getFriends()
      if (Array.isArray(data)) {
        setFriends(data)
      }
    } catch (e) {
      console.warn("fetchFriends error:", e)
    }
  }

  useEffect(() => {
    fetchFriends()
    const interval = setInterval(fetchFriends, 30000)
    const onFriendshipUpdated = () => fetchFriends()
    window.addEventListener('friendship-updated', onFriendshipUpdated)
    return () => {
      clearInterval(interval)
      window.removeEventListener('friendship-updated', onFriendshipUpdated)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideContainer = containerRef.current && containerRef.current.contains(target)
      const isInsideWindows = windowsRef.current && windowsRef.current.contains(target)

      if (!isInsideContainer && !isInsideWindows) {
        if (isOpen) {
          setIsOpen(false)
        }
        if (activeChats.length > 0) {
          setActiveChats([])
        }
      }
    }

    if (isOpen || activeChats.length > 0) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, activeChats])

  const openChat = (friend: any) => {
    if (activeChats.find(c => c.id === friend.id)) return
    setActiveChats([...activeChats, friend])
    setIsOpen(false)
  }

  const closeChat = (friendId: string) => {
    setActiveChats(activeChats.filter(c => c.id !== friendId))
  }

  // Ocultar barra de contactos y chats activos cuando IT Support Chat está abierto
  if (isSupportOpen) {
    return null
  }

  return (
    <>
      {/* Floating Chat Pill */}
      <div className={styles.container} ref={containerRef}>
        <div className={styles.bar} onClick={() => setIsOpen(!isOpen)}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className={styles.iconBadge}>
              <MessageSquare size={18} />
              {friends.some(f => {
                const lastSeen = f.lastSeen ? new Date(f.lastSeen) : null
                return lastSeen && (Date.now() - lastSeen.getTime() < 3 * 60 * 1000)
              }) && <span className={styles.onlineDot} />}
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f8fafc" }}>{t("chat.contacts")}</span>
          </div>
          <span className={styles.badgeCount}>{friends.length}</span>
        </div>

        {isOpen && (
          <div className={styles.friendList}>
            <div className={styles.listHeader}>
              <div className={styles.searchWrapper}>
                <Search size={14} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder={t("chat.searchFriends")} 
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
                    <div style={{ position: "relative", display: "flex" }}>
                      <img 
                        src={friend.image || "/default-avatar.png"} 
                        style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)" }} 
                      />
                      {isOnline && <span className={styles.statusDot} />}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, flex: 1 }}>{friend.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chat Windows Area */}
      <div className={styles.windowsContainer} ref={windowsRef}>
        {activeChats.map(friend => (
          <ChatWindow key={friend.id} friend={friend} onClose={() => closeChat(friend.id)} />
        ))}
      </div>
    </>
  )
}

function ChatWindow({ friend, onClose }: { friend: any, onClose: () => void }) {
  const { t, locale } = useTranslation()
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const lastSeen = friend.lastSeen ? new Date(friend.lastSeen) : null
  const isOnline = lastSeen && (Date.now() - lastSeen.getTime() < 3 * 60 * 1000)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-ajuste de altura para el campo de texto
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(80, Math.max(22, textareaRef.current.scrollHeight))}px`
    }
  }, [inputText])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() && !imageFile) return
    setIsSending(true)
    try {
      const res = await sendMessageToUser(friend.id, inputText.trim(), imageFile || undefined)
      if (res.success) {
        setInputText("")
        setImageFile(null)
        setImagePreview(null)
        fetchMessages()
      }
    } catch (err) {
      console.error("Chat send error:", err)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
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
        recognition.lang = locale === "en" ? "en-US" : "es-ES"
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onstart = () => {
          setIsRecording(true)
        }

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("")
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript))
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
      // Fallback si el navegador no soporta SpeechRecognition
      alert("El reconocimiento de voz no está soportado en este navegador.")
    }
  }

  return (
    <div className={`${styles.chatWindow} ${isMinimized ? styles.minimized : ""}`}>
      {/* Header */}
      <div className={styles.windowHeader} onClick={() => setIsMinimized(!isMinimized)}>
        <div className={styles.headerAvatarWrap}>
          <img 
            src={friend.image || "/default-avatar.png"} 
            className={styles.headerAvatar} 
            alt={friend.name}
          />
          <span className={`${styles.headerStatusDot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
        </div>

        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{friend.name}</span>
          <span className={styles.headerStatusText}>
            {isOnline ? t("chat.online") : t("chat.offline")}
          </span>
        </div>

        <div className={styles.winControls}>
          <button 
            type="button"
            className={styles.winBtn} 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
            title={isMinimized ? t("chat.maximize") : t("chat.minimize")}
          >
            {isMinimized ? <Maximize2 size={13} /> : <Minus size={14} />}
          </button>
          <button 
            type="button"
            className={styles.winBtn} 
            onClick={(e) => { e.stopPropagation(); onClose() }}
            title={t("chat.closeChat")}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className={styles.windowContent}>
            {messages.map(msg => {
              const fromMe = msg.authorId !== friend.id
              const timeStr = msg.createdAt 
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
                : ""

              return (
                <div key={msg.id} className={`${styles.msgWrapper} ${fromMe ? styles.msgMe : styles.msgThem}`}>
                  {msg.imageUrl ? (
                    <img 
                      src={msg.imageUrl} 
                      className={styles.msgImg} 
                      alt="Adjunto" 
                      onClick={() => window.open(msg.imageUrl, "_blank")}
                    />
                  ) : (
                    <div className={styles.msgRow}>
                      {!fromMe && <span className={styles.msgBubble}>{msg.content}</span>}
                      {fromMe && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", order: 1 }}>
                            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{timeStr}</span>
                            <CheckCheck size={14} color="#38bdf8" />
                          </div>
                          <span className={styles.msgBubble} style={{ order: 2 }}>{msg.content}</span>
                        </>
                      )}
                      {!fromMe && <span className={styles.msgTime}>{timeStr}</span>}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Bar Footer (Modern Glassmorphism Design) */}
          <div className={styles.windowFooter}>
            {/* Image Preview Thumbnail */}
            {imagePreview && (
              <div className={styles.imagePreviewWrap}>
                <img src={imagePreview} alt="Preview" className={styles.imagePreviewImg} />
                <button 
                  type="button" 
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className={styles.imagePreviewRemove}
                  title={t("chat.removeImage")}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className={styles.chatBar}>
              {/* Izquierda: Botón para adjuntar imágenes/archivos */}
              <label className={styles.attachBtn} title={t("chat.attachTooltip")}>
                <ImageIcon size={20} />
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={handleFileChange} 
                />
              </label>

              {/* Centro: Cápsula de entrada de texto + Micrófono */}
              <div className={`${styles.inputCapsule} ${isRecording ? styles.recordingCapsule : ""}`}>
                {isRecording ? (
                  <div className={styles.recordingState}>
                    <span className={styles.pulseRecordingDot} />
                    <span className={styles.recordingText}>{t("chat.recording")}</span>
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={t("chat.placeholder")}
                    className={styles.messageInput}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                )}

                {/* Micrófono (Nota de voz / Dictado) */}
                <button 
                  type="button" 
                  onClick={handleToggleRecording}
                  className={`${styles.micBtn} ${isRecording ? styles.micBtnActive : ""}`}
                  title={isRecording ? t("chat.stopRecordTooltip") : t("chat.recordTooltip")}
                >
                  <Mic size={18} />
                </button>
              </div>

              {/* Derecha: Botón de envío con degradado vibrante azul a violeta */}
              <button 
                type="button" 
                onClick={() => handleSend()}
                disabled={isSending || (!inputText.trim() && !imageFile)}
                className={styles.sendBtn}
                title={t("chat.sendTooltip")}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
