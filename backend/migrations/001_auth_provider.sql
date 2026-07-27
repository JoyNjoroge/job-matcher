alter table public.users
  add column if not exists auth_provider text;

update public.users
set auth_provider = 'email'
where auth_provider is null or auth_provider = '';

alter table public.users
  alter column auth_provider set default 'email',
  alter column auth_provider set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_provider_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_provider_check
      check (auth_provider in ('email', 'google', 'linkedin'));
  end if;
end $$;

create unique index if not exists users_email_unique_lower_idx
  on public.users (lower(email));
