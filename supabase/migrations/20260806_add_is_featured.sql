-- Add is_featured column to products table
-- This lets the admin mark specific products as "Best Sellers"
-- which appear on the homepage instead of random products.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Index for fast featured product lookups
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured)
WHERE is_featured = TRUE;

COMMENT ON COLUMN products.is_featured IS 'Admin-controlled flag. TRUE = appears in Best Selling section on homepage.';
