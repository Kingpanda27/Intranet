"use client"

import React, { useState } from 'react';
import { Cpu, Ticket, Settings2, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import SupportTicketsManager from '@/app/components/Admin/Config/SupportTicketsManager';
import AiIntegrationsManager from '@/app/components/Admin/Config/AiIntegrationsManager';
import ApiKeysManager from '@/app/components/Admin/Config/ApiKeysManager';
import WhatsappManager from '@/app/components/Admin/Config/WhatsappManager';
import OllamaManager from '@/app/components/Admin/Config/OllamaManager';

interface ConfigTabsWrapperProps {
  apiConfigs: any[];
  whatsappConfigs: any[];
  projects: any[];
  documents: any[];
  ollamaConfigs: any[];
}

export default function ConfigTabsWrapper({
  apiConfigs,
  whatsappConfigs,
  projects,
  documents,
  ollamaConfigs,
}: ConfigTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState<'apis' | 'support' | 'channels'>('apis');

  return (
    <div>
      {/* Executive Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, hsl(var(--surface)), hsl(var(--surface-hover)))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
            <span>Intranet</span>
            <span>/</span>
            <span>Administración TI</span>
            <span>/</span>
            <span style={{ color: '#ff6a00' }}>Ecosistema IA & Soporte</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '0.85rem',
                background: 'linear-gradient(135deg, #ff6a00, #ff8c33)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(255, 106, 0, 0.35)',
              }}
            >
              <Cpu size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>
                Configuración de Infraestructura & Soporte TI
              </h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                Supervisión de APIs externas, modelos de IA generativa, administración de tickets de soporte AILlama y canales RAG.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Badges */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            <span>MySQL Unificado</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <Sparkles size={13} />
            <span>Gemini 1.5 Flash</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'rgba(255, 106, 0, 0.1)',
              color: '#ff6a00',
              border: '1px solid rgba(255, 106, 0, 0.25)',
            }}
          >
            <Cpu size={13} />
            <span>Ollama Llama 3.2</span>
          </div>
        </div>
      </div>

      {/* Modern Tabs Navigation Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.65rem',
          background: 'hsl(var(--surface))',
          padding: '0.45rem',
          borderRadius: '1rem',
          border: '1px solid hsl(var(--border))',
          marginBottom: '2rem',
          width: 'fit-content',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('apis')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.4rem',
            borderRadius: '0.75rem',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            background: activeTab === 'apis' ? '#ff6a00' : 'transparent',
            color: activeTab === 'apis' ? '#ffffff' : 'hsl(var(--muted-foreground))',
            boxShadow: activeTab === 'apis' ? '0 4px 12px rgba(255, 106, 0, 0.25)' : 'none',
          }}
        >
          <Cpu size={18} />
          <span>Integraciones de APIs & Modelos IA</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.4rem',
            borderRadius: '0.75rem',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            background: activeTab === 'support' ? '#ff6a00' : 'transparent',
            color: activeTab === 'support' ? '#ffffff' : 'hsl(var(--muted-foreground))',
            boxShadow: activeTab === 'support' ? '0 4px 12px rgba(255, 106, 0, 0.25)' : 'none',
          }}
        >
          <Ticket size={18} />
          <span>Soporte & Tickets AILlama</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.4rem',
            borderRadius: '0.75rem',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            background: activeTab === 'channels' ? '#ff6a00' : 'transparent',
            color: activeTab === 'channels' ? '#ffffff' : 'hsl(var(--muted-foreground))',
            boxShadow: activeTab === 'channels' ? '0 4px 12px rgba(255, 106, 0, 0.25)' : 'none',
          }}
        >
          <Layers size={18} />
          <span>Canales & Documentación RAG</span>
        </button>
      </div>

      {/* Tab 1: Integración de APIs & Modelos IA */}
      {activeTab === 'apis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <AiIntegrationsManager />
          <ApiKeysManager initialConfigs={apiConfigs} />
        </div>
      )}

      {/* Tab 2: Admin de Soporte & Tickets AILlama */}
      {activeTab === 'support' && (
        <div>
          <SupportTicketsManager />
        </div>
      )}

      {/* Tab 3: Canales & Documentación RAG */}
      {activeTab === 'channels' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <WhatsappManager initialConfigs={whatsappConfigs} projects={projects} documents={documents} />
          <OllamaManager initialConfigs={ollamaConfigs} documents={documents} whatsappConfigs={whatsappConfigs} />
        </div>
      )}
    </div>
  );
}
