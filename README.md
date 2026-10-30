# Telecom Networks — Intranet Corporativa (v1.2.9)

Plataforma empresarial de última generación construida con **Next.js 15 (App Router)**, **React 19**, **Prisma ORM 5.22**, **MySQL 8.x** y **Redis**, diseñada para la gestión integral de equipos, incidencias técnicas de teletrabajo, vacaciones y permisos, calendario laboral, centro social, auditoría de operaciones y asistencia con Inteligencia Artificial híbrida (NVIDIA NIM Cloud + Ollama + Google Gemini).

---

## 📚 Documentación Oficial

El proyecto cuenta con documentación técnica y funcional exhaustiva:

- 📄 **[DOCUMENTACION.md](file:///d:/Intranet/DOCUMENTACION.md):** Manual completo de arquitectura, seguridad RBAC, variables de entorno, catálogo de 12 tipos de permisos, búsqueda multi-tabla en IA, data scoping y procedimientos de mantenimiento.
- 📕 **[documentacion_intranet.pdf](file:///d:/Intranet/documentacion_intranet.pdf):** Manual ejecutivo oficial en formato PDF listo para distribución institucional.
- 🎨 **[DESIGN_SYSTEM.md](file:///d:/Intranet/DESIGN_SYSTEM.md):** Sistema de diseño oficial, tokens CSS HSL, componentes glassmorphism y directrices visuales.
- 🚀 **[SERVER_MIGRATION_PACKAGE/GUIA_PASO_A_PASO_MIGRACION.md](file:///d:/Intranet/SERVER_MIGRATION_PACKAGE/GUIA_PASO_A_PASO_MIGRACION.md):** Guía paso a paso para despliegues y restauración desde cero en servidores de producción.
- 📝 **[CHANGELOG.md](file:///d:/Intranet/CHANGELOG.md):** Registro cronológico detallado de versiones y mejoras continuas.

---

## ⚡ Inicio Rápido (Desarrollo Local)

### 1. Requisitos Previos
- Node.js v20.x LTS o superior
- Servidor MySQL 8.x o MariaDB 10.11+
- Servidor Redis 7.x (opcional para desarrollo, recomendado para sesiones)

### 2. Instalación de Dependencias
```bash
npm install --legacy-peer-deps
```

### 3. Configurar Variables de Entorno
Copia la plantilla y ajusta tus credenciales locales:
```bash
cp .env.example .env.local
```

### 4. Base de Datos & Prisma ORM
```bash
# Generar cliente fuertemente tipado
npx prisma generate

# Sincronizar esquema de base de datos
npx prisma db push

# Poblar feriados oficiales y roles base
node scripts/seed_holidays.js
node scripts/seed_rbac.js
```

### 5. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la plataforma en funcionamiento.

---

## 🛡️ Seguridad y Control de Acceso (RBAC)
- **Dirección & Desarrollador del Sistema (Iván Reyes - AI & Software Development):** Acceso global y credenciales de superadministrador para soporte, depuración y mantenimiento integral.
- **Tecnología / IT (`TECHNOLOGY`, `IT_MANAGER`, `TECHNOLOGY_ADMIN`):** Configuración de TI, gestión de IA, auditoría en tiempo real y administración de usuarios.
- **Managers:** Creación y edición de colaboradores con cualquier dominio de correo, aprobaciones directas.
- **Supervisores y Team Leads:** Autorización de ausencias con Data Scoping restringido a sus escuadrones asignados y registro administrado masivo.
- **Protección contra IDOR / BOLA:** Validación estricta a nivel de base de datos antes de mutaciones de estado en solicitudes.


