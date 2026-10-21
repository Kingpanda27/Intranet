"use client"

import React, { useState, useRef, useEffect } from 'react';
import styles from './SupportAILlama.module.css';
import { useSupportChat } from './SupportContext';
import emailjs from '@emailjs/browser';
import { Send, CheckCircle2, XCircle, Bot, AlertTriangle, ExternalLink } from 'lucide-react';

const CATEGORIES_BY_LANG: Record<'es' | 'en', Array<{ key: string; label: string }>> = {
  es: [
    { key: 'audio-headset', label: '🎧 Headset / Auriculares' },
    { key: 'monitors', label: '🖥️ Monitores y Pantallas' },
    { key: 'internet', label: '🌐 Conexión a Internet / Red' },
    { key: 'vpn-issues', label: '🔒 Problemas de VPN' },
    { key: 'app-crashing', label: '⚠️ Cierre de Aplicaciones' },
    { key: 'login-account', label: '👤 Inicio de Sesión / Cuenta' },
    { key: 'printer-issues', label: '🖨️ Problemas de Impresora' },
    { key: 'email-outlook', label: '📧 Correo / Outlook' },
    { key: 'other-issue', label: '⚙️ Otro Problema' },
  ],
  en: [
    { key: 'audio-headset', label: '🎧 Headset / Audio' },
    { key: 'monitors', label: '🖥️ Monitors & Displays' },
    { key: 'internet', label: '🌐 Internet & Network' },
    { key: 'vpn-issues', label: '🔒 VPN Issues' },
    { key: 'app-crashing', label: '⚠️ App Crashing' },
    { key: 'login-account', label: '👤 Login / Account' },
    { key: 'printer-issues', label: '🖨️ Printer Issues' },
    { key: 'email-outlook', label: '📧 Email / Outlook' },
    { key: 'other-issue', label: '⚙️ Other Issue' },
  ],
};

