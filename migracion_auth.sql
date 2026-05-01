-- =============================================================================
-- MIGRACIÓN: Sistema de autenticación unificado y auditoría de registros
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================================

-- 1. Agregar columna created_by_name a mantenimiento
ALTER TABLE mantenimiento ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 2. Agregar columna created_by_name a inspections
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 3. Agregar columna created_by_name a pump_records
ALTER TABLE pump_records ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 4. Agregar columnas password_hash y salt a users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salt TEXT;

-- 5. Crear/actualizar usuario Admin (contraseña: 354)
-- Se inserta con plaintext; el sistema la migrará a hash automáticamente en el primer login
INSERT INTO users (username, password, role)
VALUES ('Admin', '354', 'admin')
ON CONFLICT (username)
DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
SELECT 'Columnas agregadas:' as info;
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('mantenimiento', 'inspections', 'pump_records', 'users')
  AND column_name IN ('created_by_name', 'password_hash', 'salt')
ORDER BY table_name, column_name;

SELECT 'Usuarios:' as info;
SELECT id, username, role, 
       CASE WHEN password_hash IS NOT NULL THEN 'HASHED' ELSE 'PLAINTEXT' END as auth_type
FROM users ORDER BY username;