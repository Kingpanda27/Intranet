# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

---

## [Unreleased]

### Added
- **Sincronización Automática con DeskTime (`sync_desktime_groups.mjs`):** Extracción e integración en modo solo lectura (`SELECT`) con la base de datos MySQL externa `wfm_platform` (`desktime_employee_data`, `odoo_employee_data`, `org_team_managers`), creando y homologando 49 grupos/escuadrones, mapeando 274 empleados a sus equipos correspondientes, sincronizando puestos laborales (`position`), asignando líderes y sublíderes, y actualizando roles de sistema.
- **Rediseño Integral de Gestión de Grupos (`GroupManager.tsx` y `admin/groups/page.tsx`):**
  - Banner interactivo de métricas KPI (Escuadrones Activos, Miembros Asignados, Líderes Activos y Promedio de Integrantes por Grupo).
  - Buscador reactivo en tiempo real y filtros rápidos por categorías (*Todos*, *Con integrantes*, *Vacíos*, *Con líderes*).
  - Reemplazo de la antigua 'X' roja de eliminación por un botón circular minimalista con icono SVG de papelera, halo resplandeciente (`glow`) al pasar el cursor y tooltip contextual.
  - **Modal Moderno de Confirmación (`ConfirmModal`):** Cuadro de diálogo centrado en pantalla con desenfoque de fondo (`backdrop-filter: blur(12px)`), mensaje preventivo y advertencia de confirmación antes de desvincular usuarios.
  - **Adición Masiva de Integrantes (`AddMembersModal` y `groupActions.ts`):** Modal interactivo con buscador instantáneo, filtrado por pestañas (*Todos*, *Sin grupo*, *En otro grupo* con distintivo visual de transferencia) y selección múltiple para agregar múltiples colaboradores a la vez.
  - **Eliminación Masiva de Integrantes:** Modo de selección múltiple por tarjeta (*"Seleccionar varios"*) con casillas de verificación individuales y botón de desvinculación en bloque (*"Quitar seleccionados"*).
  - **Soporte para Roles `TEAM_LEAD` y `TECHNOLOGY_ADMIN`:** Integración en la matriz de permisos (`permissions.ts`), validación en acciones de usuario (`userActions.ts`), soporte en gestión de tiempo libre (`timeOffActions.ts`) y habilitación de administración de grupos para `TECHNOLOGY_ADMIN`.
- Monitoreo en tiempo real de telemetría y tiempos de inferencia de la API de NVIDIA NIM.
- **Importación Masiva Nativa desde Microsoft 365 Admin Center (`UserManager.tsx` y `userActions.ts`):** Compatibilidad directa con archivos CSV de Microsoft Entra / M365 (`Display name`, `User principal name`, `Block credential`, `Title`, `Department`, `Object Id`), filtrando de manera automática únicamente usuarios activos (`Block credential = False`) y actualizando perfiles existentes sin duplicidad ni caídas de servidor.
- **Modal Moderno de Confirmación y Eliminación Masiva de Usuarios (`UserManager.tsx` y `userActions.ts`):** Reemplazo definitivo del diálogo nativo del navegador (`confirm()`) por un pop-up moderno centrado en la pantalla con estética glassmorphism, desenfoque de fondo (`backdrop-filter: blur(8px)`), lista previa desplazable de usuarios seleccionados, roles y advertencia de seguridad.
- **Selección Múltiple y Barra Flotante de Acciones en Lote:** Checkboxes individuales por fila y selector global en cabecera con estado indeterminado, barra flotante con conteo en tiempo real y botón de eliminación masiva en un solo clic.

### Changed
- Refactorización progresiva de estilos para soporte de temas personalizados por departamento.

### Fixed
- **Eliminación Segura en Cascada de Usuarios (`cleanupUserRelations` en `userActions.ts`):** Limpieza preventiva y transaccional de dependencias de claves foráneas (`account`, `session`, `chatMessage`, `conversation`, `document`, `friendship`, `timeOffRequest`, `notification`, `like`, `comment`, `post`, `recognition`, `supportTicket`, etc.) impidiendo fallos de integridad referencial SQL al eliminar usuarios.
- **Protección de Autocuenta y Jerarquía IT:** Bloqueo de autoeliminación de la cuenta en uso e imposibilidad de que cuentas estándar o de Tecnología eliminen a otros miembros de Tecnología salvo que se cuente con rol `IT_MANAGER`.
- **Métricas Reales del Dashboard (`MetricsInteractiveCards` y `homeActions.ts`):**
  - **Eventos Semana:** Se corrigió el rango semanal (Lunes 00:00:00 a Domingo 23:59:59 con delimitador `endOfWeek`) eliminando el conteo inflado de feriados y eventos de meses futuros.
  - **Activos Hoy:** Se eliminó la función de redondeo artificial (`Math.max(activeUsersCount, 1)`), mostrando la cantidad fidedigna de empleados con actividad en el día.
  - **Nuevos Documentos:** Se vinculó el contador de la tarjeta a documentos creados durante el mes en curso (`newDocsThisMonth`), eliminando la muestra engañosa de documentos antiguos y habilitando el desglose entre documentos nuevos del mes y repositorio global con enlaces de descarga operativos.
