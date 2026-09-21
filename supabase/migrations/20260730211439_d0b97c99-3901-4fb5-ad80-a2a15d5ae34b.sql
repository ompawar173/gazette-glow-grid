CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY tm_admin_all ON public.team_members FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY tm_read_own ON public.team_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE OR REPLACE FUNCTION public.tg_team_member_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.team_members) >= 10 THEN
    RAISE EXCEPTION 'Team member limit of 10 reached';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER team_members_limit BEFORE INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_team_member_limit();

CREATE OR REPLACE FUNCTION public.can_do(_user_id uuid, _area text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT has_role(_user_id, 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.user_id = _user_id
          AND tm.active
          AND COALESCE((tm.permissions -> _area ->> _action)::boolean, false)
      );
$$;

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY cm_public_insert ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY cm_staff_read ON public.contact_messages FOR SELECT TO authenticated
  USING (can_do(auth.uid(), 'messages', 'view'));
CREATE POLICY cm_staff_update ON public.contact_messages FOR UPDATE TO authenticated
  USING (can_do(auth.uid(), 'messages', 'edit')) WITH CHECK (can_do(auth.uid(), 'messages', 'edit'));
CREATE POLICY cm_admin_delete ON public.contact_messages FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS art_admin_write ON public.articles;
DROP POLICY IF EXISTS art_admin_read_all ON public.articles;
CREATE POLICY art_staff_read_all ON public.articles FOR SELECT TO authenticated
  USING (can_do(auth.uid(), 'articles', 'view'));
CREATE POLICY art_staff_insert ON public.articles FOR INSERT TO authenticated
  WITH CHECK (can_do(auth.uid(), 'articles', 'create'));
CREATE POLICY art_staff_update ON public.articles FOR UPDATE TO authenticated
  USING (can_do(auth.uid(), 'articles', 'edit')) WITH CHECK (can_do(auth.uid(), 'articles', 'edit'));
CREATE POLICY art_staff_delete ON public.articles FOR DELETE TO authenticated
  USING (can_do(auth.uid(), 'articles', 'delete'));

DROP POLICY IF EXISTS mag_admin_write ON public.magazines;
DROP POLICY IF EXISTS mag_admin_read_all ON public.magazines;
CREATE POLICY mag_staff_read_all ON public.magazines FOR SELECT TO authenticated
  USING (can_do(auth.uid(), 'magazines', 'view'));
CREATE POLICY mag_staff_insert ON public.magazines FOR INSERT TO authenticated
  WITH CHECK (can_do(auth.uid(), 'magazines', 'create'));
CREATE POLICY mag_staff_update ON public.magazines FOR UPDATE TO authenticated
  USING (can_do(auth.uid(), 'magazines', 'edit')) WITH CHECK (can_do(auth.uid(), 'magazines', 'edit'));
CREATE POLICY mag_staff_delete ON public.magazines FOR DELETE TO authenticated
  USING (can_do(auth.uid(), 'magazines', 'delete'));

DROP POLICY IF EXISTS cat_admin_write ON public.categories;
CREATE POLICY cat_staff_write ON public.categories FOR ALL TO authenticated
  USING (can_do(auth.uid(), 'industries', 'edit')) WITH CHECK (can_do(auth.uid(), 'industries', 'edit'));

DROP POLICY IF EXISTS sub_admin_read ON public.newsletter_subscribers;
CREATE POLICY sub_staff_read ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (can_do(auth.uid(), 'subscribers', 'view'));