const SYSTEM_PROMPT_ES = `# SYSTEM PROMPT: AILlama Support Agent

## IDENTIDAD Y ROL
Eres AILlama, el asistente virtual de soporte técnico L1 para colaboradores internos. Tu objetivo es guiar al usuario para resolver **cualquier tipo de incidencia técnica** (hardware, software, periféricos, herramientas web o accesos) mediante comprobaciones visuales, directas y físicas que no requieran experiencia informática.

---

## REGLAS OBLIGATORIAS (POLÍTICA DE CERO FRICCIÓN)

1. **PROHIBICIÓN ABSOLUTA DE REINICIOS:**
   - Jamás indiques apagar, reiniciar, suspender la computadora ni acceder al "Modo Seguro".
   - El usuario no debe cerrar su sesión general de Windows ni arriesgarse a perder llamadas, pestañas o trabajo activo.

2. **PROHIBIDO EL ENTORNO TÉCNICO Y COMANDOS:**
   - Queda vetado el uso de terminales o consolas (CMD, PowerShell, comandos como ping o ipconfig), el Administrador de Dispositivos, la BIOS/UEFI, el Registro de Windows o términos de infraestructura de red (DNS, Puerta de enlace, IP estática).

3. **UNA SOLA ACCIÓN POR INTERACCIÓN:**
   - Da únicamente UNA indicación por respuesta.
   - No envíes listas de pasos múltiples. Espera la confirmación del usuario antes de pasar al siguiente intento.

4. **LENGUAJE 100% VISUAL Y FÍSICO:**
   - Guía al usuario usando referencias espaciales, colores, formas y nombres comunes (ej. "el candado al lado del link", "el icono de la bocina abajo a la derecha", "el cable con cabeza rectangular azul").

5. **TONO DIRECTO EN SEGUNDA PERSONA:**
   - Dirígete siempre directamente al usuario en segunda persona ("Por favor desconecta...", "Revisa la cajita...", "Verifica..."). Jamás digas "Pide al usuario".

6. **REGLA ESTRICTA DE LOS 3 INTENTOS (ESCALACIÓN):**
   - Para cualquier problema, el límite máximo es de 3 intentos simples.
   - Si al tercer intento la situación no se resuelve, no inventes más pasos ni pidas cosas complejas: detén el diagnóstico y escala de inmediato a un técnico humano.

7. **IDIOMA:**
   - Responde ÚNICAMENTE en ESPAÑOL.

---

## METODOLOGÍA UNIVERSAL PARA CUALQUIER INCIDENCIA
Aplica este esquema estructurado a cualquier problema que reporte el usuario (software, CRM, teclado, cámara, lentitud de app o errores web):
- Intento 1 (Nivel Superficial / Físico): Inspección visual del entorno. Revisar cables, enchufes, interruptores de encendido/mute, o si la ventana/pestaña correcta está activa.
- Intento 2 (Nivel Aplicación / Interfaz): Acciones no destructivas dentro de la misma aplicación (cerrar y reabrir únicamente esa app o pestaña, refrescar con Ctrl + F5, cambiar de navegador, revisar selectores o menús desplegables internos).
- Intento 3 (Nivel Sesión / Alternativa guiada): Probar abrir en modo incógnito (Ctrl + Shift + N), desloguearse y volver a iniciar sesión solo en esa plataforma, o cambiar a un puerto alternativo (ej. otro puerto USB).
- Fallo en Intento 3: Escalar a IT sin rodeos.

---

## GUÍAS DE REFERENCIA RÁPIDA (CASOS FRECUENTES)

### A. Auriculares / Diademas (Audio o Micrófono)
- Intento 1: Por favor desconecta el cable USB del auricular y conéctalo en otro puerto USB diferente de la máquina.
- Intento 2: Revisa la cajita de control en el cable del auricular: sube la ruedita de volumen y constata que el botón de mute no tenga una luz roja fija encendida.
- Intento 3: Haz clic en la bocinita abajo a la derecha (junto a la hora), abre la lista desplegable de salidas de audio y selecciona el nombre de tu auricular en vez del monitor.

### B. Monitores (Pantalla apagada, no detectada o parpadeo)
- Intento 1: Verifica la luz testigo en el borde inferior o trasero de la pantalla (azul/blanca/ámbar) y presiona el botón de encendido si está apagada.
- Intento 2: Ajusta con firmeza los cables detrás del monitor y detrás de la computadora (cable de corriente y cable de video).
- Intento 3: Presiona la combinación de teclas Windows + P en tu teclado y haz clic en la opción "Extender" en el menú lateral derecho (o presiona Windows + Ctrl + Shift + B).

### C. Conexión de Red / Internet
- Intento 1: Identifica el icono abajo a la derecha (junto al reloj) y descríbeme si muestra un monitor con cable, señal de Wi-Fi o un globo terráqueo/círculo gris con una X roja.
- Intento 2: Si usas cable, revisa detrás de la torre que el conector transparente tenga una pequeña luz verde o naranja parpadeando (empuja suavemente hasta oír un "clic" si está suelto).
- Intento 3: En la página o herramienta que te da error, presiona al mismo tiempo Ctrl + F5 en tu teclado para forzar la recarga limpia de la conexión.`;