- **Visualización de Próximo Feriado (`UpcomingHolidaysWidget.tsx`):**
  - Se corrigió el formateo de fecha UTC en la tarjeta principal de feriados evitando el desfasaje horario que mostraba erróneamente "8 nov" en lugar del "9 nov" (Día de la Constitución trasladado a lunes 9 de noviembre).
- **Permisos de Gestión de Usuarios (`permissions.ts`):**
  - Se otorgó el permiso `users:delete` al rol `TECHNOLOGY`, permitiendo la eliminación de usuarios del sistema con la salvaguarda de que solo un `IT_MANAGER` puede eliminar a otro usuario de Tecnología.

---

## [1.1.0] - 2026-10-21

### Added
- **Integración con NVIDIA NIM AI:** Implementación del motor de inferencia de NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`) con autenticación mediante API Key y enrutamiento con tolerancia a fallos hacia Ollama.
- **Soporte Bilingüe Interactivo:** Selector de idioma dinámico (Español / English) en la cabecera de categorías del chat de soporte, adaptando instantáneamente los prompts del sistema y los controles interactivos.
- **Metodología Universal de 3 Intentos:** Estructura estricta de soporte L1 en tres niveles progresivos:
  1. *Nivel Físico / Superficial:* Comprobación visual de conexiones, botones y cables.
  2. *Nivel Aplicación / Interfaz:* Acciones no destructivas dentro de la misma aplicación o navegador (`Ctrl + F5`, selectores internos).
  3. *Nivel Sesión / Alternativa guiada:* Apertura en modo incógnito (`Ctrl + Shift + N`), reinicio de sesión en plataforma o puertos alternativos.
- **Protocolo y Plantilla de Escalación Automática L2:** Generación desatendida de tickets en la base de datos MySQL de Intranet (`SupportTicket`) y envío de reportes detallados a Helpdesk a través de EmailJS tras completarse el tercer intento fallido.
- **Bot de WhatsApp y Tareas Programadas (Crons):** Servicio en segundo plano para atención por WhatsApp (`whatsapp-web.js`), con exclusión de grupos y contactos, generación de reportes mensuales y resúmenes ejecutivos semanales vía Google Gemini 1.5 Flash.
- **Paneles de Configuración Administrativa:** Nuevas vistas de administración para gestión de credenciales de IA (`AiIntegrationsManager`) y visor centralizado de tickets de soporte (`SupportTicketsManager`).
- **Pipeline de Despliegue Automatizado:** Scripts DevOps (`deploy_update_to_server.mjs`) para sincronización remota mediante SSH, actualización de variables de entorno, compilación de Next.js (`npm run build`) y recarga de procesos PM2 sin tiempo de inactividad en el servidor `192.168.80.241`.

### Changed
- **System Prompt de AILlama (Política de Cero Fricción):**
  - Prohibición absoluta de sugerir apagar, reiniciar, suspender la computadora o iniciar en Modo Seguro.
  - Vetado el uso de terminales o comandos (`CMD`, `PowerShell`, `ping`, `ipconfig`), `BIOS`, `DNS`, `Puerta de enlace` o Administrador de Dispositivos.
  - Regla de una sola acción por respuesta, redactada en segunda persona directa (*"Por favor desconecta..."*).
- **Reubicación de Acceso a Soporte IT:** Botón de navegación reubicado en la barra lateral (`Sidebar`) estratégicamente entre *Mi Perfil* y *Logs de Auditoría*, con indicador de estado y resalte visual distintivo.
- **Controles de Retroalimentación en Chat:** Botones interactivos actualizados para reflejar el progreso del diagnóstico: `Sí, se solucionó` y `No funcionó (${attempt}/3)`.

### Fixed
- **Corrección de Superposición de Barra de Contactos:** Solucionado el solapamiento visual de la barra flotante de contactos (`SocialChatBar`) sobre el campo de entrada y botón de envío del chat; ahora se oculta de manera automática al abrir Soporte AILlama y se restaura al salir a otra sección.
- **Eliminación de Respuestas en Tercera Persona:** Corrección en la formulación de prompts donde el modelo generaba meta-instrucciones como *"Pide al usuario verificar..."* en lugar de dirigirse directamente al colaborador.
- **Consistencia Lingüística Estricta:** Eliminada la mezcla accidental de idiomas (Spanglish) en las respuestas del asistente, forzando monolingüismo según el toggle activo (ES o EN).
- **Manejo de Excepciones en Inferencia:** Control robusto de errores de red frente a caídas de Ollama o límites de API, derivando el caso a Helpdesk sin bloquear la interfaz de usuario.

### Removed
- **Botonera Temporal de Autenticación Rápida:** Eliminado el botón de bypass de inicio de sesión de prueba (*"Entrar como Ivan Jose Reyes"*) para preservar la integridad del flujo de autenticación corporativa.
- **Comandos de Consola y Red en Sugerencias:** Retiradas todas las directrices previas que requerían ejecución técnica en terminal por parte del colaborador.

---

## [1.0.0] - 2026-10-16

### Added
- Estructura base de la plataforma Intranet corporativa sobre Next.js 15, React 19 y Prisma ORM.
- Módulos de calendario laboral, feriados, gestión de recursos y perfiles de colaboradores.
- Prototipo inicial de asistente de soporte técnico L1 y arquitectura de mensajería social.
