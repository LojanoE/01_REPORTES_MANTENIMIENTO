# Documentación del Sistema de Reportes de Mantenimiento

Este proyecto es una aplicación web para el registro y consulta de actividades de mantenimiento, migrada de Google Sheets a **Supabase** para mejorar la escalabilidad, velocidad y confiabilidad de los datos.

## 🚀 Arquitectura del Sistema

- **Frontend:** HTML5, CSS3 (Bootstrap 5) y JavaScript Vanilla.
- **Base de Datos:** Supabase (PostgreSQL).
- **Gráficos:** Chart.js para la visualización de datos de personal.
- **Exportación:** SheetJS (XLSX) para generar reportes en Excel.

## 🛠️ Configuración de Supabase

### 1. Base de Datos
La tabla principal se llama `mantenimiento` y tiene la siguiente estructura:

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | BIGINT | Clave primaria autoincremental. |
| `fecha_hora` | TIMESTAMPTZ | Fecha y hora del registro. |
| `responsable` | TEXT | Nombre del encargado (en mayúsculas). |
| `tema` | TEXT | Asunto del mantenimiento. |
| `frente` | TEXT | Ubicación o frente de trabajo. |
| `actividades` | TEXT | Descripción de las tareas realizadas. |
| `numero_ecsa` | INT | Cantidad de personal de ECSA. |
| `numero_contratista`| INT | Cantidad de personal contratista. |
| `created_at` | TIMESTAMPTZ | Fecha de creación automática del registro. |

### 2. Seguridad (RLS)
Se han configurado **Políticas de Seguridad de Nivel de Fila (RLS)** para permitir el acceso desde el navegador:
- **Lectura (SELECT):** Permitida para usuarios anónimos (`anon`).
- **Inserción (INSERT):** Permitida para usuarios anónimos (`anon`).

> **Nota:** El archivo `supabase_setup.sql` contiene el código exacto para recrear esta estructura y sus permisos.

## 📂 Estructura de Archivos

- `index.html`: Interfaz de usuario con pestañas para Registro y Consulta.
- `app.js`: Lógica principal, conexión a Supabase y manejo de eventos.
- `styles.css`: Estilos personalizados y diseño bilingüe (Español/Chino).
- `supabase_setup.sql`: Script de configuración inicial de la base de datos.
- `.gitignore`: Configuración para excluir archivos sensibles de GitHub.

## 📋 Instrucciones de Uso

1. **Configuración de API:**
   Asegúrate de que las constantes `SUPABASE_URL` y `SUPABASE_KEY` en `app.js` coincidan con las de tu proyecto en Supabase (*Settings > API*).

2. **Registro de Datos:**
   - Completa el formulario de la pestaña "Registro".
   - El campo "Actividades" genera viñetas automáticas al presionar Enter.
   - Si el frente no está en la lista, selecciona "OTRO" para escribirlo manualmente.

3. **Consulta y Filtros:**
   - Usa la pestaña "Consulta" para ver los registros existentes.
   - Los filtros por Responsable, Tema, Frente y Rango de Fechas se aplican en tiempo real.
   - El gráfico de barras se actualiza automáticamente según los filtros aplicados.

4. **Exportación:**
   - Haz clic en "Exportar a Excel" para descargar los datos actualmente filtrados en formato `.xlsx`.

## 🔒 Seguridad y Buenas Prácticas

- **Exclusiones:** El archivo `.gitignore` evita que el script de configuración SQL se suba a repositorios públicos.
- **Respaldo Local:** El sistema guarda una copia de los datos en el `localStorage` del navegador para permitir la consulta incluso si falla la conexión a internet.
- **Mayúsculas:** El sistema convierte automáticamente los campos de texto a mayúsculas para mantener la consistencia en la base de datos.

---
**Desarrollado para el Departamento de Gestión de Depósitos de Relaves (GDR).**
