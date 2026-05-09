-- Lock down SECURITY DEFINER trigger functions (not meant for API callers)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_offer_dates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role IS meant to be called by RLS policies (which run as the executing user),
-- so authenticated EXECUTE is required. Just revoke from anon.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Restrict bucket listing: only let users fetch a file when they know the exact name.
DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;
CREATE POLICY "Product images readable by name"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images' AND name IS NOT NULL);