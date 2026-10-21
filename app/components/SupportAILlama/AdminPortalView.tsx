"use client"

import React, { useState, useEffect } from 'react';
import styles from './SupportAILlama.module.css';
import {
  BarChart3,
  MessageSquare,
  Bot,
  Send,
  QrCode,
  ShieldAlert,
  Sparkles,
  Server,
  RefreshCw,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Inbox
} from 'lucide-react';

interface Ticket {
  id: string;
  from: string;
  email?: string | null;
  box?: string | null;
  category?: string | null;
  severity: string;
  issue: string;
  summary?: string | null;
  history?: string | null;
  source: string;
  status: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export function AdminPortalView() {
  const [adminTab, setAdminTab] = useState<'dashboard' | 'whatsapp' | 'ai'>('dashboard');

  // Dashboard Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // WhatsApp Status State
  const [waStatus, setWaStatus] = useState<{ ready: boolean; qr: string | null; disabled: boolean }>({
    ready: false,
    qr: null,
    disabled: true,
  });
  const [waPhone, setWaPhone] = useState('');
  const [waMsg, setWaMsg] = useState('');
  const [waSendStatus, setWaSendStatus] = useState<string | null>(null);

  // Reports Trigger State
  const [monthlyTriggerStatus, setMonthlyTriggerStatus] = useState<string | null>(null);
  const [weeklyTriggerStatus, setWeeklyTriggerStatus] = useState<string | null>(null);

  // Exclusions State
  const [exclusions, setExclusions] = useState<{ numbers: string[]; groups: string[]; ignoreAllGroups: boolean }>({
    numbers: [],
    groups: [],
    ignoreAllGroups: true,
  });
  const [newExclusionValue, setNewExclusionValue] = useState('');

  // Gemini Test State
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [geminiResult, setGeminiResult] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Ollama Test State
  const [ollamaPrompt, setOllamaPrompt] = useState('');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [ollamaHost, setOllamaHost] = useState('http://192.168.50.233:11434');
  const [ollamaResult, setOllamaResult] = useState('');
  const [ollamaLoading, setOllamaLoading] = useState(false);

  // Fetch Tickets
  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('[AdminPortal] Error loading tickets:', e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Fetch WA Status
  const fetchWaStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setWaStatus(data);
    } catch (e) {
      console.error('[AdminPortal] Error loading WA status:', e);
    }
  };

