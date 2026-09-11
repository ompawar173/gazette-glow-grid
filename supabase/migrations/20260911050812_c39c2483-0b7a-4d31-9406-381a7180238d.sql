REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_team_member_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_do(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_do(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_article_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_views(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.increment_backlink_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_backlink_click(uuid) TO anon, authenticated, service_role;