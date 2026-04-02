-- ============================================================
-- RestaurantOS - Creador de Usuarios de Prueba
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Nota: Este script crea usuarios directamente en el esquema auth.
-- Requiere permisos de superusuario (disponibles en el SQL Editor de Supabase).

-- 1. Definir variables (UUIDs de ejemplo)
DO $$
DECLARE
    restaurant_id uuid := 'a0000000-0000-0000-0000-000000000001'; -- Los Pollos
    admin_id uuid := 'e0000000-0000-0000-0000-000000000001';
    waiter_id uuid := 'e0000000-0000-0000-0000-000000000002';
    kitchen_id uuid := 'e0000000-0000-0000-0000-000000000003';
    -- Hash para '123' (Supabase usa bcrypt)
    pass_hash text := crypt('123', gen_salt('bf'));
BEGIN
    -- 1.5 Asegurar que el restaurante existe
    INSERT INTO public.restaurants (id, name, slug, currency, timezone)
    VALUES (restaurant_id, 'Los Pollos', 'los-pollos', 'COP', 'America/Bogota')
    ON CONFLICT (id) DO NOTHING;

    -- Crear ADMIN
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (
        admin_id, '00000000-0000-0000-0000-000000000000', 'admin@a', pass_hash, now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Demo"}', 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, restaurant_id, full_name, role, active)
    VALUES (admin_id, restaurant_id, 'Admin Demo', 'admin', true)
    ON CONFLICT (id) DO NOTHING;

    -- Crear MESERO
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (
        waiter_id, '00000000-0000-0000-0000-000000000000', 'mesero@a', pass_hash, now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Mesero Demo"}', 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, restaurant_id, full_name, role, active)
    VALUES (waiter_id, restaurant_id, 'Mesero Demo', 'waiter', true)
    ON CONFLICT (id) DO NOTHING;

    -- Crear COCINA
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    VALUES (
        kitchen_id, '00000000-0000-0000-0000-000000000000', 'cocina@a', pass_hash, now(),
        '{"provider":"email","providers":["email"]}', '{"full_name":"Cocina Demo"}', 'authenticated', 'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, restaurant_id, full_name, role, active)
    VALUES (kitchen_id, restaurant_id, 'Cocina Demo', 'kitchen', true)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Usuarios de prueba creados exitosamente.';
END $$;
