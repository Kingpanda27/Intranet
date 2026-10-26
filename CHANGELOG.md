# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

## [1.2.4] - 2026-10-26

### Added
- **Matriz de Permisos y Alcance de Datos (Data Scoping / Row-Level Authorization / IDOR Protection):**
  - **Motor Central de Autorización (`lib/authorizationRoles.ts` y `lib/requestAuthorization.ts`):**
    - `isCEO`: Acceso y alcance global para CEO / Master Admin (Ivan Reyes) / SuperAdmin. Visualización y gestión total sin restricciones corporativas.
    - `canAccessITConfig` / `isTechnologyStaff`: Acceso exclusivo al módulo de Configuración de TI (`/admin/config`, `/configuracion-ti`, y `/api/whatsapp/*`) para personal de `Technology` / `IT` y `IT Manager`. Restricción total para RRHH, Managers de otras áreas, Supervisores y Empleados regulares.
    - `canAccessApprovalsPanel`: Acceso al Panel de Aprobaciones (`/dashboard`) reservado para roles directivos y supervisores (`CEO`, `RRHH`, `Manager`, `IT Manager`, `Supervisor`, `Team Lead`, `Technology`). Bloqueo estricto para empleados regulares (`USER`, `AGENT`).
    - `getTimeOffScopeFilter`: Cláusula SQL/ORM dinámica que impone aislamiento de datos por rol. Para Supervisores y Team Leads, filtra estrictamente por `userId IN managedUserIds` mediante las relaciones `supervisors` y `subLeaders` de sus grupos asignados. Para `IT_MANAGER`, permite alcance global en incidencias técnicas (`REMOTE_*`) y solicitudes de su equipo directo.
    - `authorizeRequestAction`: Blindaje contra vulnerabilidades BOLA / IDOR. Valida a nivel de base de datos que el usuario solicitante sea supervisor legítimo del empleado antes de procesar cualquier cambio de estado.
  - **Endpoints API Blindados (`app/api/requests/*`):**
    - `POST` / `PATCH /api/requests/:id/approve`: Verificación de sesión y pertenencia a equipo. Responde `403 Forbidden` ante intentos de aprobación de solicitudes ajenas.
    - `POST` / `PATCH /api/requests/:id/reject`: Verificación de pertenencia y captura obligatoria/opcional de motivo de rechazo.
    - `GET /api/requests`: Consulta con alcance dinámico de solicitudes (`getTimeOffScopeFilter`) y filtrado opcional por `?status=`.
    - `GET` / `PATCH /api/requests/:id`: Verificación de propiedad (solicitante) o supervisor directo para consultas puntuales.
  - **Protección de Enrutamiento y Frontend:**
    - Nueva página `/acceso-denegado` con diseño Dark Mode de alta seguridad, visualización de credenciales de sesión y botones de retorno contextual.
    - Redirección de URL directa `/configuracion-ti` con validación en servidor hacia `/admin/config` o `/acceso-denegado`.
    - Protección en Server Components de `/admin/config` y `/dashboard` contra accesos no autorizados.
    - `middleware.ts`: Verificación perimetral en borde para rutas de interfaz (`/admin/config`, `/configuracion-ti`, `/dashboard`) y endpoints de configuración (`/api/whatsapp/*`).
    - `Sidebar.tsx`: Ocultamiento de la opción `Configuración TI` para RRHH y otros roles no autorizados, manteniendo intactas las opciones para roles con permisos válidos.

## [1.2.3] - 2026-10-26

### Added
- **Gestión y Asignación de Líderes por Grupo (`GroupManager.tsx`, `groupActions.ts`, `api/admin/groups/members`):**
  - **Botón y Acción Rápida en Cada Grupo:** Acceso directo mediante ícono de corona dorada `[👑]` en la barra de herramientas superior de cada tarjeta de grupo, así como botones explícitos `[👑 Asignar Líderes]` / `[Gestionar]` en la sección de liderazgo para todos los estados (grupos con ambos roles, con supervisores, con sub-líderes o sin líderes asignados).
  - **Modal Interactivo `ManageLeadersModal`:**
    - Panel de resumen con chips visuales e interactivos de líderes principales (`👑`) y sub-líderes (`🛡️`) seleccionados con botón de desasignación instantánea.
    - Pestañas de filtrado rápido: `👑 Roles de Liderazgo` (Supervisores, Managers, Team Leads, etc.), `👥 Integrantes del Grupo`, y `🌐 Todos los usuarios`.
    - Barra de búsqueda predictiva en tiempo real por nombre, correo, cargo o rol.
    - Lista de colaboradores candidatos con botones directos para asignar como Líder Principal (`+ Líder`), asignar como Sub-Líder (`+ Sub-Líder`), intercambiar roles (promover/mover) o quitar de liderazgo.
    - Barra inferior flotante con conteo exacto de asignaciones, botones de Cancelar y Guardar con indicador de carga animado.
  - **Integración Backend Dual y Auditoría:**
    - Server Action `setGroupLeaders(groupId, supervisorIds, subLeaderIds)` con validación de permisos de Tecnología/IT Manager.
    - Endpoint REST `PUT /api/admin/groups/members` con soporte de fallback ante contingencias de red.
    - Registro de auditoría `GROUP_LEADERS_UPDATED` con metadata completa (conteo de supervisores y sub-líderes).
    - Actualización optimista de estado local en la interfaz (`localGroups`) y notificación toast de confirmación sin recargar la página.