const SYSTEM_PROMPT_EN = `# SYSTEM PROMPT: AILlama Support Agent

## IDENTITY AND ROLE
You are AILlama, the L1 IT Support Virtual Assistant for internal employees. Your goal is to guide the user in resolving ANY technical issue (hardware, software, peripherals, web tools, or logins) through direct, visual, and physical checks that require no technical expertise.

---

## MANDATORY RULES (ZERO FRICTION POLICY)

1. **ABSOLUTE PROHIBITION OF REBOOTS:**
   - Never instruct the user to shut down, restart, suspend the computer, or enter "Safe Mode".
   - The user must not log out of Windows or risk losing calls, tabs, or active work.

2. **TECHNICAL ENVIRONMENT AND COMMANDS PROHIBITED:**
   - Terminal/console usage (CMD, PowerShell, commands like ping or ipconfig), Device Manager, BIOS/UEFI, Windows Registry, or network infrastructure terms (DNS, Gateway, static IP) are strictly forbidden.

3. **SINGLE ACTION PER INTERACTION:**
   - Provide only ONE instruction per response.
   - Do not send multi-step lists. Wait for user confirmation before moving to the next attempt.

4. **100% VISUAL AND PHYSICAL LANGUAGE:**
   - Guide the user using spatial references, colors, shapes, and everyday terms (e.g. "the padlock next to the link", "the speaker icon bottom right", "the cable with a rectangular blue head").

5. **DIRECT SECOND-PERSON TONE:**
   - Always address the user directly ("Please disconnect...", "Check the cable...", "Press..."). Never speak in third person ("Ask the user...").

6. **STRICT 3-ATTEMPT RULE (ESCALATION):**
   - For any issue, the maximum limit is 3 simple attempts.
   - If not resolved by attempt 3, stop troubleshooting immediately and escalate to a human technician.

7. **LANGUAGE:**
   - Respond STRICTLY in ENGLISH.

---

## UNIVERSAL METHODOLOGY FOR ANY INCIDENT
Apply this structured framework to any user issue (software, CRM, keyboard, camera, app slowdown, or web errors):
- Attempt 1 (Surface / Physical Level): Visual inspection of the physical setup. Check cables, plugs, power/mute switches, or whether the correct window/tab is active.
- Attempt 2 (Application / Interface Level): Non-destructive actions within the same application (close and reopen only that specific app or tab, refresh with Ctrl + F5, switch browser, check internal dropdown selectors).
- Attempt 3 (Session / Guided Alternative Level): Try opening incognito mode (Ctrl + Shift + N), logging out and logging back in only on that platform, or switching to an alternative port (e.g. another USB port).
- Failure on Attempt 3: Escalate to IT immediately.

---

## QUICK REFERENCE GUIDES (FREQUENT CASES)

### A. Headsets / Audio (Sound or Microphone)
- Attempt 1: Please disconnect your headset's USB cable and plug it into a different USB port on your machine.
- Attempt 2: Check the control dongle on your headset cable: turn the volume wheel up and make sure the mute button does not have a solid red light on.
- Attempt 3: Click the speaker icon at the bottom right (next to the clock), open the audio output list, and select your headset name instead of your monitor.

### B. Monitors (Black screen, not detected, or flickering)
- Attempt 1: Check the indicator light on the bottom or back edge of the screen (blue/white/amber) and press the power button if it is off.
- Attempt 2: Firmly reseat the cables behind your monitor and computer (power cable and video cable).
- Attempt 3: Press Windows + P simultaneously on your keyboard and click "Extend" in the right side menu (or press Windows + Ctrl + Shift + B).

### C. Network / Internet Connection
- Attempt 1: Look at the icon in the bottom right corner (next to the clock) and describe if it shows a monitor with a cable, Wi-Fi fan, or a globe/gray circle with a red X.
- Attempt 2: If connected by cable, check behind the tower that the transparent plastic connector has a small green or amber blinking light (gently push until you hear a "click").
- Attempt 3: On the page or tool giving the error, press Ctrl + F5 simultaneously on your keyboard to force a clean reload.`;

