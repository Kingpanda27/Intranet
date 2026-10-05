"use client"

import React, { useState, useEffect } from 'react'
import { giveRecognition } from '@/app/actions/recognitionActions'
import { generateTextWithAI } from '@/app/actions/ollamaActions'
import { Award, Star, HeartHandshake, Lightbulb, Users, ShieldCheck, Bot, Loader2 } from 'lucide-react'

type GiveRecognitionModalProps = {
  onClose: () => void
}

const RECOGNITION_TYPES = [
  { id: 'TRABAJO_EN_EQUIPO', label: 'Trabajo en Equipo', icon: Users, color: '#3b82f6' },
  { id: 'EXCELENTE_SERVICIO', label: 'Excelente Servicio', icon: Star, color: '#f59e0b' },
  { id: 'LIDERAZGO', label: 'Liderazgo', icon: ShieldCheck, color: '#10b981' },
  { id: 'INNOVACION', label: 'Innovación', icon: Lightbulb, color: '#8b5cf6' },
  { id: 'APOYO_DESTACADO', label: 'Apoyo Destacado', icon: HeartHandshake, color: '#f43f5e' }
]

export function GiveRecognitionModal({ onClose }: GiveRecognitionModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [receiverId, setReceiverId] = useState('')
  const [type, setType] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    import('@/app/actions/userActions').then(mod => {
      mod.getSimpleUsersList().then(data => setUsers(data))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiverId || !type) {
      setError("Por favor, selecciona a un compañero y un tipo de reconocimiento.")
      return
    }
    
    setLoading(true)
    setError('')
    try {
      await giveRecognition(receiverId, type, message)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al enviar reconocimiento')
    }
    setLoading(false)
  }

  const handleAIGenerate = async () => {
    if (!message.trim()) return setError("Escribe unas palabras clave primero para que la IA redacte el mensaje.")
    setError('')
    setGeneratingAI(true)
    const result = await generateTextWithAI("RECOGNITION", message)
    if (result.success) {
      setMessage(result.generatedText)
    } else {
      setError(result.error)
    }
    setGeneratingAI(false)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="card animate-scale" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Award className="text-primary" /> Dar Reconocimiento
        </h2>
        
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'hsl(var(--destructive)/0.1)', color: 'hsl(var(--destructive))', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Compañero</label>
            <select 
              className="input" 
              value={receiverId} 
              onChange={(e) => setReceiverId(e.target.value)}
            >
              <option value="">Selecciona a alguien...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Motivo / Valor</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {RECOGNITION_TYPES.map(rt => {
                const isSelected = type === rt.id
                const Icon = rt.icon
                return (
                  <div 
                    key={rt.id}
                    onClick={() => setType(rt.id)}
                    style={{
                      padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      border: `1px solid ${isSelected ? rt.color : 'hsl(var(--border))'}`,
                      backgroundColor: isSelected ? `${rt.color}15` : 'transparent',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={24} color={isSelected ? rt.color : 'hsl(var(--muted-foreground))'} />
                    <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500, textAlign: 'center' }}>{rt.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Mensaje (Opcional)</label>
              <button 
                type="button" 
                onClick={handleAIGenerate}
                disabled={generatingAI || !message.trim()}
                className="btn btn-surface hover-scale" 
                style={{ padding: "0.3rem 0.75rem", borderRadius: "99px", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)", display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.75rem", fontWeight: 700 }}
              >
                {generatingAI ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Bot size={14} />}
                Redactar con IA
              </button>
            </div>
            <textarea 
              className="input custom-scrollbar" 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe unas palabras clave y presiona 'Redactar con IA' para obtener un mensaje profesional..."
              style={{ resize: "none" }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Otorgar Reconocimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
