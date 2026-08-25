-- Create the "product-images" bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to read images
CREATE POLICY "Public access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Note: We don't need an INSERT policy here because the backend uses 
-- the SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security (RLS) entirely.
