-- ============================================================
-- RestaurantOS - Schema Completo
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: restaurants (tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  currency text NOT NULL DEFAULT 'COP',
  timezone text NOT NULL DEFAULT 'America/Bogota',
  active boolean NOT NULL DEFAULT true,
  n8n_webhook_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: profiles (usuarios del sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants ON DELETE CASCADE,
  full_name text,
  role text NOT NULL CHECK (role IN ('superadmin','admin','waiter','kitchen')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA: areas (zonas del restaurante)
-- ============================================================
CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLA: tables (mesas)
-- ============================================================
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  area_id uuid REFERENCES areas ON DELETE SET NULL,
  number text NOT NULL,
  capacity int NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'available' 
    CHECK (status IN ('available','occupied','reserved'))
);

-- ============================================================
-- TABLA: menu_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT '🍽️',
  display_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

-- ============================================================
-- TABLA: menu_items
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES menu_categories ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  preparation_time int NOT NULL DEFAULT 15,
  available boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  allergens text[],
  tags text[]
);

-- ============================================================
-- TABLA: modifiers
-- ============================================================
CREATE TABLE IF NOT EXISTS modifiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'single' CHECK (type IN ('single','multiple'))
);

CREATE TABLE IF NOT EXISTS modifier_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  modifier_id uuid NOT NULL REFERENCES modifiers ON DELETE CASCADE,
  name text NOT NULL,
  price_delta decimal(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_item_modifiers (
  menu_item_id uuid NOT NULL REFERENCES menu_items ON DELETE CASCADE,
  modifier_id uuid NOT NULL REFERENCES modifiers ON DELETE CASCADE,
  required boolean NOT NULL DEFAULT false,
  PRIMARY KEY (menu_item_id, modifier_id)
);

-- ============================================================
-- TABLA: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES tables,
  waiter_id uuid NOT NULL REFERENCES profiles,
  order_number text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','sent','preparing','ready','delivered','closed','cancelled')),
  notes text,
  guests int NOT NULL DEFAULT 1,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  tax decimal(10,2) NOT NULL DEFAULT 0,
  total decimal(10,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','partial','paid')),
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  closed_at timestamptz
);

-- ============================================================
-- TABLA: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items,
  quantity int NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
  sent_to_kitchen_at timestamptz,
  ready_at timestamptz,
  selected_modifiers jsonb
);

-- ============================================================
-- TABLA: activity_log (auditoría)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_waiter ON orders(waiter_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id, available);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant ON profiles(restaurant_id, active);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: obtener restaurant_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS uuid AS $$
  SELECT restaurant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- POLÍTICAS: restaurants
CREATE POLICY "users_see_own_restaurant" ON restaurants
  FOR SELECT USING (id = get_user_restaurant_id() OR get_user_role() = 'superadmin');

CREATE POLICY "admin_update_restaurant" ON restaurants
  FOR UPDATE USING (id = get_user_restaurant_id() AND get_user_role() IN ('admin','superadmin'));

-- POLÍTICAS: profiles
CREATE POLICY "users_see_own_profile" ON profiles
  FOR SELECT USING (restaurant_id = get_user_restaurant_id() OR get_user_role() = 'superadmin');

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admin_manage_profiles" ON profiles
  FOR ALL USING (restaurant_id = get_user_restaurant_id() AND get_user_role() IN ('admin','superadmin'));

-- POLÍTICAS GENÉRICAS para tablas con restaurant_id
DO $$ BEGIN
  -- areas
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON areas USING (restaurant_id = get_user_restaurant_id())';
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON tables USING (restaurant_id = get_user_restaurant_id())';
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON menu_categories USING (restaurant_id = get_user_restaurant_id())';
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON menu_items USING (restaurant_id = get_user_restaurant_id())';
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON modifiers USING (restaurant_id = get_user_restaurant_id())';
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON orders USING (restaurant_id = get_user_restaurant_id())';
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON activity_log USING (restaurant_id = get_user_restaurant_id())';

  -- modifier_options (via modifier_id join)  
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON modifier_options USING (modifier_id IN (SELECT id FROM modifiers WHERE restaurant_id = get_user_restaurant_id()))';
  
  -- menu_item_modifiers (via menu_item_id join)
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON menu_item_modifiers USING (menu_item_id IN (SELECT id FROM menu_items WHERE restaurant_id = get_user_restaurant_id()))';
  
  -- order_items (via order_id join)  
  EXECUTE 'CREATE POLICY "restaurant_isolation" ON order_items USING (order_id IN (SELECT id FROM orders WHERE restaurant_id = get_user_restaurant_id()))';
EXCEPTION WHEN OTHERS THEN
  -- Policies may already exist
  NULL;
END $$;

-- Permisos de escritura para roles específicos
CREATE POLICY "admins_write_areas" ON areas FOR INSERT WITH CHECK (restaurant_id = get_user_restaurant_id() AND get_user_role() IN ('admin','superadmin'));
CREATE POLICY "admins_write_tables" ON tables FOR INSERT WITH CHECK (restaurant_id = get_user_restaurant_id() AND get_user_role() IN ('admin','superadmin'));
CREATE POLICY "admins_write_menu" ON menu_categories FOR INSERT WITH CHECK (restaurant_id = get_user_restaurant_id() AND get_user_role() IN ('admin','superadmin'));
CREATE POLICY "admins_write_menu_items" ON menu_items FOR INSERT WITH CHECK (restaurant_id = get_user_restaurant_id() AND get_user_role() IN ('admin','superadmin'));

CREATE POLICY "waiters_insert_orders" ON orders FOR INSERT WITH CHECK (restaurant_id = get_user_restaurant_id());
CREATE POLICY "waiters_insert_order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "kitchen_update_orders" ON orders FOR UPDATE USING (restaurant_id = get_user_restaurant_id());
CREATE POLICY "kitchen_update_order_items" ON order_items FOR UPDATE USING (true);
