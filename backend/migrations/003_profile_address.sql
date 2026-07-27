-- Structured mailing address for accurate job-application autofill.
-- Safe to run more than once in Supabase Dashboard -> SQL Editor.

begin;

alter table public.user_profiles
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text;

commit;

notify pgrst, 'reload schema';
