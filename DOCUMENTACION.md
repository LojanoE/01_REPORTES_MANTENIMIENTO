# Documentación del Sistema de Reportes - ECSA/GDR

Este repositorio contiene **dos aplicaciones web unificadas** para la gestión de actividades del Departamento de Gestión de Depósitos de Relaves (GDR):

1. **Sistema de Mantenimiento**: Registro y consulta de actividades de mantenimiento.
2. **Sistema de Inspección de Pozos**: Gestión de inspecciones de seguridad y medio ambiente de pozos de inundación.

Ambas aplicaciones comparten una **base de datos unificada en Supabase** para mejorar la escalabilidad, velocidad y confiabilidad de los datos.

---

## 🏗️ Estructura del Proyecto

```
01_REPORTES_MANTENIMIENTO/
├── index.html              ← Portal de entrada (Landing Page con tarjetero)
├── landing.css             ← Estilos del tema oscuro del portal
├── ECUACORRIENTE.png       ← Logo compartido
├── LOGO GDR.jpeg           ← Logo compartido
├── MANTENIMIENTO/
│   ├── index.html          ← App de Mantenimiento
│   ├── app.js              ← Lógica JS de Mantenimiento
│   └── styles.css          ← Estilos de Mantenimiento
├── POZOS/
│   ├── index.html          ← App de Inspección de Pozos
│   ├── script.js           ← Lógica JS de Pozos
│   └── style.css           ← Estilos de Pozos
└── supabase_setup.sql      ← Script de configuración de BD unificada
```

---

## 🚀 Arquitectura del Sistema

### Frontend
- **HTML5, CSS3 (Bootstrap 5)** y **JavaScript Vanilla**
- **Tema oscuro** consistente en toda la aplicación
- **Diseño responsive** para móviles y tablets
- **Interfaz bilingüe** (Español/Chino) en ambas aplicaciones

### Base de Datos (Supabase - PostgreSQL)
Proyecto unificado: `dzmhhlsttqygjvfabdxx`

#### Tablas:

| Tabla | Propósito | App |
|-------|-----------|-----|
| `mantenimiento` | Registros de actividades de mantenimiento | Mantenimiento |
| `inspections` | Inspecciones de pozos (checklist) | Pozos |
| `pump_records` | Datos técnicos de bombas y niveles | Pozos |
| `users` | Usuarios y roles para autenticación | Pozos |

---

## 📋 App 1: Sistema de Mantenimiento

### Funcionalidades
- **Registro de actividades** con fecha, responsable, frente, tema y actividades
- **Control de personal**: Número de personas ECSA y contratistas
- **Consulta con filtros**: Por responsable, tema, frente y rango de fechas
- **Gráficos**: Visualización de personal ECSA vs Contratista (Chart.js)
- **Exportación**: Descarga de datos filtrados a Excel (SheetJS)
- **Viñetas automáticas**: El campo de actividades genera viñetas con Enter

### Estructura de la tabla `mantenimiento`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Clave primaria autoincremental |
| `fecha_hora` | TIMESTAMPTZ | Fecha y hora del registro |
| `responsable` | TEXT | Nombre del encargado (mayúsculas) |
| `tema` | TEXT | Asunto del mantenimiento |
| `frente` | TEXT | Ubicación o frente de trabajo |
| `actividades` | TEXT | Descripción de tareas realizadas |
| `numero_ecsa` | INT | Cantidad de personal ECSA |
| `numero_contratista` | INT | Cantidad de personal contratista |
| `created_at` | TIMESTAMPTZ | Fecha de creación automática |

---

## 📋 App 2: Sistema de Inspección de Pozos

### Funcionalidades
- **Checklist bilingüe**: 7 ítems de inspección en Chino y Español
- **Gestión de turnos**: Registro por turno Día y Noche
- **Datos técnicos**: Horarios de bomba, cantidades, niveles de agua y lodo
- **Generación de PDFs**: Reportes individuales en formato A4 (html2pdf.js)
- **Exportación por lote**: Descarga masiva en ZIP (JSZip)
- **Gráficas de tendencia**: Evolución de niveles de agua (Chart.js)
- **Control de versiones**: Múltiples versiones por fecha
- **Autenticación**: Sistema de login con roles (Admin, User, Viewer)

### Estructura de tablas

