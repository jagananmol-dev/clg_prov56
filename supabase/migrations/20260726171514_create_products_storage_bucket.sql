/*
# Create public storage bucket for product images

1. Overview
Creates a public storage bucket named `products` so the storefront can
upload and display product photos. Public read access means anyone can
view the images via their public URL — required for a storefront.

2. Storage
- Bucket `products` (public = true) — holds product images.
- Public read policy on storage.objects so anon users can view images.
- Authenticated write policy so logged-in admins can upload later.

3. Security
- SELECT (read) on storage.objects: public — anyone can view product photos.
- INSERT (upload): authenticated users only — admin uploads.
- UPDATE / DELETE: authenticated users only — admin management.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for product images
DROP POLICY IF EXISTS "public_read_products" ON storage.objects;
CREATE POLICY "public_read_products" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'products');

-- Authenticated upload
DROP POLICY IF EXISTS "auth_insert_products" ON storage.objects;
CREATE POLICY "auth_insert_products" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

-- Authenticated update
DROP POLICY IF EXISTS "auth_update_products" ON storage.objects;
CREATE POLICY "auth_update_products" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products') WITH CHECK (bucket_id = 'products');

-- Authenticated delete
DROP POLICY IF EXISTS "auth_delete_products" ON storage.objects;
CREATE POLICY "auth_delete_products" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');
