# Sistema de Diseño e Interfaz UI - Telecom Networks Intranet

Esta guía documenta el **Sistema de Diseño (Design System)** oficial de la intranet corporativa de Telecom Networks. Su propósito es servir como referencia técnica y visual para que cualquier nueva herramienta, módulo o vista externa que desarrolle el equipo mantenga la misma coherencia estética, comportamiento responsivo y facilidad de integración.

---

## 1. Filosofía Visual

El diseño de la intranet está inspirado en la estética moderna de herramientas como **Linear, Vercel y Notion**:
- **Glassmorphism:** Fondos de superficies translúcidas con desenfoque (`backdrop-filter: blur(...)`).
- **Micro-interacciones:** Transiciones fluidas con curvas cúbicas (`cubic-bezier(0.16, 1, 0.3, 1)`), efectos hover con elevación sutil (`translateY(-2px)` a `-4px`) y feedback táctil en clic (`scale(0.96)`).
- **Dark Mode First-Class:** Soporte nativo para Modo Claro y Modo Oscuro mediante variables CSS en formato **HSL**.
- **Iconografía:** [Lucide React](https://lucide.dev/) estándar (`size={18}` a `size={22}`).

---

## 2. Tipografía

El proyecto utiliza fuentes de Google Fonts optimizadas para interfaces limpias:
- **Familia principal:** `'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif`
- **Jerarquía:**
  - **H1 (Título de Página):** `font-size: 1.75rem` (28px) a `2rem` (32px), `font-weight: 800`, `letter-spacing: -0.02em`.
  - **H2 (Títulos de Sección / Modales):** `font-size: 1.25rem` (20px) a `1.5rem` (24px), `font-weight: 700`.
  - **H3 (Subtítulos / Tarjetas):** `font-size: 1rem` (16px) a `1.125rem` (18px), `font-weight: 600`.
  - **Etiquetas de Formulario (`.form-label`):** `font-size: 0.78rem` (12px), `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.05em`, color `hsl(var(--muted-foreground))`.
  - **Cuerpo / Textos (`p`, `span`):** `font-size: 0.875rem` (14px), `line-height: 1.6`.

---

## 3. Paleta de Colores (Tokens CSS HSL)

Los colores se consumen con la función `hsl(var(--nombre-token))` o `hsl(var(--nombre-token) / opacidad)`.

| Token | Modo Claro (Light) | Modo Oscuro (Dark) | Uso Principal |
| :--- | :--- | :--- | :--- |
| `--primary` | `215 100% 50%` (#0066ff) | `217 90% 65%` (#5b95ff) | Botones primarios, enlaces activos, badges destacados |
| `--primary-hover` | `215 100% 45%` | `217 90% 70%` | Estados hover de elementos primarios |
| `--background` | `210 40% 98%` (#f8fafc) | `230 20% 7%` (#0f1117) | Fondo principal de la ventana/aplicación |
| `--surface` | `0 0% 100%` (#ffffff) | `228 15% 10%` (#16181f) | Tarjetas, barras, modales, tablas |
| `--surface-hover` | `210 40% 96%` | `228 15% 14%` (#1e2029) | Hover en filas de tablas, items de listas |
| `--foreground` | `222 47% 11%` (#0f172a) | `210 40% 98%` (#f8fafc) | Color de texto principal |
| `--muted-foreground`| `215 16.3% 46.9%` | `215 20% 78%` | Subtítulos, textos secundarios, placeholders |
| `--border` | `214 32% 91%` (#e2e8f0) | `228 15% 22%` (#2e3240) | Bordes de tarjetas, divisores, inputs |
| `--destructive` | `0 84.2% 60.2%` (#ef4444) | `0 84.2% 60.2%` | Errores, alertas, acciones de eliminar/cerrar sesión |

### Colores de Estado Semánticos
- **Éxito / En línea / Activo:** `#10b981` (Emerald) `rgba(16, 185, 129, 0.1)`
- **Alerta / Ausencia / Rechazado:** `#ef4444` (Rojo) `rgba(239, 68, 68, 0.1)`
- **Advertencia / Reconocimiento / Oro:** `#f59e0b` (Ámbar) `rgba(245, 158, 11, 0.1)`
- **Eventos / Social / Rosa:** `hsl(340 80% 60%)` `hsla(340, 80%, 60%, 0.1)`
- **TI / Permisos Especiales:** `#a855f7` (Púrpura) `rgba(168, 85, 247, 0.1)`

---

## 4. Radios y Sombras

```css
--radius-sm: 0.375rem; /* 6px  - Badges pequeños */
--radius-md: 0.75rem;  /* 12px - Botones e Inputs */
--radius-lg: 1.125rem; /* 18px - Tarjetas y Tablas */
--radius-xl: 1.5rem;   /* 24px - Modales y Contenedores */
```

- **Sombra sutil:** `var(--shadow-sm)` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`)
- **Sombra tarjeta hover:** `box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)`
- **Sombra interna para inputs:** `var(--shadow-inset)` (`inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)`)

---

## 5. Clases de Componentes Listos para Usar

### A. Tarjetas (`.card` y `.glass`)
```html
<div class="card">
  <!-- Tarjeta estándar con elevación y borde interactivo -->
  <h3>Título de la Sección</h3>
  <p>Contenido informativo...</p>
</div>

<!-- Tarjeta efecto cristal para métricas o banners -->
<div class="card glass">
  ...
</div>
```

### B. Botones (`.btn`)
```html
<!-- Botón Primario (con gradiente y brillo) -->
<button class="btn btn-primary">
  <svg>...</svg>
  <span>Guardar Cambios</span>
</button>

<!-- Botón Secundario / Superficie -->
<button class="btn btn-surface">
  <span>Cancelar</span>
</button>

<!-- Botón Fantasma / Sin fondo -->
<button class="btn btn-ghost">
  <span>Detalles</span>
</button>
```

### C. Campos de Entrada (`.form-label` y `.form-input`)
```html
<div style="display: flex; flex-direction: column; gap: 0.35rem;">
  <label class="form-label">Nombre del Recurso</label>
  <input type="text" class="form-input" placeholder="Ej. Servidor VPN" />
</div>
```

### D. Tablas Modernas (`.table-container-modern` y `.table-modern`)
```html
<div class="table-container-modern">
  <table class="table-modern">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Departamento</th>
        <th>Estado</th>
        <th style="text-align: right;">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Juan Pérez</td>
        <td>Soporte TI</td>
        <td><span class="badge-modern" style="background: rgba(16,185,129,0.15); color: #10b981;">Activo</span></td>
        <td style="text-align: right;">
          <button class="btn btn-ghost" style="padding: 0.35rem 0.65rem;">Ver</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### E. Modales y Overlays
```tsx
{isOpen && (
  <div 
    className="animate-in fade-in" 
    style={{ 
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" 
    }}
    onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
  >
    <div 
      className="animate-in zoom-in-95" 
      style={{ 
        backgroundColor: "hsl(var(--background))", width: "100%", maxWidth: "600px", 
        borderRadius: "24px", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.95)", overflow: "hidden",
        border: "1px solid hsl(var(--border) / 0.8)"
      }}
    >
      <div style={{ padding: "1.5rem", borderBottom: "1px solid hsl(var(--border)/0.5)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "hsl(var(--surface))" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>Título del Modal</h2>
        <button onClick={() => setIsOpen(false)} className="btn btn-ghost" style={{ padding: "0.5rem", borderRadius: "50%" }}>✕</button>
      </div>
      <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
        <!-- Contenido -->
      </div>
    </div>
  </div>
)}
```

---

## 6. Plantilla Estándar para una Nueva Página / Herramienta

Cuando tus compañeros creen una nueva vista, pueden estructurarla con esta plantilla estándar para que encaje 1:1 con la Intranet:

```tsx
"use client"

import React, { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'

export default function MiHerramientaPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Encabezado de la Herramienta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Nombre de la Herramienta
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
            Gestiona y visualiza la información de este módulo corporativo.
          </p>
        </div>
        
        {/* Acciones principales */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-surface">
            <Filter size={16} />
            <span>Filtrar</span>
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="card glass" style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="input" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* 3. Contenedor Principal (Tarjetas o Tablas) */}
      <div className="table-container-modern">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Descripción</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#REG-001</td>
              <td>Actividad de ejemplo</td>
              <td>20 Oct 2026</td>
              <td><span className="badge-modern" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Completado</span></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  )
}
```

---

## 7. Reglas Clave para Garantizar Integración Fluida

1. **Evitar colores fijos (Hardcoded hex):** En lugar de usar `color: "#000"` o `background: "#fff"`, usar siempre `hsl(var(--foreground))` y `hsl(var(--surface))` para que el modo oscuro funcione automáticamente.
2. **Utilizar Iconos de `lucide-react`:** Garantiza el mismo trazo (stroke de 2px) y tamaño en toda la aplicación.
3. **No alterar el ancho del layout:** El contenedor principal de la intranet ya viene definido con ancho máximo de `1720px` y `padding: 2rem 1.5rem`. La nueva herramienta solo debe ocupar el 100% de su contenedor.
4. **Manejar estados con `.animate-in`:** Añadir la clase `.animate-in` para que los elementos aparezcan con la animación suave de entrada.
