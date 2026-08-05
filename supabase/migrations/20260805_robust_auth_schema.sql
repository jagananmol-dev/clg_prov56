/*
# Robust Auth Schema — The Dorm Store

1. profiles table
   - id UUID PRIMARY KEY → auth.users(id) ON DELETE CASCADE
   - full_name, phone, timestamps
   - RLS: users can only read/update their own row
   - TRIGGER: auto-creates profile row on every new signup

2. orders table improvements
   - user_id UUID → auth.users(id)  (replaces customer_email as the FK)
   - Composite index (user_id, created_at DESC) — matches Account.tsx query exactly
   - Index on status — for future order filtering
   - OLD permissive anon RLS policies replaced with strict per-user policies

3. order_items table improvements
   - OLD permissive anon RLS policies replaced
   - Users may only see/insert items whose parent order belongs to them

Security model after this migration:
  - A logged-in user can SELECT/INSERT orders where user_id = auth.uid()
  - A logged-in user can SELECT/INSERT order_items where the parent order's user_id = auth.uid()
  - No row is visible to any other user or to anonymous requests
*/

-- ─────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Each user manages only their own profile
DROP POLICY IF EXISTS "profiles_select_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────────────
-- 2. AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as the function owner (postgres), not the caller
SET search_path = public  -- prevent search_path hijacking
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop + recreate so the trigger is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 3. ORDERS — add user_id FK
-- ─────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Composite index: matches Account.tsx query pattern exactly
--   .eq('user_id', user.id).order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

-- Index on status for future order status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (status);

-- Remove the old, overly-permissive anon policies
DROP POLICY IF EXISTS "anon_select_orders"  ON orders;
DROP POLICY IF EXISTS "anon_insert_orders"  ON orders;
DROP POLICY IF EXISTS "anon_update_orders"  ON orders;
DROP POLICY IF EXISTS "anon_delete_orders"  ON orders;

-- New strict per-user policies
DROP POLICY IF EXISTS "users_select_own_orders" ON orders;
DROP POLICY IF EXISTS "users_insert_own_orders" ON orders;

CREATE POLICY "users_select_own_orders" ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 4. ORDER_ITEMS — strict per-user policies
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_order_items"  ON order_items;
DROP POLICY IF EXISTS "anon_insert_order_items"  ON order_items;
DROP POLICY IF EXISTS "anon_update_order_items"  ON order_items;
DROP POLICY IF EXISTS "anon_delete_order_items"  ON order_items;

DROP POLICY IF EXISTS "users_select_own_order_items" ON order_items;
DROP POLICY IF EXISTS "users_insert_own_order_items" ON order_items;

-- A user can see items that belong to one of their orders
CREATE POLICY "users_select_own_order_items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- A user can insert items into one of their orders
CREATE POLICY "users_insert_own_order_items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );
