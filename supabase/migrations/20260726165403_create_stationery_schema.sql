/*
# Create stationery store database schema

1. Overview
This is a single-tenant e-commerce store for "The Dorm Store" stationery shop.
No sign-in / accounts are required — visitors browse and order as guests.
All policies allow anon + authenticated access because the catalog is intentionally public.

2. New Tables
- `categories` — product categories (e.g. Pens, Notebooks, Bags).
  - id (text, primary key — slug like 'pens', 'notebooks')
  - name (text, not null)
  - image (text — URL to category thumbnail)
  - created_at (timestamptz)
- `products` — the catalog of sellable items.
  - id (uuid, primary key)
  - name (text, not null)
  - category_id (text, foreign key -> categories.id)
  - price (integer, not null — in INR)
  - original_price (integer)
  - rating (numeric, default 0)
  - reviews (integer, default 0)
  - image (text — URL to product photo)
  - tag (text — optional badge like 'Best Seller', 'New', 'Premium')
  - description (text)
  - created_at (timestamptz)
- `orders` — guest checkout orders.
  - id (uuid, primary key)
  - customer_name (text, not null)
  - customer_email (text, not null)
  - customer_phone (text)
  - shipping_address (text, not null)
  - total (integer, not null — total in INR)
  - status (text, default 'pending')
  - created_at (timestamptz)
- `order_items` — line items belonging to an order.
  - id (uuid, primary key)
  - order_id (uuid, foreign key -> orders.id ON DELETE CASCADE)
  - product_id (uuid, foreign key -> products.id)
  - product_name (text, not null — snapshot at purchase time)
  - price (integer, not null — snapshot at purchase time)
  - quantity (integer, not null, default 1)

3. Indexes
- products.category_id — speeds category filtering on the shop page.
- order_items.order_id — speeds order-detail lookups.

4. Security
- RLS enabled on every table.
- All tables use `TO anon, authenticated` because this is a no-auth storefront:
  the anon-key frontend must be able to read the catalog and submit orders.
- SELECT/INSERT/UPDATE/DELETE split into 4 separate policies per table.
  - categories: anon can read; admin-style writes also open to anon (single-tenant, no admin auth yet).
  - products: anon can read; writes open to anon for the same reason.
  - orders: anon can read + insert (guest checkout); update/delete open for order management.
  - order_items: anon can read + insert; update/delete open for management.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  image text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  price integer NOT NULL,
  original_price integer,
  rating numeric(2,1) DEFAULT 0,
  reviews integer DEFAULT 0,
  image text,
  tag text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_address text NOT NULL,
  total integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  price integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- Seed categories
INSERT INTO categories (id, name, image) VALUES
  ('pens', 'Pens & Pencils', 'https://images.pexels.com/photos/159751/book-address-book-learning-read-159751.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('notebooks', 'Notebooks', 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('study', 'Study Essentials', 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('organizers', 'Organizers', 'https://images.pexels.com/photos/416322/pexels-photo-416322.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('bags', 'Bags & Cases', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('desk', 'Desk Accessories', 'https://images.pexels.com/photos/1329571/pexels-photo-1329571.jpeg?auto=compress&cs=tinysrgb&w=200'),
  ('art', 'Art Supplies', 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&w=200')
ON CONFLICT (id) DO NOTHING;

-- Seed products
INSERT INTO products (name, category_id, price, original_price, rating, reviews, image, tag, description)
SELECT * FROM (VALUES
  ('Gel Pens Set (10 Pcs)', 'pens', 299, 399, 4.5, 480, 'https://images.pexels.com/photos/159751/book-address-book-learning-read-159751.jpeg?auto=compress&cs=tinysrgb&w=400', 'Best Seller', 'Smooth-writing gel pens in 10 vibrant colors. Perfect for notes, journaling, and assignments.'),
  ('A5 Spiral Notebook', 'notebooks', 149, 199, 4.5, 350, 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg?auto=compress&cs=tinysrgb&w=400', NULL, '200-page spiral notebook with thick, bleed-proof pages. Ideal for daily notes.'),
  ('Pastel Highlighters (Set of 6)', 'pens', 199, 249, 4.5, 560, 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400', 'New', 'Soft pastel highlighters that won''t bleed through your notes. Set of 6 soothing shades.'),
  ('Canvas Pencil Pouch', 'bags', 179, 249, 4.0, 210, 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400', NULL, 'Durable canvas pencil case with multiple pockets. Keeps your stationery organized.'),
  ('Sticky Notes Set', 'study', 99, 149, 4.5, 610, 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400', 'Best Seller', '400-sheet sticky notes in assorted pastel colors. Strong adhesive that won''t damage pages.'),
  ('Mechanical Pencil Set', 'pens', 249, 349, 4.5, 290, 'https://images.pexels.com/photos/159751/book-address-book-learning-read-159751.jpeg?auto=compress&cs=tinysrgb&w=400', NULL, 'Set of 3 mechanical pencils with 0.5mm lead. Includes extra leads and eraser tips.'),
  ('Leather Desk Organizer', 'desk', 449, 599, 4.5, 175, 'https://images.pexels.com/photos/1329571/pexels-photo-1329571.jpeg?auto=compress&cs=tinysrgb&w=400', 'Premium', 'Elegant vegan-leather desk organizer with 5 compartments. Keeps your workspace tidy.'),
  ('Watercolor Set (24 Colors)', 'art', 349, 499, 5.0, 140, 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&w=400', NULL, 'Professional-grade watercolors with vibrant, fade-resistant pigments.'),
  ('Hardcover Planner 2025', 'organizers', 299, 399, 4.5, 320, 'https://images.pexels.com/photos/416322/pexels-photo-416322.jpeg?auto=compress&cs=tinysrgb&w=400', 'New', 'Structured daily planner with monthly overviews, goal trackers, and dot-grid notes pages.'),
  ('Backpack — Tan Canvas', 'bags', 1299, 1799, 4.5, 89, 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400', 'Premium', 'Spacious 30L canvas backpack with padded laptop sleeve, water-resistant coating.'),
  ('Index Card Set (200 Pcs)', 'study', 129, 179, 4.0, 205, 'https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400', NULL, 'Blank and ruled index cards for flashcards, notes, and study sessions.'),
  ('Washi Tape Set (12 Rolls)', 'art', 199, 279, 4.5, 430, 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg?auto=compress&cs=tinysrgb&w=400', NULL, 'Decorative washi tapes in botanical and geometric patterns. Great for bullet journaling.')
) AS v(name, category_id, price, original_price, rating, reviews, image, tag, description)
WHERE NOT EXISTS (SELECT 1 FROM products);
