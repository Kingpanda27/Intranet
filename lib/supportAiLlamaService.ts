import path from 'path';
import cron from 'node-cron';
import qrcode from 'qrcode';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

// Types for WhatsApp Client
type WhatsAppClientType = any;

interface WhatsAppSession {
  step: 'AWAITING_INITIAL_ISSUE' | 'EVALUATING_SOLUTIONS' | 'IDLE';
  attempt: number;
  userIssue: string;
  history: string[];
}

interface SupportAiLlamaState {
  client: WhatsAppClientType | null;
  qrCodeData: string | null;
  isWhatsAppReady: boolean;
  sessions: Map<string, WhatsAppSession>;
  cronWeeklyStarted: boolean;
  cronMonthlyStarted: boolean;
  initialized: boolean;
}

// Global singleton to prevent duplicate instances during Next.js hot-reload
const globalForAiLlama = globalThis as unknown as {
  __supportAiLlamaState?: SupportAiLlamaState;
};

const state: SupportAiLlamaState = globalForAiLlama.__supportAiLlamaState || {
  client: null,
  qrCodeData: null,
  isWhatsAppReady: false,
  sessions: new Map<string, WhatsAppSession>(),
  cronWeeklyStarted: false,
  cronMonthlyStarted: false,
  initialized: false,
};

if (!globalForAiLlama.__supportAiLlamaState) {
  globalForAiLlama.__supportAiLlamaState = state;
}

// Helper: NVIDIA NIM Response Generator
export async function generateNvidiaResponse(
  prompt: string,
  model?: string,
  systemPrompt?: string
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA API key missing in environment (NVIDIA_API_KEY)");
  }

  const selectedModel = model || process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
  console.log(`[Support AILlama] Calling NVIDIA NIM AI: ${selectedModel}`);

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt.trim() });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Support AILlama] NVIDIA Error (${response.status}):`, errorText);
    throw new Error(`NVIDIA HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '';
  console.log(`[Support AILlama] NVIDIA NIM Response received (${reply.length} chars)`);
  return reply;
}

export const SYSTEM_PROMPT_WHATSAPP = `# SYSTEM PROMPT: AILlama Support Agent

## IDENTIDAD Y ROL
Eres AILlama, el asistente virtual de soporte técnico L1 para colaboradores internos. Tu objetivo es guiar al usuario para resolver cualquier tipo de incidencia técnica (hardware, software, periféricos, herramientas web o accesos) mediante comprobaciones visuales, directas y físicas que no requieran experiencia informática.

## REGLAS OBLIGATORIAS (POLÍTICA DE CERO FRICCIÓN)
1. PROHIBICIÓN ABSOLUTA DE REINICIOS: Jamás indiques apagar, reiniciar, suspender la computadora ni acceder al "Modo Seguro". El usuario no debe cerrar su sesión general de Windows ni arriesgarse a perder llamadas, pestañas o trabajo activo.
2. PROHIBIDO EL ENTORNO TÉCNICO Y COMANDOS: Queda vetado el uso de terminales o consolas (CMD, PowerShell, comandos como ping o ipconfig), el Administrador de Dispositivos, la BIOS/UEFI, el Registro de Windows o términos de infraestructura de red (DNS, Puerta de enlace, IP estática).
3. UNA SOLA ACCIÓN POR INTERACCIÓN: Da únicamente UNA indicación por respuesta. No envíes listas de pasos múltiples. Espera la confirmación del usuario antes de pasar al siguiente intento.
4. LENGUAJE 100% VISUAL Y FÍSICO: Guía al usuario usando referencias espaciales, colores, formas y nombres comunes (ej. "el candado al lado del link", "el icono de la bocina abajo a la derecha", "el cable con cabeza rectangular azul").
5. TONO DIRECTO EN SEGUNDA PERSONA: Dirígete siempre directamente al usuario en segunda persona ("Por favor desconecta...", "Revisa la cajita...", "Verifica..."). Jamás digas "Pide al usuario".
6. REGLA ESTRICTA DE LOS 3 INTENTOS (ESCALACIÓN): Para cualquier problema, el límite máximo es de 3 intentos simples. Si al tercer intento la situación no se resuelve, no inventes más pasos ni pidas cosas complejas: detén el diagnóstico y escala de inmediato a un técnico humano.
7. IDIOMA: Responde ÚNICAMENTE en ESPAÑOL.

## METODOLOGÍA UNIVERSAL PARA CUALQUIER INCIDENCIA
- Intento 1 (Nivel Superficial / Físico): Inspección visual del entorno. Revisar cables, enchufes, interruptores de encendido/mute, o si la ventana/pestaña correcta está activa.
- Intento 2 (Nivel Aplicación / Interfaz): Acciones no destructivas dentro de la misma aplicación (cerrar y reabrir únicamente esa app o pestaña, refrescar con Ctrl + F5, cambiar de navegador, revisar selectores o menús desplegables internos).
- Intento 3 (Nivel Sesión / Alternativa guiada): Probar abrir en modo incógnito (Ctrl + Shift + N), desloguearse y volver a iniciar sesión solo en esa plataforma, o cambiar a un puerto alternativo (ej. otro puerto USB).

## GUÍAS DE REFERENCIA RÁPIDA (CASOS FRECUENTES)
- Headsets / Auriculares: Intento 1: desconectar cable USB y probar en otro puerto USB. Intento 2: revisar cajita en el cable (volumen y botón mute sin luz roja). Intento 3: selector de audio en bocinita abajo a la derecha.
- Monitores: Intento 1: luz testigo en borde inferior/trasero y botón de encendido. Intento 2: ajustar cables detrás del monitor y PC (HDMI/DisplayPort). Intento 3: atajo Windows + P y 'Extender', o Windows + Ctrl + Shift + B.
- Internet / Red: Intento 1: icono abajo a la derecha al lado del reloj. Intento 2: conector transparente con luz parpadeante / clic. Intento 3: Ctrl + F5 en la herramienta con error.`;

