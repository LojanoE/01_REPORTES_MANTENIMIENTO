# Documentacion del Sistema de Reportes - ECSA/GDR

Este repositorio contiene **tres aplicaciones web unificadas** para la gestion del Departamento de Gestion de Depositos de Relaves (GDR):

1. **Sistema de Mantenimiento**: Registro y consulta de actividades de mantenimiento.
2. **Sistema de Inspeccion de Pozos**: Gestion de inspecciones de seguridad y medio ambiente de pozos de inundacion.
3. **Sistema de Control de Bodegas**: Inventario multi-bodega con ingresos, egresos y trazabilidad.

Las tres aplicaciones comparten una **base de datos unificada en Supabase** y un **sistema de autenticacion centralizado** en el portal principal.

---

## Estructura del Proyecto

```
01_REPORTES_MANTENIMIENTO/
├── index.html              <- Portal con login unificado + gestion de usuarios (admin)
├── landing.css             <- Estilos del portal (login, barra usuario, panel admin)
├── auth.js                 <- Modulo de autenticacion compartido (session, hash, roles)
├── ECUACORRIENTE.png       <- Logo compartido
├── LOGO GDR.jpeg           <- Logo compartido
├── MANTENIMIENTO/
│   ├── index.html          <- App de Mantenimiento
│   ├── app.js              <- Logica JS de Mantenimiento
│   └── styles.css          <- Estilos de Mantenimiento
├── POZOS/
│   ├── index.html          <- App de Inspeccion de Pozos
│   ├── script.js           <- Logica JS de Pozos
│   └── style.css           <- Estilos de Pozos
├── BODEGAS/
│   ├── index.html          <- App de Control de Bodegas
│   ├── script.js           <- Logica JS de Bodegas
│   ├── style.css           <- Estilos de Bodegas
│   └── 1. Control_Bodegas_V0.xlsm <- Excel fuente para migracion
├── supabase_setup.sql      <- Script de configuracion inicial de BD (Mantenimiento, Pozos, Users)
├── bodegas_setup.sql        <- Script de configuracion de BD para Bodegas
├── migrate_bodegas.py       <- Script de migracion Excel -> Supabase para Bodegas
└── migracion_auth.sql       <- Migracion: columnas created_by_name, password_hash, salt
```

---

## Sistema de Autenticacion

### Arquitectura

El sistema usa un **login unificado en el portal** (`index.html`). Las tres aplicaciones redirigen al portal si no hay sesion activa.

### Flujo de Acceso

1. El usuario abre el portal (`index.html`)
2. Ingresa usuario y contrasena
3. Se valida contra la tabla `users` de Supabase
4. La contrasena se verifica con **hash SHA-256 + salt** (migracion automatica desde texto plano)
5. Se guarda la sesion en `localStorage` (valida por 8 horas)
6. Al acceder a cualquier app, se verifica la sesion; si no existe, redirige al portal

### Roles y Permisos

| Rol | Portal | Mantenimiento | Pozos | Bodegas |
|-----|--------|---------------|-------|---------|
| **admin** | Gestionar Usuarios | Registro + Consulta | Verificacion + Reportes + Consulta + Bombas + Grafica | Inventario + Movimientos + Gestion |
| **user** | Acceso normal | Registro + Consulta | Verificacion + Reportes + Consulta + Bombas + Grafica | Inventario + Movimientos |
| **viewer** | Solo acceso a apps | Solo Consulta | Reportes + Consulta + Bombas + Grafica (sin Verificacion) | Inventario + Movimientos (sin Gestion) |

### Seguridad de Contrasenas

- Las contrasenas se almacenan con **hash SHA-256 + salt** unico por usuario
- Al crear un usuario nuevo, se genera un salt aleatorio y se almacena `password_hash`
- Los usuarios existentes con contrasena en texto plano se migran automaticamente al primer login exitoso
- El campo `password` se mantiene temporalmente por compatibilidad, pero la validacion prioriza `password_hash` + `salt`

---

## App 3: Sistema de Control de Bodegas

### Descripcion General

El modulo de Bodegas gestiona el **inventario de multiples bodegas** con control de ingresos y egresos. Cada articulo existe dentro de una bodega especifica, con su propio stock independiente.

### Funcionalidades

