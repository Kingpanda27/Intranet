# Documentación Oficial de Plataforma: Intranet Corporativa

**Guía Maestra de Arquitectura, Operación, Seguridad y Módulos del Sistema**  
*Organización:* Telecom Networks  
*Autoría:* Iván Reyes — Departamento de AI & Software Development  
*Fecha de Emisión:* Octubre 2026 | **Versión del Sistema: 1.2.9**  
*Clasificación:* Confidencial — Documento de Uso Interno Exclusivo

---

## Índice General

1. [Introducción & Visión General](#1-introducción--visión-general)
2. [Arquitectura General & Stack Tecnológico](#2-arquitectura-general--stack-tecnológico)
3. [Modelo de Seguridad, RBAC y Data Scoping (Row-Level Authorization)](#3-modelo-de-seguridad-rbac-y-data-scoping-row-level-authorization)
4. [Instalación, Configuración y Variables de Entorno](#4-instalación-configuración-y-variables-de-entorno)
5. [Estructura del Proyecto y Convenciones](#5-estructura-del-proyecto-y-convenciones)
6. [Documentación Detallada de Módulos Funcionales](#6-documentación-detallada-de-módulos-funcionales)
   - 6.1 [Inicio / Feed Corporativo & Muro Social](#61-inicio--feed-corporativo--muro-social)
   - 6.2 [Directorio Corporativo & Centro Social](#62-directorio-corporativo--centro-social)
   - 6.3 [Gestión Documental & Base de Conocimiento](#63-gestión-documental--base-de-conocimiento)
   - 6.4 [Vacaciones, Permisos e Incidencias Técnicas de Teletrabajo](#64-vacaciones-permisos-e-incidencias-técnicas-de-teletrabajo)
   - 6.5 [Panel de Control & Aprobaciones](#65-panel-de-control--aprobaciones)
   - 6.6 [Gestión de Grupos & Sincronización DeskTime](#66-gestión-de-grupos--sincronización-desktime)
   - 6.7 [Administración de Usuarios & Compatibilidad M365](#67-administración-de-usuarios--compatibilidad-m365)
   - 6.8 [Calendario Corporativo & Gestión de Feriados](#68-calendario-corporativo--gestión-de-feriados)
   - 6.9 [Centro de Inteligencia Artificial (TN Assistant & Soporte AILlama L1)](#69-centro-de-inteligencia-artificial-tn-assistant--soporte-aillama-l1)
   - 6.10 [Centro Integral de Auditoría & Trazabilidad](#610-centro-integral-de-auditoría--trazabilidad)
   - 6.11 [Configuración de TI & Consola de Proveedores](#611-configuración-de-ti--consola-de-proveedores)
7. [Administración y Operaciones del Sistema](#7-administración-y-operaciones-del-sistema)
8. [Mantenimiento y Solución de Problemas (Troubleshooting)](#8-mantenimiento-y-solución-de-problemas-troubleshooting)
9. [Políticas de Respaldo, Restauración y Disaster Recovery](#9-políticas-de-respaldo-restauración-y-disaster-recovery)
10. [Buenas Prácticas de Desarrollo y Despliegue](#10-buenas-prácticas-de-desarrollo-y-despliegue)
11. [Historial de Versiones & Registro de Cambios](#11-historial-de-versiones--registro-de-cambios)

---

## 1. Introducción & Visión General

### 1.1 Nombre y Propósito de la Plataforma
La **Intranet Corporativa** de Telecom Networks es una solución web empresarial integral de última generación diseñada para centralizar, digitalizar y optimizar las operaciones diarias, la comunicación organizacional, el bienestar laboral y la asistencia técnica de todos los colaboradores de la empresa.

### 1.2 Objetivos Estratégicos
- **Centralización Total:** Erradicar la fragmentación de herramientas desconectadas y cadenas interminables de correos electrónicos, unificando bajo un único entorno seguro las solicitudes de ausencias, noticias corporativas, documentos oficiales, soporte de TI y directorio humano.
- **Transparencia y Productividad:** Facilitar la visibilidad de feriados nacionales, eventos internos, políticas de empresa y estructuras de liderazgo en tiempo real.
- **Autogestión Ágil:** Permitir que los colaboradores gestionen sus solicitudes de vacaciones, permisos por horas o incidencias técnicas de teletrabajo de forma autónoma con cómputo instantáneo de balances.
- **Asistencia Inteligente de Alta Velocidad:** Incorporar inteligencia artificial de clase mundial para soporte técnico de Nivel 1 (AILlama) y un asistente corporativo omnisciente (TN Assistant) con consultas en tiempo real a la base de datos corporativa.
- **Trazabilidad y Cumplimiento:** Garantizar la auditoría integral y el aislamiento estricto de datos bajo normativas de seguridad OWASP y autorización basada en roles (RBAC).

### 1.3 Ficha Técnica de la Versión Activa
| Atributo | Detalle |
| :--- | :--- |
| **Versión Oficial:** | `v1.2.9` |
| **Fecha de Despliegue:** | Octubre 2026 |
| **Organización:** | Telecom Networks |
| **Desarrollo & Autoría:** | Iván Reyes (Departamento de AI & Software Development) |
| **Entorno de Ejecución:** | Node.js v20+ LTS / Debian 12 / Docker |
| **Framework Base:** | Next.js 15 (App Router) + React 19 + TypeScript |
| **Motor de Base de Datos:** | MySQL 8.x / MariaDB con Prisma ORM 5.22 |
| **Caché y Mensajería:** | Redis 7.x en memoria |
| **Motores de IA:** | NVIDIA NIM Cloud API (`llama-3.2-11b`), Ollama On-Premise, Google Gemini 1.5 Flash |

---

## 2. Arquitectura General & Stack Tecnológico

La plataforma adopta una arquitectura desacoplada, reactiva y escalable basada en los más avanzados paradigmas de Next.js, combinando Server Components, Server Actions seguras, Route Handlers optimizados y comunicación en tiempo real mediante Server-Sent Events (SSE).

```text
                      +------------------------------------------+
                      |       Navegador Web del Colaborador      |
                      |  (Plus Jakarta Sans / HSL Glassmorphism) |
                      +--------------------+---------------------+
                                           |
                              HTTP / HTTPS | Next.js Server Actions / API Routes
                                           v
                      +------------------------------------------+
                      |       Capa Web: Next.js 15 / Node.js     |
                      | - middleware.ts (Perímetro & RBAC)       |
                      | - Server Actions (Lógica Transaccional)  |
                      | - Route Handlers (SSE Streaming & REST)  |
                      +----+-------------------+---------------+--+
                           |                   |               |
           Consultas SQL   |       Caché Redis |               | Inferencia IA
           vía Prisma ORM  |                   v               | (Streaming SSE)
                           v             +-----------+         |
                  +----------------+     | Redis 7.x |         v
                  |  MySQL 8.x DB  |     | (Sesiones |   +--------------------+
                  | (Relacional &  |     |  y Caché) |   | Motor IA Primario: |
                  |  Transacciones)|     +-----------+   | NVIDIA NIM API     |
                  +----------------+                     +---------+----------+
                           ^                                       | Fallback
                           | Sync Solo Lectura                     v Automático
                  +--------+-------+                     +--------------------+
                  | DeskTime MySQL |                     | Motor IA Secundario|
                  | (wfm_platform) |                     | Ollama On-Premise  |
                  +----------------+                     +--------------------+
```

### 2.1 Componentes del Stack
- **Frontend Moderno:**
  - **Next.js 15 (App Router):** Enrutamiento por carpetas, renderizado del lado del servidor (SSR) y componentes de servidor reactivos.
  - **React 19:** Última versión del ecosistema React con transiciones optimizadas y gestión atómica de estados.
  - **Tokens de Diseño HSL Propios:** Diseño sin librerías invasivas, basado en variables CSS nativas, glassmorphism con `backdrop-filter: blur()`, soporte nativo para Modo Claro y Modo Oscuro.
  - **Iconografía:** Lucide React unificada.
- **Backend & Lógica de Negocio:**
  - **Server Actions de Next.js:** Operaciones mutacionales directas (`timeOffActions.ts`, `userActions.ts`, `groupActions.ts`, `auditActions.ts`) blindadas contra ataques CSRF e inyección de datos.
  - **Route Handlers Especializados:** `/api/chat` (streaming SSE con RAG y multi-tabla), `/api/requests/*` (aprobaciones con protección contra IDOR), `/api/whatsapp/*` (bot y tareas cron).
- **Persistencia de Datos:**
  - **MySQL 8.0 / MariaDB:** Almacén relacional principal con soporte completo para transacciones ACID, collation UTF-8mb4 y claves foráneas en cascada controladas.
  - **Prisma ORM 5.22:** Generación tipada de cliente (`@prisma/client`), esquemas declarativos y migraciones estructuradas.
  - **Redis 7.x:** Almacén en memoria para snapshots de caché y optimización de llamadas de sesión.
- **Inteligencia Artificial Híbrida & Alta Disponibilidad:**
  - **NVIDIA NIM Cloud API:** Motor principal de alta velocidad (`meta/llama-3.2-11b-vision-instruct`) que responde a consultas complejas en milisegundos con streaming continuo.
  - **Ollama On-Premise / Servidor Local:** Conmutador por error (fallback) automático en puerto 11434 si la conexión externa presenta latencia o caída.
  - **Google Gemini 1.5 Flash:** Procesamiento analítico en segundo plano para generación de resúmenes ejecutivos semanales y mensuales enviados por WhatsApp.

---

## 3. Modelo de Seguridad, RBAC y Data Scoping (Row-Level Authorization)

A partir de la versión `1.2.4` y `1.2.5`, la intranet implementa una arquitectura de seguridad militar de acceso por roles y alcance dinámico de datos (Data Scoping), mitigando riesgos de OWASP Top 10 como IDOR (Insecure Direct Object References) y BOLA (Broken Object Level Authorization).

### 3.1 Jerarquía Numérica de Roles (`ROLE_HIERARCHY`)
```typescript
export const ROLE_HIERARCHY: Record<string, number> = {
  NO_ROLE: 0,
  USER: 10,
  AGENT: 10,
  SUPERVISOR: 20,
  TEAM_LEAD: 20,
  MANAGER: 30,
  HR: 35,
  TECHNOLOGY: 40,
  IT_MANAGER: 50,
  TECHNOLOGY_ADMIN: 50,
}
```

### 3.2 Matriz Detallada de Permisos por Rol
| Permiso Clave | USER / AGENT | SUPERVISOR / TEAM_LEAD | MANAGER | HR (Recursos Humanos) | TECHNOLOGY | IT_MANAGER / TECH_ADMIN | CEO / DIRECCIÓN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `documents:read` | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| `documents:create` | No | No | Sí | Sí | Sí | Sí | Sí |
| `documents:delete` | No | No | No | Sí | Sí | Sí | Sí |
| `posts:feature` | No | Sí | Sí | Sí | Sí | Sí | Sí |
| `posts:delete` | No | No | Sí | Sí | Sí | Sí | Sí |
| `vacations:approve` | No | Sí (Equipo) | Sí (Área) | Sí (Global) | Sí | Sí | Sí (Global) |
| `vacations:create_on_behalf` | No | Sí (Masivo) | Sí (Masivo) | Sí (Global) | Sí | Sí | Sí (Global) |
| `users:view_all` | No | No | Sí | Sí | Sí | Sí | Sí |
| `users:create` | No | No | Sí (Cualquier dominio) | Sí | Sí | Sí | Sí |
| `users:edit` | No | No | Sí | Sí | Sí | Sí | Sí |
| `users:delete` | No | No | No | No | Sí* | Sí | Sí |
| `audit:view` | No | Sí | Sí | No | Sí | Sí | Sí |
| `config:manage` (TI) | No | No | No | No | Sí | Sí | Sí |
| `admin:full` | No | No | No | No | No | Sí | Sí |

*\*Nota de Salvaguarda de Tecnología:* Un usuario con rol `TECHNOLOGY` cuenta con permiso `users:delete`, pero el sistema prohíbe taxativamente la eliminación de miembros del equipo de Tecnología a menos que el ejecutor sea `IT_MANAGER` o un superadministrador autorizado.

### 3.3 Aislamiento de Datos por Nivel de Autorización (Data Scoping)
El motor de autorización (`lib/authorizationRoles.ts` y `lib/requestAuthorization.ts`) impone cláusulas dinámicas en las consultas a la base de datos:
1. **Roles Ejecutivos y Desarrollador del Sistema (`isCEO` / `isSuperAdmin`):** Los roles de alta dirección (CEO / Director) e Iván Reyes (Desarrollador de AI & Software Development con credencial maestra de desarrollador) cuentan con autorización global irrestricta para visualización, depuración y soporte integral de la plataforma. En el asistente de IA, el sistema reconoce estas credenciales y entrega datos corporativos completos sin derivar a Recursos Humanos.
2. **Supervisores y Team Leads (`SUPERVISOR`, `TEAM_LEAD`):** Mediante `getTimeOffScopeFilter()`, la consulta filtra estrictamente por `userId IN managedUserIds`. Solo pueden ver y autorizar solicitudes de los miembros pertenecientes a los grupos donde están designados como supervisores (`supervisors`) o sub-líderes (`subLeaders`).
3. **IT Manager (`IT_MANAGER`):** Posee alcance global sobre incidencias técnicas de teletrabajo (`REMOTE_INTERNET`, `REMOTE_POWER`, `REMOTE_HARDWARE`, `REMOTE_VPN`) y alcance departamental sobre su personal directo.
4. **Protección Perimetral en API (`authorizeRequestAction`):** Todo endpoint de aprobación (`/api/requests/:id/approve` o `reject`) valida en la base de datos la relación jerárquica antes de admitir mutaciones, respondiendo con `403 Forbidden` ante intentos de acceso cruzado.
5. **Configuración de TI Exclusiva (`canAccessITConfig`):** Las rutas `/admin/config`, `/configuracion-ti` y los endpoints de WhatsApp y credenciales de IA están bloqueados para Recursos Humanos y Managers generales; su acceso está reservado exclusivamente para personal de Tecnología y administradores autorizados.

---

## 4. Instalación, Configuración y Variables de Entorno

### 4.1 Requisitos Mínimos del Servidor
- **CPU:** 2 vCPU (Recomendado: 4 vCPU para entornos de alta concurrencia).
- **Memoria RAM:** 4 GB mínimo (8 GB recomendado con servicios de IA locales).
- **Almacenamiento:** 30 GB SSD en disco.
- **Sistema Operativo:** Debian 12 (Bookworm), Ubuntu 22.04/24.04 LTS o Windows Server con Node.js 20+.
- **Software:** Node.js v20.x LTS o superior, npm v10+, MySQL 8.x / MariaDB 10.11+, Redis 7.x, Apache 2.4 o NGINX.

### 4.2 Catálogo de Variables de Entorno (`.env` / `.env.local`)
| Variable | Descripción y Finalidad | Valor Ejemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cadena de conexión JDBC/MySQL hacia Prisma | `mysql://[usuario]:[clave]--host:3306/intranet` |
| `NEXTAUTH_URL` | URL canónica de acceso a la intranet | `https://intranet.tnoutsourcing.com` |
| `NEXTAUTH_SECRET` | Llave criptográfica de firmado de cookies JWT | Hash aleatorio base64 (mín. 32 caracteres) |
| `SUPERADMIN_EMAIL` | Correo del desarrollador/administrador maestro con pase de soporte | `ireyes@tnoutsourcing.com` |
| `REDIS_URL` | Conexión hacia el almacén de caché en memoria | `redis://127.0.0.1:6379` |
| `NVIDIA_API_KEY` | Clave API del motor primario NVIDIA NIM Cloud | `nvapi-TU_API_KEY` |
| `NVIDIA_MODEL` | Identificador del modelo Llama en NVIDIA | `meta/llama-3.2-11b-vision-instruct` |
| `OLLAMA_HOST` | URL del servidor local de Ollama para fallback | `http://127.0.0.1:11434` |
| `GEMINI_API_KEY` | Llave API de Google AI para reportes analíticos | `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `SMTP_HOST` | Host del servidor de correo saliente | `smtp.office365.com` |
| `SMTP_PORT` | Puerto de transmisión segura TLS/STARTTLS | `587` |
| `SMTP_USER` | Cuenta de correo corporativa remitente | `notificaciones@tnoutsourcing.com` |
| `SMTP_PASSWORD` | Contraseña o App Password de Microsoft 365 | `ContraseñaSeguraApp` |
| `DESKTIME_DB_HOST` | Servidor MySQL de DeskTime (modo solo lectura) | `127.0.0.1` |
| `DESKTIME_DB_NAME` | Nombre de la base de datos externa de WFM | `wfm_platform` |
| `ENABLE_WHATSAPP` | Flag para inicializar el cliente WhatsApp Web | `true` o `false` |

### 4.3 Procedimiento de Puesta en Marcha (Desarrollo Local)
```bash
# 1. Clonar el repositorio
git clone https://github.com/Kingpanda27/Intranet.git
cd Intranet

# 2. Instalar dependencias del proyecto con resolución de pares
npm install --legacy-peer-deps

# 3. Configurar variables de entorno locales
cp .env.example .env.local

# 4. Generar el cliente fuertemente tipado de Prisma
npx prisma generate

# 5. Sincronizar el esquema de datos con la base MySQL
npx prisma db push

# 6. Sembrar feriados corporativos y roles base
node scripts/seed_holidays.js
node scripts/seed_rbac.js

# 7. Iniciar el entorno de desarrollo reactivo
npm run dev
```

### 4.4 Compilación y Despliegue en Producción
```bash
# Compilar bundle de producción optimizado
npm run build

# Ejecución gestionada con PM2 para alta disponibilidad
pm2 start npm --name "intranet" -- start -- -p 3000
pm2 save
```

---

## 5. Estructura del Proyecto y Convenciones

```text
d:\Intranet\
├── app\                                # Directorio principal de App Router (Next.js 15)
│   ├── actions\                        # Server Actions con lógica transaccional de servidor
│   │   ├── auditActions.ts             # Registro y consulta de auditoría
│   │   ├── embeddingActions.ts         # Vectorización y búsqueda semántica RAG
│   │   ├── groupActions.ts             # Gestión de grupos, miembros y líderes
│   │   ├── homeActions.ts              # Métricas reales y widgets de inicio
│   │   ├── timeOffActions.ts           # Motor de ausencias, incidencias y aprobaciones
│   │   └── userActions.ts              # Gestión de usuarios, M365 e integridad referencial
│   ├── admin\                          # Rutas del panel de administración
│   │   ├── audit-logs\                 # Visor de telemetría y logs de auditoría
│   │   ├── config\                     # Configuración de TI, WhatsApp y credenciales de IA
│   │   ├── groups\                     # Gestión moderna de escuadrones y campañas
│   │   └── users\                      # Gestión de usuarios e importación M365 CSV
│   ├── api\                            # Route Handlers REST y Streaming SSE
│   │   ├── chat\route.ts               # TN Assistant: NVIDIA NIM + Ollama con RAG
│   │   ├── requests\                   # Endpoints blindados de aprobación de ausencias
│   │   └── whatsapp\                   # Webhooks y endpoints del bot de WhatsApp
│   ├── calendar\                       # Módulo de calendario corporativo y feriados
│   ├── configuracion-ti\               # Enrutamiento protegido de TI
│   ├── dashboard\                      # Panel de Aprobaciones para directivos y supervisores
│   ├── documents\                      # Repositorio documental corporativo
│   ├── groups\                         # Vista pública/colaborativa de escuadrones
│   ├── social\                         # Centro social y directorio de empleados
│   ├── support\                        # Portal de soporte técnico inteligente AILlama
│   ├── vacations\                      # Módulo de vacaciones e incidencias técnicas
│   ├── layout.tsx                      # Layout maestro, barra lateral y Providers
│   └── globals.css                     # Sistema de diseño con tokens CSS HSL y Glassmorphism
├── lib\                                # Servicios de soporte, seguridad y utilidades
│   ├── auditPermissions.ts             # Validación de acceso al módulo de auditoría
│   ├── auth.ts                         # Configuración y callbacks de NextAuth.js
│   ├── authorizationRoles.ts           # Funciones de comprobación de roles y permisos
│   ├── email.ts                        # Envíos transaccionales vía Nodemailer / SMTP
│   ├── permissions.ts                  # Jerarquía y matriz granular de permisos
│   ├── prisma.ts                       # Singleton de conexión Prisma Client
│   ├── requestAuthorization.ts         # Reglas de IDOR y Data Scoping por grupo
│   └── supportAiLlamaService.ts        # Motor de soporte técnico L1 y crons WhatsApp
├── prisma\
│   └── schema.prisma                   # Modelo de datos declarativo en MySQL
├── public\                             # Archivos estáticos, logos institucionales y uploads
├── scripts\                            # Scripts de mantenimiento, sincronización y despliegue
├── SERVER_MIGRATION_PACKAGE\           # Paquete integral de migración de servidores
├── CHANGELOG.md                        # Historial cronológico de cambios de versión
└── DESIGN_SYSTEM.md                    # Especificación formal de tokens visuales
```

---

## 6. Documentación Detallada de Módulos Funcionales

### 6.1 Inicio / Feed Corporativo & Muro Social
- **Comunicación Abierta:** Muro central donde los colaboradores interactúan compartiendo noticias, anuncios y actualizaciones.
- **Moderación y Fijación:** Recursos Humanos y directivos pueden fijar comunicados prioritarios con distintivo de chincheta dorada.
- **Interacciones:** Sistema de comentarios jerárquicos y reacciones con persistencia transaccional.
- **Widgets de Contexto en Tiempo Real:**
  - *Próximos Feriados:* Normalización estricta de huso horario UTC que garantiza la presentación fidedigna de fechas cívicas y feriados trasladados (ej. Día de la Constitución).
  - *Cumpleaños y Aniversarios Laborales:* Tarjetas automáticas que celebran los hitos del personal activo.
  - *Métricas Reales:* Tarjetas interactivas con recuento verídico de colaboradores activos en el día, eventos de la semana actual (delimitados de lunes a domingo) y documentos incorporados en el mes en curso.

### 6.2 Directorio Corporativo & Centro Social
- **Búsqueda Avanzada:** Localización instantánea de empleados por nombre, apellido, cargo o grupo de trabajo.
- **Disponibilidad:** Indicadores en vivo de estado: *Disponible*, *Ocupado*, *En Reunión*, *Home Office* o *De Vacaciones*.
- **Reconocimientos (Kudos):** Módulo para felicitar el desempeño laboral con insignias temáticas, mensajes de agradecimiento y redacción asistida por IA.

### 6.3 Gestión Documental & Base de Conocimiento
- **Clasificación Departamental:** Repositorios segmentados por áreas (Recursos Humanos, Operaciones, Legal, Tecnología).
- **Control de Acceso:** Políticas de lectura pública o restringida según el rol del colaborador.
- **Integración con IA (RAG):** Los documentos cargados son vectorizados (`DocumentEmbedding`) permitiendo que el asistente de IA responda consultas citando directamente fragmentos de políticas internas.

### 6.4 Vacaciones, Permisos e Incidencias Técnicas de Teletrabajo
El módulo (`/vacations`) cuenta con un contenedor ergonómico de 1560px y una cuadrícula optimizada.

#### Catálogo de Solicitudes (12 Tipos con Identidad Cromática)
1. **Categoría Tiempo Libre:**
   - *Vacaciones:* Color azul eléctrico (`#3b82f6`). Aplica política de anticipación de 25 días y descuenta días hábiles del balance personal (`vacationBalance`).
   - *Permiso Especial:* Color índigo (`#6366f1`). Modalidades: Día completo, Medio turno o Permiso por horas con captura de hora de salida y retorno.
   - *Reposición de Horas:* Color turquesa (`#14b8a6`). Permite coordinar la fecha y franja horaria exacta de recuperación de tiempo ausente.
   - *Salir Temprano:* Color ámbar (`#f59e0b`). Solicitud ágil de egreso anticipado por razones justificadas.
2. **Categoría Salud y Familia:**
   - *Enfermedad (Corta duración):* Color esmeralda (`#10b981`).
   - *Licencia Médica Oficial:* Color carmesí (`#f43f5e`). Exige la subida digital de justificante o certificado médico expedido por autoridad de salud.
   - *Maternidad / Paternidad:* Color fucsia (`#ec4899`).
   - *Fallecimiento / Duelo Familiar:* Color púrpura suave (`#8b5cf6`).
3. **Categoría Incidencias de Teletrabajo / Remoto:**
   - *Falla de Proveedor de Internet:* Color naranja advertencia (`#f97316`).
   - *Corte de Energía Eléctrica:* Color amarillo relámpago (`#eab308`).
   - *Avería de Hardware / Computadora:* Color rojo alerta (`#ef4444`). Incluye toggle de solicitud de sustitución de equipo por TI.
   - *Fallo de VPN / Accesos Corporativos:* Color púrpura eléctrico (`#a855f7`).

#### Mecánica Exclusiva de Teletrabajo
- **Exención Inmediata:** Desactiva de forma automática la regla de 25 días de anticipación y suprime la selección de fecha de fin.
- **Captura Precisa de Timestamp:** Campo `datetime-local` para registrar el momento exacto en que ocurrió la interrupción.
- **Selector de Duración Prevista:** *1-2 Horas*, *Medio Turno*, *Turno Completo*, o *Indefinido*.
- **Campos Dinámicos Adaptativos:** Captura del Proveedor de Internet (ISP), Compañía de Electricidad o Dispositivo Afectado.
- **Consumo Neutro de Vacaciones:** Cómputo garantizado de 0 días deducidos del balance anual (`workingDays = 0`).

#### Modo de Registro Administrado Masivo para Supervisores (v1.2.2)
Permite a supervisores y managers reportar incidencias o permisos en nombre de su equipo:
- Selector de Ámbito: *Para mí mismo* o *En nombre de equipo / colaboradores*.
- Modo por Escuadrón / Campaña: Añade con un clic a todos los integrantes asignados a un grupo.
- Modo Individual Múltiple: Buscador predictivo con autocompletado y fichas interactivas (chips) removibles.
- Gestión de Excepciones: Checkboxes interactivos para deseleccionar rápidamente a colaboradores no impactados por la falla técnica.
- Confirmación Modal Previa: Cuadro de diálogo que resume el impacto total antes del envío.
- Soporte Backend en Lote: Genera registros transaccionales individuales en `TimeOffRequest` vinculados al supervisor y colaborador con auditoría `CREATE_TIME_OFF_MASS`.

### 6.5 Panel de Control & Aprobaciones (`/dashboard`)
Diseñado para directores, supervisores y managers autorizados (`canAccessApprovalsPanel`):
- **Agrupamiento por Escuadrón / Proyecto:** Las solicitudes se organizan dentro de recuadros visuales correspondientes al grupo de pertenencia del empleado, mostrando el color del grupo, icono, avatar, cantidad de colaboradores involucrados y badges de estado.
- **Contenedor para Empleados Sin Grupo:** Las solicitudes de personal no asignado se agrupan ordenadamente en una tarjeta neutra "Sin Grupo Asignado".
- **Píldoras de Filtrado Dinámico:** Barra de chips interactivos con el color de cada grupo para filtrar la vista instantáneamente.
- **Alternador de Modos:** Switch para alternar entre Vista por Grupos y Vista Clásica en Lista Plana.
- **Modal de Exportación Avanzada a CSV (v1.2.7):**
  - Configuración granular: Exportar todos los grupos o aislar una campaña específica.
  - Filtro por Mes y Año con botones rápidos (*Mes Actual*, *Mes Anterior*, *Todo el Año*, *Todo el Histórico*).
  - Filtro por Estado: Todas, Solo Aprobadas, Solo Pendientes o Solo Rechazadas.
  - Previsualización en Tiempo Real: Conteo exacto de registros a exportar y desglose de estados.
  - Compatibilidad Universal Excel: Nombres descriptivos y codificación con prefijo UTF-8 BOM (`\uFEFF`) que evita la distorsión de tildes o caracteres en español.

### 6.6 Gestión de Grupos & Sincronización DeskTime (`/admin/groups`)
- **Sincronización Automática con WFM Platform:** Script `sync_desktime_groups.mjs` que realiza consultas `SELECT` a la base de datos externa de DeskTime (`wfm_platform`), sincronizando y homologando 49 grupos, 274 empleados con sus cargos laborales y jerarquías de supervisores.
- **Gestión Interactiva de Líderes (`ManageLeadersModal`):**
  - Asignación de Líderes Principales (`👑`) y Sub-Líderes (`🛡️`) mediante botón rápido en cada tarjeta.
  - Modal con pestañas: *Roles de Liderazgo*, *Integrantes del Grupo* y *Todos los Usuarios*.
  - Búsqueda predictiva y asignación instantánea con actualización optimista de la interfaz.
- **Adición Masiva de Miembros (`AddMembersModal`):** Selección múltiple de colaboradores con filtro por colaboradores *Sin grupo* o *En otro grupo* con indicativo visual de traspaso.
- **Eliminación Masiva con Modal Moderno (`ConfirmModal`):** Checkboxes por tarjeta para desvinculación masiva y diálogo de advertencia centrado con desenfoque de fondo (`backdrop-filter: blur(12px)`).
- **Tarjetas Responsivas:** Eliminación definitiva de recortes visuales o truncamiento en nombres largos.

### 6.7 Administración de Usuarios & Compatibilidad M365 (`/admin/users`)
- **Creación Flexible Multi-Dominio:** Personal de Tecnología y Managers pueden dar de alta cuentas con cualquier dominio legítimo (Gmail, Outlook, dominios externos), facilitando la integración de contratistas y consultores externos.
- **Importación Masiva Nativa desde Microsoft 365 Admin Center:**
  - Carga directa del archivo CSV estándar de Microsoft Entra / Office 365.
  - Mapeo inteligente de campos (`Display name`, `User principal name`, `Block credential`, `Title`, `Department`, `Object Id`).
  - Filtrado automático de usuarios inactivos (`Block credential = False`) y actualización de perfiles existentes sin caídas del servicio.
- **Eliminación Masiva Segura (`cleanupUserRelations`):**
  - Modal de confirmación estilizado en modo oscuro con lista desplazable de usuarios seleccionados.
  - Limpieza transaccional en cascada que elimina preventivamente referencias en 15+ tablas relacionales (sesiones, cuentas, chats, documentos, amistades, solicitudes, notificaciones, likes, comentarios, tickets de soporte), imposibilitando errores de clave foránea SQL.
  - Protección absoluta contra autoeliminación y protección jerárquica que impide la eliminación de personal de TI por usuarios no autorizados.

### 6.8 Calendario Corporativo & Gestión de Feriados (`/calendar`)
- **Sincronización con Permisos:** Las vacaciones e incidencias aprobadas se reflejan en el calendario del equipo, informando la disponibilidad general de los recursos.
- **Eventos Corporativos:** Creación de convocatorias, aniversarios y reuniones con configuración de alcance: *Público*, *Por Grupo*, *Solo Supervisores* o *Solo Recursos Humanos*.
- **Participación:** Gestión de asistencia (RSVP) y comentarios en eventos.

### 6.9 Centro de Inteligencia Artificial (TN Assistant & Soporte AILlama L1)

#### TN Assistant (Asistente Corporativo Omnisciente)
- **RAG Context & Búsqueda Multi-Tabla:** Motor de búsqueda predictiva en la base de datos MySQL ante cualquier consulta del colaborador:
  - *Colaboradores y Balances:* Búsqueda por nombre o apellido (compatible con MySQL, sin fallos de validación) que retorna balance de días disponibles, cargo, departamento e historial reciente de solicitudes.
  - *Grupos y Campañas:* Consulta integrantes y líderes de proyectos.
  - *Publicaciones y Feriados:* Responde sobre comunicados recientes del muro o fechas patrias.
  - *Documentos Internos:* Búsqueda semántica sobre políticas corporativas.
- **Reconocimiento de Autorización Maestra:** Reconoce a los roles de alta dirección (CEO / Director) y a Iván Reyes (Desarrollador de AI & Software Development con credenciales de desarrollador maestro), entregando respuestas ejecutivas con cifras exactas sin evasivas de derivación a Recursos Humanos.
- **Arquitectura de Streaming con Tolerancia a Fallos:** Conexión prioritaria con NVIDIA NIM API (`llama-3.2-11b`) y fallback inmediato hacia Ollama On-Premise si la nube experimenta latencia.

#### Soporte AILlama L1 (Asistencia Técnica para Teletrabajo)
- **Metodología de Diagnóstico en 3 Intentos:**
  1. *Nivel 1 (Físico / Superficial):* Inspección visual de cables, botones y adaptadores.
  2. *Nivel 2 (Aplicación / Interfaz):* Acciones limpias en el navegador (`Ctrl + F5`, caché).
  3. *Nivel 3 (Sesión / Navegación Alternativa):* Modo incógnito o reinicio de sesión guiado.
- **Política Estricta de Cero Fricción:** Vetado el uso de terminales (`CMD`, `PowerShell`, `ping`, `ipconfig`), `BIOS` o reinicios agresivos de equipos.
- **Escalación Automática a L2:** Al agotarse los 3 intentos sin solución, el sistema genera automáticamente un ticket de soporte en la base de datos (`SupportTicket`) y despacha un correo estructurado a Helpdesk mediante EmailJS / Nodemailer.
- **Soporte Bilingüe Interactivo:** Selector instantáneo de idioma (Español / Inglés).

#### Bot de WhatsApp y Tareas Cron
- Servicio desatendido sobre `whatsapp-web.js` para atención remota y tareas cron automatizadas con resúmenes ejecutivos vía Google Gemini 1.5 Flash.

### 6.10 Centro Integral de Auditoría & Trazabilidad (`/admin/audit-logs`)
- **Acceso Segmentado:** Reservado a Supervisores, Managers, Tecnología y miembros del equipo de *AI & Software Development*.
- **Métricas KPI en Tiempo Real:** 4 tarjetas con indicadores de Total de Eventos, Actividad Registrada Hoy con indicador de pulso verde, Alertas / Rechazos e Inventario de Acciones del Sistema.
- **Modalidades de Visualización:**
  - *Tabla Dinámica:* Vista densa con filtros avanzados por tipo de evento (`USER_CREATED`, `GROUP_DELETED`, `CONFIG_UPDATED`), estado y rangos temporales.
  - *Línea de Tiempo (Timeline Stream):* Flujo visual de actividad interactivo con nodos luminosos.
- **Visor Modal de Diferencias (Diff Inspector):** Ventana emergente que muestra de manera clara los valores *Antes vs. Después* en modificaciones de datos y visualizador formateado de JSON con botón de copia rápida.
- **Exportación:** Descarga de reportes de auditoría en formatos CSV y JSON con un solo clic.

### 6.11 Configuración de TI & Consola de Proveedores (`/configuracion-ti` / `/admin/config`)
- Módulo protegido por `canAccessITConfig` para el equipo de Tecnología:
  - *Integraciones de IA:* Panel de administración de credenciales, selección de modelos (NVIDIA NIM, Ollama, Gemini) y parámetros de temperatura.
  - *Gestor de Tickets de Soporte:* Monitoreo centralizado del estado de incidentes L2 derivados por AILlama.
  - *Parámetros de WhatsApp:* Exclusión de grupos, números telefónicos y control de reportes periódicos.

---

## 7. Administración y Operaciones del Sistema

### 7.1 Gestión de Políticas y Sesiones
- Las sesiones se gestionan mediante cookies encriptadas `next-auth.session-token` con expiración configurable y validación transaccional periódica.
- Invitaciones de nuevos usuarios cuentan con tokens unívocos (`invitationToken`) con tiempo límite de caducidad.

### 7.2 Pasarela de Correos Corporativos
- Las notificaciones de solicitudes, aprobaciones y alertas de L2 se transmiten a través de SMTP seguro sobre Office 365 / Exchange Online en el puerto 587.

---

## 8. Mantenimiento y Solución de Problemas (Troubleshooting)

### 8.1 Matriz de Diagnóstico y Contingencias
| Incidencia Detectada | Causa Raíz Probable | Procedimiento de Resolución |
| :--- | :--- | :--- |
| **La plataforma no responde en el puerto 80/3000** | Proceso Node.js detenido o fallo en Apache | 1. Comprobar estado: `pm2 status`<br>2. Ver logs: `pm2 logs intranet --lines 50`<br>3. Reiniciar proceso: `pm2 restart intranet`<br>4. Verificar proxy: `systemctl status apache2` |
| **Error de Conexión a Base de Datos (P1001)** | MySQL detenido o credenciales de `.env` erróneas | 1. Verificar servicio: `systemctl status mysql`<br>2. Validar cadena de conexión `DATABASE_URL`<br>3. Probar conexión local: `mysql -u intranet_user -p` |
| **TN Assistant indica que los servicios de IA no responden** | NVIDIA API sin crédito/llave inválida y Ollama apagado | 1. Verificar `NVIDIA_API_KEY` en `/configuracion-ti`<br>2. Comprobar servicio Ollama: `systemctl status ollama`<br>3. Validar modelo: `ollama list` |
| **Cambios de Interfaz o CSS no se visualizan** | Caché persistente de compilación de Next.js | 1. Purgar caché: `rm -rf .next/cache`<br>2. Reconstruir bundle: `npm run build`<br>3. Recargar PM2: `pm2 reload intranet` |
| **Fallo al eliminar usuarios por restricciones de integridad** | Claves foráneas huérfanas en modelos relacionales | Utilizar el botón de eliminación masiva en `/admin/users`, el cual ejecuta `cleanupUserRelations` limpiando transaccionalmente todas las tablas dependientes. |

---

## 9. Políticas de Respaldo, Restauración y Disaster Recovery

### 9.1 Estrategia de Respaldo Periódico
Para garantizar la continuidad ininterrumpida de operaciones:
1. **Base de Datos MySQL:** Respaldo lógico diario integral con `mysqldump`:
   ```bash
   mysqldump -u root -p --single-transaction --routines --triggers --events intranet > /backups/intranet_$(date +%Y%m%d).sql
   ```
2. **Archivos Multimedia & Uploads:** Respaldo comprimido del directorio persistente `/public/uploads`:
   ```bash
   tar -czf /backups/uploads_$(date +%Y%m%d).tar.gz public/uploads/
   ```
3. **Caché y Sesiones Redis:** Snapshot programado del archivo de persistencia `dump.rdb`.
4. **Variables de Configuración:** Resguardo en bóveda cifrada de los archivos `.env.local` y configuraciones de Apache.

### 9.2 Protocolo de Restauración ante Desastres
1. Detener el proceso web de la aplicación (`pm2 stop intranet`).
2. Restaurar la base de datos relacional:
   ```bash
   mysql -u root -p intranet < /backups/intranet_backup.sql
   ```
3. Descomprimir el paquete de uploads en `/public/uploads`.
4. Ejecutar `npx prisma generate` y reiniciar los servicios con `pm2 start intranet`.

---

## 10. Buenas Prácticas de Desarrollo y Despliegue

- **No Mutar la Base de Datos sin Pruebas:** Ejecutar siempre cambios de esquema en entornos locales o de staging antes de aplicar `prisma db push` en producción.
- **Despliegues Zero-Downtime:** Utilizar `pm2 reload intranet` en servidores de producción para recargar instancias de forma progresiva sin interrumpir la conexión de los usuarios activos.
- **Respeto Estricto de Seguridad OWASP:**
  - Toda nueva Server Action debe verificar la sesión (`getServerSession(authOptions)`).
  - Nunca retornar contraseñas ni tokens en consultas públicas de Prisma.
  - Todas las aprobaciones de tiempo libre deben invocar `authorizeRequestAction` para prevenir vulnerabilidades BOLA.
- **Integridad del Sistema de Diseño:** Emplear exclusivamente las variables de diseño HSL y clases reutilizables documentadas en `DESIGN_SYSTEM.md` (`.card`, `.btn-primary`, `.glass`), evitando estilos ad-hoc o librerías externas que rompan la estética corporativa.

---

## 11. Historial de Versiones & Registro de Cambios

| Versión | Fecha | Resumen de Cambios Mayores |
| :--- | :--- | :--- |
| **v1.0.0** | 16-Oct-2026 | Arquitectura base sobre Next.js 15, React 19 y Prisma ORM. Módulos iniciales de feed, usuarios, permisos, documentos y calendario laboral. Prototipo inicial de asistente L1. |
| **v1.1.0** | 21-Oct-2026 | Integración con NVIDIA NIM Cloud API (`meta/llama-3.2-11b-vision-instruct`). Soporte bilingüe en chat de soporte (ES/EN). Protocolo de diagnóstico guiado en 3 intentos y política de Cero Fricción. Escalación automática a L2 con EmailJS. Bot de WhatsApp y resúmenes ejecutivos vía Google Gemini 1.5 Flash. Pipeline de despliegue automatizado por SSH y PM2. |
| **v1.2.0** | 26-Oct-2026 | Refactorización de Vacaciones e Incidencias en 12 tipos con identidad cromática propia. Creación de sub-módulo de incidencias de teletrabajo (0 días de vacaciones deducidos, captura horaria de corte, solicitud de reemplazo de hardware). Centro Integral de Auditoría & Trazabilidad (`AuditLogViewer.tsx`) con tabla dinámica, línea de tiempo (timeline) y exportación CSV/JSON. |
| **v1.2.1** | 26-Oct-2026 | Ampliación ergonómica del contenedor de Vacaciones a 1560px con balance simétrico de columnas y espaciado de alta legibilidad. |
| **v1.2.2** | 26-Oct-2026 | Modo de Registro Administrado Masivo para Supervisores y Managers en Vacaciones. Asignación masiva por escuadrón/campaña o selección múltiple, gestión interactiva de excepciones y diálogo modal de confirmación. |
| **v1.2.3** | 26-Oct-2026 | Rediseño integral de Gestión de Grupos (`GroupManager.tsx`). Sincronización automática de 49 grupos y 274 empleados desde BD DeskTime (`wfm_platform`). Modal para asignar y gestionar Líderes (`👑`) y Sub-Líderes (`🛡️`). Modales modernos con `backdrop-filter: blur` (`AddMembersModal`, `ConfirmModal`) y desvinculación masiva. |
| **v1.2.4** | 26-Oct-2026 | Implementación de Matriz de Permisos, Alcance Dinámico de Datos (Data Scoping) y protección IDOR/BOLA. Aislamiento de consultas por escuadrones asignados para Supervisores. Acceso exclusivo a `/configuracion-ti` para Tecnología y administradores autorizados. Nueva página `/acceso-denegado`. |
| **v1.2.5** | 26-Oct-2026 | Flexibilización de dominios de correo para creación de usuarios (soporte para Gmail, Outlook, contratistas). Habilitación de gestión de usuarios para Managers. Autenticación multi-dominio en NextAuth. |
| **v1.2.6** | 26-Oct-2026 | Agrupamiento de solicitudes por Grupo / Escuadrón / Campaña en el Panel de Control (`AdminDashboard.tsx`). Tarjetas compartidas con cabecera cromática, badges de estado, recuadro para colaboradores sin grupo y píldoras interactivas de filtrado rápido. |
| **v1.2.7** | 26-Oct-2026 | Modal interactivo de Exportación Avanzada a CSV en Panel de Control con selector de grupos, filtros por mes y año, selector de estados, previsualización de registros en vivo y codificación UTF-8 BOM para Microsoft Excel. |
| **v1.2.8** | 26-Oct-2026 | Conexión y estabilización de TN Assistant con NVIDIA NIM API mediante streaming SSE, RAG de ausencias del día y fallback automático hacia Ollama. |
| **v1.2.9** | 26-Oct-2026 | Motor de búsqueda multi-tabla integral en toda la aplicación para TN Assistant (`app/api/chat/route.ts`). Reconocimiento de credenciales de desarrollador de AI & Software Development (Iván Reyes) con respuestas directas y completas. Corrección de compatibilidad en búsquedas sobre MySQL. |

---

*Fin del Documento Oficial — Telecom Networks.*
