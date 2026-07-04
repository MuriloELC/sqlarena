create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.current_user_is_admin() from public, anon;
grant execute on function private.current_user_is_admin() to authenticated, service_role;

drop policy if exists "profiles are public" on profiles;
drop policy if exists "users read own profile" on profiles;
create policy "users read own profile" on profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "admins read profiles" on profiles;
create policy "admins read profiles" on profiles
for select
to authenticated
using (private.current_user_is_admin());

drop policy if exists "users insert own profile" on profiles;
create policy "users insert own student profile" on profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and role = 'student'
  and total_points = 0
);

drop policy if exists "users update own profile" on profiles;
create policy "users update own profile" on profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
);

drop policy if exists "progress is readable for rankings" on user_challenge_progress;
drop policy if exists "users read own progress" on user_challenge_progress;
create policy "users read own progress" on user_challenge_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "point events are readable for rankings" on point_events;
drop policy if exists "users read own point events" on point_events;
create policy "users read own point events" on point_events
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "admins manage tracks" on tracks;
create policy "admins manage tracks" on tracks
for all
to authenticated
using (private.current_user_is_admin())
with check (private.current_user_is_admin());

drop policy if exists "admins manage modules" on modules;
create policy "admins manage modules" on modules
for all
to authenticated
using (private.current_user_is_admin())
with check (private.current_user_is_admin());

drop policy if exists "admins manage challenges" on challenges;
create policy "admins manage challenges" on challenges
for all
to authenticated
using (private.current_user_is_admin())
with check (private.current_user_is_admin());

drop policy if exists "admins manage hints" on challenge_hints;
create policy "admins manage hints" on challenge_hints
for all
to authenticated
using (private.current_user_is_admin())
with check (private.current_user_is_admin());

drop policy if exists "admins manage events" on platform_events;
create policy "admins manage events" on platform_events
for all
to authenticated
using (private.current_user_is_admin())
with check (private.current_user_is_admin());

revoke select on
  profiles,
  user_challenge_progress,
  point_events
from anon, authenticated;

revoke insert on profiles from anon, authenticated;
revoke update on profiles from authenticated;

grant select on
  profiles,
  user_challenge_progress,
  point_events
to authenticated;

grant insert (id, username, display_name, avatar_url, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version)
on profiles
to authenticated;

grant update (username, display_name, avatar_url, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, updated_at)
on profiles
to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    terms_accepted_at,
    terms_version,
    privacy_accepted_at,
    privacy_version
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(new.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz,
    nullif(new.raw_user_meta_data->>'terms_version', ''),
    nullif(new.raw_user_meta_data->>'privacy_accepted_at', '')::timestamptz,
    nullif(new.raw_user_meta_data->>'privacy_version', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
