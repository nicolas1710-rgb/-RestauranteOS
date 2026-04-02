-- ============================================================
-- deep_clean_auth.sql - Ejecutar en Supabase SQL Editor
-- Limpia la base de datos de usuarios corruptos
-- ============================================================

-- 1. Desactivar triggers de auth temporalmente si es posible (opcional)
-- NOTA: Esto limpia los perfiles asociados primero para evitar errores de FK
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@a', 'mesero@a', 'cocina@a')
);

-- 2. Limpiar identidades huérfanas
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@a', 'mesero@a', 'cocina@a')
);

-- 3. Eliminar los usuarios corruptos de auth.users
DELETE FROM auth.users WHERE email IN ('admin@a', 'mesero@a', 'cocina@a');

-- 4. Reparar el esquema auth (si hay triggers rotos)
-- Esto asegura que el campo instance_id y otros sean correctos
UPDATE auth.users SET instance_id = '00000000-0000-0000-0000-000000000000' WHERE instance_id IS NULL;

-- FINAL: Verificar que la tabla quedó limpia
SELECT COUNT(*) as remaining_test_users FROM auth.users WHERE email IN ('admin@a', 'mesero@a', 'cocina@a');
