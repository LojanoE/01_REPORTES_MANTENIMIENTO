# DOCUMENTACIÓN DEL PROYECTO - ESTADO ACTUAL
## Fecha: 02/05/2026

---

## 1. RESUMEN DEL PROYECTO

Sistema de gestión para ECSA (EcuaCorriente S.A.) con 3 módulos principales:
- **Mantenimiento**: Registro de actividades de mantenimiento
- **Pozos**: Inspección de pozos y registros de bombeo
- **Bodegas**: Control de inventario, ingresos y egresos

### Tecnologías
- **Frontend**: Vanilla JS/HTML/CSS + Bootstrap 5
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Sistema propio con hash SHA-256 + salt
- **Migración**: Python (openpyxl + supabase-py)

---

## 2. ARCHIVOS DEL PROYECTO

### Archivos Principales
```
├── index.html                    # Portal principal (login + tarjetas de apps)
├── auth.js                       # Módulo de autenticación + permisos
├── dashboard.css                 # Estilos globales
├── landing.css                   # Estilos del portal
├── permissions_setup.sql         # SQL: tablas permisos + auditoría + triggers
├── fix_users_and_permissions.sql # SQL: reparación de usuarios y permisos
├── bodegas_setup.sql             # SQL: schema de bodegas
├── supabase_setup.sql            # SQL: schema inicial (mantenimiento + pozos)
├── migracion_auth.sql            # SQL: migración de auth (hash passwords)
├── migrate_bodegas.py            # Python: migración Excel → Supabase
├── servidor_prueba.bat           # Servidor local de prueba
│
├── MANTENIMIENTO/
│   ├── index.html
│   ├── app.js                    # Lógica del módulo
│   └── style.css
│
├── POZOS/
│   ├── index.html
│   ├── script.js                 # Lógica del módulo
│   └── style.css
│
└── BODEGAS/
    ├── index.html
    ├── script.js                 # Lógica del módulo
    ├── style.css
    └── 1. Control_Bodegas_V0.xlsm  # Fuente de datos Excel
```

---

## 3. SISTEMA DE PERMISOS (NUEVO)

### Tabla: `user_permissions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | BIGINT | PK auto |
| user_id | INTEGER | FK → users(id) |
| module | TEXT | 'mantenimiento', 'pozos', 'bodegas' |
| can_view | BOOLEAN | Puede ver el módulo |
| can_edit | BOOLEAN | Puede crear/editar registros |
| can_delete | BOOLEAN | Puede eliminar registros |
| can_export | BOOLEAN | Puede exportar a Excel |

### Reglas de Permisos
- **Admin**: Acceso total implícito (no necesita registros en user_permissions)
- **User**: Por defecto: view=true, edit=false, delete=false, export=true
- **Viewer**: Por defecto: view=true, edit=false, delete=false, export=false
- Si no existe registro → sin acceso al módulo

### Métodos en `auth.js`
```javascript
Auth.hasPermission(module, action)  // Retorna true/false
Auth.canView(module)                // Ver módulo
Auth.canEdit(module)                // Editar/crear
Auth.canDelete(module)              // Eliminar
Auth.canExport(module)              // Exportar
Auth.loadPermissions(userId)        // Carga permisos de BD
Auth.savePermissions(userId, perms) // Guarda permisos
Auth.setCurrentUser(username)       // Setea variable de sesión para auditoría
```

### UI de Permisos
- Botón "🔒 Permisos" en la tabla de usuarios (panel de gestión)
- Modal con checkboxes por módulo: Ver, Editar, Eliminar, Exportar
- Admin no necesita permisos (acceso total implícito)

---

## 4. SISTEMA DE AUDITORÍA (NUEVO)

### Tabla: `audit_log`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | BIGINT | PK auto |
| module | TEXT | 'mantenimiento', 'pozos', 'bodegas', 'auth' |
| table_name | TEXT | Tabla afectada |
| record_id | BIGINT | ID del registro |
| action | TEXT | 'INSERT', 'UPDATE', 'DELETE' |
| old_values | JSONB | Valores antes del cambio |
| new_values | JSONB | Valores después del cambio |
| changed_by | TEXT | Usuario que hizo el cambio |
| changed_at | TIMESTAMPTZ | Fecha/hora del cambio |
| description | TEXT | Descripción legible del cambio |

### Triggers Automáticos
Se disparan en INSERT/UPDATE/DELETE de:
- `mantenimiento` → module='mantenimiento'
- `inspections`, `pump_records` → module='pozos'
- `bodegas_inventory`, `bodegas_transactions`, `bodegas_list` → module='bodegas'
- `users` → module='auth'

### Funciones Clave
```sql
set_current_user(username TEXT)  -- Setea el usuario actual para auditoría
get_current_user()               -- Retorna el usuario actual
audit_trigger_func()             -- Función genérica de auditoría
```

### UI de Auditoría
- Botón "📋 Auditoría" en la barra superior (solo admin)
- Panel con filtros: módulo, acción, usuario, fecha desde/hasta
- Tabla con todos los cambios registrados
- Botón "Ver" para ver detalle de cada cambio

