/*
 * @file 20260805_admin_reviews_table.sql
 * @description Reviews table + tighten product/category write permissions.
 *
 * Changes:
 *  1. CREATE reviews table (user reviews on products)
 *  2. RLS on reviews: users read all, users insert/delete their own
 *  3. TIGHTEN products + categories: remove anon INSERT/UPDATE/DELETE
 *     (only backend service_role can write products now)
 */

-- ─────────────────────────────────────────────
-- 1. REVIEWS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT         NOT NULL CHECK (char_length(content) BETWEEN 10 AND 1000),
  rating      INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ  DEFAULT now(),

  -- One review per user per product
  UNIQUE (product_id, user_id)
);

-- Index for fast product-level review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON reviews(user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can READ all reviews
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT TO anon, authenticated USING (true);

-- Logged-in users can INSERT their own review
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can UPDATE their own review
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users can DELETE their own review
-- (Admin deletes via service_role — bypasses RLS entirely)
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 2. TIGHTEN PRODUCTS — remove anon write access
--    Only backend (service_role) can write now
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;

-- SELECT stays open (public catalog)
-- INSERT/UPDATE/DELETE: removed — only service_role bypasses RLS

-- ─────────────────────────────────────────────
-- 3. TIGHTEN CATEGORIES — same as products
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
