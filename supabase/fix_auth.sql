-- ============================================================
-- fix_auth.sql - Versión Simplificada y Segura
-- Corregir error "Database error querying schema"
-- ============================================================

-- 1. Asegurar identidades para cada correo de prueba
-- Supabase necesita un registro en auth.identities para permitir el ingreso
INSERT INTO auth.identities (
  id, 
  user_id, 
  identity_data, 
  provider, 
  last_sign_in_at, 
  created_at, 
  updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  json_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email IN ('admin@a', 'mesero@a', 'cocina@a')
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
  );

-- 2. Asegurar que el el correo esté marcado como confirmado si no lo está
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email IN ('admin@a', 'mesero@a', 'cocina@a')
  AND email_confirmed_at IS NULL;

-- 3. Verificación final
SELECT u.email, 
       u.email_confirmed_at, 
       (SELECT COUNT(*) FROM auth.identities i WHERE i.user_id = u.id) as identities_count
FROM auth.users u
WHERE u.email IN ('admin@a', 'mesero@a', 'cocina@a');