## [1.2.2] - 2026-10-26

### Added
- **Modo de Registro Administrado Masivo para Equipos (`VacationForm.tsx`, `timeOffActions.ts`):**
  - **Selector de Ámbito de Registro:** Opciones de radio `Para mí mismo` (por defecto) y `En nombre de equipo / colaboradores` con badge distintivo `Rol Supervisor/Manager`.
  - **Panel de Asignación Masiva Contenido:**
    - Sub-tabs/Toggle con diseño Dark Mode entre **Por Grupo / Campaña / Turno** y **Selección Individual Múltiple**.
    - **Opción A (Por Grupo):** Dropdown con conteo de colaboradores por escuadrón/campaña y botón rápido `[Seleccionar todos]` que añade a todos los integrantes en un solo clic.
    - **Opción B (Selección Individual Múltiple):** Input predictivo con autocompletado en tiempo real por nombre, correo o ID y chips visuales interactivos con avatar/iniciales, tooltip y botón `×` para desasignar.
  - **Barra de Resumen y Gestión de Excepciones:**
    - Contador reactivo: `👥 Total asignados: X colaboradores`.
    - Menú desplegable `[Ver lista / Gestionar excepciones (▼)]` con checkboxes individuales para desmarcar rápidamente colaboradores específicos no afectados por la incidencia técnica o permiso.
    - Botón `[Limpiar selección]` para restablecer la asignación completa.
  - **Diálogo Modal de Confirmación Masiva:** Diálogo previo al envío cuando se asignan más de 1 colaborador: *"¿Deseas aplicar la incidencia [Tipo de Incidencia] a X colaboradores del equipo?"* con desglose de horario, estado de aprobación automática y lista previa de colaboradores.
  - **Soporte Backend para Lotes (`timeOffActions.ts`):**
    - Procesamiento de `assigned_employee_ids: string[]` en `createTimeOffRequest`.
    - Creación iterativa de registros de incidencias/solicitudes vinculados al supervisor y al colaborador objetivo.
    - Generación de notificaciones individuales en la plataforma para cada miembro asignado y registro de auditoría `CREATE_TIME_OFF_MASS` con metadata estructurada.
    - Notificación por correo agrupada enviada a RRHH / Supervisión con el resumen del lote.

## [1.2.1] - 2026-10-26

### Changed
- **Ampliación y Balance de Contenedor en Vacaciones y Permisos (`vacations/page.tsx`):**
  - Se incrementó el `maxWidth` del contenedor de `1200px` a `1560px` conservando su centrado armónico, eliminando el espacio vacío sobredimensionado a la izquierda junto a la barra lateral sin apretar el lateral derecho.
  - Ajuste de proporciones en la cuadrícula principal a `1fr 380px` con un espaciado óptimo (`gap: 2rem`), permitiendo que el formulario de solicitudes y las métricas aprovechen la resolución de pantalla distribuyéndose en columnas limpias de alta legibilidad.

## [1.2.0] - 2026-10-26

