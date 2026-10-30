# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

## [1.4.0] - 2026-10-30

### Added
- **Arquitectura de Roles Administrativos y Super Administradores (`lib/auth.ts`, `lib/permissions.ts`, `lib/authorizationRoles.ts`, `lib/auditPermissions.ts`, `lib/requestAuthorization.ts`):**
  - **Nuevo Rol `ADMIN` Operativo:** Creado rol para Rose Estevez, Ivana Lowe y María Peralta con alcance corporativo global:
    - Creación de solicitudes de cualquier incidencia para sí mismos o en nombre de cualquier colaborador.
    - Aprobación y rechazo global de solicitudes en el Panel de Control (`/dashboard`) sin importar el grupo o departamento.
    - Acceso habilitado a Gestión de Usuarios (`/admin/users`) y Gestión de Grupos (`/admin/groups`).
    - Bloqueo y protección estricta contra acceso a Logs de Auditoría (`/admin/audit-logs`), Configuración TI (`/admin/config`) y Solicitudes de Rol (`/admin/role-requests`), tanto en el backend como en la barra lateral de navegación (`Sidebar.tsx`).
  - **Super Administradores Corporativos:** Asignación de privilegios de Super Administrador con acceso maestro total para Rafael Ureña y Pablo Brun (junto a Iván Reyes).
- **Soporte Multi-Grupo para Colaboradores y Managers (`prisma/schema.prisma`, `groupActions.ts`, `teamActions.ts`, `scripts/migrate_multi_group.mjs`):**
  - Colaboradores y managers ahora pueden pertenecer a múltiples grupos o proyectos simultáneamente mediante la relación many-to-many `ProjectMembers`.
  - Sincronización en tiempo real del grupo primario (`projectId`) y membresía multi-grupo (`projects`).
- **Asignación Obligatoria de Líder al Crear Grupos (`GroupManager.tsx`, `groupActions.ts`):**
  - El modal de creación de nuevos grupos ahora exige seleccionar un Líder de Escuadrón (Supervisor / Manager) antes de guardar, garantizando que todo grupo nazca con liderazgo operativo asignado.
- **División Independiente de Checkboxes de Aprobación y Bono (`timeOffActions.ts`, `VacationForm.tsx`):**
  - Separación funcional en el formulario de registro administrado: ahora se presentan dos opciones independientes: *"Aprobar automáticamente"* e *"Impactar bono"*.
- **Exportación de Reportes con Filtros Semanales y por Tipo de Incidencia (`AdminDashboard.tsx`, `timeOffActions.ts`):**
  - Selector de periodicidad ampliado en el Panel de Control: exportación de incidencias filtradas por semana específica (`Semana 1`, `Semana 2`, etc.) o por mes completo.
  - Filtro granular por tipo específico de incidencia (Vacaciones, Permisos Especiales, Llegadas Tarde, Salidas Tempranas, Falla de Internet/Remoto, etc.).
- **Licencia por Matrimonio según Ley Laboral Dominicana (`VacationForm.tsx`, `timeOffActions.ts`, `holidayData.ts`):**
  - Nueva incidencia en la categoría *Salud y Familia*: 3 días laborables remunerados con justificación legal según el Art. 54 del Código de Trabajo de la República Dominicana y carga obligatoria de acta o certificado de matrimonio.
- **Soporte para Documentos y Correos de Outlook `.msg` (`VacationForm.tsx`, `lib/privateStorage.ts`):**
  - Incorporación de la extensión `.msg` entre los formatos admitidos para adjuntos y documentación de soporte en todas las incidencias.

### Fixed
- **Adaptabilidad a Modo Claro en Formulario de Nueva Solicitud (`VacationForm.tsx`, `vacations.module.css`):**
  - Corrección de estilos fijos oscuros en el apartado de Nueva Solicitud; ahora responde correctamente al tema claro con fondos, bordes y textos adaptados.
- **Insignias de País en Feriados Oficiales (`UpcomingHolidaysWidget.tsx`):**
  - Corrección visual en la visualización de feriados en inglés y español para mostrar adecuadamente los distintivos de país ("DO" y "US") en miniatura.

## [1.3.1] - 2026-10-28

