-- Enhance page_views table for comprehensive analytics
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS visitor_id text;

-- Performance indexes for analytics aggregation
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_visitor_id_idx ON public.page_views (visitor_id);
CREATE INDEX IF NOT EXISTS page_views_session_id_idx ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON public.page_views (path);

-- RLS Grants and Policies
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated, service_role;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pv_public_insert ON public.page_views;
CREATE POLICY pv_public_insert ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS pv_staff_read ON public.page_views;
CREATE POLICY pv_staff_read ON public.page_views FOR SELECT TO authenticated
  USING (can_do(auth.uid(), 'analytics', 'view') OR has_role(auth.uid(), 'admin'::app_role));
