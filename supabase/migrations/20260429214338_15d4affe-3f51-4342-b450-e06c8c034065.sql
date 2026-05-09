-- Prevent customers from listing/enumerating files in the product-images bucket.
-- Public direct-URL reads (used by <img> tags) go through the public CDN endpoint
-- and do NOT require a SELECT policy on storage.objects, so the storefront keeps working.
-- Only admins should be able to query storage.objects (used by .list() / .from().select()).

DROP POLICY IF EXISTS "Product images readable by name" ON storage.objects;

CREATE POLICY "Admins list product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