// Helper: Ollama Response Generator (with NVIDIA NIM primary routing)
export async function generateOllamaResponse(
  prompt: string,
  model = 'llama3.2:latest',
  host: string | null = null,
  systemPrompt?: string
): Promise<string> {
  // If NVIDIA API is configured, use NVIDIA NIM AI by default
  if (process.env.NVIDIA_API_KEY) {
    try {
      console.log(`[Support AILlama] Routing request to NVIDIA NIM AI (${process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'})...`);
      return await generateNvidiaResponse(prompt, model, systemPrompt);
    } catch (nvidiaErr) {
      console.warn(`[Support AILlama] NVIDIA NIM call failed, attempting fallback to Ollama:`, nvidiaErr);
    }
  }

  let ollamaHost = host || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  const selectedModel = model || 'llama3.2:latest';

  ollamaHost = ollamaHost.trim();
  if (ollamaHost.endsWith('/api/generate')) ollamaHost = ollamaHost.replace('/api/generate', '');
  if (ollamaHost.endsWith('/api/chat')) ollamaHost = ollamaHost.replace('/api/chat', '');
  if (ollamaHost.endsWith('/')) {
    ollamaHost = ollamaHost.slice(0, -1);
  }

  const url = `${ollamaHost}/api/generate`;
  console.log(`[Support AILlama] Calling Ollama: ${url} (Model: ${selectedModel})`);

  const reqBody: any = {
    model: selectedModel,
    prompt: prompt,
    stream: false,
  };
  if (systemPrompt && systemPrompt.trim()) {
    reqBody.system = systemPrompt.trim();
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Support AILlama] Ollama Error (${response.status}):`, errorText);
    throw new Error(`Ollama HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { response: string };
  console.log(`[Support AILlama] Ollama Response received (${data.response?.length || 0} chars)`);
  return data.response;
}

// Helper: Gemini Response Generator (using gemini-1.5-flash)
export async function generateGeminiResponse(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error("Google Gemini API key is missing. Add GEMINI_API_KEY to your .env file.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Helper: SMTP Transporter
function getSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  });
}