### Added
- **Refactorización Integral del Panel de Nueva Solicitud y Teletrabajo (`VacationForm.tsx`, `timeOffActions.ts`, `VacationList.tsx`, `validations/index.ts`):**
  - **Selector de Categorías (Pills / Segmented Tabs):** Pestañas segmentadas en cabecera (*Todas*, *Tiempo Libre*, *Salud y Familia*, *Incidencias Remoto / IT* con badge animado de advertencia *Urgente*).
  - **Modo Colapsable (Show More / Show Less):** Despliegue inicial de las 6 opciones más frecuentes en la vista global y botón interactivo `[Mostrar más incidencias (6) ↓]` / `[Mostrar menos ↑]`, mostrando directamente todas las tarjetas al filtrar por categorías específicas.
  - **Identidad Cromática Individual (12 tipos de solicitud):** Paleta y halo suave para cada tarjeta en estado hover y selección activa:
    - *Vacaciones:* Azul eléctrico (`#3b82f6`)
    - *Permiso Especial:* Índigo (`#6366f1`)
    - *Reposición de Horas:* Turquesa / Teal (`#14b8a6`)
    - *Salir Temprano:* Ámbar (`#f59e0b`)
    - *Enfermedad (corta):* Esmeralda (`#10b981`)
    - *Licencia Médica Oficial:* Rosa / Carmesí (`#f43f5e`)
    - *Maternidad / Paternidad:* Fucsia (`#ec4899`)
    - *Fallecimiento / Duelo:* Violeta / Púrpura suave (`#8b5cf6`)
    - *Falla de Internet:* Naranja advertencia (`#f97316`)
    - *Corte de Energía Eléctrica:* Amarillo relámpago (`#eab308`)
    - *Avería de Hardware / PC:* Rojo alerta (`#ef4444`)
    - *Fallo de VPN / Accesos:* Púrpura eléctrico (`#a855f7`)
  - **Jerarquía Tipográfica Mejorada:** Títulos de tarjetas en 17px (`#f8fafc`), subtítulos descriptivos en 13.5px (`#cbd5e1`), etiquetas de campo legibles en 15px (`#e2e8f0`) e inputs accesibles en 15px que evitan zoom indeseado en móviles.
  - **Formulario Reactivo y UX Condicional para Teletrabajo:**
    - Exención automática de la política de 25 días de anticipación para emergencias técnicas y supresión de `Fecha Fin` estándar.
    - Captura precisa con `datetime-local` para la fecha y hora de la falla.
    - Selector desplegable de tiempo estimado de interrupción (*1-2 horas*, *Medio turno*, *Turno completo*, *Indefinido*).
    - Campo contextual dinámico adaptativo (*Proveedor ISP*, *Empresa Distribuidora Eléctrica*, *Componente o Dispositivo Afectado*, *Herramienta o Acceso Afectado*).
    - Toggle de solicitud de reemplazo / revisión de equipo por IT para averías de hardware.
    - Cómputo de 0 días de vacaciones consumidos (`workingDays = 0`) para incidencias de teletrabajo y notificación desatendida por correo a supervisores y RRHH.
- **Centro Integral de Auditoría & Trazabilidad (`auditActions.ts`, `AuditLogViewer.tsx`, `auditPermissions.ts`):**
  - **Control de Acceso Segmentado:** Visualización reservada exclusivamente para Supervisores, Managers, equipo de Tecnología (`TECHNOLOGY`, `TECHNOLOGY_ADMIN`, `IT_MANAGER`), integrantes de *AI & Software Development* y desarrolladores de sistemas.
  - **Auditoría Completa de Operaciones del Sistema:**
    - Usuarios: Creación individual, actualización de perfiles/roles, eliminación en bloque, importación masiva M365, invitaciones y contraseñas.
    - Grupos: Creación, modificación de detalles, borrado de grupos y asignación/desvinculación individual y masiva de integrantes.
    - Configuraciones TI: Altas, bajas y actualizaciones de proveedores y llaves API de IA.
  - **Filtros Avanzados y Búsqueda Específica:** Selector dinámico por tipo de acción exacta (`USER_CREATED`, `GROUP_DELETED`, etc.), filtrado por módulos, estado de resultado (*Éxito*, *Rechazado*, *Fallido*, *Alerta*) y rangos de fecha (*Hoy*, *7 días*, *30 días*, *Todo el tiempo*).
  - **Rediseño Visual Creativo (UI/UX):**
    - 4 tarjetas KPI con métricas en tiempo real (Total de Eventos, Actividad de Hoy con pulso verde, Alertas/Rechazos e inventario de tipos de acciones auditadas).
    - Doble modalidad de visualización: **Tabla Dinámica** detallada y **Línea de Tiempo (Timeline Stream)** interactiva con nodos resplandecientes.
    - Exportación de auditoría con un solo clic en formatos **CSV** y **JSON**.
    - Inspector modal con visor de diferencias (*Antes vs. Después*) para modificaciones de datos y visor formateado de payload/metadata JSON con botón de copia rápida.
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
- **Resolución de Truncamiento Visual en Tarjetas de Grupos (`GroupManager.tsx`):**
  - Implementación de un selector adaptativo de liderazgo con pestañas segmentadas (`👑 Líderes` y `🛡️ Sub-Líderes`) y modo "Ver ambos", erradicando el desbordamiento horizontal que cortaba la sección de Sub-Líderes en pantallas medianas y móviles.
  - Ancho completo del 100% para cada fila de líder/sub-líder con tooltips contextuales nativos, permitiendo que nombres extensos se lean con total claridad sin recortes.
  - Optimización de la lista desplazable de integrantes (`maxHeight: 260px`), scrollbar minimalista e indicador inferior dinámico que señala la existencia de más miembros al desplazarse.
  - Ampliación del ancho base de tarjetas (`minmax(380px, 1fr)`) para un espaciado más limpio y estético.

### Changed
- **Configuración de Rol IT y Privilegios Maestros de Desarrollador para Iván Reyes:** Se estableció su rol en la plataforma como `TECHNOLOGY` (identificado como equipo de TI, no como Manager de TI), manteniendo a la vez privilegios maestros irrestrictos (`isSuperAdmin`) en todos los módulos (gestión de grupos, usuarios de TI, solicitudes de tiempo libre, feriados, configuración global de TI, IA Ollama, logs de auditoría, panel ejecutivo y API) reconociendo su labor de creador/desarrollador de la intranet.
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
