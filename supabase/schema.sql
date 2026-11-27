-- Prediction board: tables and access rules for Supabase.
-- Paste this whole file into Supabase > SQL Editor and press Run (once). Safe to run again: it only creates what is missing.
--
-- Who can do what (row-level security):
--   - anyone can read display names, forecasts and the public part of suggestions;
--   - a signed-in person can add their own display name, forecasts and suggestions, and nothing else;
--   - nobody can edit or delete through the site (the latest forecast counts; the maintainer can delete in the dashboard).
-- Email addresses stay in Supabase's own auth tables and are never readable through these tables.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  display_name text not null unique check (char_length(display_name) between 2 and 40 and display_name !~ '[<>@]'),
  created_at timestamptz not null default now()
);

create table if not exists public.forecasts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade default auth.uid(),
  question text not null check (question ~ '^q-[a-z0-9-]{3,120}$'),
  p numeric not null check (p >= 0.01 and p <= 0.99),
  stakeholder_group text not null check (stakeholder_group in (
    'Investor or asset manager', 'Asset owner or pension', 'Company (governance, legal, IR)', 'Proxy advisor or ESG data',
    'Policymaker or regulator', 'Academic or researcher', 'Civil society or advocacy', 'Employee of an AI company',
    'Journalist', 'Retail shareholder', 'Other')),
  stake boolean not null default false,
  confirmed boolean not null check (confirmed),
  made timestamptz not null default now()
);
create index if not exists forecasts_question on public.forecasts (question);

create table if not exists public.suggestions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade default auth.uid(),
  company text not null check (char_length(company) between 1 and 120),
  ask text not null check (char_length(ask) between 3 and 300),
  standing text not null check (standing in ('filed, in a proxy statement', 'filed, not yet in a proxy statement', 'not filed')),
  question text not null check (char_length(question) between 10 and 600),
  source_url text check (source_url is null or source_url ~ '^https://'),
  stake boolean not null default false,
  confirmed boolean not null check (confirmed),
  status text not null default 'awaiting review' check (status in ('awaiting review', 'added to the board', 'not added')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.forecasts enable row level security;
alter table public.suggestions enable row level security;

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select using (true);
drop policy if exists "add own profile" on public.profiles;
create policy "add own profile" on public.profiles for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "read forecasts" on public.forecasts;
create policy "read forecasts" on public.forecasts for select using (true);
drop policy if exists "add own forecast" on public.forecasts;
create policy "add own forecast" on public.forecasts for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "read suggestions" on public.suggestions;
create policy "read suggestions" on public.suggestions for select using (true);
drop policy if exists "add own suggestion" on public.suggestions;
create policy "add own suggestion" on public.suggestions for insert to authenticated with check (user_id = auth.uid());

-- No more than 20 forecasts and 5 suggestions per person per day (spam guard).
create or replace function public.daily_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if tg_table_name = 'forecasts' then
    select count(*) into n from public.forecasts where user_id = new.user_id and made > now() - interval '1 day';
    if n >= 20 then raise exception 'Daily limit reached: 20 forecasts a day.'; end if;
  else
    select count(*) into n from public.suggestions where user_id = new.user_id and created_at > now() - interval '1 day';
    if n >= 5 then raise exception 'Daily limit reached: 5 suggestions a day.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists forecasts_limit on public.forecasts;
create trigger forecasts_limit before insert on public.forecasts for each row execute function public.daily_limit();
drop trigger if exists suggestions_limit on public.suggestions;
create trigger suggestions_limit before insert on public.suggestions for each row execute function public.daily_limit();

-- The public view the site and the nightly copy read: display name instead of the account id.
create or replace view public.forecasts_public with (security_invoker = true) as
  select f.id, f.question, f.p, f.stakeholder_group, f.stake, f.made, pr.display_name
  from public.forecasts f join public.profiles pr using (user_id);
grant select on public.forecasts_public to anon, authenticated;

-- Table access for the site (this project does not grant new tables to the API automatically);
-- row-level security above still decides which rows each person can read or add.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.forecasts, public.suggestions to anon, authenticated;
grant insert on public.profiles, public.forecasts, public.suggestions to authenticated;