---

## 5. TABLAS DE BASE DE DATOS

### Tablas Existentes
| Tabla | Módulo | Propósito |
|-------|--------|-----------|
| `users` | Auth | Usuarios del sistema |
| `mantenimiento` | Mantenimiento | Reportes de mantenimiento |
| `inspections` | Pozos | Checklist de inspecciones |
| `pump_records` | Pozos | Datos técnicos de bombeo |
| `bodegas_inventory` | Bodegas | Inventario de artículos |
| `bodegas_transactions` | Bodegas | Transacciones de stock |
| `bodegas_list` | Bodegas | Lista de bodegas |

### Tablas Nuevas
| Tabla | Propósito |
|-------|-----------|
| `user_permissions` | Permisos granulares por usuario/módulo |
| `audit_log` | Registro centralizado de cambios |

### Vistas
| Vista | Propósito |
|-------|-----------|
| `v_user_permissions` | Permisos con info de usuario (join users) |

---

## 6. CAMBIOS REALIZADOS POR MÓDULO

### BODEGAS
- ✅ Columna "Acciones" en tabla Inventario (botones editar/eliminar)
- ✅ Columna "Acciones" en tabla Movimientos (botones editar/eliminar)
- ✅ Modal de edición de inventario (descripcion, especificaciones, unidad, min_stock, ubicacion)
- ✅ Modal de edición de transacciones (fecha, cantidad, responsable, notas, etc.)
- ✅ Verificación de permisos: `Auth.canEdit('bodegas')` para mostrar botones
- ✅ `Auth.setCurrentUser()` antes de cada operación de escritura
- ✅ Funciones: `openEditInventory()`, `handleSaveInventoryEdit()`, `deleteInventoryItem()`
- ✅ Funciones: `openEditTransaction()`, `handleSaveTransEdit()`, `deleteTransaction()`
- ✅ Columna "Responsable" agregada a la tabla de movimientos
- ✅ Export de Excel incluye campo Responsable

### MANTENIMIENTO
- ✅ Verificación de permisos: `Auth.canView('mantenimiento')`
- ✅ Si no puede editar: oculta tab de registro, muestra solo consulta
- ✅ `Auth.setCurrentUser()` antes de insertar reporte

### POZOS
- ✅ Verificación de permisos: `Auth.canView('pozos')`
- ✅ `Auth.setCurrentUser()` antes de insertar/actualizar inspecciones

### PORTAL (index.html)
- ✅ Botón "🔒 Permisos" en tabla de usuarios
- ✅ Modal de permisos con checkboxes por módulo
- ✅ Panel de auditoría con filtros y tabla
- ✅ Botón "📋 Auditoría" en barra superior (solo admin)
- ✅ Logging de consola para debugging

### AUTH.JS
- ✅ `loadPermissions(userId)` - Carga permisos via RPC
- ✅ `savePermissions(userId, permissions)` - Guarda permisos
- ✅ `hasPermission(module, action)` - Verifica permiso
- ✅ `canView/canEdit/canDelete/canExport` - Atajos
- ✅ `setCurrentUser(username)` - Setea usuario para auditoría
- ✅ `loadAuditLog(filters)` - Carga registros de auditoría
- ✅ Login ahora carga permisos y setea current_user

### DASHBOARD.CSS
- ✅ Estilos para `.admin-panel`, `.admin-perm-btn`
- ✅ Estilos para `.modal-overlay`, `.modal-content`
- ✅ Estilos para `.permissions-table`, `.perm-check`
- ✅ Estilos para `.edit-btn`, `.delete-btn`
- ✅ Estilos para `.acciones-col`

---

## 7. PASOS PARA ACTIVAR (PENDIENTE)

### Paso 1: Ejecutar SQL en Supabase
```
1. Abrir Supabase → SQL Editor
2. Ejecutar fix_users_and_permissions.sql (script de reparación)
   - Este script crea TODAS las tablas, funciones, triggers y políticas
3. Verificar que no haya errores en la salida
```

### Paso 2: Verificar Usuarios
```
1. Ir al portal principal
2. Hacer login como Admin
3. Click en "⚙ Gestionar Usuarios"
4. Debería mostrar la lista de usuarios
5. Si no carga: abrir F12 → Console → ver errores
```

### Paso 3: Verificar Permisos
```
1. En gestión de usuarios, click en "🔒 Permisos" de un usuario
2. Debería mostrar checkboxes por módulo
3. Modificar permisos y guardar
4. Hacer logout/login con ese usuario para ver cambios
```

### Paso 4: Verificar Auditoría
```
1. Click en "📋 Auditoría" (solo admin)
2. Debería mostrar registros de cambios
3. Hacer un cambio en Bodegas y verificar que aparezca
```

---

## 8. PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema: Usuarios no cargan
**Causa**: Política RLS de `users` bloqueada o tabla `user_permissions` no existe
**Solución**: Ejecutar `fix_users_and_permissions.sql`