### Added
- **Edición Directa de Grupos desde el Tablero (`app/groups/[id]/`, `groupActions.ts`, `route.ts`):**
  - **Acceso Exclusivo por Permisos:** Los Líderes de Escuadrón (supervisores y sub-líderes asignados al grupo) y los Administradores del Intranet (`TECHNOLOGY`, `IT_MANAGER`, `TECHNOLOGY_ADMIN`, Superadmin) ahora pueden editar la configuración del grupo directamente al abrir su tablero (`/groups/[id]`), sin tener que depender exclusivamente de "Gestión de Grupos".
  - **Modal Integral de Configuración de Grupo (`GroupEditModal.tsx`):**
    - **Pestaña "Información General":** Edición de nombre del grupo, misión/descripción, correo electrónico de contacto, color temático (con selector nativo y paleta de 10 colores predefinidos), ícono/emoji distintivo (selector de 20 emojis y campo libre) y URL de imagen/logo.
    - **Pestaña "Integrantes":** Búsqueda de colaboradores en tiempo real con selector multi-selección, incorporación masiva al grupo y desvinculación de integrantes con un solo clic.
    - **Pestaña "Liderazgo":** Asignación y actualización directa de Líderes de Escuadrón (Supervisores) y Sub-Líderes.
  - **Botones y Accesos Rápidos Contextuales (`TeamDashboardView.tsx`):**
    - Botón destacado *"Editar Grupo"* en la cabecera y en el panel principal del escuadrón.
    - Acciones contextuales *"Sumar Integrantes"* y *"Gestionar Líderes"* dentro de la sección "Estructura del Equipo".
    - Enlace inteligente de retorno: dirige a *"Gestión de Grupos"* para administradores o a *"Inicio"* para líderes operativos sin acceso al panel TI.
  - **Seguridad en Backend y Auditoría (`groupActions.ts`, `api/admin/groups/members`):**
    - Implementación de `assertCanEditGroup(groupId)` en Server Actions (`updateGroup`, `addMembersToGroup`, `removeMembersFromGroup`, `setGroupLeaders`) y en la API REST.
    - Verificación a nivel de base de datos para impedir que usuarios ajenos o sin liderazgo en el grupo modifiquen sus datos, manteniendo la creación y eliminación definitiva de grupos restringida a administradores de Tecnología.

## [1.3.0] - 2026-10-27

### Added
- **Visualización Dinámica de Versión en Pie de Menú y Login (`Sidebar.tsx`, `LoginForm.tsx`, `lib/version.ts`):**
  - Indicador automático de la versión activa de la Intranet corporativa (`v1.3.0`) sincronizado dinámicamente desde `package.json` debajo de la sección de soporte.
- **Almacenamiento Seguro Fuera del Árbol Público para Documentos Médicos (`lib/privateStorage.ts`):**
  - Migración y aislamiento de justificantes médicos hacia `/home/storage/private-uploads/medical/` fuera de `public/` para neutralizar accesos directos no autenticados.
  - Validación criptográfica estricta de formato mediante Magic Bytes (PDF, PNG, JPG/JPEG y WEBP) rechazando archivos ejecutables o camuflados.
  - Asignación de nombres anonimizados con UUID v4 y saneamiento contra vulnerabilidades de *Path Traversal*.
  - Configuración flexible mediante variable de entorno `PRIVATE_STORAGE_PATH` con soporte fallback a rutas anteriores.
- **Endpoint Seguro de Streaming y Prevención BOLA/IDOR (`app/api/attachments/[requestId]`):**
  - Controlador de streaming con autorización a nivel de fila (*Row-Level Authorization*), permitiendo la descarga exclusivamente al colaborador solicitante, su supervisor directo, Managers, RRHH o Administrador Maestro.
  - Registro inmediato de incidentes de intento no autorizado en la tabla de auditoría (`AuditLog`) con IP, cabeceras seguras (`X-Content-Type-Options: nosniff`) y control estricto de caché (`no-store, no-cache`).
- **Arquitectura de Baja Lógica (Soft Delete) y Preservación de Trazabilidad (`prisma/schema.prisma`, `userActions.ts`):**
  - Implementación de campos `isActive`, `deletedAt` y `deactivatedBy` con índice compuesto `@@index([isActive, email])` en la base de datos MySQL.
  - Eliminación del borrado físico en cascada destructivo que eliminaba registros relacionales en más de 15 tablas, preservando permanentemente el historial de vacaciones, aprobaciones, reportes CSV de nómina y logs de auditoría.
  - Revocación de sesiones en tiempo real en Redis (`invalidateUserSessionsInRedis`) al desactivar una cuenta.
  - Filtrado integral de usuarios inactivos en listados de colaboradores, buscador, solicitudes de amistad y selector de grupos.
