CREATE TABLE public.backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL DEFAULT 'site',
  target_id uuid,
  label text NOT NULL,
  url text NOT NULL,
  note text,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.backlinks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backlinks TO authenticated;
GRANT ALL ON public.backlinks TO service_role;
ALTER TABLE public.backlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY bl_public_read ON public.backlinks FOR SELECT USING (true);
CREATE POLICY bl_staff_insert ON public.backlinks FOR INSERT TO authenticated WITH CHECK (can_do(auth.uid(),'backlinks','create'));
CREATE POLICY bl_staff_update ON public.backlinks FOR UPDATE TO authenticated USING (can_do(auth.uid(),'backlinks','edit')) WITH CHECK (can_do(auth.uid(),'backlinks','edit'));
CREATE POLICY bl_staff_delete ON public.backlinks FOR DELETE TO authenticated USING (can_do(auth.uid(),'backlinks','delete'));
CREATE TRIGGER backlinks_updated_at BEFORE UPDATE ON public.backlinks FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  country text,
  region text,
  city text,
  device text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_views TO anon;
GRANT SELECT, INSERT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY pv_public_insert ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY pv_staff_read ON public.page_views FOR SELECT TO authenticated USING (can_do(auth.uid(),'analytics','view'));
CREATE INDEX page_views_created_at_idx ON public.page_views (created_at DESC);

CREATE OR REPLACE FUNCTION public.increment_backlink_click(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.backlinks SET click_count = click_count + 1 WHERE id = _id;
END; $$;