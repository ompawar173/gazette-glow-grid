-- Add company_name, designation, and role columns to team_members
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'CIO Media World',
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'Editor';
