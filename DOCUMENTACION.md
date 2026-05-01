# Documentación del Sistema de Reportes - ECSA/GDR

Este repositorio contiene **dos aplicaciones web unificadas** para la gestión de actividades del Departamento de Gestión de Depósitos de Relaves (GDR):

1. **Sistema de Mantenimiento**: Registro y consulta de actividades de mantenimiento.
2. **Sistema de Inspección de Pozos**: Gestión de inspecciones de seguridad y medio ambiente de pozos de inundación.

Ambas aplicaciones comparten una **base de datos unificada en Supabase** y un **sistema de autenticación centralizado** en el portal principal.

---

## 🏗️ Estructura del Proyecto

```
01_REPORTES_MANTENIMIENTO/
├── index.html              ← Portal con login unificado + gestión de usuarios (admin)
├── landing.css             ← Estilos del portal (login, barra usuario, panel admin)
├── auth.js                 ← Módulo de autenticación compartido (session, hash, roles)
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
├── supabase_setup.sql      ← Script de configuración inicial de BD
└── migracion_auth.sql      ← Migración: columnas created_by_name, password_hash, salt
```

---

## 🔐 Sistema de Autenticación

### Arquitectura

El sistema usa un **login unificado en el portal** (`index.html`). Ambas aplicaciones (Mantenimiento y Pozos) redirigen al portal si no hay sesión activa.

### Flujo de Acceso

1. El usuario abre el portal (`index.html`)
2. Ingresa usuario y contraseña
3. Se valida contra la tabla `users` de Supabase
4. La contraseña se verifica con **hash SHA-256 + salt** (migración automática desde texto plano)
5. Se guarda la sesión en `localStorage` (válida por 8 horas)
6. Al acceder a cualquier app, se verifica la sesión; si no existe, redirige al portal

### Roles y Permisos

| Rol | Portal | Mantenimiento | Pozos |
|-----|--------|---------------|-------|
| **admin** | Ver panel "Gestionar Usuarios" + crear/editar/eliminar usuarios | Registro + Consulta | Verificación + Reportes + Consulta + Bombas + Gráfica |
| **user** | Acceso normal | Registro + Consulta | Verificación + Reportes + Consulta + Bombas + Gráfica |
| **viewer** | Solo acceso a las apps | Solo Consulta (sin Registro) | Reportes + Consulta + Bombas + Gráfica (sin Verificación) |

### Seguridad de Contraseñas

- Las contraseñas se almacenan con **hash SHA-256 + salt** único por usuario
- Al crear un usuario nuevo, se genera un salt aleatorio y se almacena `password_hash`
- Los usuarios existentes con contraseña en texto plano se migran automáticamente al primer login exitoso
- El campo `password` se mantiene temporalmente por compatibilidad, pero la validación prioriza `password_hash` + `salt`

### Gestión de Usuarios (solo admin)

El portal incluye un **panel de gestión de usuarios** visible únicamente para el rol `admin`. Funcionalidades:
- Ver lista de usuarios con su rol (sin mostrar contraseñas)
- Crear nuevos usuarios (username + contraseña + rol)
- Editar usuarios existentes (cambiar username, rol; contraseña opcional)
- Eliminar usuarios (excepto `Admin`)
- Las contraseñas se hashean automáticamente al guardar

---

## 🚀 Arquitectura del Sistema

### Frontend
- **HTML5, CSS3 (Bootstrap 5)** y **JavaScript Vanilla**
- **Tema oscuro** consistente en toda la aplicación
- **Diseño responsive** para móviles y tablets
- **Interfaz bilingüe** (Español/Chino) en ambas aplicaciones
- **Módulo `auth.js`** compartido para autenticación, hashing y gestión de usuarios

### Base de Datos (Supabase - PostgreSQL)
Proyecto unificado: `dzmhhlsttqygjvfabdxx`

#### Tablas:

| Tabla | Propósito | App |
|-------|-----------|-----|
| `mantenimiento` | Registros de actividades de mantenimiento | Mantenimiento |
| `inspections` | Inspecciones de pozos (checklist) | Pozos |
| `pump_records` | Datos técnicos de bombas y niveles | Pozos |
| `users` | Usuarios, contraseñas hasheadas y roles | Ambas (vía auth.js) |

---

## 📋 App 1: Sistema de Mantenimiento