// Helper: Load WhatsApp Exclusions from Prisma DB
export async function getWhatsAppExclusionsFromDb() {
  const setting = await prisma.whatsappSetting.findUnique({
    where: { id: 'default' },
  });
  const exclusions = await prisma.whatsappExclusion.findMany();

  const numbers = exclusions.filter((e) => e.type === 'NUMBER').map((e) => e.value);
  const groups = exclusions.filter((e) => e.type === 'GROUP').map((e) => e.value);
  const ignoreAllGroups = setting ? setting.ignoreAllGroups : true;

  return { numbers, groups, ignoreAllGroups };
}

// 1. WhatsApp Support Bot Step Handler
async function handleSupportStep(msg: any, session: WhatsAppSession) {
  let prompt = "";
  if (session.attempt === 1) {
    prompt = `Problema reportado por el usuario: "${session.userIssue}".
Este es el INTENTO 1 (Nivel Superficial / Físico).
Instrucción: Entrega exactamente UNA sola comprobación física o visual sencilla según la metodología y guía de resolución para este problema.
- Cero fricción: Jamás indiques reiniciar la PC ni comandos técnicos.
- Dirígete directamente al usuario en segunda persona ("Por favor desconecta...", "Revisa...").
- Entrega ÚNICAMENTE una sola instrucción.`;
  } else if (session.attempt === 2) {
    prompt = `Problema reportado por el usuario: "${session.userIssue}".
El intento 1 no funcionó. Este es el INTENTO 2 (Nivel Aplicación / Interfaz).
Instrucción: Entrega el paso 2 de la guía de resolución (o una acción no destructiva dentro de la misma aplicación, selectores o cables y controles).
- Solo una instrucción directa sin reiniciar el equipo ni comandos.`;
  } else {
    prompt = `Problema reportado por el usuario: "${session.userIssue}".
Los intentos 1 y 2 no funcionaron. Este es el INTENTO 3 (Último intento L1: Nivel Sesión / Alternativa guiada).
Instrucción: Entrega el paso 3 de la guía de resolución (modo incógnito, selector de dispositivo, puerto alternativo o recarga limpia Ctrl+F5).
- Solo una instrucción directa sin reiniciar el equipo ni comandos.`;
  }

  try {
    const response = await generateOllamaResponse(prompt, undefined, null, SYSTEM_PROMPT_WHATSAPP);
    session.history.push(`Bot: ${response}`);
    session.step = 'EVALUATING_SOLUTIONS';
    await msg.reply(response + "\n\n¿Esto solucionó tu problema? (Sí/No)");
  } catch (err) {
    console.error("[Support AILlama] AI Step Error:", err);
    await msg.reply("Lo siento, estoy teniendo problemas para conectar con mi cerebro de IA. Por favor intenta más tarde o describe tu problema de nuevo.");
    state.sessions.delete(msg.from);
  }
}

// 2. WhatsApp Support Bot Ticket Creation Handler
async function handleCreateTicketFromWhatsApp(msg: any, session: WhatsAppSession) {
  const historyText = session.history.join("\n");
  const summaryPrompt = `Summarize this failed IT support chat into a concise ticket for the technical team. Output only the summary.\n\nLog:\n${historyText}`;

  try {
    let summary = "";
    try {
      summary = await generateOllamaResponse(summaryPrompt);
    } catch {
      summary = `Ticket generado automáticamente tras 3 intentos. Problema: ${session.userIssue}`;
    }

    // Save ticket directly to Intranet Prisma MySQL Database
    const savedTicket = await prisma.supportTicket.create({
      data: {
        from: msg.from,
        issue: session.userIssue,
        summary: summary,
        history: JSON.stringify(session.history),
        source: 'WhatsApp',
        status: 'OPEN',
      },
    });

    console.log("--- NEW TICKET CREATED IN INTRANET DB (WhatsApp) ---", savedTicket.id);
    await msg.reply(`✅ *Ticket Generado #${savedTicket.id.slice(-6)}*\n\n*Resumen:* ${summary}\n\nUn técnico se pondrá en contacto contigo pronto.`);
  } catch (err) {
    console.error("[Support AILlama] Ticket DB Error:", err);
    await msg.reply("No pude registrar el resumen completo, pero he notificado al equipo técnico sobre tu caso.");
  }
}

