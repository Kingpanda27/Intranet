"use client"

import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  MessageSquare,
  Globe,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Send,
  Calendar,
  Eye,
  User,
  AlertCircle,
  Inbox,
  X
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
  user?: { id: string; name: string; email: string } | null;
}

export default function SupportTicketsManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'WhatsApp' | 'Chat Web'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Exclusions State
  const [exclusions, setExclusions] = useState<{ numbers: string[]; groups: string[]; ignoreAllGroups: boolean }>({
    numbers: [],
    groups: [],
    ignoreAllGroups: true,
  });
  const [newExclusionValue, setNewExclusionValue] = useState('');
  const [savingExclusion, setSavingExclusion] = useState(false);

  // Cron test trigger state
  const [monthlyStatus, setMonthlyStatus] = useState<string | null>(null);
  const [weeklyStatus, setWeeklyStatus] = useState<string | null>(null);
  const [triggeringMonthly, setTriggeringMonthly] = useState(false);
  const [triggeringWeekly, setTriggeringWeekly] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('[SupportTicketsManager] Error cargando tickets:', e);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('[SupportTicketsManager] Error cargando exclusiones:', e);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchExclusions();
  }, []);

  // Exclusions management
  const handleAddExclusion = async () => {
    if (!newExclusionValue.trim()) return;
    setSavingExclusion(true);
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
    } finally {
      setSavingExclusion(false);
    }
  };

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

  // Cron test triggers
  const handleTriggerMonthly = async () => {
    setTriggeringMonthly(true);
    setMonthlyStatus('Generando resumen de tickets con Ollama Llama 3.2...');
    try {
      const res = await fetch('/api/whatsapp/test-monthly-report', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMonthlyStatus('✅ Reporte mensual generado con éxito.');
      } else {
        setMonthlyStatus(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setMonthlyStatus(`❌ Error: ${e.message}`);
    } finally {
      setTriggeringMonthly(false);
    }
  };

  const handleTriggerWeekly = async () => {
    setTriggeringWeekly(true);
    setWeeklyStatus('Analizando tickets con Gemini 1.5 Flash y enviando correo...');
    try {
      const res = await fetch('/api/whatsapp/test-weekly-report', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWeeklyStatus('✅ Reporte semanal por correo enviado exitosamente.');
      } else {
        setWeeklyStatus(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setWeeklyStatus(`❌ Error: ${e.message}`);
    } finally {
      setTriggeringWeekly(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSource = sourceFilter === 'ALL' || t.source === sourceFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      t.from.toLowerCase().includes(query) ||
      t.issue.toLowerCase().includes(query) ||
      (t.category && t.category.toLowerCase().includes(query)) ||
      (t.email && t.email.toLowerCase().includes(query));
    return matchesSource && matchesQuery;
  });

  const totalCount = tickets.length;
  const waCount = tickets.filter((t) => t.source === 'WhatsApp').length;
  const webCount = tickets.filter((t) => t.source === 'Chat Web').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header Card */}
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
                background: 'rgba(255, 106, 0, 0.12)',
                color: '#ff6a00',
                padding: '0.4rem',
                borderRadius: '0.5rem',
                display: 'inline-flex',
              }}
            >
              <TicketIcon size={22} />
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'hsl(var(--foreground))' }}>
              Gestión de Tickets & Soporte AILlama
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
            Base de datos unificada en MySQL con registro en tiempo real de consultas web y WhatsApp.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--surface))',
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refrescar Datos</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div
          style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1.125rem',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '0.85rem',
              background: 'rgba(255, 106, 0, 0.12)',
              color: '#ff6a00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Inbox size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1.1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase' }}>
              Total de Tickets
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1.125rem',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '0.85rem',
              background: 'rgba(37, 211, 102, 0.12)',
              color: '#25d366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1.1 }}>
              {waCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase' }}>
              Desde WhatsApp
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1.125rem',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '0.85rem',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Globe size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1.1 }}>
              {webCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase' }}>
              Desde Chat Web
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Ticket Table & Search */}
      <div
        style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1.125rem',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Table Filters Bar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--muted-foreground))',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por usuario, email o problema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.25rem',
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

          {/* Source Filter Segmented Control */}
          <div
            style={{
              display: 'flex',
              background: 'hsl(var(--background))',
              padding: '3px',
              borderRadius: '0.65rem',
              border: '1px solid hsl(var(--border))',
            }}
          >
            {(['ALL', 'WhatsApp', 'Chat Web'] as const).map((source) => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: sourceFilter === source ? 'hsl(var(--surface))' : 'transparent',
                  color: sourceFilter === source ? '#ff6a00' : 'hsl(var(--muted-foreground))',
                  boxShadow: sourceFilter === source ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {source === 'ALL' ? 'Todos' : source}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 500 }}>No se encontraron tickets con los filtros actuales.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                style={{
                  padding: '1.1rem 1.5rem',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(var(--surface-hover))')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      background: ticket.source === 'WhatsApp' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(255, 106, 0, 0.1)',
                      color: ticket.source === 'WhatsApp' ? '#25d366' : '#ff6a00',
                      flexShrink: 0,
                    }}
                  >
                    {ticket.source === 'WhatsApp' ? '📱' : '🌐'}
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--foreground))' }}>
                        {ticket.issue}
                      </span>
                      {ticket.category && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            fontWeight: 600,
                          }}
                        >
                          {ticket.category}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'hsl(var(--muted-foreground))' }}>
                      De: <strong style={{ color: 'hsl(var(--foreground))' }}>{ticket.from}</strong>
                      {ticket.email ? ` • ${ticket.email}` : ''}
                      {ticket.box ? ` • Box: ${ticket.box}` : ''}
                      <span style={{ marginLeft: '8px', opacity: 0.7 }}>#{ticket.id.slice(-6)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                    <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                    <div>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <Eye size={18} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exclusiones de WhatsApp & Configuración de Grupos */}
      <div
        style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1.125rem',
          padding: '1.75rem 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} style={{ color: '#ef4444' }} />
              <span>Lista de Exclusiones de WhatsApp</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
              Números o grupos que el bot interactivo no debe responder ni procesar.
            </p>
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'hsl(var(--background))',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <input
              type="checkbox"
              checked={exclusions.ignoreAllGroups}
              onChange={handleToggleIgnoreAllGroups}
            />
            <span>Ignorar Todos los Grupos (ignoreAllGroups)</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Ej. 18092160598@c.us o 18298560444-1582042450@g.us"
            value={newExclusionValue}
            onChange={(e) => setNewExclusionValue(e.target.value)}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: '0.65rem',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddExclusion}
            disabled={savingExclusion || !newExclusionValue.trim()}
            style={{
              padding: '0.7rem 1.5rem',
              background: '#ff6a00',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.65rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {savingExclusion ? 'Guardando...' : 'Agregar Exclusión'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {exclusions.numbers.map((num) => (
            <span
              key={num}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                padding: '0.35rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <span>📞 {num}</span>
              <button
                onClick={() => handleDeleteExclusion(num)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                title="Eliminar exclusión"
              >
                &times;
              </button>
            </span>
          ))}

          {exclusions.groups.map((grp) => (
            <span
              key={grp}
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                color: '#3b82f6',
                padding: '0.35rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <span>👥 {grp}</span>
              <button
                onClick={() => handleDeleteExclusion(grp)}
                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}
                title="Eliminar exclusión"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Disparadores de Pruebas de Reportes Programados (Cron) */}
      <div
        style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1.125rem',
          padding: '1.75rem 2rem',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} style={{ color: '#ff6a00' }} />
            <span>Tareas Programadas & Reportes Ejecutivos (node-cron)</span>
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
            Los dos reportes automáticos se ejecutan en segundo plano en el servidor. Puedes disparar una prueba manual aquí:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.85rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 700, color: '#25d366' }}>
                📱 Reporte Mensual por WhatsApp
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                Motor: <strong>Ollama Llama 3.2</strong>. Resume los tickets del mes y los despacha por WhatsApp a los números de administración. Programado para el 1 de cada mes a las 10:00 AM.
              </p>
            </div>
            <div>
              <button
                onClick={handleTriggerMonthly}
                disabled={triggeringMonthly}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid #25d366',
                  background: 'rgba(37, 211, 102, 0.08)',
                  color: '#25d366',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {triggeringMonthly ? 'Ejecutando...' : 'Disparar Reporte Mensual Ahora'}
              </button>
              {monthlyStatus && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', fontWeight: 500 }}>{monthlyStatus}</p>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.85rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', fontWeight: 700, color: '#3b82f6' }}>
                ✉️ Reporte Semanal por Correo
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                Motor: <strong>Google Gemini 1.5 Flash</strong>. Agrupa las incidencias de los últimos 7 días y envía un informe ejecutivo vía SMTP a la dirección de TI. Programado para los lunes a las 9:00 AM.
              </p>
            </div>
            <div>
              <button
                onClick={handleTriggerWeekly}
                disabled={triggeringWeekly}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.65rem',
                  border: '1px solid #3b82f6',
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: '#3b82f6',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {triggeringWeekly ? 'Generando...' : 'Disparar Reporte Semanal por Correo'}
              </button>
              {weeklyStatus && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', fontWeight: 500 }}>{weeklyStatus}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Details Inspection Modal */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1.5rem',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setSelectedTicket(null)}
        >
          <div
            style={{
              background: 'hsl(var(--surface))',
              color: 'hsl(var(--foreground))',
              borderRadius: '1.25rem',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              border: '1px solid hsl(var(--border))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 106, 0, 0.12), rgba(59, 130, 246, 0.08))',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>
                  Detalles del Ticket #{selectedTicket.id.slice(-6)}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                  Origen: <strong>{selectedTicket.source}</strong> • Creado: {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--muted-foreground))',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem', overflowY: 'auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid hsl(var(--border))',
                  paddingBottom: '1.25rem',
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <span style={{ color: 'hsl(var(--muted-foreground))', display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Agente / Remitente
                  </span>
                  <strong style={{ color: 'hsl(var(--foreground))' }}>{selectedTicket.from}</strong>
                </div>

                <div>
                  <span style={{ color: 'hsl(var(--muted-foreground))', display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Correo Electrónico
                  </span>
                  <strong style={{ color: 'hsl(var(--foreground))' }}>{selectedTicket.email || 'N/A'}</strong>
                </div>

                <div>
                  <span style={{ color: 'hsl(var(--muted-foreground))', display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Box / Ubicación
                  </span>
                  <strong style={{ color: 'hsl(var(--foreground))' }}>{selectedTicket.box || 'N/A'}</strong>
                </div>

                <div>
                  <span style={{ color: 'hsl(var(--muted-foreground))', display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Categoría
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      marginTop: '2px',
                    }}
                  >
                    {selectedTicket.category || 'General'}
                  </span>
                </div>

                <div>
                  <span style={{ color: 'hsl(var(--muted-foreground))', display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Severidad
                  </span>
                  <strong style={{ color: selectedTicket.severity === 'Alta' ? '#ef4444' : 'hsl(var(--foreground))' }}>
                    {selectedTicket.severity || 'Normal'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'hsl(var(--muted-foreground))', display: 'block', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    Estado
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      marginTop: '2px',
                    }}
                  >
                    <CheckCircle2 size={12} />
                    <span>{selectedTicket.status}</span>
                  </span>
                </div>
              </div>

              <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff6a00', fontSize: '0.95rem', fontWeight: 700 }}>
                Resumen / Descripción del Problema:
              </h4>
              <div
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedTicket.summary || selectedTicket.issue}
              </div>

              {selectedTicket.history && (
                <>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff6a00', fontSize: '0.95rem', fontWeight: 700 }}>
                    Registro Completo de la Conversación:
                  </h4>
                  <div
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedTicket.history}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                background: 'hsl(var(--surface))',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '0.65rem',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