### Funcionalidades
- **Autenticación obligatoria**: Redirige al portal si no hay sesión activa
- **Barra de usuario**: Muestra nombre, rol y botón de cerrar sesión
- **Registro de actividades** con fecha, responsable, frente, tema y actividades
- **Auditoría**: Cada registro guarda `created_by_name` (nombre del usuario que lo creó)
- **Control de personal**: Número de personas ECSA y contratistas
- **Consulta con filtros**: Por responsable, tema, frente y rango de fechas
- **Columna "Creado por"**: Visible en la tabla de consulta y exportación Excel
- **Gráficos**: Visualización de personal ECSA vs Contratista (Chart.js)
- **Exportación**: Descarga de datos filtrados a Excel (SheetJS)
- **Control por roles**: Los usuarios `viewer` solo pueden consultar (no registrar)

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
| `created_by_name` | TEXT | Nombre del usuario que creó el registro |

---

## 📋 App 2: Sistema de Inspección de Pozos

### Funcionalidades
- **Autenticación obligatoria**: Redirige al portal si no hay sesión activa
- **Barra de usuario**: Muestra nombre, rol y botón de cerrar sesión
- **Checklist bilingüe**: 7 ítems de inspección en Chino y Español
- **Gestión de turnos**: Registro por turno Día y Noche
- **Datos técnicos**: Horarios de bomba, cantidades, niveles de agua y lodo
- **Auditoría**: Las inspecciones y registros de bombas guardan `created_by_name`
- **Generación de PDFs**: Reportes individuales en formato A4 (html2pdf.js)
- **Exportación por lote**: Descarga masiva en ZIP (JSZip)
- **Gráficas de tendencia**: Evolución de niveles de agua (Chart.js)
- **Control de versiones**: Múltiples versiones por fecha
- **Control por roles**: Sin pestaña Configuración (movida al portal)

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
| `created_by_name` | TEXT | Nombre del usuario que creó el registro |

#### `pump_records`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `inspection_date` | DATE (UNIQUE) | Fecha |
| `day_pump_open/close` | TIME | Horario bomba día |
| `day_pump_quantity` | NUMERIC | Cantidad bombeada día |
| `day_water_level_before/after` | NUMERIC | Nivel agua día |
| `day_mud_level` | NUMERIC | Nivel lodo día |
| *(campos night_*) | - | Mismos campos para turno noche |
| `created_by_name` | TEXT | Nombre del usuario que creó el registro |

#### `users`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL | Clave primaria |
| `username` | TEXT (UNIQUE) | Nombre de usuario |
| `password` | TEXT | Contraseña en texto plano (compatibilidad) |
| `password_hash` | TEXT | Hash SHA-256 de la contraseña |
| `salt` | TEXT | Salt único para el hash |
| `role` | TEXT | Rol: `admin`, `user`, `viewer` |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

**Usuarios predeterminados:**
- `Admin` / `354` (rol: admin) — se crea vía `migracion_auth.sql`
- `GDR` / `123` (rol: user) — se crea vía `supabase_setup.sql`

---

## 📂 Asociación de Datos (Tabla Relacional)

Cada registro creado en cualquiera de las aplicaciones guarda el campo `created_by_name` con el nombre del usuario autenticado. Esto permite:

- **Trazabilidad**: Saber quién creó cada registro
- **Responsabilidad**: Asociación directa usuario → registro
- **Consulta**: La columna "Creado por" es visible en tablas y exportaciones Excel
- **Auditoría**: En la base de datos, se puede filtrar registros por usuario creador

Ejemplo de relaciones:
```
users.username ──→ mantenimiento.created_by_name
users.username ──→ inspections.created_by_name
users.username ──→ pump_records.created_by_name
```

---

## 🛠️ Configuración Inicial

### 1. Configurar Supabase

1. Ve al **SQL Editor** de tu proyecto Supabase (`dzmhhlsttqygjvfabdxx`)
2. Ejecuta primero `supabase_setup.sql` para crear las tablas base y usuarios iniciales
3. Luego ejecuta `migracion_auth.sql` para agregar las columnas nuevas (`created_by_name`, `password_hash`, `salt`) y crear el usuario Admin

### 2. Verificar credenciales

Las credenciales de Supabase están centralizadas en `auth.js`:
```javascript
const SUPABASE_URL = 'https://dzmhhlsttqygjvfabdxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK';
```

Las apps individuales (`MANTENIMIENTO/app.js` y `POZOS/script.js`) usan `Auth.getSupabaseClient()` del módulo compartido o sus propias constantes locales.

### 3. Migración para proyectos existentes