export function ChatAssistantView() {
  const {
    profile,
    setProfileLocation,
    setProfileBox,
    isProfileConfirmed,
    confirmProfile,
    selectedCategory,
    selectedCategoryName,
    selectCategory,
    attempt,
    setAttempt,
    step,
    setStep,
    messages,
    addMessage,
    userIssueText,
    setUserIssueText,
    resetSession,
    language,
    setLanguage,
  } = useSupportChat();

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isEs = language === 'es';
  const categoriesList = CATEGORIES_BY_LANG[language] || CATEGORIES_BY_LANG.es;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Form validation
  const isFormValid =
    profile.location !== '' &&
    (profile.location === 'wfh' || (profile.location === 'onsite' && profile.box.trim().length > 0));

  const handleStartChat = () => {
    if (isFormValid) {
      confirmProfile();
    }
  };

  // Helper text formatter for markdown-like bold
  const formatMsg = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Diagnostic step with AI (NVIDIA NIM Llama 3.2)
  const fetchOllamaSolutions = async (issue: string, currentAttempt: number) => {
    setIsProcessing(true);
    addMessage(
      'system',
      isEs
        ? 'Analizando tu problema con IA (NVIDIA Llama 3.2)...'
        : 'Analyzing your issue with AI (NVIDIA Llama 3.2)...'
    );

    let userPrompt = '';
    const systemPrompt = isEs ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;

    if (isEs) {
      if (currentAttempt === 1) {
        userPrompt = `Categoría seleccionada: ${selectedCategoryName}.
Problema reportado por el usuario: "${issue}".
Este es el INTENTO 1 (Nivel Superficial / Físico).
Instrucción: Entrega exactamente UNA sola comprobación visual o física según la metodología y guía de resolución para este problema.
Recuerda:
- Cero fricción: JAMÁS indiques reiniciar la PC, apagarla ni Modo Seguro.
- Prohibido entorno técnico: No menciones comandos (CMD/PowerShell), DNS, IP ni BIOS.
- Entrega ÚNICAMENTE una sola instrucción breve y directa en segunda persona ("Por favor...", "Revisa...").`;
      } else if (currentAttempt === 2) {
        userPrompt = `Categoría seleccionada: ${selectedCategoryName}.
Problema reportado por el usuario: "${issue}".
El intento 1 no funcionó. Este es el INTENTO 2 (Nivel Aplicación / Interfaz).
Instrucción: Entrega el paso 2 de la guía de resolución (o una acción no destructiva dentro de la misma aplicación / selectores / cables y controles).
Recuerda:
- Solo UNA sola instrucción directa en segunda persona.
- Sin reiniciar la computadora ni comandos técnicos.`;
      } else {
        userPrompt = `Categoría seleccionada: ${selectedCategoryName}.
Problema reportado por el usuario: "${issue}".
Los intentos 1 y 2 no funcionaron. Este es el INTENTO 3 (Último intento L1: Nivel Sesión / Alternativa guiada).
Instrucción: Entrega el paso 3 de la guía de resolución (modo incógnito Ctrl+Shift+N, selector de audio/pantalla, puerto alternativo o recarga Ctrl+F5).
Recuerda:
- Solo UNA sola instrucción directa.
- Jamás sugieras reiniciar el equipo.`;
      }
    } else {
      if (currentAttempt === 1) {
        userPrompt = `Selected category: ${selectedCategoryName}.
User reported issue: "${issue}".
This is ATTEMPT 1 (Surface / Physical Level).
Instruction: Provide exactly ONE simple physical or visual check following the methodology and resolution guide for this issue.
Remember:
- Zero friction: NEVER tell the user to reboot, restart, or use Safe Mode.
- No technical commands: No CMD/PowerShell, DNS, IP, or BIOS.
- Deliver ONLY a single instruction, brief and direct in second person ("Please...", "Check...").`;
      } else if (currentAttempt === 2) {
        userPrompt = `Selected category: ${selectedCategoryName}.
User reported issue: "${issue}".
Attempt 1 did not work. This is ATTEMPT 2 (Application / Interface Level).
Instruction: Provide step 2 from the resolution guide (or a non-destructive check within the same application / selectors / controls).
Remember:
- Deliver ONLY a single direct instruction in second person.
- No PC reboots or technical commands.`;
      } else {
        userPrompt = `Selected category: ${selectedCategoryName}.
User reported issue: "${issue}".
Attempts 1 and 2 did not work. This is ATTEMPT 3 (Final L1 attempt: Session / Guided Alternative Level).
Instruction: Provide step 3 from the resolution guide (incognito mode Ctrl+Shift+N, audio/display selector, alternative port, or clean reload Ctrl+F5).
Remember:
- Deliver ONLY a single direct instruction.
- Never suggest restarting the PC.`;
      }
    }

    try {
      const res = await fetch('/api/ollama/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          systemPrompt: systemPrompt,
          model: 'meta/llama-3.2-11b-vision-instruct',
        }),
      });

      if (!res.ok) throw new Error(isEs ? 'No se pudo contactar al servidor de IA.' : 'Could not reach the AI server.');
      const data = await res.json();

      setIsProcessing(false);
      addMessage('agent', data.response);
      addMessage(
        'agent',
        isEs
          ? '¿Esta solución resolvió tu problema? Por favor responde con Sí o No.'
          : 'Did this solution solve your problem? Please reply with Yes or No.'
      );
      setStep('EVALUATING_SOLUTIONS');
    } catch (err: any) {
      setIsProcessing(false);
      console.error('[ChatAssistant] AI error:', err);
      addMessage(
        'agent',
        isEs
          ? 'Lo siento, no pude contactar al motor de IA en este momento. Voy a proceder a derivar tu caso con el equipo técnico de inmediato.'
          : 'Sorry, I could not reach the AI engine right now. I will proceed to escalate your case to the technical team immediately.'
      );
      await createTicketAndSendEmail(issue);
    }
  };

  // Ticket creation & EmailJS dispatch
  const createTicketAndSendEmail = async (userIssue: string) => {
    setStep('SUBMITTING');
    addMessage(
      'system',
      isEs
        ? 'Generando reporte y guardando ticket en la base de datos de Intranet...'
        : 'Generating report and saving support ticket in the Intranet database...'
    );

    const conversationHistory = messages
      .map((m) => `${m.type === 'agent' ? 'Bot' : 'User'}: ${m.text}`)
      .join('\n');

    let summary = `Ticket de soporte para ${selectedCategoryName}: ${userIssue}`;
    try {
      const summaryPrompt = isEs
        ? `Resume este caso de soporte IT en una descripción concisa en ESPAÑOL para el técnico de Helpdesk. Explica el problema del usuario y menciona los pasos físicos verificados. Devuelve únicamente el resumen sin saludos ni despedidas.\n\nChat Log:\n${conversationHistory.slice(-2000)}`
        : `Summarize this IT support case into a concise ticket description in ENGLISH for the Helpdesk technician. Explain the user's issue and mention the physical checks verified. Just output the summary, no intro/outro.\n\nChat Log:\n${conversationHistory.slice(-2000)}`;

      const sumRes = await fetch('/api/ollama/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: summaryPrompt,
          model: 'meta/llama-3.2-11b-vision-instruct',
        }),
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        summary = sumData.response;
      }
    } catch (e) {
      console.warn('[ChatAssistant] Resumen IA omitido:', e);
    }

    const fullSummaryLog = `AI SUMMARY:\n${summary}\n\n----- FULL LOG -----\n${conversationHistory}`;

    // 1. Guardar ticket en Base de Datos de Intranet (MySQL)
    let ticketSaved = false;
    try {
      const ticketRes = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: profile.name,
          email: profile.email,
          box: profile.box,
          category: selectedCategoryName,
          severity: 'Normal',
          issue: userIssue,
          summary: fullSummaryLog,
          history: messages,
          source: 'Chat Web',
        }),
      });
      if (ticketRes.ok) ticketSaved = true;
    } catch (err) {
      console.error('[ChatAssistant] Error guardando ticket en BD:', err);
    }

    // 2. Envío desacoplado con EmailJS
    let emailSent = false;
    try {
      await emailjs.send(
        'service_9q5tkyt',
        'template_t961pe6',
        {
          user_name: profile.name,
          user_email: profile.email,
          box_number: profile.box,
          category: selectedCategoryName,
          severity: 'Normal',
          chat_history: fullSummaryLog,
          timestamp: new Date().toLocaleString(),
        },
        'Qob3T9TZxrEeMUz3G'
      );
      emailSent = true;
    } catch (err) {
      console.error('[ChatAssistant] Error enviando email con EmailJS:', err);
    }

    if (ticketSaved || emailSent) {
      addMessage(
        'agent',
        isEs
          ? '✅ Tu caso ha sido escalado exitosamente a TI. Un técnico tomará el control en breve.'
          : '✅ Your case has been successfully escalated to IT. A technician will assist you shortly.'
      );
    } else {
      addMessage(
        'agent',
        isEs
          ? '⚠️ El reporte ha sido registrado localmente. Por favor avisa directamente al equipo de TI.'
          : '⚠️ The report has been recorded. Please contact IT directly.'
      );
    }

    setStep('IDLE');
    setTimeout(() => {
      resetSession();
    }, 4500);
  };

  // Handlers for interactive Sí / No buttons
  const handleSolutionYes = () => {
    if (isEs) {
      addMessage('user', 'Sí, solucionó mi problema.');
      addMessage(
        'agent',
        '🎉 ¡Excelente! Me alegra saber que tu problema quedó resuelto. Soy **AILlama**, tu asistente de TI. Si necesitas ayuda adicional, puedes iniciar una nueva consulta.'
      );
    } else {
      addMessage('user', 'Yes, it solved my issue.');
      addMessage(
        'agent',
        '🎉 Great! Glad your problem is resolved. I am **AILlama**, your IT Assistant. If you need additional help, feel free to start a new inquiry.'
      );
    }
    setStep('IDLE');
    setTimeout(() => {
      resetSession();
    }, 3500);
  };

  const handleSolutionNo = async () => {
    addMessage('user', isEs ? 'No, el problema persiste.' : 'No, the problem persists.');

    // REGLA ESTRICTA DE LOS 3 INTENTOS: Tras 3 intentos fallidos se detiene el diagnóstico y se escala de inmediato
    if (attempt < 3) {
      const nextAttempt = attempt + 1;
      setAttempt(nextAttempt);
      await fetchOllamaSolutions(userIssueText, nextAttempt);
    } else {
      // MENSAJE DE ESCALADO AUTOMÁTICO EXACTO (AL COMPLETAR LOS 3 INTENTOS)
      const escalationMessage = isEs
        ? 'Gracias por hacer estas pruebas. Dado que el inconveniente persiste tras estas comprobaciones, se requiere la atención directa de un técnico de soporte para no quitarte más tiempo. He registrado un reporte con los datos que revisamos; por favor mantén tu equipo encendido y tus ventanas abiertas para que un compañero tome el control de inmediato.'
        : 'Thank you for doing these tests. Since the issue persists after these checks, direct attention from a support technician is required so as not to take up more of your time. I have logged a report with the details we reviewed; please keep your computer on and your windows open so a teammate can take control immediately.';

      addMessage('agent', escalationMessage);
      await createTicketAndSendEmail(userIssueText);
    }
  };

  const handleSendMessage = async () => {
    const text = inputVal.trim();
    if (!text || isProcessing) return;

    if (!selectedCategory) {
      alert(isEs ? 'Por favor selecciona una categoría de soporte en el panel izquierdo.' : 'Please select a support category from the left panel.');
      return;
    }

    addMessage('user', text);
    setInputVal('');

    if (step === 'AWAITING_INITIAL_ISSUE') {
      setUserIssueText(text);
      await fetchOllamaSolutions(text, 1);
    } else if (step === 'EVALUATING_SOLUTIONS') {
      const lower = text.toLowerCase();
      if (/^(yes|sí|si|listo|funciona|fixed|ok|gracias|thanks|it worked|solved)/.test(lower)) {
        handleSolutionYes();
      } else if (/^(no|nope|nada|falló|fallo|not|didn't work|didnt work|still broken|sigue igual|no funcionó|no sirve)/.test(lower)) {
        await handleSolutionNo();
      } else {
        addMessage(
          'agent',
          isEs
            ? '¿Esta solución te ayudó? Por favor presiona uno de los botones de confirmación o responde con Sí o No.'
            : 'Did this solution help? Please press one of the confirmation buttons or reply with Yes or No.'
        );
      }
    } else if (step === 'IDLE') {
      addMessage(
        'agent',
        isEs
          ? '¿Deseas realizar una nueva consulta? Puedes presionar el botón "Finalizar / Nueva Consulta" arriba o seleccionar otra categoría.'
          : 'Would you like to start a new inquiry? You can click the "Reset / New Session" button above or choose another category.'
      );
    }
  };

  return (
    <div className={styles.chatContainer}>
      {/* Categories Left Sidebar */}
      <aside className={styles.chatSidebar}>
        {/* Language selector in sidebar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div className={styles.sidebarTitle} style={{ margin: 0 }}>
            {isEs ? 'Categorías' : 'Categories'}
          </div>
          <div className={styles.langToggleContainer}>
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`${styles.langToggleBtn} ${language === 'es' ? styles.langToggleBtnActive : ''}`}
              title="Español"
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`${styles.langToggleBtn} ${language === 'en' ? styles.langToggleBtnActive : ''}`}
              title="English"
            >
              EN
            </button>
          </div>
        </div>

        <nav className={styles.categoryNav}>
          {categoriesList.map((cat) => (
            <button
              key={cat.key}
              onClick={() => selectCategory(cat.key, cat.label)}
              className={`${styles.categoryBtn} ${selectedCategory === cat.key ? styles.categoryBtnActive : ''}`}
            >
              <span>{cat.label}</span>
              {selectedCategory === cat.key && <span style={{ fontSize: '0.8rem' }}>●</span>}
            </button>
          ))}
        </nav>

        <div className={styles.waSection}>
          <a
            href="https://wa.me/18294232495"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waBtn}
            title={isEs ? "Escribir por WhatsApp a soporte" : "Chat with IT Support on WhatsApp"}
          >
            <ExternalLink size={16} />
            <span>{isEs ? 'Soporte vía WhatsApp' : 'Support via WhatsApp'}</span>
          </a>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={styles.chatMain}>
        <div className={styles.messagesArea}>
          {!isProfileConfirmed ? (
            /* Pre-chat Welcome & Location confirmation */
            <div className={styles.welcomeCard}>
              <div className={styles.badgeLive} style={{ marginBottom: '1rem' }}>
                <span className={styles.pulseDot}></span>
                {isEs ? 'AILlama • Soporte IT Automatizado (NVIDIA AI)' : 'AILlama • Automated IT Support (NVIDIA AI)'}
              </div>
              <h2 className={styles.welcomeTitle}>
                {isEs ? 'Bienvenido al Soporte IT' : 'Welcome to IT Support'}
              </h2>
              <p className={styles.welcomeSub}>
                {isEs ? 'Confirma tu ubicación de trabajo para iniciar la asistencia.' : 'Confirm your work location to begin assistance.'}
              </p>

              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  onClick={() => setProfileLocation('onsite')}
                  className={`${styles.segmentBtn} ${profile.location === 'onsite' ? styles.segmentBtnActive : ''}`}
                >
                  {isEs ? 'En Oficina (On-Site)' : 'Work On Site'}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileLocation('wfh')}
                  className={`${styles.segmentBtn} ${profile.location === 'wfh' ? styles.segmentBtnActive : ''}`}
                >
                  {isEs ? 'Desde Casa (Remoto)' : 'Work From Home'}
                </button>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {isEs ? 'Nombre del Agente' : 'Agent Name'}
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    readOnly
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {isEs ? 'Correo Electrónico' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {isEs ? 'Proyecto Asignado' : 'Assigned Project'}
                  </label>
                  <input
                    type="text"
                    value={profile.project}
                    readOnly
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                  />
                </div>

                {profile.location === 'onsite' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {isEs ? 'Número de Box (Ubicación física)' : 'Box Number (Workstation)'}
                    </label>
                    <input
                      type="text"
                      placeholder={isEs ? 'Ej. Box 42, Estación 3B' : 'e.g. Box 42, Station 3B'}
                      value={profile.box}
                      onChange={(e) => setProfileBox(e.target.value)}
                      className={styles.formInput}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleStartChat}
                disabled={!isFormValid}
                className={styles.btnStart}
              >
                {isEs ? 'Comenzar Asistencia' : 'Start Support Session'}
              </button>
            </div>
          ) : (
            /* Active Chat Messages */
            <>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.messageWrapper} ${
                    m.type === 'user' ? styles.userWrapper : m.type === 'agent' ? styles.agentWrapper : ''
                  }`}
                  style={{ alignSelf: m.type === 'system' ? 'center' : undefined }}
                >
                  {m.type === 'agent' && <div className={styles.messageAvatar}>AL</div>}

                  <div
                    className={`${styles.messageBubble} ${
                      m.type === 'user'
                        ? styles.userBubble
                        : m.type === 'agent'
                        ? styles.agentBubble
                        : styles.systemBubble
                    }`}
                  >
                    {m.type === 'system' && <Bot size={16} />}
                    <div>{formatMsg(m.text)}</div>
                  </div>
                </div>
              ))}

              {/* Quick Choice Buttons for Evaluating Solutions (3 Intentos Máximo) */}
              {step === 'EVALUATING_SOLUTIONS' && !isProcessing && (
                <div style={{ alignSelf: 'flex-start', marginLeft: '48px' }}>
                  <div className={styles.feedbackControls}>
                    <button onClick={handleSolutionYes} className={styles.btnFeedbackYes}>
                      <CheckCircle2 size={16} /> {isEs ? 'Sí, se solucionó' : 'Yes, it worked'}
                    </button>
                    <button onClick={handleSolutionNo} className={styles.btnFeedbackNo}>
                      <XCircle size={16} /> {isEs ? `No funcionó (${attempt}/3)` : `Didn't work (${attempt}/3)`}
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className={styles.inputBar}>
          <input
            type="text"
            placeholder={
              !isProfileConfirmed
                ? (isEs ? 'Confirma tu ubicación arriba para comenzar...' : 'Confirm your location above to start...')
                : !selectedCategory
                ? (isEs ? 'Selecciona una categoría a la izquierda...' : 'Select a category on the left...')
                : (isEs ? 'Describe tu problema o escribe un mensaje...' : 'Describe your issue or type a message...')
            }
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={!isProfileConfirmed || !selectedCategory || isProcessing}
            className={styles.chatInput}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!isProfileConfirmed || !selectedCategory || !inputVal.trim() || isProcessing}
            className={styles.btnSend}
          >
            <Send size={16} />
            <span>{isEs ? 'Enviar' : 'Send'}</span>
          </button>
        </div>
      </main>
    </div>
  );
}
