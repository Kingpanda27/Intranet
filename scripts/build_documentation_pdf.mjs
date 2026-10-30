import fs from 'fs';
import path from 'path';
import { execFileSync, execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const LOGO_PATH = path.join(ROOT_DIR, 'public', 'logo_tn.png');
const OUTPUT_HTML = path.join(ROOT_DIR, 'scripts', 'temp_doc_template.html');
const OUTPUT_PDF = path.join(ROOT_DIR, 'documentacion_intranet.pdf');

// Read logo as base64
let logoBase64 = '';
if (fs.existsSync(LOGO_PATH)) {
  const logoBuffer = fs.readFileSync(LOGO_PATH);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
}

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Documentación Oficial: Intranet Corporativa v1.2.9</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 14mm 13mm 14mm 13mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      letter-spacing: normal !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      font-size: 8.8pt;
      line-height: 1.5;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      word-break: normal;
      overflow-wrap: break-word;
      hyphens: none;
    }

    /* Print Break Utilities */
    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Header & Footer styling for pages */
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.2pt;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .running-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.2pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 14px;
    }

    /* Cover Page */
    .cover-container {
      min-height: 258mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14mm 12mm 12mm 12mm;
      border: 2px solid #0284c7;
      border-radius: 14px;
      background: linear-gradient(145deg, #ffffff 0%, #f0f9ff 45%, #e0f2fe 100%);
      position: relative;
      overflow: hidden;
    }

    .cover-container::before {
      content: "";
      position: absolute;
      top: -100px;
      right: -100px;
      width: 280px;
      height: 280px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(255, 255, 255, 0) 70%);
      border-radius: 50%;
    }

    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cover-logo {
      max-height: 58px;
      object-fit: contain;
    }

    .cover-badge-top {
      background: #0284c7;
      color: #ffffff;
      font-size: 7.8pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 20px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
    }

    .cover-main {
      margin-top: 30px;
      margin-bottom: 25px;
    }

    .cover-kicker {
      font-size: 10pt;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      line-height: 1.15;
      color: #0f172a;
      margin-bottom: 14px;
    }

    .cover-title span {
      color: #0284c7;
    }

    .cover-subtitle {
      font-size: 11.5pt;
      font-weight: 500;
      color: #334155;
      line-height: 1.45;
      max-width: 580px;
      margin-bottom: 20px;
    }

    .cover-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .cover-tag {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      font-size: 7.5pt;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 5px;
    }

    .cover-card-info {
      background: #ffffff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 14px 18px;
      box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.1);
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
    }

    .cover-meta-label {
      font-size: 7.4pt;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }

    .cover-meta-value {
      font-size: 9pt;
      font-weight: 600;
      color: #0f172a;
    }

    .cover-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      font-size: 7.5pt;
      color: #64748b;
    }

    /* Headings */
    h1 {
      font-size: 15.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 14px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #0284c7;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    h2 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    h3 {
      font-size: 9.8pt;
      font-weight: 700;
      color: #0369a1;
      margin-top: 10px;
      margin-bottom: 4px;
    }

    p {
      margin-bottom: 7px;
      text-align: left;
      word-break: normal;
      overflow-wrap: break-word;
      hyphens: none;
    }

    ul, ol {
      margin-left: 18px;
      margin-bottom: 8px;
    }

    li {
      margin-bottom: 3px;
    }

    /* Table of Contents */
    .toc-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 10px;
      margin-bottom: 16px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 4px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 8.4pt;
    }

    .toc-item.level-1 {
      font-weight: 700;
      color: #0f172a;
      margin-top: 3px;
    }

    .toc-item.level-2 {
      padding-left: 12px;
      color: #334155;
      font-size: 7.8pt;
    }

    .toc-dots {
      flex: 1;
      margin: 0 6px;
      border-bottom: 1px dotted #cbd5e1;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
      font-size: 8pt;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 7.5pt;
      text-transform: uppercase;
    }

    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Alerts / Callouts */
    .alert {
      border-radius: 6px;
      padding: 8px 12px;
      margin: 8px 0 10px 0;
      font-size: 8.2pt;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .alert-icon {
      font-size: 11pt;
      line-height: 1;
    }

    .alert-content {
      flex: 1;
    }

    .alert-info {
      background-color: #f0f9ff;
      border-left: 3px solid #0284c7;
      color: #0369a1;
    }

    .alert-success {
      background-color: #f0fdf4;
      border-left: 3px solid #16a34a;
      color: #15803d;
    }

    .alert-warning {
      background-color: #fffbeb;
      border-left: 3px solid #f59e0b;
      color: #b45309;
    }

    .alert-danger {
      background-color: #fef2f2;
      border-left: 3px solid #ef4444;
      color: #b91c1c;
    }

    /* Code blocks */
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 7.5pt;
      line-height: 1.4;
      margin: 6px 0 10px 0;
      overflow-x: auto;
      border: 1px solid #1e293b;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 7.6pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 7pt;
      font-weight: 700;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .badge-primary { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-warning { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-danger  { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    /* Visual Diagram Card */
    .diagram-card {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 8px;
      padding: 10px 14px;
      margin: 8px 0 12px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.2pt;
      line-height: 1.3;
      border: 1px solid #334155;
    }

    .module-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .module-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      color: #0f172a;
      font-size: 8.5pt;
      margin-bottom: 3px;
    }

    .color-chip {
      width: 9px;
      height: 9px;
      border-radius: 2px;
      display: inline-block;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-container avoid-break">
    <div class="cover-top">
      <img src="${logoBase64}" alt="Telecom Networks" class="cover-logo">
      <div class="cover-badge-top">Manual de Operación & Arquitectura</div>
    </div>

    <div class="cover-main">
      <div class="cover-kicker">Documento Técnico & Administrativo Oficial</div>
      <h1 class="cover-title" style="border:none; margin:0; padding:0;">
        Plataforma: <span>Intranet Corporativa</span>
      </h1>
      <p class="cover-subtitle">
        Guía Completa de Referencia del Sistema: Arquitectura de Software, Modelo de Seguridad RBAC, Operación de Módulos, Inteligencia Artificial Híbrida y Despliegue de Alta Disponibilidad.
      </p>

      <div class="cover-tags">
        <span class="cover-tag">Next.js 15 App Router</span>
        <span class="cover-tag">React 19</span>
        <span class="cover-tag">MySQL 8.x & Prisma 5.22</span>
        <span class="cover-tag">Redis 7.x</span>
        <span class="cover-tag">NVIDIA NIM AI Cloud</span>
        <span class="cover-tag">Ollama Local</span>
        <span class="cover-tag">Row-Level Authorization</span>
        <span class="cover-tag">OWASP Security</span>
      </div>
    </div>

    <div class="cover-card-info">
      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <span class="cover-meta-label">Versión del Sistema:</span>
          <span class="cover-meta-value">v1.2.9 (Build de Producción)</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Fecha de Actualización:</span>
          <span class="cover-meta-value">27 de Octubre de 2026</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Organización:</span>
          <span class="cover-meta-value">Telecom Networks</span>
        </div>
        <div class="cover-meta-item">
          <span class="cover-meta-label">Desarrollo & Autoría:</span>
          <span class="cover-meta-value">Iván Reyes (AI & Software Development)</span>
        </div>
      </div>
    </div>

    <div class="cover-bottom">
      <span>Telecom Networks © 2026 — Todos los derechos reservados.</span>
      <span>Confidencial — Uso Interno Exclusivo</span>
    </div>
  </div>

  <!-- PAGE BREAK TO TOC -->
  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 2 de 14</span>
  </div>

  <h1>Índice de Contenido General</h1>
  <p>Esta documentación técnica y funcional unifica los estándares arquitectónicos, operacionales y de seguridad de la Intranet Corporativa de Telecom Networks.</p>

  <div class="toc-card avoid-break">
    <div class="toc-item level-1"><span>1. Introducción & Visión General del Sistema</span><div class="toc-dots"></div><span>Pág. 3</span></div>
    <div class="toc-item level-2"><span>1.1 Nombre y Propósito Corporativo | 1.2 Objetivos | 1.3 Ficha Técnica v1.2.9</span></div>
    
    <div class="toc-item level-1"><span>2. Arquitectura General & Stack Tecnológico</span><div class="toc-dots"></div><span>Pág. 4</span></div>
    <div class="toc-item level-2"><span>2.1 Diagrama de Arquitectura de Sistemas | 2.2 Componentes del Stack</span></div>

    <div class="toc-item level-1"><span>3. Modelo de Seguridad, RBAC y Data Scoping</span><div class="toc-dots"></div><span>Pág. 5</span></div>
    <div class="toc-item level-2"><span>3.1 Jerarquía de Roles | 3.2 Matriz de Permisos | 3.3 Aislamiento de Datos & IDOR</span></div>

    <div class="toc-item level-1"><span>4. Instalación, Configuración y Variables de Entorno</span><div class="toc-dots"></div><span>Pág. 6</span></div>
    <div class="toc-item level-2"><span>4.1 Requisitos de Hardware | 4.2 Catálogo .env | 4.3 Puesta en Marcha & Docker</span></div>

    <div class="toc-item level-1"><span>5. Estructura del Proyecto y Convenciones de Código</span><div class="toc-dots"></div><span>Pág. 7</span></div>
    <div class="toc-item level-2"><span>5.1 Árbol de Directorios | 5.2 Server Actions vs API Routes | 5.3 Sistema de Diseño HSL</span></div>

    <div class="toc-item level-1"><span>6. Manual Detallado de Módulos Funcionales</span><div class="toc-dots"></div><span>Pág. 8</span></div>
    <div class="toc-item level-2"><span>6.1 Feed Corporativo & Muro Social | 6.2 Directorio Corporativo & Centro Social</span></div>
    <div class="toc-item level-2"><span>6.3 Gestión Documental & RAG | 6.4 Vacaciones, Permisos e Incidencias Remotas</span></div>
    <div class="toc-item level-2"><span>6.5 Panel de Control & Aprobaciones | 6.6 Gestión de Grupos & Sync DeskTime</span></div>
    <div class="toc-item level-2"><span>6.7 Administración de Usuarios & M365 | 6.8 Calendario Corporativo & Feriados</span></div>
    <div class="toc-item level-2"><span>6.9 Centro de IA (TN Assistant & Soporte AILlama) | 6.10 Auditoría & Trazabilidad</span></div>
    <div class="toc-item level-2"><span>6.11 Configuración de TI & Consola de Proveedores</span></div>

    <div class="toc-item level-1"><span>7. Administración y Operaciones del Sistema</span><div class="toc-dots"></div><span>Pág. 12</span></div>
    <div class="toc-item level-2"><span>7.1 Gestión de Políticas y Sesiones | 7.2 Pasarela de Correos SMTP</span></div>

    <div class="toc-item level-1"><span>8. Mantenimiento y Solución de Problemas (Troubleshooting)</span><div class="toc-dots"></div><span>Pág. 12</span></div>
    <div class="toc-item level-2"><span>8.1 Matriz de Diagnóstico y Contingencias Comunes</span></div>

    <div class="toc-item level-1"><span>9. Políticas de Respaldo, Restauración y Disaster Recovery</span><div class="toc-dots"></div><span>Pág. 13</span></div>
    <div class="toc-item level-2"><span>9.1 Respaldo de Base de Datos y Uploads | 9.2 Protocolo de Restauración</span></div>

    <div class="toc-item level-1"><span>10. Buenas Prácticas de Desarrollo y Despliegue</span><div class="toc-dots"></div><span>Pág. 13</span></div>
    <div class="toc-item level-2"><span>10.1 Cero Tiempo de Inactividad (PM2) | 10.2 Seguridad OWASP</span></div>

    <div class="toc-item level-1"><span>11. Historial de Versiones & Registro de Cambios</span><div class="toc-dots"></div><span>Pág. 14</span></div>
    <div class="toc-item level-2"><span>11.1 Resumen Cronológico de Versiones (v1.0.0 a v1.2.9)</span></div>
  </div>

  <div class="alert alert-info avoid-break">
    <div class="alert-icon">ℹ️</div>
    <div class="alert-content">
      <strong>Nota de Integridad Técnica:</strong> Este documento sustituye formalmente todas las revisiones preliminares de la intranet, consolidando las refactorizaciones de seguridad, arquitectura de base de datos MySQL, orquestación de IA con NVIDIA NIM y la suite de auditoría integral desplegadas en la versión <strong>1.2.9</strong>.
    </div>
  </div>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTER 1 -->
  <div class="page-break"></div>

  <!-- CHAPTER 1 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 3 de 14</span>
  </div>

  <h1>1. Introducción & Visión General del Sistema</h1>
  
  <h2>1.1 Nombre y Propósito Corporativo</h2>
  <p>
    La <strong>Intranet Corporativa de Telecom Networks</strong> es una plataforma de software empresarial concebida como el epicentro digital y operativo de la organización. Su propósito central es brindar a todos los colaboradores, supervisores y equipos ejecutivos un espacio seguro, intuitivo y colaborativo que simplifique la autogestión de solicitudes laborales, la consulta de normativas internas, el reporte de incidencias técnicas en teletrabajo y la comunicación organizacional de alto impacto.
  </p>

  <h2>1.2 Objetivos Estratégicos</h2>
  <ul>
    <li><strong>Unificación Operacional:</strong> Eliminar el uso fragmentado de hojas de cálculo aisladas, chats informales y correos dispersos para la solicitud de ausencias y aprobaciones de turnos.</li>
    <li><strong>Soporte Proactivo y Diagnóstico Guiado:</strong> Asistir a los colaboradores que realizan teletrabajo mediante el agente inteligente <em>Soporte AILlama</em> con metodología progresiva en 3 niveles y resolución de emergencias técnicas.</li>
    <li><strong>Gobernanza de Datos y Seguridad:</strong> Implementar un modelo de control de acceso basado en roles (RBAC) con aislamiento por escuadrón (Row-Level Authorization) y trazabilidad inmutable mediante logs de auditoría en tiempo real.</li>
    <li><strong>Transparencia Directiva:</strong> Facilitar a managers y recursos humanos reportes dinámicos, exportación de nómina a CSV compatible con Microsoft Excel y visualización de indicadores clave (KPIs) en tiempo real.</li>
  </ul>

  <h2>1.3 Ficha Técnica de la Versión Activa (v1.2.9)</h2>
  <table class="avoid-break">
    <thead>
      <tr>
        <th style="width: 25%;">Parámetro</th>
        <th style="width: 35%;">Especificación Oficial</th>
        <th style="width: 40%;">Propósito / Observaciones</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Versión de Producción</strong></td>
        <td><code>v1.2.9 (SemVer)</code></td>
        <td>Revisión activa con búsqueda omnisciente y soporte para Dirección y Desarrollador.</td>
      </tr>
      <tr>
        <td><strong>Organización</strong></td>
        <td>Telecom Networks</td>
        <td>Entidad corporativa de la plataforma.</td>
      </tr>
      <tr>
        <td><strong>Desarrollo & Autoría</strong></td>
        <td>Iván Reyes (AI & Software Development)</td>
        <td>Desarrollador de software de la intranet con credencial maestra.</td>
      </tr>
      <tr>
        <td><strong>Núcleo Web</strong></td>
        <td>Next.js 15.1.0 + React 19 + TypeScript</td>
        <td>Renderizado híbrido SSR, Server Actions y App Router.</td>
      </tr>
      <tr>
        <td><strong>Base de Datos Relacional</strong></td>
        <td>MySQL 8.0 / MariaDB 10.11+ (Prisma ORM 5.22)</td>
        <td>Soporte UTF-8mb4, transacciones atómicas e integridad referencial.</td>
      </tr>
      <tr>
        <td><strong>Caché & Sesiones</strong></td>
        <td>Redis 7.x en memoria</td>
        <td>Aceleración de tokens JWT y snapshots de telemetría.</td>
      </tr>
      <tr>
        <td><strong>Motores de IA Primario</strong></td>
        <td>NVIDIA NIM API (<code>llama-3.2-11b-vision-instruct</code>)</td>
        <td>Inferencia ultrarrápida con streaming SSE para TN Assistant.</td>
      </tr>
      <tr>
        <td><strong>Motor de IA Fallback</strong></td>
        <td>Ollama On-Premise (<code>llama3.2</code> en puerto 11434)</td>
        <td>Conmutación por error ante desconexión o latencia en nube.</td>
      </tr>
      <tr>
        <td><strong>Motor Analítico WhatsApp</strong></td>
        <td>Google Gemini 1.5 Flash</td>
        <td>Generación periódica de resúmenes ejecutivos semanales y mensuales.</td>
      </tr>
      <tr>
        <td><strong>Servidor de Aplicación</strong></td>
        <td>Node.js v20.x LTS con PM2 Process Manager</td>
        <td>Despliegue sin caída de servicio (Zero-Downtime Reload).</td>
      </tr>
    </tbody>
  </table>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTER 2 -->
  <div class="page-break"></div>

  <!-- CHAPTER 2 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 4 de 14</span>
  </div>

  <h1>2. Arquitectura General & Stack Tecnológico</h1>
  <p>
    La plataforma adopta una topología de capas desacopladas que garantiza alta concurrencia, respuesta inmediata en milisegundos y resiliencia ante contingencias externas de red o caídas de servicios de terceros.
  </p>

  <h2>2.1 Diagrama de Arquitectura de Sistemas y Flujos de Datos</h2>
  <div class="diagram-card avoid-break">
+---------------------------------------------------------------------------------------+
|                              CAPA DE CLIENTE / NAVEGADOR                              |
|   - Plus Jakarta Sans Typography        - Glassmorphism & Tokens HSL                  |
|   - Formularios Reactivos React 19       - Streaming SSE (Chat en Tiempo Real)        |
+-------------------------------------------+-------------------------------------------+
                                            |
                         Peticiones HTTPS   | Server Actions & REST API
                                            v
+---------------------------------------------------------------------------------------+
|                    CAPA DE APLICACIÓN Y PERÍMETRO (NEXT.JS 15)                        |
|  - middleware.ts: Verificación perimetral, expiración de sesión y control de acceso   |
|  - Server Actions: timeOffActions, userActions, groupActions, auditActions            |
|  - Route Handlers: /api/chat (SSE Stream), /api/requests/* (IDOR Shield)              |
+-------------------+-----------------------+--------------------+----------------------+
                    |                       |                    |
      Consultas SQL |         Caché Sesión  |      Streaming SSE | Fallback Auto
      vía Prisma    |         y Snapshots   |                    |
                    v                       v                    v                      v
+------------------------+   +-------------------+   +--------------------+  +--------------------+
|   BASE DE DATOS MYSQL  |   |    REDIS 7.X      |   |   NVIDIA NIM API   |  |   OLLAMA LOCAL     |
| - Usuarios & Roles     |   | - Sesiones Rápidas|   | - Llama 3.2 11B    |  | - Instancia local  |
| - 12 Tipos Permisos    |   | - Throttling      |   | - Streaming SSE    |  |   en puerto 11434  |
| - Historial Auditoría  |   +-------------------+   +--------------------+  +--------------------+
| - Índices Collation    |
+-----------+------------+
            ^
            | Sincronización Solo Lectura (SELECT)
+-----------+------------+
|  WFM PLATFORM MYSQL    |
| - 49 Grupos DeskTime   |
| - 274 Empleados        |
+------------------------+
  </div>

  <h2>2.2 Componentes Esenciales del Stack</h2>
  <ul>
    <li><strong>Capa de Presentación:</strong> Renderizado reactivo en Next.js 15.1 con TypeScript y soporte nativo para temas claro y oscuro mediante tokens variables HSL. El sistema de diseño no requiere utilidades externas pesadas, garantizando una carga veloz y libre de dependencias no controladas.</li>
    <li><strong>Capa de Lógica Transaccional (Server Actions):</strong> Todas las mutaciones de datos se ejecutan en el servidor mediante funciones tipadas seguras con control de acceso por sesión, eliminación de riesgo CSRF y manejo transaccional de excepciones.</li>
    <li><strong>Persistencia de Datos (MySQL 8.x):</strong> La base de datos opera bajo el motor InnoDB con transacciones ACID, soporte nativo de collation <code>utf8mb4_unicode_ci</code> e índices en campos de búsqueda rápida (nombres, correos, estados y tipos de solicitud).</li>
    <li><strong>Sincronización Externa WFM (DeskTime):</strong> Integración unidireccional de solo lectura con la base de datos <code>wfm_platform</code>, manteniendo homologados en tiempo real los 49 grupos corporativos y los 274 colaboradores de la organización.</li>
    <li><strong>Arquitectura de Inteligencia Artificial Dual:</strong> Inferencia primaria en la nube de NVIDIA NIM con respuesta inmediata en streaming y conmutación transparente hacia Ollama local si la API externa experimenta degradación de red.</li>
  </ul>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTER 3 -->
  <div class="page-break"></div>

  <!-- CHAPTER 3 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 5 de 14</span>
  </div>

  <h1>3. Modelo de Seguridad, RBAC y Data Scoping</h1>
  <p>
    La Intranet implementa un modelo de seguridad por capas que combina autenticación criptográfica basada en cookies HTTP-only, control de acceso basado en roles jerárquicos (RBAC) y autorización a nivel de fila (Row-Level Authorization / Data Scoping) para prevenir accesos indebidos e IDOR.
  </p>

  <h2>3.1 Jerarquía Numérica de Roles</h2>
  <p>Cada rol dispone de un nivel jerárquico entero que regula la subordinación, privilegios y protección de cuentas:</p>
  <pre><code>NO_ROLE (0) &lt; USER / AGENT (10) &lt; SUPERVISOR / TEAM_LEAD (20) &lt; MANAGER (30) 
            &lt; HR (35) &lt; TECHNOLOGY (40) &lt; IT_MANAGER / TECHNOLOGY_ADMIN (50) &lt; DIRECCIÓN / SUPERADMIN</code></pre>

  <h2>3.2 Matriz Exhaustiva de Permisos</h2>
  <table class="avoid-break">
    <thead>
      <tr>
        <th>Código del Permiso</th>
        <th>USER</th>
        <th>SUPERVISOR</th>
        <th>MANAGER</th>
        <th>HR</th>
        <th>TECHNOLOGY</th>
        <th>IT_MANAGER</th>
        <th>DIRECCIÓN</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>documents:read</code></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
      </tr>
      <tr>
        <td><code>documents:create</code></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
      </tr>
      <tr>
        <td><code>posts:feature</code></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
      </tr>
      <tr>
        <td><code>vacations:approve</code></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-primary">Equipo</span></td>
        <td><span class="badge badge-primary">Área</span></td>
        <td><span class="badge badge-success">Global</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Global</span></td>
      </tr>
      <tr>
        <td><code>vacations:create_on_behalf</code></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-primary">Masivo</span></td>
        <td><span class="badge badge-primary">Masivo</span></td>
        <td><span class="badge badge-success">Global</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Global</span></td>
      </tr>
      <tr>
        <td><code>users:create</code> (Multi-dominio)</td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
      </tr>
      <tr>
        <td><code>users:delete</code></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-warning">Protegido</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
      </tr>
      <tr>
        <td><code>audit:view</code></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
      </tr>
      <tr>
        <td><code>config:manage</code> (TI / IA / Bot)</td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-danger">No</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
        <td><span class="badge badge-success">Sí</span></td>
      </tr>
    </tbody>
  </table>

  <h2>3.3 Mecanismos de Aislamiento y Protección (Data Scoping & IDOR)</h2>
  <div class="alert alert-danger avoid-break">
    <div class="alert-icon">🛡️</div>
    <div class="alert-content">
      <strong>Protección IDOR / BOLA (Insecure Direct Object References):</strong> Ninguna solicitud puede ser aprobada o rechazada mediante el simple conocimiento de su identificador ID. La función <code>authorizeRequestAction()</code> valida en la base de datos que el usuario solicitante sea supervisor legítimo del colaborador mediante las tablas relacionales de escuadrones antes de autorizar cualquier cambio de estado.
    </div>
  </div>

  <ul>
    <li><strong>Cláusula Dinámica de Alcance (<code>getTimeOffScopeFilter</code>):</strong> Al consultar solicitudes de tiempo libre en el panel de control, el sistema intercepta la llamada SQL. Para supervisores y líderes, aplica un filtro restrictivo: <code>userId IN managedUserIds</code>, aislando los datos y garantizando que ningún supervisor pueda ver solicitudes de escuadrones ajenos.</li>
    <li><strong>Acceso Exclusivo a Configuración TI (<code>canAccessITConfig</code>):</strong> Módulo restringido exclusivamente al personal de Tecnología y administradores autorizados. Si un colaborador de Recursos Humanos, supervisor o empleado común intenta acceder a <code>/configuracion-ti</code> o <code>/admin/config</code>, el servidor intercepta la petición y redirige a la página segura <code>/acceso-denegado</code>.</li>
    <li><strong>Salvaguarda Jerárquica de TI:</strong> Los usuarios con rol <code>TECHNOLOGY</code> pueden eliminar usuarios regulares, pero tienen vedada la eliminación de cualquier miembro del equipo de Tecnología, facultad reservada de forma estricta para el <code>IT_MANAGER</code> o superadministradores autorizados.</li>
  </ul>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTER 4 -->
  <div class="page-break"></div>

  <!-- CHAPTER 4 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 6 de 14</span>
  </div>

  <h1>4. Instalación, Configuración y Variables de Entorno</h1>

  <h2>4.1 Requisitos de Infraestructura</h2>
  <ul>
    <li><strong>Servidor Host Recomendado:</strong> Debian 12 (Bookworm) o Ubuntu 22.04 LTS (x86_64).</li>
    <li><strong>CPU & Memoria:</strong> 2 vCPU y 4 GB RAM (Mínimo). Recomendado: 4 vCPU y 8 GB RAM para producción.</li>
    <li><strong>Puertos de Red Requeridos:</strong> <code>80/tcp</code> (HTTP), <code>443/tcp</code> (HTTPS), <code>3000/tcp</code> (Node.js interno), <code>3306/tcp</code> (MySQL), <code>6379/tcp</code> (Redis).</li>
  </ul>

  <h2>4.2 Catálogo Detallado de Variables de Entorno</h2>
  <table class="avoid-break">
    <thead>
      <tr>
        <th style="width: 28%;">Variable</th>
        <th style="width: 42%;">Descripción y Finalidad</th>
        <th style="width: 30%;">Valor Ejemplo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>DATABASE_URL</code></td>
        <td>Cadena de conexión JDBC/MySQL hacia Prisma.</td>
        <td><code>mysql://[usuario]:[clave]--host:3306/intranet</code></td>
      </tr>
      <tr>
        <td><code>NEXTAUTH_SECRET</code></td>
        <td>Clave criptográfica para firma de cookies JWT (mínimo 32 caracteres).</td>
        <td>Hash aleatorio base64 generado con OpenSSL</td>
      </tr>
      <tr>
        <td><code>NEXTAUTH_URL</code></td>
        <td>URL pública de acceso a la intranet corporativa.</td>
        <td><code>https://intranet.tnoutsourcing.com</code></td>
      </tr>
      <tr>
        <td><code>SUPERADMIN_EMAIL</code></td>
        <td>Correo del desarrollador/administrador maestro con pase de soporte.</td>
        <td><code>ireyes@tnoutsourcing.com</code></td>
      </tr>
      <tr>
        <td><code>NVIDIA_API_KEY</code></td>
        <td>Clave API de NVIDIA Cloud para inferencia del modelo Llama 3.2.</td>
        <td><code>nvapi-TU_API_KEY</code></td>
      </tr>
      <tr>
        <td><code>NVIDIA_MODEL</code></td>
        <td>Identificador del modelo en el catálogo de NVIDIA NIM.</td>
        <td><code>meta/llama-3.2-11b-vision-instruct</code></td>
      </tr>
      <tr>
        <td><code>OLLAMA_HOST</code></td>
        <td>Dirección HTTP del servidor Ollama para contingencias.</td>
        <td><code>http://127.0.0.1:11434</code></td>
      </tr>
      <tr>
        <td><code>REDIS_URL</code></td>
        <td>Almacén en memoria para snapshots de caché y optimización de llamadas.</td>
        <td><code>redis://127.0.0.1:6379</code></td>
      </tr>
      <tr>
        <td><code>SMTP_HOST</code> / <code>PORT</code></td>
        <td>Servidor de correo saliente para alertas transaccionales (Office 365).</td>
        <td><code>smtp.office365.com</code> (Puerto 587)</td>
      </tr>
      <tr>
        <td><code>DESKTIME_DB_*</code></td>
        <td>Credenciales de solo lectura para sincronización de <code>wfm_platform</code>.</td>
        <td>Host, usuario y base de datos DeskTime</td>
      </tr>
    </tbody>
  </table>

  <h2>4.3 Procedimiento de Puesta en Marcha Rápida</h2>
  <pre><code># 1. Instalar dependencias con resolución de pares
npm install --legacy-peer-deps

# 2. Generar cliente Prisma y sincronizar esquema
npx prisma generate && npx prisma db push

# 3. Sembrar feriados oficiales y roles del sistema
node scripts/seed_holidays.js && node scripts/seed_rbac.js

# 4. Compilar para producción y levantar con PM2
npm run build && pm2 start npm --name "intranet" -- start -- -p 3000</code></pre>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTER 5 -->
  <div class="page-break"></div>

  <!-- CHAPTER 5 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 7 de 14</span>
  </div>

  <h1>5. Estructura del Proyecto y Convenciones de Código</h1>

  <h2>5.1 Árbol de Directorios del Código Fuente</h2>
  <pre><code>Intranet/
├── app/                           # Rutas y vistas de App Router (Next.js 15)
│   ├── actions/                   # Server Actions transaccionales (timeOff, user, group, audit)
│   ├── admin/                     # Vistas administrativas (audit-logs, config, groups, users)
│   ├── api/                       # Endpoints REST y streaming (chat, requests, whatsapp)
│   ├── calendar/                  # Calendario laboral y feriados nacionales
│   ├── configuracion-ti/          # Redirección protegida hacia /admin/config
│   ├── dashboard/                 # Panel de aprobaciones agrupado por proyecto
│   ├── documents/                 # Repositorio documental corporativo
│   ├── groups/                    # Directorio de escuadrones y campañas
│   ├── social/                    # Centro social, directorio y reconocimientos Kudos
│   ├── support/                   # Portal de Soporte Técnico AILlama L1
│   ├── vacations/                 # Formulario de ausencias e incidencias remotas (1560px)
│   └── globals.css                # Sistema de diseño con tokens CSS HSL y Glassmorphism
├── lib/                           # Módulos de soporte, seguridad y conectividad
│   ├── auditPermissions.ts        # Reglas de autorización para visualización de logs
│   ├── auth.ts                    # Configuración central de NextAuth.js y callbacks
│   ├── authorizationRoles.ts      # Funciones maestras de comprobación de permisos
│   ├── permissions.ts             # Matriz RBAC y jerarquía de permisos
│   ├── prisma.ts                  # Conexión singleton Prisma Client
│   ├── requestAuthorization.ts    # Control de acceso y protección IDOR por grupo
│   └── supportAiLlamaService.ts   # Diagnóstico L1 en 3 intentos y crons de WhatsApp
├── prisma/
│   └── schema.prisma              # Definición de entidades, relaciones y dialecto MySQL
├── public/                        # Logos institucionales, imágenes y uploads de usuarios
├── scripts/                       # Sincronización DeskTime, despliegue y validación
├── CHANGELOG.md                   # Bitácora histórica de versiones SemVer
├── DESIGN_SYSTEM.md               # Especificación técnica de componentes y tokens
└── DOCUMENTACION.md               # Manual técnico oficial maestro</code></pre>

  <h2>5.2 Filosofía de Desarrollo: Server Actions vs. API Routes</h2>
  <ul>
    <li><strong>Server Actions (app/actions):</strong> Empleadas de manera preferencial para todas las mutaciones de interfaz (solicitudes de tiempo libre, cambios de miembros de grupo, actualización de perfiles y creación de usuarios). Garantizan validación en el servidor sin serialización insegura de parámetros.</li>
    <li><strong>Route Handlers (app/api):</strong> Reservados para flujos con streaming continuo de datos (Server-Sent Events en <code>app/api/chat/route.ts</code>), integración de webhooks entrantes de WhatsApp o consumo externo desde servicios satélites.</li>
    <li><strong>Tokens HSL de Diseño:</strong> No se utilizan librerías CSS invasivas que distorsionen el rendimiento. Toda la interfaz consume variables HSL nativas (<code>--primary</code>, <code>--surface</code>, <code>--background</code>) con soporte para desenfoques de fondo (<code>backdrop-filter: blur(12px)</code>).</li>
  </ul>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTER 6 -->
  <div class="page-break"></div>

  <!-- CHAPTER 6 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 8 de 14</span>
  </div>

  <h1>6. Manual Detallado de Módulos Funcionales</h1>

  <h2>6.1 Inicio / Feed Corporativo & Muro Social</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">📌 Comunicación, Muro Central y Widgets de Inicio</div>
    <p>
      El espacio primordial de comunicación empresarial. Permite a los colaboradores autorizados publicar comunicados, noticias y anuncios con soporte de comentarios jerárquicos y reacciones. Recursos Humanos cuenta con la facultad de fijar comunicados prioritarios con distintivo de chincheta.
    </p>
    <ul>
      <li><strong>Normalización de Feriados UTC:</strong> Corrección horaria que muestra siempre la fecha exacta del feriado cívico (ej. 9 de noviembre para el Día de la Constitución).</li>
      <li><strong>Métricas Verídicas en Tiempo Real:</strong> Conteo fidedigno de eventos de la semana (Lunes a Domingo), colaboradores con actividad registrada hoy y nuevos documentos agregados en el mes en curso.</li>
      <li><strong>Widgets de Acompañamiento:</strong> Próximos feriados, cumpleaños y aniversarios laborales del personal activo.</li>
    </ul>
  </div>

  <h2>6.2 Directorio Corporativo & Centro Social</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">👥 Directorio y Reconocimientos Entre Colaboradores</div>
    <p>
      Directorio dinámico que lista al personal activo con buscador en vivo por nombre, cargo o departamento. Muestra indicadores de disponibilidad en tiempo real (*Disponible*, *Ocupado*, *De Vacaciones* o *Home Office*) y habilita el envío de <em>Kudos</em> (reconocimientos institucionales con insignias y felicitaciones asistidas por inteligencia artificial).
    </p>
  </div>

  <h2>6.3 Gestión Documental & Base de Conocimiento</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">📁 Repositorio de Documentos & Vectorización RAG</div>
    <p>
      Repositorio estructurado de manuales, normativas y políticas internas segmentadas por departamentos. Cada documento incorporado es procesado semánticamente (Embeddings vectoriales en <code>DocumentEmbedding</code>), permitiendo que el asistente corporativo <strong>TN Assistant</strong> cite reglamentos oficiales al responder consultas de los empleados.
    </p>
  </div>

  <h2>6.4 Vacaciones, Permisos e Incidencias Técnicas de Teletrabajo</h2>
  <p>
    El módulo de ausencias (<code>/vacations</code>) está diseñado en un contenedor ergonómico de 1560px con balance simétrico y catálogo de 12 tipos de solicitudes organizadas en 3 categorías cromáticas:
  </p>

  <table class="avoid-break">
    <thead>
      <tr>
        <th>Categoría</th>
        <th>Tipo de Solicitud</th>
        <th>Identidad Cromática</th>
        <th>Reglas de Negocio / Deducción de Días</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="4"><strong>Tiempo Libre</strong></td>
        <td>Vacaciones Anuales</td>
        <td><span class="color-chip" style="background:#3b82f6;"></span> Azul Eléctrico (<code>#3b82f6</code>)</td>
        <td>Requiere 25 días de anticipación. Descuenta días hábiles del balance personal.</td>
      </tr>
      <tr>
        <td>Permiso Especial</td>
        <td><span class="color-chip" style="background:#6366f1;"></span> Índigo (<code>#6366f1</code>)</td>
        <td>Opciones: Día completo, Medio turno o Por horas con horario de entrada/salida.</td>
      </tr>
      <tr>
        <td>Reposición de Horas</td>
        <td><span class="color-chip" style="background:#14b8a6;"></span> Turquesa (<code>#14b8a6</code>)</td>
        <td>Captura fecha y franja horaria exacta de reposición compensatoria.</td>
      </tr>
      <tr>
        <td>Salir Temprano</td>
        <td><span class="color-chip" style="background:#f59e0b;"></span> Ámbar (<code>#f59e0b</code>)</td>
        <td>Solicitud ágil para salida anticipada con motivo justificado.</td>
      </tr>
      <tr>
        <td rowspan="4"><strong>Salud & Familia</strong></td>
        <td>Enfermedad (Corta)</td>
        <td><span class="color-chip" style="background:#10b981;"></span> Esmeralda (<code>#10b981</code>)</td>
        <td>Ausencia médica breve con opción de reposo domiciliario.</td>
      </tr>
      <tr>
        <td>Licencia Médica</td>
        <td><span class="color-chip" style="background:#f43f5e;"></span> Carmesí (<code>#f43f5e</code>)</td>
        <td>Exige la subida digital de justificante o certificado médico oficial.</td>
      </tr>
      <tr>
        <td>Maternidad / Paternidad</td>
        <td><span class="color-chip" style="background:#ec4899;"></span> Fucsia (<code>#ec4899</code>)</td>
        <td>Periodo prenatal/postnatal según legislación laboral vigente.</td>
      </tr>
      <tr>
        <td>Fallecimiento / Duelo</td>
        <td><span class="color-chip" style="background:#8b5cf6;"></span> Violeta (<code>#8b5cf6</code>)</td>
        <td>Licencia por fallecimiento de familiar directo con acompañamiento institucional.</td>
      </tr>
      <tr>
        <td rowspan="4"><strong>Incidencias Remoto / IT</strong></td>
        <td>Falla de Internet (ISP)</td>
        <td><span class="color-chip" style="background:#f97316;"></span> Naranja (<code>#f97316</code>)</td>
        <td rowspan="4">
          <strong>Tratamiento Exclusivo de Teletrabajo:</strong><br>
          - Exención automática de los 25 días de anticipación.<br>
          - Supresión de fecha de fin.<br>
          - Captura horaria con <code>datetime-local</code>.<br>
          - Cómputo de <strong>0 días deducidos</strong> (<code>workingDays = 0</code>).<br>
          - Toggle de reemplazo de hardware para fallas de PC.
        </td>
      </tr>
      <tr>
        <td>Corte de Energía</td>
        <td><span class="color-chip" style="background:#eab308;"></span> Amarillo (<code>#eab308</code>)</td>
      </tr>
      <tr>
        <td>Avería Hardware / PC</td>
        <td><span class="color-chip" style="background:#ef4444;"></span> Rojo Alerta (<code>#ef4444</code>)</td>
      </tr>
      <tr>
        <td>Fallo VPN / Accesos</td>
        <td><span class="color-chip" style="background:#a855f7;"></span> Púrpura (<code>#a855f7</code>)</td>
      </tr>
    </tbody>
  </table>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO MODULES CONTINUATION -->
  <div class="page-break"></div>

  <!-- MODULES CONTINUATION -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 9 de 14</span>
  </div>

  <h3>Modo de Registro Administrado Masivo para Supervisores (v1.2.2)</h3>
  <p>
    Diseñado para líderes de escuadrón y directores. Permite registrar ausencias o incidencias técnicas de forma grupal:
  </p>
  <ul>
    <li><strong>Selección por Escuadrón / Campaña:</strong> Agrega con un solo clic a todos los integrantes de un proyecto.</li>
    <li><strong>Selección Individual Múltiple:</strong> Buscador predictivo con tarjetas interactivas (chips) removibles.</li>
    <li><strong>Gestión de Excepciones:</strong> Menú desplegable con casillas de verificación para excluir de inmediato a colaboradores que no sufrieron la avería eléctrica o de Internet.</li>
    <li><strong>Confirmación Previa:</strong> Modal descriptivo que resume el horario y los colaboradores afectados antes de consolidar el envío.</li>
  </ul>

  <h2>6.5 Panel de Control & Aprobaciones (/dashboard)</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">📊 Visualización Agrupada por Campaña y Exportación CSV</div>
    <ul>
      <li><strong>Organización por Recuadro de Grupo:</strong> Las solicitudes se agrupan dentro de la tarjeta visual de su respectivo escuadrón (heredando color del grupo, icono, avatar y recuento de colaboradores). Los usuarios sin grupo se alojan ordenadamente en el recuadro <em>Sin Grupo Asignado</em>.</li>
      <li><strong>Píldoras de Filtrado Rápido:</strong> Barra horizontal interactiva con los colores de cada grupo para aislar un escuadrón con un clic.</li>
      <li><strong>Modal Interactivo de Exportación CSV (v1.2.7):</strong> Permite configurar filtros por grupo específico o todos los grupos, seleccionar mes y año (botones rápidos: <em>Mes Actual</em>, <em>Mes Anterior</em>, <em>Todo el Año</em>, <em>Histórico</em>) y filtrar por estado (Solo Aprobadas, Pendientes, Rechazadas). Genera archivos con codificación <strong>UTF-8 BOM</strong> para visualización perfecta de tildes en Microsoft Excel.</li>
    </ul>
  </div>

  <h2>6.6 Gestión de Grupos & Sincronización DeskTime (/admin/groups)</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">🛡️ Sincronización WFM y Asignación de Liderazgo</div>
    <ul>
      <li><strong>Sincronización Automática:</strong> Conecta en solo lectura con la base de datos externa de DeskTime (<code>wfm_platform</code>), manteniendo 49 escuadrones y 274 colaboradores sincronizados con sus cargos reales.</li>
      <li><strong>Modal de Gestión de Líderes (<code>ManageLeadersModal</code>):</strong> Permite asignar o remover Líderes Principales (<code>👑</code>) y Sub-Líderes (<code>🛡️</code>) en cada grupo mediante una interfaz con buscador predictivo y actualización optimista.</li>
      <li><strong>Modales Modernos:</strong> Inclusión de <code>AddMembersModal</code> (para altas masivas con pestañas de transferencia) y <code>ConfirmModal</code> con desenfoque de fondo (<code>backdrop-filter: blur(12px)</code>) para desvinculaciones seguras.</li>
    </ul>
  </div>

  <h2>6.7 Administración de Usuarios & Compatibilidad M365 (/admin/users)</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">👤 Gestión de Cuentas, Integridad Referencial y Microsoft 365</div>
    <ul>
      <li><strong>Creación de Usuarios Multi-Dominio:</strong> Permite que Tecnología y Managers creen usuarios con cualquier correo legítimo (Gmail, Outlook o contratistas), eliminando la restricción obligada de <code>@tnoutsourcing.com</code>.</li>
      <li><strong>Importación Masiva Nativa desde Microsoft 365 Admin Center:</strong> Soporte directo de archivos CSV de Microsoft Entra / Office 365, mapeando automáticamente identificadores, nombres, cargos y filtrando cuentas bloqueadas.</li>
      <li><strong>Eliminación Masiva Segura (<code>cleanupUserRelations</code>):</strong> Limpieza en cascada transaccional sobre más de 15 tablas relacionales para erradicar errores de clave foránea SQL al borrar colaboradores.</li>
    </ul>
  </div>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO AI AND AUDIT MODULES -->
  <div class="page-break"></div>

  <!-- AI & AUDIT MODULES -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 10 de 14</span>
  </div>

  <h2>6.8 Calendario Corporativo & Gestión de Feriados (/calendar)</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">📅 Eventos Corporativos y Feriados Oficiales</div>
    <p>
      Vista integrada de eventos institucionales y festividades patrias. Las solicitudes de vacaciones e incidencias aprobadas se sincronizan automáticamente en el calendario, permitiendo que el equipo conozca anticipadamente la disponibilidad del personal en cada fecha laboral.
    </p>
  </div>

  <h2>6.9 Centro de Inteligencia Artificial (TN Assistant & Soporte AILlama L1)</h2>
  
  <h3>TN Assistant (Asistente Corporativo Omnisciente)</h3>
  <ul>
    <li><strong>Búsqueda Multi-Tabla Exhaustiva:</strong> Detección automática de intenciones y consulta directa sobre MySQL para responder con precisión sobre:
      <ul>
        <li><em>Colaboradores y Balances:</em> Encuentra a cualquier colaborador por nombre o apellido y responde con su cargo, grupo y balance de días de vacaciones disponibles.</li>
        <li><em>Grupos y Liderazgo:</em> Informa integrantes, supervisores y sublíderes asignados a cada campaña.</li>
        <li><em>Publicaciones del Muro & Feriados:</em> Consulta anuncios recientes y festividades oficiales.</li>
        <li><em>Documentos Internos:</em> Búsqueda semántica (RAG) sobre políticas corporativas.</li>
      </ul>
    </li>
    <li><strong>Reconocimiento de Autorización Maestra:</strong> Reconoce tanto a los roles de alta dirección (CEO / Director) como a Iván Reyes (Desarrollador de AI & Software Development con credenciales maestras de soporte), entregando respuestas ejecutivas con cifras exactas sin evasivas de derivación a Recursos Humanos.</li>
    <li><strong>Streaming SSE con Tolerancia a Fallos:</strong> Motor primario en NVIDIA NIM Cloud API (<code>meta/llama-3.2-11b-vision-instruct</code>) y conmutación automática hacia Ollama local si la nube externa no responde.</li>
  </ul>

  <h3>Soporte AILlama L1 (Asistencia Técnica para Teletrabajo)</h3>
  <ul>
    <li><strong>Metodología de Diagnóstico en 3 Intentos:</strong> Nivel Físico (inspección de cables) &rarr; Nivel Aplicación (limpieza de navegador) &rarr; Nivel Sesión (modo incógnito o reseteo guiado).</li>
    <li><strong>Política de Cero Fricción:</strong> Prohibido sugerir comandos de consola (<code>CMD</code>, <code>PowerShell</code>, <code>ping</code>), reinicios forzados de PC o alteraciones en el <code>BIOS</code>.</li>
    <li><strong>Escalación Automática a L2:</strong> Al completarse el tercer intento sin resolución, genera automáticamente un registro en <code>SupportTicket</code> y despacha una notificación por correo a Helpdesk.</li>
    <li><strong>Soporte Bilingüe Interactivo:</strong> Selector de idioma en tiempo real (Español / English).</li>
  </ul>

  <h2>6.10 Centro Integral de Auditoría & Trazabilidad (/admin/audit-logs)</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">🔍 Trazabilidad Operacional e Inspección de Diferencias</div>
    <ul>
      <li><strong>4 Tarjetas KPI en Tiempo Real:</strong> Total de Eventos Registrados, Actividad de Hoy con pulso verde, Alertas / Rechazos e Inventario de Acciones del Sistema.</li>
      <li><strong>Modalidad Dual:</strong> Tabla Dinámica con filtros avanzados y Línea de Tiempo (Timeline Stream) con nodos luminosos interactivos.</li>
      <li><strong>Inspector de Diferencias (Diff Inspector):</strong> Modal con visor visual comparativo *Antes vs. Después* en modificaciones de registros y visor JSON formateado con botón de copia rápida.</li>
      <li><strong>Exportación Inmediata:</strong> Descarga de pistas de auditoría en formatos CSV y JSON.</li>
    </ul>
  </div>

  <h2>6.11 Configuración de TI & Consola de Proveedores (/admin/config)</h2>
  <div class="module-card avoid-break">
    <div class="module-card-header">⚙️ Credenciales de IA, Tickets de Soporte y WhatsApp Bot</div>
    <p>
      Módulo reservado para Tecnología y administradores autorizados bajo <code>canAccessITConfig</code>. Administra llaves API (NVIDIA, Ollama, Gemini), monitor centralizado de tickets L2 y parámetros del bot de WhatsApp para resúmenes semanales y mensuales desatendidos.
    </p>
  </div>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTERS 7, 8 -->
  <div class="page-break"></div>

  <!-- CHAPTER 7 & 8 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 11 de 14</span>
  </div>

  <h1>7. Administración y Operaciones del Sistema</h1>
  <p>
    La plataforma opera bajo el gestor de procesos <strong>PM2</strong> en servidores Linux, respaldado por un proxy inverso Apache en el puerto 80 que canaliza el tráfico seguro hacia la instancia Node.js en el puerto 3000.
  </p>
  <ul>
    <li><strong>Gestión de Sesiones JWT:</strong> Sesiones encriptadas con caducidad configurable y rotación automática de credenciales.</li>
    <li><strong>Servidor de Notificaciones SMTP:</strong> Conectividad TLS autenticada con Exchange Online / Microsoft 365 para despacho de correos transaccionales a supervisores y colaboradores.</li>
  </ul>

  <h1>8. Mantenimiento y Solución de Problemas (Troubleshooting)</h1>
  <table class="avoid-break">
    <thead>
      <tr>
        <th style="width: 30%;">Incidencia Detectada</th>
        <th style="width: 35%;">Causa Raíz Típica</th>
        <th style="width: 35%;">Acción Correctiva Recomendada</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>La intranet no responde en el navegador</strong></td>
        <td>Servicio Node.js detenido o Apache caído</td>
        <td>Ejecutar <code>pm2 status</code> y <code>systemctl status apache2</code>. Reiniciar con <code>pm2 restart intranet</code>.</td>
      </tr>
      <tr>
        <td><strong>Error P1001 en Base de Datos</strong></td>
        <td>Servicio MySQL detenido o credencial incorrecta</td>
        <td>Comprobar <code>systemctl status mysql</code> y verificar la variable <code>DATABASE_URL</code> en <code>.env.local</code>.</td>
      </tr>
      <tr>
        <td><strong>TN Assistant indica que la IA no responde</strong></td>
        <td>Falta de conexión con NVIDIA API y Ollama apagado</td>
        <td>Revisar <code>NVIDIA_API_KEY</code> en Configuración TI y validar Ollama local con <code>ollama list</code>.</td>
      </tr>
      <tr>
        <td><strong>Modificaciones en estilos no impactan</strong></td>
        <td>Caché estática de Next.js persistente</td>
        <td>Purgar el directorio: <code>rm -rf .next/cache</code>, recompilar con <code>npm run build</code> y recargar PM2.</td>
      </tr>
    </tbody>
  </table>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTERS 9, 10 -->
  <div class="page-break"></div>

  <!-- CHAPTER 9 & 10 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 12 de 14</span>
  </div>

  <h1>9. Políticas de Respaldo, Restauración y Disaster Recovery</h1>
  <div class="alert alert-warning avoid-break">
    <div class="alert-icon">⚠️</div>
    <div class="alert-content">
      <strong>Estrategia de Respaldos Diarios:</strong>
      <ol>
        <li><strong>Base de Datos MySQL:</strong> <code>mysqldump -u root -p --single-transaction --routines --triggers --events intranet &gt; /backups/intranet_$(date +%F).sql</code></li>
        <li><strong>Directorio Uploads:</strong> <code>tar -czf /backups/uploads_$(date +%F).tar.gz public/uploads/</code></li>
        <li><strong>Caché Redis:</strong> Copia periódica del archivo de snapshot <code>dump.rdb</code>.</li>
      </ol>
    </div>
  </div>

  <h1>10. Buenas Prácticas de Desarrollo y Despliegue</h1>
  <ul>
    <li><strong>Despliegues Zero-Downtime:</strong> Utilizar <code>pm2 reload intranet</code> en producción para renovar trabajadores sin pérdida de sesiones.</li>
    <li><strong>Seguridad OWASP Mandatoria:</strong> Toda Server Action debe comprobar la sesión y ejecutar <code>authorizeRequestAction</code> antes de alterar registros.</li>
    <li><strong>Coherencia de Diseño:</strong> Emplear exclusivamente tokens HSL y clases universales (<code>.card</code>, <code>.glass</code>, <code>.btn-primary</code>) definidas en <code>DESIGN_SYSTEM.md</code>.</li>
  </ul>

  <div class="running-footer">
    <span>Confidencial — Telecom Networks</span>
    <span>Uso Interno Exclusivo</span>
  </div>

  <!-- PAGE BREAK TO CHAPTER 11 -->
  <div class="page-break"></div>

  <!-- CHAPTER 11 -->
  <div class="running-header">
    <span>Intranet Corporativa — Manual de Operación y Arquitectura v1.2.9</span>
    <span>Página 13 de 14</span>
  </div>

  <h1>11. Historial de Versiones & Registro de Cambios</h1>
  <table class="avoid-break">
    <thead>
      <tr>
        <th style="width: 15%;">Versión</th>
        <th style="width: 20%;">Fecha</th>
        <th style="width: 65%;">Hitos Principales y Mejoras Implementadas</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>v1.0.0</code></td>
        <td>16-Oct-2026</td>
        <td>Lanzamiento de plataforma sobre Next.js 15, React 19 y Prisma ORM. Feed, calendario, feriados y perfiles.</td>
      </tr>
      <tr>
        <td><code>v1.1.0</code></td>
        <td>21-Oct-2026</td>
        <td>Integración con NVIDIA NIM Cloud API. Diagnóstico L1 en 3 niveles, tickets Helpdesk y bot de WhatsApp con Gemini.</td>
      </tr>
      <tr>
        <td><code>v1.2.0</code></td>
        <td>26-Oct-2026</td>
        <td>Catálogo de 12 solicitudes cromáticas, submódulo de incidencias de teletrabajo y centro de auditoría integral.</td>
      </tr>
      <tr>
        <td><code>v1.2.1</code> - <code>v1.2.3</code></td>
        <td>26-Oct-2026</td>
        <td>Ampliación a 1560px, registro masivo de ausencias y sync automática con BD DeskTime (49 grupos, 274 empleados).</td>
      </tr>
      <tr>
        <td><code>v1.2.4</code> - <code>v1.2.5</code></td>
        <td>26-Oct-2026</td>
        <td>Data Scoping por escuadrón, protección IDOR/BOLA, acceso exclusivo a TI y creación de usuarios multi-dominio.</td>
      </tr>
      <tr>
        <td><code>v1.2.6</code> - <code>v1.2.7</code></td>
        <td>26-Oct-2026</td>
        <td>Panel agrupado por campañas en tarjetas cromáticas y modal interactivo de exportación CSV con UTF-8 BOM.</td>
      </tr>
      <tr>
        <td><code>v1.2.8</code> - <code>v1.2.9</code></td>
        <td>26-Oct-2026</td>
        <td>Búsqueda multi-tabla omnisciente en IA, reconocimiento directo de Dirección y desarrollador, y fallback con streaming SSE en NVIDIA NIM.</td>
      </tr>
    </tbody>
  </table>

  <div class="running-footer">
    <span>Documentación Oficial: Intranet Corporativa v1.2.9</span>
    <span>Telecom Networks — Confidencial</span>
  </div>

</body>
</html>
`;

fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf-8');
console.log(`HTML template written to ${OUTPUT_HTML} (${htmlContent.length} bytes)`);

// Delete old PDF before compilation
if (fs.existsSync(OUTPUT_PDF)) {
  fs.unlinkSync(OUTPUT_PDF);
  console.log(`Deleted previous PDF at ${OUTPUT_PDF}`);
}

// Compile to PDF with Edge Headless using execFileSync directly
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(edgePath)) {
  console.error(`Edge binary not found at ${edgePath}`);
  process.exit(1);
}

console.log(`Generating official PDF with Microsoft Edge...`);
try {
  execFileSync(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${OUTPUT_PDF}`,
    OUTPUT_HTML
  ], { stdio: 'inherit' });

  console.log(`PDF successfully generated at: ${OUTPUT_PDF}`);
  if (fs.existsSync(OUTPUT_PDF)) {
    const stats = fs.statSync(OUTPUT_PDF);
    console.log(`PDF size: ${stats.size} bytes (${(stats.size / 1024).toFixed(1)} KB)`);
  }
} catch (err) {
  console.error(`Error generating PDF:`, err);
  process.exit(1);
}
