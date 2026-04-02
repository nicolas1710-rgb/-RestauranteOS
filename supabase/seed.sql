-- ============================================================
-- RestaurantOS - Datos de Demo (Seed)
-- Ejecutar DESPUÉS de 001_schema.sql
-- ============================================================

-- Crear restaurante demo
INSERT INTO restaurants (id, name, slug, currency, timezone) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Los Pollos', 'los-pollos', 'COP', 'America/Bogota')
ON CONFLICT (slug) DO NOTHING;

-- Crear áreas
INSERT INTO areas (id, restaurant_id, name, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Salón Principal', 0),
  ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Terraza', 1),
  ('a1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Bar', 2)
ON CONFLICT DO NOTHING;

-- Crear mesas
INSERT INTO tables (id, restaurant_id, area_id, number, capacity, status) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '1', 4, 'available'),
  ('b1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '2', 4, 'available'),
  ('b1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '3', 6, 'available'),
  ('b1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '4', 2, 'available'),
  ('b1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'T1', 4, 'available'),
  ('b1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'T2', 4, 'available'),
  ('b1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'B1', 2, 'available'),
  ('b1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'B2', 2, 'available')
ON CONFLICT DO NOTHING;

-- Crear categorías del menú
INSERT INTO menu_categories (id, restaurant_id, name, icon, display_order, active) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Entradas', '🥗', 0, true),
  ('c1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Platos Fuertes', '🍖', 1, true),
  ('c1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Pastas', '🍝', 2, true),
  ('c1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Bebidas', '🥤', 3, true),
  ('c1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Postres', '🍰', 4, true)
ON CONFLICT DO NOTHING;

-- Crear items del menú
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, preparation_time, available, display_order, tags) VALUES
  -- Entradas
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Bruschetta al Pesto', 'Pan tostado con pesto fresco, tomate y albahaca', 18000, 8, true, 0, ARRAY['vegetariano']),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Tabla de Embutidos', 'Selección de jamón, chorizo y quesos importados', 35000, 5, true, 1, ARRAY['popular']),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Sopa del Día', 'Preparación del chef según mercado', 16000, 10, true, 2, NULL),
  -- Platos Fuertes
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Lomo al Trapo', 'Lomo de res a la parrilla con papas rústicas', 68000, 20, true, 0, ARRAY['popular']),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Pollo a la Plancha', 'Pechuga de pollo con salsa de limón y arroz', 42000, 18, true, 1, NULL),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Salmón a la Mantequilla', 'Filete de salmón noruego con mantequilla y alcaparras', 74000, 20, true, 2, NULL),
  -- Pastas
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Carbonara Clásica', 'Spaghetti, guanciale, yema de huevo y pecorino', 38000, 15, true, 0, ARRAY['popular']),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Penne al Pesto', 'Penne con pesto genovés y piñones tostados', 32000, 12, true, 1, ARRAY['vegetariano']),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Lasaña de Carne', 'Lasaña tradicional con salsa boloñesa y béchamel', 44000, 15, true, 2, NULL),
  -- Bebidas
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'Agua Mineral', 'Agua con o sin gas 350ml', 6000, 1, true, 0, NULL),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'Limonada Natural', 'Limonada fresca con menta', 12000, 3, true, 1, NULL),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'Copa de Vino Tinto', 'House wine tinto de la casa', 18000, 2, true, 2, NULL),
  -- Postres
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'Tiramisú', 'Postre italiano clásico con café y mascarpone', 22000, 5, true, 0, NULL),
  ('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'Panna Cotta', 'Con coulis de frutos rojos', 18000, 5, true, 1, NULL)
ON CONFLICT DO NOTHING;

-- Crear modificador: Término de la carne (para Lomo al Trapo)
INSERT INTO modifiers (id, restaurant_id, name, type) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Término de la carne', 'single')
ON CONFLICT DO NOTHING;

INSERT INTO modifier_options (modifier_id, name, price_delta) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Azul', 0),
  ('d1000000-0000-0000-0000-000000000001', 'Medio', 0),
  ('d1000000-0000-0000-0000-000000000001', 'Tres cuartos', 0),
  ('d1000000-0000-0000-0000-000000000001', 'Bien cocido', 0)
ON CONFLICT DO NOTHING;

-- NOTA: Para crear usuarios admin/mesero/cocina, registrarlos primero en Supabase Auth
-- y luego ejecutar:
-- INSERT INTO profiles (id, restaurant_id, full_name, role) VALUES
--   ('<auth_user_uuid>', 'a0000000-0000-0000-0000-000000000001', 'Admin Demo', 'admin'),
--   ('<auth_user_uuid>', 'a0000000-0000-0000-0000-000000000001', 'Mesero Demo', 'waiter');