Si ya tienes datos en la base de datos, ejecuta `migracion_auth.sql` que:
- Agrega `created_by_name` a `mantenimiento`, `inspections`, `pump_records`
- Agrega `password_hash` y `salt` a `users`
- Crea/actualiza el usuario `Admin` con contraseña `354`
- Usa `IF NOT EXISTS` para no afectar datos existentes

---

## 📂 Instrucciones de Uso

### Acceso al Portal
1. Abre `index.html` en la raíz del proyecto
2. Ingresa usuario y contraseña en el formulario de login
3. Si es **admin**, aparece el botón "Gestionar Usuarios" para crear/editar/eliminar usuarios
4. Selecciona la aplicación deseada:
   - 🛠️ **Mantenimiento** → `MANTENIMIENTO/index.html`
   - ⛏️ **Inspección de Pozos** → `POZOS/index.html`

### Cerrar Sesión
- En la barra superior de cualquiera de las apps, haz clic en "Cerrar Sesión"
- Se eliminará la sesión y se redirigirá al portal

### App de Mantenimiento
- **Admin/User**: Pueden Registrar y Consultar
- **Viewer**: Solo puede Consultar (la pestaña Registro está oculta)
- Cada registro nuevo queda asociado al usuario que lo creó (`created_by_name`)

### App de Pozos
- **Admin/User**: Pueden ver todas las pestañas excepto Configuración (movida al portal)
- **Viewer**: Solo ve Reportes, Consulta, Bombas y Gráfica (sin Verificación)
- Cada inspección y registro de bombas queda asociado al usuario creador

### Gestión de Usuarios (solo Admin)
1. En el portal, haz clic en "⚙ Gestionar Usuarios"
2. Para crear: completa usuario, contraseña y rol, luego "Guardar"
3. Para editar: haz clic en "✏ Editar" en la fila del usuario
4. Para eliminar: haz clic en "🗑 Eliminar" (no se puede eliminar el usuario Admin)

---

## 🔒 Seguridad

- **Hashing de contraseñas**: SHA-256 con salt único por usuario
- **Migración automática**: Contraseñas en texto plano se migran a hash en el primer login
- **Sesión persistente**: 8 horas de validez en `localStorage`
- **Redirección obligatoria**: Las apps redirigen al portal si no hay sesión válida
- **RLS (Row Level Security)**: Todas las tablas tienen políticas para SELECT, INSERT y UPDATE
- **No exposición de contraseñas**: La UI nunca muestra contraseñas, solo rol y acciones
- **Respaldo Local**: La app de Mantenimiento guarda copia en `localStorage`

---

## 🔧 Módulo `auth.js` — Referencia de API

### Métodos principales

| Método | Descripción |
|--------|-------------|
| `Auth.login(username, password)` | Autentica un usuario contra Supabase |
| `Auth.getSession()` | Obtiene la sesión actual (o null si expiró) |
| `Auth.initPage()` | Verifica sesión; redirige al portal si no existe |
| `Auth.logout()` | Cierra la sesión |
| `Auth.logoutAndRedirect()` | Cierra sesión y redirige al portal |
| `Auth.isAdmin()` | Retorna true si el usuario actual es admin |
| `Auth.hasRole(role)` | Verifica si el usuario tiene un rol mínimo |
| `Auth.hashPassword(password, salt)` | Genera hash SHA-256 de una contraseña |
| `Auth.generateSalt()` | Genera un salt aleatorio de 32 caracteres hex |
| `Auth.getSupabaseClient()` | Retorna la instancia de Supabase (lazy init) |
| `Auth.renderUserBar(containerId)` | Renderiza la barra de usuario en el contenedor dado |

### Métodos de gestión de usuarios (solo admin)

| Método | Descripción |
|--------|-------------|
| `Auth.loadUsers()` | Carga todos los usuarios desde Supabase |
| `Auth.saveUser(id, username, password, role)` | Crea o actualiza un usuario |
| `Auth.deleteUser(id)` | Elimina un usuario por ID |
| `Auth.getRoleBadge(role)` | Retorna badge HTML para un rol |

---

## 📝 Notas Técnicas

- **Versión de apps**: Mantenimiento v2.0.0, Pozos v2.0.0
- **Cache-busting**: Los archivos CSS/JS usan parámetros de versión (`?v=2.0.0`)
- **Sin backend**: Ambas apps son SPAs que se conectan directamente a Supabase
- **Hosting estático**: Se pueden desplegar en cualquier hosting estático
- **GitHub Actions**: El repositorio incluye un workflow que ping a Supabase 2 veces por semana para evitar pausas

---

**Desarrollado para EcuaCorriente S.A. - Departamento de Gestión de Depósitos de Relaves (GDR)**