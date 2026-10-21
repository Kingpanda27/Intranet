"use client"

import React from 'react';
import styles from './SupportAILlama.module.css';
import { useSupportChat } from './SupportContext';
import { ChatAssistantView } from './ChatAssistantView';
import { RotateCcw, X } from 'lucide-react';

export function SupportAILlamaContainer() {
  const {
    isSupportOpen,
    closeSupportChat,
    resetSession,
    language,
    setLanguage,
  } = useSupportChat();

  return (
    <div
      className={styles.supportRoot}
      style={{ display: isSupportOpen ? 'flex' : 'none' }}
      id="support-aillama-persistent-root"
    >
      {/* Top Header Navigation */}
      <header className={styles.topNav}>
        <div className={styles.brandArea}>
          <img
            src="/logotnnaranja.png"
            alt="AILlama"
            className={styles.brandLogo}
          />
          <div className={styles.brandTitle}>
            <span>AILlama Support</span>
            <span className={styles.badgeLive}>
              <span className={styles.pulseDot}></span>
              {language === 'es' ? 'Asistente IT' : 'IT Assistant'}
            </span>
          </div>
        </div>

        <div className={styles.navControls}>
          {/* Language Selector Switcher */}
          <div className={styles.langToggleContainer} role="group" aria-label="Language selection">
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`${styles.langToggleBtn} ${language === 'es' ? styles.langToggleBtnActive : ''}`}
              title="Cambiar idioma a Español"
            >
              <span>🇪🇸</span>
              <span>ES</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`${styles.langToggleBtn} ${language === 'en' ? styles.langToggleBtnActive : ''}`}
              title="Switch language to English"
            >
              <span>🇺🇸</span>
              <span>EN</span>
            </button>
          </div>

          {/* Botón visible de Finalizar / Nueva Consulta */}
          <button
            type="button"
            onClick={resetSession}
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            title={language === 'es' ? "Borra la conversación actual y empieza una nueva consulta" : "Reset current chat and start a new session"}
          >
            <RotateCcw size={15} />
            <span>{language === 'es' ? 'Finalizar / Nueva Consulta' : 'Reset / New Session'}</span>
          </button>

          {/* Botón Volver al Intranet */}
          <button
            type="button"
            onClick={closeSupportChat}
            className={styles.actionBtn}
            title={language === 'es' ? "Ocultar chat y volver al Intranet" : "Hide chat and return to Intranet"}
          >
            <X size={16} />
            <span>{language === 'es' ? 'Volver al Intranet' : 'Back to Intranet'}</span>
          </button>
        </div>
      </header>

      {/* Persistent Chat Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ChatAssistantView />
      </div>
    </div>
  );
}