- **Diseño Ergonómico y Responsivo del Módulo de Vacaciones (`app/vacations/`):**
  - Sustitución del contenedor rígido de 1560px por un esquema adaptativo (`width: 100%; max-width: 1560px; margin-inline: auto; padding-inline: clamp(1rem, 3vw, 2.5rem)`).
  - Eliminación total del desbordamiento horizontal en pantallas estándar (1366x768, 1440x900) y optimización en monitores verticales o ultrawide.
  - Reestructuración de tarjetas informativas mediante CSS Grid dinámico (`minmax(260px, 1fr)`) y scroll horizontal contenido en tablas y calendarios.

## [1.2.9] - 2026-10-26

### Added
- **Motor de Búsqueda Integral en Toda la Aplicación y Autorización Maestra para TN Assistant (`app/api/chat/route.ts`):**
  - **Reconocimiento del Administrador Maestro:** Integración de `isCEO(session.user)` en el prompt del sistema. El asistente ahora reconoce a Iván Reyes (Administrador Maestro / AI & Software Development) con nivel de acceso global irrestricto, respondiendo con datos corporativos completos y eliminando respuestas evasivas de *"contacta a Recursos Humanos o a tu supervisor"*.
  - **Búsqueda Multi-Tabla Exhaustiva en la Base de Datos:**
    - **Compatibilidad con MySQL:** Corrección del error de validación de Prisma (`mode: insensitive`) incompatible con el dialecto MySQL, permitiendo que la búsqueda de colaboradores (`User`) encuentre de manera infalible a cualquier persona por nombre o apellido.
    - **Búsqueda de Colaboradores e Historial:** Extrae en tiempo real nombre completo, cargo/posición, departamento/grupo, balance de vacaciones (`vacationBalance`) y el historial de solicitudes recientes (`TimeOffRequest`).
    - **Búsqueda de Grupos y Liderazgo:** Incluye detalles de grupos (`Project`), cantidad de miembros, supervisores y sub-líderes.
    - **Búsqueda de Publicaciones y Novedades:** Consulta las publicaciones recientes del muro (`Post`) para responder preguntas sobre comunicados y noticias corporativas.
    - **Búsqueda de Eventos y Documentos:** Consulta eventos programados (`CalendarEvent`) y búsqueda semántica en documentos (`Document`).

## [1.2.8] - 2026-10-26

### Added
- **Reactivación y Conexión de TN Assistant a NVIDIA NIM API (`app/api/chat/route.ts`):**
  - **Integración con NVIDIA NIM como Motor Principal:** Conexión de alta velocidad hacia el modelo `meta/llama-3.2-11b-vision-instruct` de NVIDIA Cloud API mediante streaming SSE, resolviendo la caída del servicio por falta de conectividad hacia el servidor local de Ollama.
  - **Tolerancia a Fallos y Fallback Automático:** Si la API de NVIDIA experimenta intermitencia, conmuta automáticamente hacia Ollama local si este vuelve a estar disponible, evitando caídas inesperadas en el chat corporativo.
  - **Búsqueda Semántica de Colaboradores y Vacaciones (RAG Context):** Detección automática de nombres y apellidos en las preguntas de los colaboradores (ej. *"¿Cuántas vacaciones le quedan a Johan?"*), consultando en tiempo real la base de datos para responder con exactitud el balance de días disponibles, cargo y departamento.
  - **Corrección de Alcances y Variables en Acciones de IA (`ollamaActions.ts`):** Corrección de importación de roles autorizados de tecnología y gestión de variables para resúmenes de documentos y Kudos con IA.

## [1.2.7] - 2026-10-26

### Added
- **Exportación Personalizada de Reporte CSV con Filtro por Grupo y Mes (`AdminDashboard.tsx`):**
  - **Modal Interactivo de Exportación:** Al presionar *Exportar Reporte (CSV)* en el Panel de Control, se despliega un modal estilizado (Dark Mode, backdrop blur) para configurar con precisión los parámetros del reporte antes de descargarlo.
  - **Filtro por Grupo / Campaña:** Permite exportar todas las solicitudes del personal supervisado (*"Todos los grupos y campañas"*) o seleccionar un grupo específico (ej. Soporte, Ventas, IT, o *Sin Grupo Asignado*), aislando exclusivamente los colaboradores pertenecientes a ese equipo.
  - **Filtro por Mes y Año:** Selector dedicado para elegir cualquier mes del año (Enero a Diciembre o *"Todos los meses"*), junto con selector de año y botones de acceso rápido (*⚡ Mes Actual*, *⏪ Mes Anterior*, *📅 Todo el Año*, *🌐 Todo el Histórico*).
  - **Filtro Adicional por Estado de Solicitud:** Selector para exportar todas las solicitudes o filtrar por *"Solo Aprobadas"* (ideal para nómina y RRHH), *"Solo Pendientes"* o *"Solo Rechazadas"*.
  - **Previsualización en Vivo de Registros:** Resumen dinámico que calcula al instante la cantidad exacta de registros encontrados, con desglose de solicitudes aprobadas, pendientes y rechazadas, y nombre previsto del archivo a descargar.
  - **Nomenclatura Inteligente y Formato UTF-8 BOM:** Genera nombres descriptivos de archivo (ej. `Reporte_Permisos_Soporte_Tecnico_Octubre_2026.csv`) e incluye el prefijo UTF-8 BOM (`\uFEFF`) para que Microsoft Excel y Numbers reconozcan correctamente caracteres y tildes en español sin distorsiones.

