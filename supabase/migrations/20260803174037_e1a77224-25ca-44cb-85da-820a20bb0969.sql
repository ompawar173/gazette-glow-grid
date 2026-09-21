CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  hero_image_url text,
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pg_public_read_pub ON public.pages FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY pg_staff_read_all ON public.pages FOR SELECT TO authenticated USING (can_do(auth.uid(), 'pages', 'view'));
CREATE POLICY pg_staff_insert ON public.pages FOR INSERT TO authenticated WITH CHECK (can_do(auth.uid(), 'pages', 'create'));
CREATE POLICY pg_staff_update ON public.pages FOR UPDATE TO authenticated USING (can_do(auth.uid(), 'pages', 'edit')) WITH CHECK (can_do(auth.uid(), 'pages', 'edit'));
CREATE POLICY pg_staff_delete ON public.pages FOR DELETE TO authenticated USING (can_do(auth.uid(), 'pages', 'delete'));

CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

ALTER TABLE public.backlinks ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;
ALTER TABLE public.backlinks ADD COLUMN IF NOT EXISTS rel_nofollow boolean NOT NULL DEFAULT true;
ALTER TABLE public.backlinks ADD COLUMN IF NOT EXISTS rel_sponsored boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.increment_backlink_click(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.backlinks SET click_count = click_count + 1, last_clicked_at = now() WHERE id = _id;
END; $function$;