- **Autenticacion obligatoria**: Redirige al portal si no hay sesion activa
- **Inventario multi-bodega**: Cada articulo pertenece a una bodega con stock propio
- **Busqueda y filtrado**: Por codigo, descripcion, especificaciones o bodega
- **Registro de Ingresos**: Con bodega, responsable, vale, ubicacion
- **Registro de Egresos**: Con bodega, responsable, despachador, ubicacion
- **Stock automatico**: Un trigger en PostgreSQL actualiza el stock al registrar movimientos
- **Bodega-first**: Seleccionar bodega primero filtra los articulos de esa bodega
- **Auto-relleno**: Al seleccionar un articulo, se auto-rellena la bodega y se muestra info del item
- **Exportacion a Excel**: Tanto inventario como movimientos
- **Control por roles**: Solo admin puede registrar articulos y movimientos
- **Optimizado para movil**: Carga progresiva, columnas ocultas, debounce en busqueda

### Estructura de Base de Datos

#### `bodegas_inventory`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `id` | BIGINT (PK) | Clave primaria autoincremental |
| `code` | TEXT | Codigo de material (puede repetirse en diferentes bodegas) |
| `excel_unique_id` | TEXT (UNIQUE) | ID unico del Excel (Codigo + Bodega) |
| `description` | TEXT | Nombre del material |
| `specifications` | TEXT | Especificaciones tecnicas |
| `unit` | TEXT | Unidad de medida (UND, KG, MT, etc.) |
| `initial_stock` | NUMERIC | Stock inicial al momento de la migracion |
| `current_stock` | NUMERIC | Stock actual (actualizado por trigger) |
| `min_stock` | NUMERIC | Stock minimo para alertas |
| `bodega` | TEXT | Nombre de la bodega donde se encuentra |
| `location` | TEXT | Ubicacion dentro de la bodega |
| `created_at` | TIMESTAMPTZ | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | Fecha de ultima actualizacion |

#### `bodegas_transactions`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `id` | BIGINT (PK) | Clave primaria autoincremental |
| `item_id` | BIGINT (FK) | Referencia a `bodegas_inventory.id` |
| `type` | TEXT | Tipo de movimiento: `IN` (ingreso) o `OUT` (egreso) |
| `quantity` | NUMERIC | Cantidad movida |
| `date` | DATE | Fecha del movimiento |
| `time` | TIME | Hora del movimiento |
| `bodega` | TEXT | Bodega donde se realizo el movimiento |
| `specifications` | TEXT | Especificaciones del item al momento del movimiento |
| `received_by` | TEXT | Persona que recibe conforme (ingresos) |
| `dispatched_by` | TEXT | Persona que despacha |
| `voucher_code` | TEXT | Codigo de vale (ingresos) |
| `notes` | TEXT | Notas o motivo del movimiento |
| `location` | TEXT | Ubicacion dentro de la bodega |
| `created_by_name` | TEXT | Usuario que registro el movimiento |
| `created_at` | TIMESTAMPTZ | Fecha de creacion del registro |

### Relacion entre tablas

```
bodegas_inventory (1) ────< bodegas_transactions (N)
     id ◄────────────────────── item_id
     current_stock                type: IN / OUT
                                   quantity
                              ──────────────────
                         Trigger: INSERT →
                           IN  → inventory.current_stock += quantity
                           OUT → inventory.current_stock -= quantity
```

El trigger `tr_update_stock` ejecuta la funcion `update_inventory_stock()` que:
- En INSERT `IN`: suma cantidad al stock del inventario
- En INSERT `OUT`: resta cantidad del stock del inventario
- En UPDATE: ajusta stock segun tipo viejo y nuevo
- En DELETE: revierte el efecto del movimiento eliminado

### Flujo de Trabajo: Ingreso/Egreso

1. **Seleccionar Bodega** (filtro primero) — Filtra los articulos disponibles en esa bodega
2. **Seleccionar Articulo** — Se auto-rellena la bodega y se muestra info (especificaciones, stock actual, ubicacion)
3. **Ingresar Cantidad y Datos** — Responsable, vale, ubicacion, notas
4. **Registrar** — Se inserta en `bodegas_transactions` con `type = 'IN'` o `'OUT'`
5. **Trigger actualiza automaticamente** el `current_stock` en `bodegas_inventory`
6. **La interfaz se refresca** mostrando el nuevo stock

### Bodegas Configuradas

