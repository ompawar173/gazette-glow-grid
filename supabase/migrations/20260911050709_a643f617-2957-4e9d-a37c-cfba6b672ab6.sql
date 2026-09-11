ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_latest boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS articles_latest_published_idx
ON public.articles (is_latest, published_at DESC)
WHERE status = 'published';