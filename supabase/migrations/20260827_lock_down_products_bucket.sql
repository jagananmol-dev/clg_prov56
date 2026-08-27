/*
# Lock down the legacy "products" storage bucket

Problem:
  20260726171514_create_products_storage_bucket.sql created a bucket
  named `products` with INSERT/UPDATE/DELETE policies granted to
  `authenticated` — meaning any signed-up customer (there is no
  admin-specific Postgres role; admin auth is handled entirely by the
  separate Express backend's own JWT) could upload, overwrite, or
  delete objects in that bucket.

  The app doesn't actually use this bucket: real product image uploads
  go through backend/src/routes/upload.routes.ts to the `product-images`
  bucket (created in 20260806_create_storage_bucket.sql), which
  correctly has no client-writable policies — only the backend's
  service_role key can write there. `products` was leftover scaffolding
  from before uploads were consolidated into the backend.

Fix:
  Drop the three write policies on the `products` bucket. Public read
  stays (harmless, and avoids breaking anything if an old row somewhere
  still links to a file in this bucket). The bucket itself is left in
  place rather than dropped, in case it holds files still referenced
  from historical data — only the ability for arbitrary customers to
  write to it is removed.
*/

DROP POLICY IF EXISTS "auth_insert_products" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_products" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_products" ON storage.objects;

-- "public_read_products" (SELECT, TO anon, authenticated) is intentionally
-- left in place — read-only public access to a storage bucket is not a
-- vulnerability, and removing it could break any existing links.