// 3. Cron Job 1: Monthly WhatsApp Report with Ollama Llama 3.2
export async function generateAndSendMonthlyReport(): Promise<{ success: boolean; reportText: string }> {
  console.log("[Support AILlama] Generating Monthly Report...");
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const yearOfLastMonth = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  // Fetch tickets from Intranet Prisma DB
  const allTickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
  });

  let monthlyTickets = allTickets.filter((t) => {
    const tDate = new Date(t.createdAt);
    return tDate.getMonth() === lastMonth && tDate.getFullYear() === yearOfLastMonth;
  });

  // Fallback if testing and no tickets in previous month
  if (monthlyTickets.length === 0 && allTickets.length > 0) {
    console.log("[Monthly Report] Fallback to available tickets for reporting.");
    monthlyTickets = allTickets.slice(0, 30);
  }

  const whatsappCount = monthlyTickets.filter((t) => t.source === 'WhatsApp').length;
  const webCount = monthlyTickets.filter((t) => t.source === 'Chat Web').length;

  let reportText = `📊 *Reporte Mensual de Soporte IT*\n\n`;
  reportText += `*Total de Tickets:* ${monthlyTickets.length}\n`;
  reportText += `  🌐 *Vía Chat Web:* ${webCount}\n`;
  reportText += `  📱 *Vía WhatsApp:* ${whatsappCount}\n`;

  if (monthlyTickets.length > 0) {
    const prompt = `Eres AILlama, un asistente de TI experto. Resuma los siguientes ${monthlyTickets.length} tickets de soporte técnico del mes en un informe ejecutivo para la gerencia en español (en 3 oraciones concisas). Identifique los problemas principales.\n\nTickets:\n` +
      monthlyTickets.map((t) => `- Usuario: "${t.from}" con problema: "${t.issue}" (Resumen: ${t.summary || 'N/A'})`).join('\n');

    try {
      const aiSummary = await generateOllamaResponse(prompt);
      reportText += `\n*Resumen de Problemas Principales (Ollama Llama 3.2):*\n${aiSummary}\n`;
    } catch (err) {
      console.error("[Monthly Report] AI Error:", err);
      reportText += `\n*Resumen:* No se pudo generar el resumen automático debido a un error en el motor de IA.\n`;
    }
  } else {
    reportText += `\n*Resumen:* No hubo tickets registrados en este período.\n`;
  }

  console.log(`\n--- PREVIEW OF MONTHLY REPORT ---\n${reportText}\n---------------------------------\n`);

  if (state.client && state.isWhatsAppReady) {
    const adminNumbers = ['18092160598@c.us', '18099750071@c.us'];
    for (const num of adminNumbers) {
      try {
        await state.client.sendMessage(num, reportText);
        console.log(`[Monthly Report] Sent to ${num}`);
      } catch (err) {
        console.error(`[Monthly Report] Error sending to ${num}:`, err);
      }
    }
  } else {
    console.log("[Monthly Report] WhatsApp Client not ready or disabled. Preview generated.");
  }

  return { success: true, reportText };
}

