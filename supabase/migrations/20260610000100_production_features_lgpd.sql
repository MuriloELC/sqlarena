alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists privacy_version text;

alter view public.ranking_general set (security_invoker = true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

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

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

revoke execute on function public.record_challenge_attempt(uuid, uuid, text, boolean, int, text) from public;
revoke execute on function public.record_challenge_attempt(uuid, uuid, text, boolean, int, text) from anon, authenticated;
grant execute on function public.record_challenge_attempt(uuid, uuid, text, boolean, int, text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  drop policy if exists "avatar images are publicly readable" on storage.objects;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'users upload own avatar') then
    create policy "users upload own avatar"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'users update own avatar') then
    create policy "users update own avatar"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'users delete own avatar') then
    create policy "users delete own avatar"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = (select auth.uid())::text
    );
  end if;
end
$$;

grant select on public.profiles, public.tracks, public.modules, public.challenges, public.challenge_hints, public.user_challenge_progress, public.point_events, public.platform_events, public.ranking_general to anon, authenticated;
grant insert on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, updated_at) on public.profiles to authenticated;
grant select, insert on public.attempts to authenticated;
grant select on public.attempts to service_role;
grant select, insert, update, delete on public.tracks, public.modules, public.challenges, public.challenge_hints, public.platform_events to authenticated;
grant select, insert, update, delete on public.profiles, public.tracks, public.modules, public.challenges, public.challenge_hints, public.attempts, public.user_challenge_progress, public.point_events, public.platform_events to service_role;
