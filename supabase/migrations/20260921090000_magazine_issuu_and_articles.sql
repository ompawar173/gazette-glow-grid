-- Add issuu_url column to public.magazines table if not exists
ALTER TABLE public.magazines ADD COLUMN IF NOT EXISTS issuu_url TEXT;

-- Create magazine_articles table to relate articles to magazines
CREATE TABLE IF NOT EXISTS public.magazine_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magazine_id UUID NOT NULL REFERENCES public.magazines(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(magazine_id, article_id)
);

-- Permissions & RLS for magazine_articles
GRANT SELECT ON public.magazine_articles TO anon, authenticated;
GRANT ALL ON public.magazine_articles TO authenticated;
GRANT ALL ON public.magazine_articles TO service_role;

ALTER TABLE public.magazine_articles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'magazine_articles' AND policyname = 'mag_art_public_read'
  ) THEN
    CREATE POLICY "mag_art_public_read" ON public.magazine_articles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'magazine_articles' AND policyname = 'mag_art_admin_write'
  ) THEN
    CREATE POLICY "mag_art_admin_write" ON public.magazine_articles FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
  END IF;
END $$;