// 4. Cron Job 2: Weekly Email Report with Google Gemini 1.5 Flash
export async function generateAndSendWeeklyEmailReport(): Promise<{ success: boolean; subject: string; summary: string }> {
  console.log("[Support AILlama] Generating Weekly Email Report with Gemini 1.5 Flash...");
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let tickets = await prisma.supportTicket.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  if (tickets.length === 0) {
    // Fallback if testing
    tickets = await prisma.supportTicket.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  const webCount = tickets.filter((t) => t.source === 'Chat Web').length;
  const waCount = tickets.filter((t) => t.source === 'WhatsApp').length;

  let geminiSummary = "Sin tickets registrados para resumir.";
  if (tickets.length > 0) {
    const prompt = `Actúa como AILlama, asistente senior de soporte IT de Telecom Networks. Genera un reporte ejecutivo semanal conciso en español para la dirección de TI basado en los siguientes ${tickets.length} tickets de soporte de los últimos días:\n\n` +
      tickets.map((t) => `- [${t.source}] ${t.from} (${t.category || 'General'}): ${t.issue}. Resumen: ${t.summary || 'N/A'}`).join('\n') +
      `\n\nPor favor incluye:\n1. Panorama general (1 párrafo breve)\n2. Categorías o fallas más recurrentes\n3. Recomendaciones preventivas clave para el equipo técnico.`;

    try {
      geminiSummary = await generateGeminiResponse(prompt);
    } catch (err: any) {
      console.error("[Weekly Report] Gemini API Error:", err);
      geminiSummary = `No se pudo conectar a Google Gemini: ${err.message}.`;
    }
  }

  const subject = `📊 Reporte Semanal de Soporte IT - ${new Date().toLocaleDateString('es-DO')}`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 1.4rem;">Telecom Networks • Soporte IT</h2>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 0.9rem;">Informe Semanal Automatizado con Gemini 1.5 Flash</p>
      </div>

      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 1.6rem; font-weight: bold; color: #1e293b;">${tickets.length}</div>
          <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;">Total Tickets</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 1.6rem; font-weight: bold; color: #2563eb;">${webCount}</div>
          <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;">Chat Web</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 1.6rem; font-weight: bold; color: #16a34a;">${waCount}</div>
          <div style="font-size: 0.8rem; color: #64748b; text-transform: uppercase;">WhatsApp</div>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e293b; margin-top: 0; font-size: 1.1rem;">Análisis Ejecutivo de Incidencias:</h3>
        <div style="color: #334155; line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap;">${geminiSummary}</div>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="color: #94a3b8; font-size: 0.75rem; text-align: center; margin: 0;">
        Generado automáticamente por el Módulo Support AILlama • Intranet Telecom Networks<br>
        Fecha: ${new Date().toLocaleString('es-DO')}
      </p>
    </div>
  `;

  const targetEmail = process.env.SMTP_USER || process.env.SMTP_FROM || 'notice@tnoutsourcing.com';
  try {
    const transporter = getSmtpTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"AILlama Support" <notice@tnoutsourcing.com>',
      to: targetEmail,
      subject: subject,
      html: htmlContent,
    });
    console.log(`[Weekly Report] Email sent successfully to ${targetEmail}`);
  } catch (mailErr) {
    console.error("[Weekly Report] Mail dispatch error:", mailErr);
  }

  return { success: true, subject, summary: geminiSummary };
}

// 5. Service Initializer (Singleton WhatsApp Bot + Crons)
export async function initSupportAiLlamaService() {
  if (state.initialized) {
    return state;
  }
  state.initialized = true;

  console.log("=== INICIALIZANDO SERVICIO NATIVO SUPPORT AILLAMA ===");

  // Configuración de Cron Jobs
  if (!state.cronMonthlyStarted) {
    // Día 1 de cada mes a las 10:00 AM
    cron.schedule('0 10 1 * *', () => {
      console.log("[Cron] Ejecutando reporte mensual de soporte IT...");
      generateAndSendMonthlyReport().catch((e) => console.error(e));
    });
    state.cronMonthlyStarted = true;
    console.log("✓ Cron Reporte Mensual (WhatsApp) registrado: 0 10 1 * *");
  }

  if (!state.cronWeeklyStarted) {
    // Cada lunes a las 9:00 AM
    cron.schedule('0 9 * * 1', () => {
      console.log("[Cron] Ejecutando reporte semanal de soporte IT...");
      generateAndSendWeeklyEmailReport().catch((e) => console.error(e));
    });
    state.cronWeeklyStarted = true;
    console.log("✓ Cron Reporte Semanal (Email / Gemini 1.5 Flash) registrado: 0 9 * * 1");
  }

  // Inicialización de WhatsApp Client
  const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === 'true';

  if (!ENABLE_WHATSAPP) {
    console.log("[Support AILlama] WhatsApp deshabilitado localmente (ENABLE_WHATSAPP != 'true'). Para conectarlo, establece ENABLE_WHATSAPP=true en .env");
    return state;
  }

  try {
    const { Client, LocalAuth } = await import('whatsapp-web.js');

    const authPath = path.join(process.cwd(), '.wwebjs_auth');
    const client = new Client({
      authStrategy: new LocalAuth({ dataPath: authPath }),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    client.on('qr', async (qr: string) => {
      console.log('[Support AILlama] QR recibido. Generando base64...');
      try {
        state.qrCodeData = await qrcode.toDataURL(qr, {
          errorCorrectionLevel: 'L',
          margin: 2,
          scale: 8,
        });
        state.isWhatsAppReady = false;
      } catch (err) {
        console.error('[Support AILlama] Error generando QR:', err);
      }
    });

    client.on('ready', () => {
      console.log('[Support AILlama] WhatsApp Client está listo y autenticado!');
      state.isWhatsAppReady = true;
      state.qrCodeData = null;
    });

    client.on('message', async (msg: any) => {
      const from = msg.from;
      const isGroup = from.endsWith('@g.us');

      // Consultar exclusiones directamente en la base de datos de Intranet
      const exclusions = await getWhatsAppExclusionsFromDb();

      if (exclusions.numbers.includes(from)) {
        console.log(`[Support AILlama] Omitiendo número excluido: ${from}`);
        return;
      }
      if (isGroup && (exclusions.ignoreAllGroups || exclusions.groups.includes(from))) {
        console.log(`[Support AILlama] Omitiendo grupo excluido: ${from}`);
        return;
      }

      console.log(`[Support AILlama] Mensaje recibido de ${from}: ${msg.body}`);
      const message = msg.body.trim();

      const YES_REGEX = /^(yes|sí|si|fixed|funciona|listo|ok|thanks|gracias)/i;
      const NO_REGEX = /^(no|nope|not|nada|falló|fallo)/i;

      let session = state.sessions.get(from);

      if (!session) {
        if (message.length > 5) {
          session = {
            step: 'AWAITING_INITIAL_ISSUE',
            attempt: 1,
            userIssue: message,
            history: [`User: ${message}`],
          };
          state.sessions.set(from, session);
          await handleSupportStep(msg, session);
        } else {
          await msg.reply("¡Hola! Soy **AILlama**, tu asistente de IT Support. ¿En qué puedo ayudarte hoy? Por favor, describe tu problema.");
        }
        return;
      }

      if (session.step === 'EVALUATING_SOLUTIONS') {
        if (YES_REGEX.test(message)) {
          await msg.reply("¡Excelente! Me alegra que se haya solucionado. Si necesitas algo más, no dudes en escribirme.");
          state.sessions.delete(from);
        } else if (NO_REGEX.test(message)) {
          if (session.attempt < 3) {
            session.attempt++;
            await handleSupportStep(msg, session);
          } else {
            await msg.reply("Gracias por hacer estas pruebas. Dado que el inconveniente persiste tras estas comprobaciones, se requiere la atención directa de un técnico de soporte para no quitarte más tiempo. He registrado un reporte con los datos que revisamos; por favor mantén tu equipo encendido y tus ventanas abiertas para que un compañero tome el control de inmediato.");
            await handleCreateTicketFromWhatsApp(msg, session);
            state.sessions.delete(from);
          }
        } else {
          await msg.reply("¿Esta solución te ayudó? Por favor responde con 'Sí' o 'No'.");
        }
      }
    });

    state.client = client;
    client.initialize().catch((err: any) => {
      console.error("[Support AILlama] Error inicializando cliente WhatsApp:", err);
    });
  } catch (e) {
    console.error("[Support AILlama] Error al cargar módulo whatsapp-web.js:", e);
  }

  return state;
}

// Export state accessors
export function getWhatsAppStatus() {
  return {
    ready: state.isWhatsAppReady,
    qr: state.qrCodeData,
    disabled: process.env.ENABLE_WHATSAPP !== 'true',
  };
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  if (!state.client || !state.isWhatsAppReady) {
    throw new Error('El cliente de WhatsApp no está listo o está deshabilitado.');
  }

  let formattedPhone = phone.replace(/[^0-9]/g, '');
  if (!formattedPhone.endsWith('@c.us')) formattedPhone = `${formattedPhone}@c.us`;

  const response = await state.client.sendMessage(formattedPhone, message);
  return { success: true, messageId: response.id.id };
}