| Bodega | Codigo en Excel |
|--------|----------------|
| Bodega GDR 1 (MV) | MV |
| Bodega GDR 1 (M&OPTAC #2) | M&OPTAC #2 |
| Bodega GDR 2 (LSM & QC) | LSM & QC |
| Bodega GDR 2 (C/QC&LSM) | C/QC&LSM |
| Bodega GDR 2 (OMV) | OMV |
| Bodega GDR 3 (M) | M |
| Bodega GDR 3 (PTAC #2) | PTAC #2 |
| Bodega GDR 3 (MV) | MV |
| Bodega GDR 4 (Container PTAC #2) | Container PTAC #2 |
| Bodega GDR 5 (M&OPTAC #2) | M&OPTAC #2 |
| Bodega GDR 5 (MV) | MV |
| Sala de Induccion de GDR 6 | - |
| Unidad de Monitoreo | - |
| Unidad de Operacion, Mantenimiento y Vigilancia | - |
| Unidad de Construccion, Control de Calidad & Laboratorio | - |

---

## Migracion de Datos: Excel a Supabase

### Proceso

1. **Configurar BD**: Ejecutar `bodegas_setup.sql` en el SQL Editor de Supabase
2. **Recargar schema**: Ejecutar `NOTIFY pgrst, 'reload schema';` en Supabase
3. **Ejecutar migracion**: `python migrate_bodegas.py`

### Script `migrate_bodegas.py`

Lee directamente el archivo Excel `BODEGAS/1. Control_Bodegas_V0.xlsm` usando `openpyxl` (no pandas) y migra los datos a Supabase.

#### Hojas del Excel y mapeo de columnas

**Hoja "Inventario"** (datos desde fila 7):
| Columna Excel | Indice openpyxl | Campo BD |
|---------------|-----------------|----------|
| Codigo de material | 2 | `code` |
| COD_UNICO | 3 | `excel_unique_id` |
| Nombre del material | 4 | `description` |
| Especificaciones | 5 | `specifications` |
| Unidad | 7 | `unit` |
| Cantidad inicial | 8 | `initial_stock` |
| Stock | 11 | `current_stock` |
| BODEGA | 14 | `bodega` |
| Ubicacion actual | 15 | `location` |

**Hoja "Ingresos"** (datos desde fila 7):
| Columna Excel | Indice openpyxl | Campo BD |
|---------------|-----------------|----------|
| Fecha | 3 | `date` |
| Hora | 4 | `time` |
| BODEGA | 6 | `bodega` |
| COD_UNICO | 7 | `item_id` (via mapeo) |
| Especificaciones | 9 | `specifications` |
| Cantidad | 11 | `quantity` |
| Codigo de Vale | 18 | `voucher_code` |
| Recibe conforme | 21 | `received_by` |
| Responsable ingreso | 22 | `dispatched_by` |
| Ubicacion actual | 23 | `location` |
| Notas | 24 | `notes` |

**Hoja "Egresos"** (datos desde fila 6):
| Columna Excel | Indice openpyxl | Campo BD |
|---------------|-----------------|----------|
| Fecha | 2 | `date` |
| Hora | 3 | `time` |
| BODEGA | 5 | `bodega` |
| COD_UNICO | 6 | `item_id` (via mapeo) |
| Especificaciones | 8 | `specifications` |
| Cantidad | 10 | `quantity` |
| Responsable egreso | 11 | `created_by_name` |
| Responsable despacho | 12 | `dispatched_by` |
| Ubicacion actual | 13 | `location` |
| Notas | 14 | `notes` |

#### Estadisticas de migracion

- **Inventario**: ~872 articulos (solo filas con COD_UNICO valido)
- **Ingresos**: ~482 registros (solo filas con COD_UNICO que exista en inventario)
- **Egresos**: ~1,557 registros (solo filas con COD_UNICO que exista en inventario)

#### Manejo de errores

- Fechas invalidas (ej. "31-11-25") se parsean con fallback a fecha actual
- Filas sin COD_UNICO o sin mapeo en inventario se omiten con conteo
- Si un lote falla, se inserta fila por fila saltando las erroneas
- Batch processing en lotes de 100 registros

### Script `bodegas_setup.sql`

Ejecutar en el SQL Editor de Supabase. Funciona de forma idempotente:

1. **CREATE TABLE IF NOT EXISTS** — Crea las tablas si no existen
2. **ALTER TABLE** — Agrega columnas nuevas y renombra `category` → `bodega`
3. **Trigger** — Crea/recrea el trigger de actualizacion automatica de stock
4. **Indices** — Crea indices si no existen
5. **Politicas RLS** — Permite lectura a todos y escritura a usuarios autenticados
6. **Verificacion** — Muestra las columnas de cada tabla al finalizar

**Orden de ejecucion obligatorio:**
1. Ejecutar `bodegas_setup.sql`
2. Ejecutar `NOTIFY pgrst, 'reload schema';`
3. Ejecutar `migrate_bodegas.py`

---

## Optimizaciones para Movil

### Problemas identificados

1. `innerHTML +=` en bucles causa reflows masivos (872 para inventario, ~2000 para transacciones)
2. Cargar todas las transacciones de golpe congela la interfaz
3. Select con 872 opciones es inmanejable en movil
4. CSS `transform: scale(1.002)` en hover de filas causa jank

### Soluciones implementadas

| Problema | Solucion | Archivo |
|----------|----------|---------|
| Reflows masivos | `DocumentFragment` en `renderInventory()` y `renderTransactionsBatch()` | script.js |
| 2000+ transacciones | Carga progresiva de 100 en 100 con boton "Cargar mas" | script.js + index.html |
| 872 opciones en select | Seleccionar bodega primero → filtra articulos por bodega | script.js |
| CSS transform/scale | Eliminado de `.table tbody tr:hover` | style.css |
| Columnas en movil | Clase `.hide-mobile` oculta columnas secundarias en pantallas < 768px | index.html + style.css |
| Busqueda lenta | Debounce de 300ms en campo de busqueda | script.js |
| Padding excesivo | Media query reduce padding, fuentes y badges en movil | style.css |

### Patron Bodega-First

El flujo de ingreso/egreso ahora es:

1. **Seleccionar Bodega** → Filtra el dropdown de articulos
2. **Seleccionar Articulo** → Auto-rellena bodega, muestra especificaciones y stock actual
3. **Ingresar datos complementarios** → Cantidad, responsable, vale, etc.
4. **Registrar** → Valida que bodega no este vacia

---

## Configuracion Inicial

### 1. Configurar Supabase

1. Ve al **SQL Editor** de tu proyecto Supabase (`dzmhhlsttqygjvfabdxx`)
2. Ejecuta primero `supabase_setup.sql` para las tablas base (Mantenimiento, Pozos, Users)
3. Luego ejecuta `bodegas_setup.sql` para las tablas de Bodegas
4. Ejecuta `NOTIFY pgrst, 'reload schema';` para refrescar el cache de PostgREST
5. Ejecuta `migracion_auth.sql` para agregar columnas de autenticacion
6. Ejecuta `python migrate_bodegas.py` para migrar los datos del Excel

### 2. Orden de ejecucion completo

```bash
# 1. Tablas base (Mantenimiento, Pozos, Users)
supabase_setup.sql

# 2. Tablas de Bodegas
bodegas_setup.sql

# 3. Refrescar cache de PostgREST (en SQL Editor)
NOTIFY pgrst, 'reload schema';

# 4. Columnas de autenticacion
migracion_auth.sql

# 5. Migracion de datos Excel -> Supabase
python migrate_bodegas.py
```

### 3. Credenciales de Supabase

Las credenciales estan centralizadas en `auth.js` y `migrate_bodegas.py`:
```javascript
// auth.js
const SUPABASE_URL = 'https://dzmhhlsttqygjvfabdxx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK';
```

---

## App 1: Sistema de Mantenimiento

### Funcionalidades
- **Autenticacion obligatoria**: Redirige al portal si no hay sesion activa
- **Barra de usuario**: Muestra nombre, rol y boton de cerrar sesion
- **Registro de actividades** con fecha, responsable, frente, tema y actividades
- **Auditoria**: Cada registro guarda `created_by_name`
- **Control de personal**: Numero de personas ECSA y contratistas
- **Consulta con filtros**: Por responsable, tema, frente y rango de fechas
- **Exportacion**: Descarga de datos filtrados a Excel (SheetJS)
- **Control por roles**: Los usuarios `viewer` solo pueden consultar

### Estructura de la tabla `mantenimiento`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `id` | BIGINT | Clave primaria autoincremental |
| `fecha_hora` | TIMESTAMPTZ | Fecha y hora del registro |
| `responsable` | TEXT | Nombre del encargado |
| `tema` | TEXT | Asunto del mantenimiento |
| `frente` | TEXT | Ubicacion o frente de trabajo |
| `actividades` | TEXT | Descripcion de tareas realizadas |
| `numero_ecsa` | INT | Cantidad de personal ECSA |
| `numero_contratista` | INT | Cantidad de personal contratista |
| `created_at` | TIMESTAMPTZ | Fecha de creacion automatica |
| `created_by_name` | TEXT | Nombre del usuario que creo el registro |

---

## App 2: Sistema de Inspeccion de Pozos

### Funcionalidades
- **Autenticacion obligatoria**: Redirige al portal si no hay sesion activa
- **Checklist bilingue**: 7 items de inspeccion en Chino y Espanol
- **Gestion de turnos**: Registro por turno Dia y Noche
- **Datos tecnicos**: Horarios de bomba, cantidades, niveles de agua y lodo
- **Generacion de PDFs**: Reportes individuales en formato A4 (html2pdf.js)
- **Exportacion por lote**: Descarga masiva en ZIP (JSZip)
- **Graficas de tendencia**: Evolucion de niveles de agua (Chart.js)
- **Control de versiones**: Multiples versiones por fecha

### Estructura de tablas

#### `inspections`
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `id` | SERIAL | Clave primaria |
| `inspection_date` | DATE | Fecha de inspeccion |
| `day_shift_person` | TEXT | Personal turno dia |
| `night_shift_person` | TEXT | Personal turno noche |
| `day_remarks` | TEXT | Observaciones dia |
| `night_remarks` | TEXT | Observaciones noche |
| `checklist_data` | JSONB | Datos del checklist (estado + notas) |
| `version` | INTEGER | Version del registro |
| `created_by_name` | TEXT | Nombre del usuario que creo el registro |

#### `pump_records`
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `inspection_date` | DATE (UNIQUE) | Fecha |
| `day_pump_open/close` | TIME | Horario bomba dia |
| `day_pump_quantity` | NUMERIC | Cantidad bombeada dia |
| `day_water_level_before/after` | NUMERIC | Nivel agua dia |
| `day_mud_level` | NUMERIC | Nivel lodo dia |
| *(campos night_*) | - | Mismos campos para turno noche |
| `created_by_name` | TEXT | Nombre del usuario que creo el registro |

---

## Tabla `users` (compartida)

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `id` | SERIAL | Clave primaria |
| `username` | TEXT (UNIQUE) | Nombre de usuario |
| `password` | TEXT | Contrasena en texto plano (compatibilidad) |
| `password_hash` | TEXT | Hash SHA-256 de la contrasena |
| `salt` | TEXT | Salt unico para el hash |
| `role` | TEXT | Rol: `admin`, `user`, `viewer` |
| `created_at` | TIMESTAMPTZ | Fecha de creacion |

**Usuarios predeterminados:**
- `Admin` / `354` (rol: admin)
- `GDR` / `123` (rol: user)

---

## Modulo `auth.js` — Referencia de API

### Metodos principales

| Metodo | Descripcion |
|--------|-------------|
| `Auth.login(username, password)` | Autentica un usuario contra Supabase |
| `Auth.getSession()` | Obtiene la sesion actual (o null si expiro) |
| `Auth.initPage()` | Verifica sesion; redirige al portal si no existe |
| `Auth.logout()` | Cierra la sesion |
| `Auth.logoutAndRedirect()` | Cierra sesion y redirige al portal |
| `Auth.isAdmin()` | Retorna true si el usuario actual es admin |
| `Auth.hasRole(role)` | Verifica si el usuario tiene un rol minimo |
| `Auth.hashPassword(password, salt)` | Genera hash SHA-256 de una contrasena |
| `Auth.generateSalt()` | Genera un salt aleatorio de 32 caracteres hex |
| `Auth.getSupabaseClient()` | Retorna la instancia de Supabase (lazy init) |
| `Auth.renderUserBar(containerId)` | Renderiza la barra de usuario en el contenedor dado |

### Metodos de gestion de usuarios (solo admin)

| Metodo | Descripcion |
|--------|-------------|
| `Auth.loadUsers()` | Carga todos los usuarios desde Supabase |
| `Auth.saveUser(id, username, password, role)` | Crea o actualiza un usuario |
| `Auth.deleteUser(id)` | Elimina un usuario por ID |
| `Auth.getRoleBadge(role)` | Retorna badge HTML para un rol |

---

## Notas Tecnicas

- **Version de apps**: Mantenimiento v2.0.0, Pozos v2.0.0, Bodegas v2.0.0
- **Cache-busting**: Los archivos CSS/JS usan parametros de version (`?v=2.0.0`)
- **Sin backend**: Las tres apps son SPAs que se conectan directamente a Supabase
- **Hosting estatico**: Se pueden desplegar en cualquier hosting estatico
- **GitHub Actions**: El repositorio incluye un workflow que ping a Supabase 2 veces por semana para evitar pausas
- **Colacion de datos**: El campo `excel_unique_id` en `bodegas_inventory` combina codigo + bodega para permitir el mismo codigo en diferentes bodegas

---

**Desarrollado para EcuaCorriente S.A. - Departamento de Gestion de Depositos de Relaves (GDR)**