### Problema: Error al crear usuario nuevo
**Causa**: Trigger `trg_auto_permissions` falla si `user_permissions` no existe
**Solución**: El script de reparación incluye verificación de existencia

### Problema: Permisos no se aplican
**Causa**: Los permisos se cargan al hacer login, hay que hacer logout/login
**Solución**: Después de cambiar permisos, el usuario debe cerrar sesión y volver a entrar

### Problema: Auditoría no registra cambios
**Causa**: `set_current_user()` no se llamó antes de la operación
**Solución**: Verificar que cada módulo llame `Auth.setCurrentUser(session.username)` antes de INSERT/UPDATE/DELETE

---

## 9. CÓMO AGREGAR UN NUEVO MÓDULO

### Paso 1: SQL - Agregar triggers de auditoría
```sql
-- En permissions_setup.sql o fix_users_and_permissions.sql
DROP TRIGGER IF EXISTS audit_nueva_tabla ON nueva_tabla;
CREATE TRIGGER audit_nueva_tabla
    AFTER INSERT OR UPDATE OR DELETE ON nueva_tabla
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### Paso 2: SQL - Agregar permisos por defecto
```sql
-- En la función create_default_permissions, agregar el módulo:
v_modules TEXT[] := ARRAY['mantenimiento', 'pozos', 'bodegas', 'nuevo_modulo'];
```

### Paso 3: Frontend - Verificar permisos
```javascript
// En el script del nuevo módulo
if (!Auth.canView('nuevo_modulo')) {
    // Mostrar mensaje de acceso denegado
    return;
}

// Para operaciones de edición
if (!Auth.canEdit('nuevo_modulo')) {
    // Ocultar botones de edición
}

// Antes de INSERT/UPDATE/DELETE
await Auth.setCurrentUser(session.username);
```

### Paso 4: Portal - Agregar al modal de permisos
```javascript
// En index.html, handleOpenPermissions()
const modules = ['mantenimiento', 'pozos', 'bodegas', 'nuevo_modulo'];
const moduleLabels = {
    'mantenimiento': 'Mantenimiento',
    'pozos': 'Pozos',
    'bodegas': 'Bodegas',
    'nuevo_modulo': 'Nuevo Módulo'
};
```

### Paso 5: Portal - Agregar filtro de auditoría
```html
<!-- En index.html, panel de auditoría -->
<option value="nuevo_modulo">Nuevo Módulo</option>
```

---

## 10. SERVIDOR DE PRUEBA

### Ejecutar
```bash
servidor_prueba.bat
```
- Puerto: 8080 (configurable en el .bat)
- URL: http://localhost:8080
- Detener: Ctrl+C

### Producción
Para producción, los archivos deben servirse desde un servidor web real (Nginx, Apache, etc.) apuntando a la raíz del proyecto.

---

## 11. CREDENCIALES POR DEFECTO

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| Admin | 354 | admin |
| GDR | 123 | user |

---

## 12. SUPABASE

- **URL**: https://dzmhhlsttqygjvfabdxx.supabase.co
- **Key**: sb_publishable_gqH1ZQ9bl--GBVfmcI4Q-A__UvBKemK
- **Proyecto**: dzmhhlsttqygjvfabdxx

---

## 13. PRÓXIMOS PASOS SUGERIDOS

1. [ ] Ejecutar `fix_users_and_permissions.sql` en Supabase
2. [ ] Verificar que usuarios carguen correctamente
3. [ ] Probar creación de nuevo usuario
4. [ ] Probar asignación de permisos
5. [ ] Probar edición en Bodegas
6. [ ] Probar panel de auditoría
7. [ ] Agregar edición en Mantenimiento (si se requiere)
8. [ ] Agregar edición en Pozos (si se requiere)
9. [ ] Agregar botón de eliminar en Mantenimiento/Pozos (si se requiere)
10. [ ] Considerar agregar paginación en auditoría para muchos registros

---

## 14. NOTAS IMPORTANTES

- Los permisos se cargan **una vez al hacer login**. Si se cambian permisos, el usuario debe hacer logout/login.
- El trigger de auditoría usa `SECURITY DEFINER`, lo que significa que puede escribir en `audit_log` incluso si el usuario no tiene permisos directos.
- La tabla `audit_log` puede crecer rápidamente. Considerar agregar limpieza periódica o archivado.
- El campo `code` y `excel_unique_id` en inventario son **readonly** en la edición (no se pueden cambiar).
- Al eliminar una transacción de bodegas, el trigger `tr_update_stock` ajusta automáticamente el stock.

---

## 15. ESTRUCTURA DE SESIÓN

```javascript
{
    userId: 1,
    username: "Admin",
    role: "admin",
    permissions: {
        mantenimiento: { can_view: true, can_edit: true, can_delete: true, can_export: true },
        pozos: { can_view: true, can_edit: true, can_delete: true, can_export: true },
        bodegas: { can_view: true, can_edit: true, can_delete: true, can_export: true }
    },
    loginTime: 1714651200000
}
```

---

*Documento generado el 02/05/2026 - Para continuar mañana*
