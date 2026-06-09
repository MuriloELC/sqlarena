drop policy if exists "users insert own profile" on profiles;
create policy "users insert own profile" on profiles
for insert with check (auth.uid() = id);

drop policy if exists "progress is readable for rankings" on user_challenge_progress;
create policy "progress is readable for rankings" on user_challenge_progress
for select using (true);

drop policy if exists "point events are readable for rankings" on point_events;
create policy "point events are readable for rankings" on point_events
for select using (true);

drop policy if exists "admins manage tracks" on tracks;
create policy "admins manage tracks" on tracks
for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

drop policy if exists "admins manage modules" on modules;
create policy "admins manage modules" on modules
for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

drop policy if exists "admins manage challenges" on challenges;
create policy "admins manage challenges" on challenges
for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

drop policy if exists "admins manage hints" on challenge_hints;
create policy "admins manage hints" on challenge_hints
for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

drop policy if exists "admins manage events" on platform_events;
create policy "admins manage events" on platform_events
for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