  // Fetch Exclusions
  const fetchExclusions = async () => {
    try {
      const res = await fetch('/api/whatsapp/exclusions');
      const data = await res.json();
      if (data.success) {
        setExclusions({
          numbers: data.numbers || [],
          groups: data.groups || [],
          ignoreAllGroups: data.ignoreAllGroups ?? true,
        });
      }
    } catch (e) {
      console.error('[AdminPortal] Error loading exclusions:', e);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchWaStatus();
    fetchExclusions();

    // Poll WA Status every 4 seconds
    const interval = setInterval(fetchWaStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Send WhatsApp message test
  const handleSendWa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim() || !waMsg.trim()) return;

    setWaSendStatus('Enviando...');
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone, message: waMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setWaSendStatus('✅ Mensaje enviado exitosamente.');
        setWaMsg('');
      } else {
        setWaSendStatus(`❌ Error: ${data.error || 'Fallo de envío'}`);
      }
    } catch (err: any) {
      setWaSendStatus(`❌ Error: ${err.message}`);
    }
  };

  // Trigger Monthly Report
  const handleTriggerMonthly = async () => {
    setMonthlyTriggerStatus('Ejecutando generación con Ollama Llama 3.2...');
    try {
      const res = await fetch('/api/whatsapp/test-monthly-report', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMonthlyTriggerStatus('✅ Reporte mensual generado y despachado.');
      } else {
        setMonthlyTriggerStatus(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setMonthlyTriggerStatus(`❌ Error: ${e.message}`);
    }
  };

  // Trigger Weekly Report
  const handleTriggerWeekly = async () => {
    setWeeklyTriggerStatus('Generando resumen con Gemini 1.5 Flash y enviando correo...');
    try {
      const res = await fetch('/api/whatsapp/test-weekly-report', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWeeklyTriggerStatus('✅ Reporte semanal enviado por correo correctamente.');
      } else {
        setWeeklyTriggerStatus(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setWeeklyTriggerStatus(`❌ Error: ${e.message}`);
    }
  };

  // Add Exclusion
  const handleAddExclusion = async () => {
    if (!newExclusionValue.trim()) return;
    try {
      const res = await fetch('/api/whatsapp/exclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newExclusionValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setExclusions({
          numbers: data.numbers,
          groups: data.groups,
          ignoreAllGroups: data.ignoreAllGroups,
        });
        setNewExclusionValue('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Exclusion
  const handleDeleteExclusion = async (val: string) => {
    try {
      const res = await fetch('/api/whatsapp/exclusions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val }),
      });
      const data = await res.json();
      if (data.success) {
        setExclusions({
          numbers: data.numbers,
          groups: data.groups,
          ignoreAllGroups: data.ignoreAllGroups,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Ignore All Groups
  const handleToggleIgnoreAllGroups = async () => {
    const updated = !exclusions.ignoreAllGroups;
    try {
      const res = await fetch('/api/whatsapp/exclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ignoreAllGroups: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setExclusions((prev) => ({ ...prev, ignoreAllGroups: updated }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run Gemini Test
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

  // Run Ollama Test
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
      setOllamaResult(`Error: ${err.message}`);
    } finally {
      setOllamaLoading(false);
    }
  };

  const waCount = tickets.filter((t) => t.source === 'WhatsApp').length;
  const webCount = tickets.filter((t) => t.source === 'Chat Web').length;

  return (
    <div className={styles.adminLayout}>
      {/* Admin Subnav */}
      <aside className={styles.adminSidebar}>
        <div className={styles.sidebarTitle}>Panel Técnico TI</div>
        <nav className={styles.adminNav}>
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`${styles.adminNavItem} ${adminTab === 'dashboard' ? styles.adminNavItemActive : ''}`}
          >
            <BarChart3 size={18} />
            <span>Dashboard View</span>
          </button>
          <button
            onClick={() => setAdminTab('whatsapp')}
            className={`${styles.adminNavItem} ${adminTab === 'whatsapp' ? styles.adminNavItemActive : ''}`}
          >
            <MessageSquare size={18} />
            <span>WhatsApp API & QR</span>
          </button>
          <button
            onClick={() => setAdminTab('ai')}
            className={`${styles.adminNavItem} ${adminTab === 'ai' ? styles.adminNavItemActive : ''}`}
          >
            <Bot size={18} />
            <span>Integraciones IA</span>
          </button>
        </nav>
      </aside>

      {/* Main Admin Content */}
      <main className={styles.adminContent}>
        {/* ================= VIEW 1: DASHBOARD ================= */}
        {adminTab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.viewTitle} style={{ margin: 0 }}>Métricas & Historial de Tickets</h2>
              <button onClick={fetchTickets} className={styles.actionBtn}>
                <RefreshCw size={14} className={isLoadingTickets ? 'animate-spin' : ''} />
                <span>Refrescar</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><Inbox size={26} /></div>
                <div className={styles.statInfo}>
                  <p className={styles.statNumber}>{tickets.length}</p>
                  <p className={styles.statLabel}>Total de Tickets</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(37, 211, 102, 0.12)', color: '#25d366' }}>
                  <MessageSquare size={26} />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statNumber}>{waCount}</p>
                  <p className={styles.statLabel}>Tickets WhatsApp</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                  <Bot size={26} />
                </div>
                <div className={styles.statInfo}>
                  <p className={styles.statNumber}>{webCount}</p>
                  <p className={styles.statLabel}>Tickets Chat Web</p>
                </div>
              </div>
            </div>

            {/* Ticket List */}
            <div className={styles.historyCard}>
              <div className={styles.historyHeader}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Historial Reciente de Tickets en Base de Datos</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tickets.length} registrados</span>
              </div>

              {tickets.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay tickets registrados en la base de datos.
                </div>
              ) : (
                tickets.slice(0, 25).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={styles.ticketItem}
                    title="Haz clic para ver detalles del ticket"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                      <div style={{ fontSize: '1.2rem' }}>
                        {t.source === 'WhatsApp' ? (
                          <span style={{ color: '#25d366' }}>📱</span>
                        ) : (
                          <span style={{ color: 'var(--primary)' }}>🌐</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {t.category ? `[${t.category}] ` : ''}{t.issue}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          De: <strong style={{ color: 'var(--primary)' }}>{t.from}</strong> {t.email ? `(${t.email})` : ''} • ID: #{t.id.slice(-6)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <div>{new Date(t.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 2: WHATSAPP API ================= */}
        {adminTab === 'whatsapp' && (
          <div>
            <h2 className={styles.viewTitle}>Gestión de WhatsApp API & Puppeteer</h2>

            {/* QR Code & Status */}
            <div className={styles.apiCard}>
              <div className={styles.apiHeader}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={20} style={{ color: '#25d366' }} />
                  <span>Estado de Conexión y Vinculación</span>
                </h3>
                {waStatus.ready ? (
                  <span className={styles.badgeSuccess}>Conectado y Listo</span>
                ) : waStatus.disabled ? (
                  <span className={styles.badgeWarning}>Deshabilitado Localmente</span>
                ) : waStatus.qr ? (
                  <span className={styles.badgeWarning}>Esperando Escaneo</span>
                ) : (
                  <span className={styles.badgeDanger}>Desconectado</span>
                )}
              </div>

              <div style={{ textAlign: 'center', padding: '1rem' }}>
                {waStatus.ready ? (
                  <div style={{ color: '#10b981', fontWeight: 500 }}>
                    <CheckCircle size={40} style={{ margin: '0 auto 10px auto' }} />
                    <p>El cliente de WhatsApp está conectado y atendiendo solicitudes de soporte.</p>
                  </div>
                ) : waStatus.qr ? (
                  <div>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                      Escanea este código QR con la aplicación de WhatsApp en tu teléfono:
                    </p>
                    <img
                      src={waStatus.qr}
                      alt="WhatsApp QR Code"
                      style={{ width: '240px', height: '240px', margin: '0 auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>
                    WhatsApp está pausado para desarrollo local (<code>ENABLE_WHATSAPP=false</code>). Cambia la variable a <code>true</code> en <code>.env</code> para iniciar Puppeteer y generar el QR.
                  </p>
                )}
              </div>
            </div>

            {/* Send WhatsApp Message */}
            <div className={styles.apiCard}>
              <div className={styles.apiHeader}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} style={{ color: '#25d366' }} />
                  <span>Envío Manual de Mensajes</span>
                </h3>
              </div>

              <form onSubmit={handleSendWa} className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Número de Teléfono (con código de país)</label>
                  <input
                    type="text"
                    placeholder="Ej. 18092160598 o 18294232495"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mensaje a Enviar</label>
                  <textarea
                    rows={3}
                    placeholder="Escribe el mensaje de prueba..."
                    value={waMsg}
                    onChange={(e) => setWaMsg(e.target.value)}
                    className={styles.formInput}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button type="submit" disabled={!waStatus.ready} className={styles.btnStart}>
                  Enviar Mensaje vía WhatsApp
                </button>
                {waSendStatus && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                    {waSendStatus}
                  </div>
                )}
              </form>
            </div>

            {/* Automated Cron Reports Triggers */}
            <div className={styles.apiCard}>
              <div className={styles.apiHeader}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} style={{ color: 'var(--primary)' }} />
                  <span>Prueba Manual de Cron Jobs Programados</span>
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(120, 120, 128, 0.05)', padding: '1.25rem', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>Reporte Mensual (WhatsApp + Ollama Llama 3.2)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Programación: Día 1 de cada mes a las 10:00 AM.
                  </p>
                  <button onClick={handleTriggerMonthly} className={styles.actionBtn}>
                    Ejecutar Prueba Ahora
                  </button>
                  {monthlyTriggerStatus && <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>{monthlyTriggerStatus}</p>}
                </div>

                <div style={{ background: 'rgba(120, 120, 128, 0.05)', padding: '1.25rem', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>Reporte Semanal (Email + Gemini 1.5 Flash)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Programación: Lunes a las 9:00 AM vía SMTP.
                  </p>
                  <button onClick={handleTriggerWeekly} className={styles.actionBtn}>
                    Ejecutar Prueba Ahora
                  </button>
                  {weeklyTriggerStatus && <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>{weeklyTriggerStatus}</p>}
                </div>
              </div>
            </div>

            {/* Exclusions Management */}
            <div className={styles.apiCard}>
              <div className={styles.apiHeader}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} style={{ color: '#ef4444' }} />
                  <span>Exclusiones de WhatsApp (Base de Datos)</span>
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={exclusions.ignoreAllGroups}
                    onChange={handleToggleIgnoreAllGroups}
                  />
                  <span>Ignorar todos los grupos (ignoreAllGroups)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Ej. 18092160598@c.us o 18298560444-1582042450@g.us"
                  value={newExclusionValue}
                  onChange={(e) => setNewExclusionValue(e.target.value)}
                  className={styles.formInput}
                  style={{ flex: 1 }}
                />
                <button onClick={handleAddExclusion} className={styles.actionBtnPrimary}>
                  Agregar Exclusión
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {exclusions.numbers.map((num) => (
                  <span
                    key={num}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>📞 {num}</span>
                    <button
                      onClick={() => handleDeleteExclusion(num)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </span>
                ))}

                {exclusions.groups.map((grp) => (
                  <span
                    key={grp}
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>👥 {grp}</span>
                    <button
                      onClick={() => handleDeleteExclusion(grp)}
                      style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 3: AI INTEGRATIONS ================= */}
        {adminTab === 'ai' && (
          <div>
            <h2 className={styles.viewTitle}>Integraciones de Modelos de Inteligencia Artificial</h2>

            {/* Google Gemini Card */}
            <div className={styles.apiCard}>
              <div className={styles.apiHeader}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} style={{ color: '#3b82f6' }} />
                  <span>Google Gemini 1.5 Flash API</span>
                </h3>
                <span className={styles.badgeSuccess}>Proxy Nativo</span>
              </div>

              <form onSubmit={handleRunGemini} className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Prompt de Prueba</label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Resume este problema de red y genera recomendaciones ejecutivas..."
                    value={geminiPrompt}
                    onChange={(e) => setGeminiPrompt(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <button type="submit" disabled={geminiLoading} className={styles.btnStart}>
                  {geminiLoading ? 'Generando con Gemini...' : 'Generar con Google Gemini'}
                </button>
                {geminiResult && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(120, 120, 128, 0.08)', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                    {geminiResult}
                  </div>
                )}
              </form>
            </div>

            {/* Ollama Card */}
            <div className={styles.apiCard}>
              <div className={styles.apiHeader}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={18} style={{ color: 'var(--primary)' }} />
                  <span>Ollama Llama 3.2 (Instancia de Red)</span>
                </h3>
                <span className={styles.badgeSuccess}>http://192.168.50.233:11434</span>
              </div>

              <form onSubmit={handleRunOllama} className={styles.formGrid}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Modelo</label>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Servidor Ollama Host</label>
                    <input
                      type="text"
                      value={ollamaHost}
                      onChange={(e) => setOllamaHost(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Prompt de Diagnóstico</label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Brinda un paso simple de solución para un usuario con audio apagado..."
                    value={ollamaPrompt}
                    onChange={(e) => setOllamaPrompt(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <button type="submit" disabled={ollamaLoading} className={styles.btnStart}>
                  {ollamaLoading ? 'Consultando Ollama...' : 'Generar con Ollama Llama 3.2'}
                </button>

                {ollamaResult && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(120, 120, 128, 0.08)', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                    {ollamaResult}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTicket(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setSelectedTicket(null)}>
              &times;
            </button>

            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#ffffff' }}>Ticket de Soporte #{selectedTicket.id.slice(-6)}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                Origen: {selectedTicket.source} • {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid #444', paddingBottom: '1rem' }}>
                <div><strong>Agente:</strong> {selectedTicket.from}</div>
                <div><strong>Email:</strong> {selectedTicket.email || 'N/A'}</div>
                <div><strong>Box / Estación:</strong> {selectedTicket.box || 'N/A'}</div>
                <div><strong>Categoría:</strong> {selectedTicket.category || 'General'}</div>
                <div><strong>Severidad:</strong> {selectedTicket.severity || 'Normal'}</div>
                <div><strong>Estado:</strong> {selectedTicket.status}</div>
              </div>

              <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}>Resumen del Problema:</h4>
              <div style={{ background: '#3b3b3b', padding: '12px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {selectedTicket.summary || selectedTicket.issue}
              </div>

              {selectedTicket.history && (
                <>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}>Historial de Conversación:</h4>
                  <div style={{ background: '#333333', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {selectedTicket.history}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