## [1.2.6] - 2026-10-26

### Added
- **Agrupamiento de Solicitudes y Permisos por Grupo / Campaña en Panel de Control (`AdminDashboard.tsx`, `timeOffActions.ts`):**
  - **Visualización en Recuadro Compartido por Grupo:** En lugar de mostrar una lista plana desordenada, las solicitudes de permisos, vacaciones e incidencias se organizan visualmente dentro del recuadro o tarjeta del grupo correspondiente (`user.project`). Si dos o más colaboradores del mismo grupo solicitan permisos, aparecen unificados en el mismo recuadro del grupo.
  - **Identidad Visual y Métricas del Grupo:** Cada recuadro cuenta con cabecera distintiva que hereda el color temático del grupo (`project.color`), imagen o avatar con ícono (`project.image` / `project.icon`), contador de colaboradores únicos (`👥 X colaboradores`) y badges con el conteo de solicitudes pendientes, aprobadas y rechazadas del grupo.
  - **Soporte de Colaboradores Sin Grupo:** Las solicitudes de usuarios sin asignación de grupo se presentan juntas en un recuadro dedicado `"Sin Grupo Asignado"` con estética neutra y profesional.
  - **Píldoras de Filtrado Rápido por Grupo:** Barra horizontal de chips/píldoras interactivas con el color distintivo de cada grupo para aislar un grupo específico o ver todos con un solo clic.
  - **Controles de Colapso y Búsqueda en Tiempo Real:** Buscador predictivo (por nombre de empleado, correo, motivo, tipo de solicitud o grupo) y botón de colapsar/expandir grupos (individual o masivo).
  - **Selector de Modo de Vista:** Switch moderno para alternar entre vista agrupada (`"Por Grupos"`) y vista de lista clásica (`"Lista Plana"`).
  - **Enriquecimiento de Consultas Backend (`timeOffActions.ts`):** Las consultas `getPendingRequests()` y `getAllSupervisedRequests()` ahora extraen `id`, `name`, `color`, `icon` e `image` de la entidad `Project` para alimentar de forma dinámica la interfaz.

## [1.2.5] - 2026-10-26

### Added
- **Flexibilización de Dominio de Correo para Creación de Usuarios (`userActions.ts`, `auth.ts`, `permissions.ts`, `UserManager.tsx`):**
  - **Soporte de Cualquier Dominio para Creadores Autorizados:** Permite que el Administrador Maestro (Ivan Reyes), personal de Tecnología (`TECHNOLOGY`, `IT_MANAGER`, `TECHNOLOGY_ADMIN`), y `MANAGER` puedan crear usuarios con cualquier correo electrónico válido (p. ej. Gmail, Outlook, dominios externos o de contratistas), eliminando el bloqueo forzado de `@tnoutsourcing.com`.
  - **Habilitación de Gestión de Usuarios para Managers:**
    - Otorgamiento de permisos `users:create` y `users:edit` al rol `MANAGER` en `lib/permissions.ts`.
    - Habilitación del panel de creación de usuarios en `UserManager.tsx` para el rol `MANAGER`.
    - Habilitación del enlace de navegación *Gestión de Usuarios* en `Sidebar.tsx` y pase perimetral en `middleware.ts`.
  - **Autenticación Multi-Dominio:** Actualización del callback `signIn` en `lib/auth.ts` para permitir el inicio de sesión con credenciales a cualquier usuario verificado y activo en la base de datos sin restricción de sufijo de dominio.
  - **Alineación de UX:** Actualización del formulario de creación en `UserManager.tsx` a *CORREO ELECTRÓNICO* con placeholder `usuario@correo.com`.

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
