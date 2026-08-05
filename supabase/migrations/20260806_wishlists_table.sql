-- Wishlist table: persists wishlisted product IDs per user
-- For logged-in users, wishlist syncs to Supabase so it's available across devices.
-- For guests, wishlist is localStorage-only (handled in frontend).

CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Each user can only wishlist a product once
  UNIQUE(user_id, product_id)
);

-- Index for fast lookups: "give me all wishlisted products for this user"
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists (user_id);

-- RLS: users can only see and manage their own wishlist
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);
