begin;

alter table public.user_profiles
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists work_experience jsonb not null default '[]'::jsonb,
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists projects jsonb not null default '[]'::jsonb,
  add column if not exists tools jsonb not null default '[]'::jsonb,
  add column if not exists languages jsonb not null default '[]'::jsonb,
  add column if not exists awards jsonb not null default '[]'::jsonb,
  add column if not exists volunteer_experience jsonb not null default '[]'::jsonb,
  add column if not exists publications jsonb not null default '[]'::jsonb,
  add column if not exists courses jsonb not null default '[]'::jsonb,
  add column if not exists interests jsonb not null default '[]'::jsonb,
  add column if not exists additional_details jsonb not null default '{}'::jsonb,
  add column if not exists years_of_experience numeric;

commit;
notify pgrst, 'reload schema';
