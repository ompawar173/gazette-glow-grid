-- Add name and status columns to newsletter_subscribers table
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'subscribed';

-- Ensure RLS policies permit public insertion
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sub_public_insert ON public.newsletter_subscribers;
CREATE POLICY sub_public_insert ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