#### `inspections`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL | Clave primaria |
| `inspection_date` | DATE | Fecha de inspección |
| `day_shift_person` | TEXT | Personal turno día |
| `night_shift_person` | TEXT | Personal turno noche |
| `day_remarks` | TEXT | Observaciones día |
| `night_remarks` | TEXT | Observaciones noche |
| `checklist_data` | JSONB | Datos del checklist (estado + notas) |
| `version` | INTEGER | Versión del registro |

#### `pump_records`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `inspection_date` | DATE (UNIQUE) | Fecha |
| `day_pump_open/close` | TIME | Horario bomba día |
| `day_pump_quantity` | NUMERIC | Cantidad bombeada día |
| `day_water_level_before/after` | NUMERIC | Nivel agua día |
| `day_mud_level` | NUMERIC | Nivel lodo día |
| *(campos night_*) | - | Mismos campos para turno noche |

#### `users` (Autenticación)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `username` | TEXT (UNIQUE) | Nombre de usuario |
| `password` | TEXT | Contraseña (texto plano - no seguro para producción) |
| `role` | TEXT | Rol: `admin`, `user`, `viewer` |

**Usuarios predeterminados:**
- `Admin` / `354` (rol: admin)
- `GDR` / `123` (rol: user)

### Roles y Permisos

| Rol | Acceso |
|-----|--------|
| **admin** | Acceso completo incluyendo Configuración (gestión de usuarios) |
| **user** | Acceso a todo excepto Configuración |
| **viewer** | Solo Reportes, Consulta, Bombas y Gráfica (sin Verificación ni Configuración) |

---

## 🛠️ Configuración Inicial

### 1. Configurar Supabase

1. Ve al **SQL Editor** de tu proyecto Supabase (`dzmhhlsttqygjvfabdxx`)
2. Copia y ejecuta el contenido de `supabase_setup.sql`
3. Esto creará todas las tablas e insertará los usuarios predeterminados

### 2. Verificar credenciales

Las credenciales de Supabase ya están configuradas en los archivos:
- `MANTENIMIENTO/app.js` (líneas 1-4)
- `POZOS/script.js` (líneas 21-24)

**Si necesitas cambiarlas**, actualiza estas constantes:
```javascript
const SUPABASE_URL = 'https://dzmhhlsttqygjvfabdxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK';
```

### 3. Migrar datos existentes (si aplica)

Si tienes datos en el proyecto anterior de Pozos (`krkoacewzhigjjybgzng`), expórtalos desde el dashboard de Supabase e impórtalos en el nuevo proyecto.

---

## 📂 Instrucciones de Uso

### Acceso al Portal
1. Abre `index.html` en la raíz del proyecto
2. Selecciona la aplicación deseada desde el tarjetero:
   - 🛠️ **Mantenimiento** → `MANTENIMIENTO/index.html`
   - ⛏️ **Inspección de Pozos** → `POZOS/index.html`

### App de Mantenimiento
1. Completa el formulario de registro
2. Usa "OTRO" para frentes no listados
3. En la pestaña "Consulta", aplica filtros y exporta a Excel

### App de Pozos
1. Inicia sesión con usuario y contraseña
2. Completa el checklist para turno día y noche
3. Registra datos técnicos de bombas
4. Guarda y genera PDFs según sea necesario

---

## 🔒 Seguridad

- **RLS (Row Level Security)**: Todas las tablas tienen políticas públicas para SELECT, INSERT y UPDATE desde el frontend
- **Respaldo Local**: La app de Mantenimiento guarda copia en `localStorage`
- **Consistencia**: Campos de texto se convierten automáticamente a mayúsculas
- **Nota sobre usuarios**: Las contraseñas se almacenan en texto plano por simplicidad. Para producción, implementar hash.

---

## 📝 Notas Técnicas

- **Versión de apps**: Cada app tiene su propio versionado (ver `script.js` o `app.js`)
- **Cache-busting**: Los archivos CSS/JS usan parámetros de versión (`?v=x.x.x`)
- **Sin backend**: Ambas apps son SPAs (Single Page Applications) que se conectan directamente a Supabase
- **Hosting estático**: Se pueden desplegar en cualquier hosting estático (GitHub Pages, Netlify, Vercel, etc.)

---

**Desarrollado para EcuaCorriente S.A. - Departamento de Gestión de Depósitos de Relaves (GDR)**
