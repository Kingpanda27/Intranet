"use client"

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Server,
  QrCode,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Terminal,
  Zap,
  Globe
} from 'lucide-react';

export default function AiIntegrationsManager() {
  // WhatsApp Status State
  const [waStatus, setWaStatus] = useState<{ ready: boolean; qr: string | null; disabled: boolean }>({
    ready: false,
    qr: null,
    disabled: true,
  });
  const [waPhone, setWaPhone] = useState('');
  const [waMsg, setWaMsg] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState<string | null>(null);

  // NVIDIA State
  const [nvidiaPrompt, setNvidiaPrompt] = useState('Proporciona un paso de solución simple para un usuario con problemas de VPN.');
  const [nvidiaModel, setNvidiaModel] = useState('meta/llama-3.2-11b-vision-instruct');
  const [nvidiaResult, setNvidiaResult] = useState('');
  const [nvidiaLoading, setNvidiaLoading] = useState(false);

  // Gemini State
  const [geminiPrompt, setGeminiPrompt] = useState('Analiza este caso de soporte técnico y genera recomendaciones de resolución rápida.');
  const [geminiResult, setGeminiResult] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Ollama State
  const [ollamaPrompt, setOllamaPrompt] = useState('Proporciona un paso de solución simple para un usuario con problemas de VPN.');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [ollamaHost, setOllamaHost] = useState('http://192.168.50.233:11434');
  const [ollamaResult, setOllamaResult] = useState('');
  const [ollamaLoading, setOllamaLoading] = useState(false);

  const fetchWaStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setWaStatus(data);
    } catch (e) {
      console.error('[AiIntegrationsManager] Error fetching WA status:', e);
    }
  };

  useEffect(() => {
    fetchWaStatus();
    const interval = setInterval(fetchWaStatus, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSendWa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim() || !waMsg.trim()) return;

    setWaSending(true);
    setWaResult(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone, message: waMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setWaResult('✅ Mensaje de WhatsApp enviado correctamente.');
        setWaMsg('');
      } else {
        setWaResult(`❌ Error: ${data.error || data.details || 'Fallo de envío'}`);
      }
    } catch (err: any) {
      setWaResult(`❌ Error de conexión: ${err.message}`);
    } finally {
      setWaSending(false);
    }
  };

  const handleRunNvidia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nvidiaPrompt.trim()) return;

    setNvidiaLoading(true);
    setNvidiaResult('');
    try {
      const res = await fetch('/api/nvidia/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: nvidiaPrompt,
          model: nvidiaModel,
        }),
      });
      const data = await res.json();
      setNvidiaResult(data.response || data.error || 'Sin respuesta');
    } catch (err: any) {
      setNvidiaResult(`Error conectando con NVIDIA AI: ${err.message}`);
    } finally {
      setNvidiaLoading(false);
    }
  };

  const handleRunGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiPrompt.trim()) return;

    setGeminiLoading(true);
    setGeminiResult('');
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: geminiPrompt }),
      });
      const data = await res.json();
      setGeminiResult(data.response || data.error || 'Sin respuesta');
    } catch (err: any) {
      setGeminiResult(`Error: ${err.message}`);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleRunOllama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ollamaPrompt.trim()) return;

    setOllamaLoading(true);
    setOllamaResult('');
    try {
      const res = await fetch('/api/ollama/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: ollamaPrompt,
          model: ollamaModel,
          host: ollamaHost,
        }),
      });
      const data = await res.json();
      setOllamaResult(data.response || data.error || 'Sin respuesta');
    } catch (err: any) {
      setOllamaResult(`Error conectando con Ollama: ${err.message}`);
    } finally {
      setOllamaLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, hsl(var(--surface)), hsl(var(--surface-hover)))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                padding: '0.4rem',
                borderRadius: '0.5rem',
                display: 'inline-flex',
              }}
            >
              <Cpu size={22} />
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'hsl(var(--foreground))' }}>
              Integración de APIs & Modelos de Inteligencia Artificial
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
            Monitoreo en tiempo real, vinculación QR de WhatsApp Web y consolas de prueba de NVIDIA NIM AI, Gemini 1.5 Flash y Ollama Llama 3.2.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: waStatus.ready ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: waStatus.ready ? '#10b981' : '#f59e0b',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: waStatus.ready ? '#10b981' : '#f59e0b',
              }}
            />
            {waStatus.ready ? 'WhatsApp Conectado' : 'WhatsApp en Espera'}
          </span>
        </div>
      </div>

      {/* Grid: WhatsApp API & QR */}
      <div
        style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1.125rem',
          padding: '1.75rem 2rem',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#25d366', background: 'rgba(37, 211, 102, 0.1)', padding: '0.4rem', borderRadius: '0.5rem', display: 'inline-flex' }}>
              <QrCode size={20} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                WhatsApp Web & Puppeteer Daemon
              </h3>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))' }}>
                Cliente autónomo con persistencia de sesión LocalAuth en <code>.wwebjs_auth/</code>.
              </p>
            </div>
          </div>

          <button onClick={fetchWaStatus} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
            <RefreshCw size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* QR Code / State Display */}
          <div
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.85rem',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '260px',
            }}
          >
            {waStatus.ready ? (
              <div style={{ color: '#10b981' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700 }}>Sesión WhatsApp Vinculada</h4>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', margin: 0, maxWidth: '280px' }}>
                  El bot está activo y listo para procesar mensajes de soporte y despachar reportes.
                </p>
              </div>
            ) : waStatus.qr ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1rem', fontWeight: 600 }}>
                  Escanea este código QR con la app de WhatsApp:
                </p>
                <img
                  src={waStatus.qr}
                  alt="WhatsApp QR Code"
                  style={{
                    width: '210px',
                    height: '210px',
                    borderRadius: '0.75rem',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            ) : (
              <div>
                <AlertTriangle size={42} style={{ color: '#f59e0b', margin: '0 auto 10px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700 }}>WhatsApp Pausado en Local</h4>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', margin: 0, maxWidth: '290px' }}>
                  Para activar el navegador Puppeteer y generar el código QR, define <code>ENABLE_WHATSAPP=true</code> en tu archivo <code>.env</code>.
                </p>
              </div>
            )}
          </div>

          {/* Test Send Message Form */}
          <form
            onSubmit={handleSendWa}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              justifyContent: 'center',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                Número de Destino (con código de país)
              </label>
              <input
                type="text"
                placeholder="Ej. 18092160598 o 18294232495"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                Mensaje de Prueba
              </label>
              <textarea
                rows={3}
                placeholder="Escribe el mensaje de prueba a despachar vía WhatsApp..."
                value={waMsg}
                onChange={(e) => setWaMsg(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={waSending || !waPhone.trim() || !waMsg.trim() || !waStatus.ready}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.65rem',
                border: 'none',
                background: '#25d366',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                opacity: !waStatus.ready || waSending ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <Send size={16} />
              <span>{waSending ? 'Enviando...' : 'Enviar Mensaje vía WhatsApp'}</span>
            </button>

            {waResult && (
              <div style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 0' }}>{waResult}</div>
            )}
          </form>
        </div>
      </div>

      {/* Grid: NVIDIA AI, Google Gemini & Ollama */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
        {/* NVIDIA NIM Card */}
        <div
          style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1.125rem',
            padding: '1.75rem 2rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#76b900', background: 'rgba(118, 185, 0, 0.1)', padding: '0.4rem', borderRadius: '0.5rem', display: 'inline-flex' }}>
                <Cpu size={20} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                  NVIDIA NIM AI (Motor Activo)
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                  IA en producción para Chat Soporte y Asistente IT.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: 'rgba(118, 185, 0, 0.15)',
                color: '#76b900',
              }}
            >
              NVIDIA Cloud API
            </span>
          </div>

          <form onSubmit={handleRunNvidia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                Modelo NVIDIA NIM
              </label>
              <input
                type="text"
                value={nvidiaModel}
                onChange={(e) => setNvidiaModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.65rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                Prompt de Validación
              </label>
              <textarea
                rows={3}
                value={nvidiaPrompt}
                onChange={(e) => setNvidiaPrompt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={nvidiaLoading || !nvidiaPrompt.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.65rem',
                border: 'none',
                background: '#76b900',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                opacity: nvidiaLoading ? 0.6 : 1,
              }}
            >
              <Zap size={16} />
              <span>{nvidiaLoading ? 'Consultando NVIDIA NIM...' : 'Probar Generación con NVIDIA AI'}</span>
            </button>

            {nvidiaResult && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.65rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {nvidiaResult}
              </div>
            )}
          </form>
        </div>
        {/* Google Gemini Card */}
        <div
          style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1.125rem',
            padding: '1.75rem 2rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem', borderRadius: '0.5rem', display: 'inline-flex' }}>
                <Sparkles size={20} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                  Google Gemini 1.5 Flash
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                  Modelo utilizado para el Reporte Semanal Ejecutivo.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
              }}
            >
              @google/generative-ai
            </span>
          </div>

          <form onSubmit={handleRunGemini} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                Prompt de Validación
              </label>
              <textarea
                rows={4}
                value={geminiPrompt}
                onChange={(e) => setGeminiPrompt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={geminiLoading || !geminiPrompt.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.65rem',
                border: 'none',
                background: '#3b82f6',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                opacity: geminiLoading ? 0.6 : 1,
              }}
            >
              <Zap size={16} />
              <span>{geminiLoading ? 'Consultando Gemini...' : 'Probar Generación con Gemini'}</span>
            </button>

            {geminiResult && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.65rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {geminiResult}
              </div>
            )}
          </form>
        </div>

        {/* Ollama Llama 3.2 Card */}
        <div
          style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1.125rem',
            padding: '1.75rem 2rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#ff6a00', background: 'rgba(255, 106, 0, 0.1)', padding: '0.4rem', borderRadius: '0.5rem', display: 'inline-flex' }}>
                <Server size={20} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                  Ollama Llama 3.2 (Instancia de Red)
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                  Motor de diagnóstico de soporte y reporte mensual.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '9999px',
                background: 'rgba(255, 106, 0, 0.12)',
                color: '#ff6a00',
              }}
            >
              192.168.50.233:11434
            </span>
          </div>

          <form onSubmit={handleRunOllama} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                  Modelo
                </label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.65rem',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                  Ollama Host IP
                </label>
                <input
                  type="text"
                  value={ollamaHost}
                  onChange={(e) => setOllamaHost(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.65rem',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                Prompt de Prueba
              </label>
              <textarea
                rows={3}
                value={ollamaPrompt}
                onChange={(e) => setOllamaPrompt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={ollamaLoading || !ollamaPrompt.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.65rem',
                border: 'none',
                background: '#ff6a00',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                opacity: ollamaLoading ? 0.6 : 1,
              }}
            >
              <Terminal size={16} />
              <span>{ollamaLoading ? 'Consultando Ollama...' : 'Probar Generación con Ollama Llama 3.2'}</span>
            </button>

            {ollamaResult && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.65rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {ollamaResult}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
