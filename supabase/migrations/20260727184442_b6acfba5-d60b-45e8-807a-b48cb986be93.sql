
-- Public read on the 3 buckets
CREATE POLICY "public_read_content_buckets" ON storage.objects FOR SELECT
  USING (bucket_id IN ('article-images','magazine-covers','magazine-pdfs'));

CREATE POLICY "admin_write_content_buckets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('article-images','magazine-covers','magazine-pdfs')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));

CREATE POLICY "admin_update_content_buckets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('article-images','magazine-covers','magazine-pdfs')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));

CREATE POLICY "admin_delete_content_buckets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('article-images','magazine-covers','magazine-pdfs')
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')));

-- Fix mutable search_path
ALTER FUNCTION public.tg_updated_at() SET search_path = public;
