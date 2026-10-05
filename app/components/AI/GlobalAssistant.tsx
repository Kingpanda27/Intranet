"use client"

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Maximize2, Minimize2 } from 'lucide-react'
import styles from './GlobalAssistant.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function GlobalAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-assistant', handleOpen)
    return () => window.removeEventListener('open-assistant', handleOpen)
  }, [])

  const sendMessageText = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: "" }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      })

      if (!response.ok || !response.body) {
        throw new Error("Respuesta no válida del servidor")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m))
      }
    } catch (error: any) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "Lo siento, ocurrió un problema al procesar tu solicitud. Por favor intenta nuevamente." } : m))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessageText(input)
  }

  if (!isOpen) return null

  return (
    <div className={`${styles.assistantContainer} ${isMaximized ? styles.maximized : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bot size={20} className={styles.headerIcon} />
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>TN Assistant</h3>
            <span className={styles.statusText}>En línea • IA Corporativa</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => setIsMaximized(!isMaximized)} className={styles.iconBtn} title={isMaximized ? "Restaurar" : "Maximizar"}>
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className={styles.iconBtn} title="Cerrar">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <Bot size={48} className={styles.emptyIcon} />
            <h4>¿En qué puedo ayudarte hoy?</h4>
            <p>Pregúntame sobre vacaciones, compañeros de equipo, eventos o políticas de la empresa.</p>
            <div className={styles.suggestions}>
              <button onClick={() => sendMessageText("¿Cuántos días de vacaciones me quedan?")}>
                🏖️ Vacaciones
              </button>
              <button onClick={() => sendMessageText("¿Qué eventos hay esta semana?")}>
                📅 Eventos
              </button>
              <button onClick={() => sendMessageText("¿Quiénes están ausentes hoy?")}>
                🏖️ Ausentes Hoy
              </button>
              <button onClick={() => sendMessageText("Buscar empleados en el directorio")}>
                👥 Directorio
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((m) => (
              <div key={m.id} className={`${styles.messageWrapper} ${m.role === 'user' ? styles.userWrapper : styles.aiWrapper}`}>
                {m.role === 'assistant' && (
                  <div className={styles.avatarAi}>
                    <Bot size={14} />
                  </div>
                )}
                <div className={`${styles.message} ${m.role === 'user' ? styles.userMessage : styles.aiMessage}`} style={{ whiteSpace: "pre-wrap" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className={`${styles.messageWrapper} ${styles.aiWrapper}`}>
                <div className={styles.avatarAi}><Bot size={14} /></div>
                <div className={`${styles.message} ${styles.aiMessage}`}>
                  <span className={styles.typingIndicator}><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          className={styles.input}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className={styles.sendBtn} title="Enviar">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
