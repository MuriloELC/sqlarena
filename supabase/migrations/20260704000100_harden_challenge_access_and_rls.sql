create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
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

revoke all on function private.current_user_is_admin() from public;
revoke all on function private.current_user_is_admin() from anon;
grant execute on function private.current_user_is_admin() to authenticated, service_role;

create or replace function private.is_challenge_unlocked(p_user_id uuid, p_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with target_challenge as (
    select
      c.id,
      c.module_id,
      c.sort_order as challenge_sort_order,
      m.sort_order as module_sort_order
    from public.challenges c
    join public.modules m on m.id = c.module_id
    where c.id = p_challenge_id
      and c.is_active = true
      and m.is_active = true
  ),
  previous_module as (
    select m.id
    from public.modules m
    cross join target_challenge tc
    where m.is_active = true
      and m.sort_order < tc.module_sort_order
    order by m.sort_order desc
    limit 1
  ),
  previous_module_progress as (
    select
      count(c.id)::numeric as total_challenges,
      count(ucp.challenge_id)::numeric as completed_challenges
    from previous_module pm
    join public.challenges c on c.module_id = pm.id and c.is_active = true
    left join public.user_challenge_progress ucp
      on ucp.challenge_id = c.id
     and ucp.user_id = p_user_id
  ),
  previous_challenge as (
    select c.id
    from public.challenges c
    join target_challenge tc on tc.module_id = c.module_id
    where c.is_active = true
      and c.sort_order < tc.challenge_sort_order
    order by c.sort_order desc
    limit 1
  )
  select
    p_user_id is not null
    and exists (select 1 from target_challenge)
    and (
      not exists (select 1 from previous_module)
      or exists (
        select 1
        from previous_module_progress pmp
        where pmp.total_challenges = 0
           or (pmp.completed_challenges / nullif(pmp.total_challenges, 0)) >= 0.7
      )
    )
    and (
      not exists (select 1 from previous_challenge)
      or exists (
        select 1
        from public.user_challenge_progress ucp
        join previous_challenge pc on pc.id = ucp.challenge_id
        where ucp.user_id = p_user_id
      )
    );
$$;

revoke all on function private.is_challenge_unlocked(uuid, uuid) from public;
revoke all on function private.is_challenge_unlocked(uuid, uuid) from anon, authenticated;
grant execute on function private.is_challenge_unlocked(uuid, uuid) to service_role;

drop policy if exists "profiles are public for learning data" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "active tracks are readable" on public.tracks;
drop policy if exists "active modules are readable" on public.modules;
drop policy if exists "active challenges are readable" on public.challenges;
drop policy if exists "hints are readable" on public.challenge_hints;
drop policy if exists "users read own attempts" on public.attempts;
drop policy if exists "users insert own attempts" on public.attempts;
drop policy if exists "admins read attempts" on public.attempts;
drop policy if exists "users read own progress" on public.user_challenge_progress;
drop policy if exists "progress is readable for rankings" on public.user_challenge_progress;
drop policy if exists "point events are readable for rankings" on public.point_events;
drop policy if exists "active events are readable" on public.platform_events;
drop policy if exists "admins manage tracks" on public.tracks;
drop policy if exists "admins manage modules" on public.modules;
drop policy if exists "admins manage challenges" on public.challenges;
drop policy if exists "admins manage hints" on public.challenge_hints;
drop policy if exists "admins manage events" on public.platform_events;

create policy "users read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "admins read profiles"
on public.profiles
for select
to authenticated
using ((select private.current_user_is_admin()));

create policy "users insert own student profile"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
  and role = 'student'
  and total_points = 0
);

create policy "users update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "active tracks are readable by authenticated users"
on public.tracks
for select
to authenticated
using (is_active = true);

create policy "active modules are readable by authenticated users"
on public.modules
for select
to authenticated
using (is_active = true);

create policy "users read own attempts"
on public.attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users insert own attempts"
on public.attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "admins read attempts"
on public.attempts
for select
to authenticated
using ((select private.current_user_is_admin()));

create policy "users read own progress"
on public.user_challenge_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users read own point events"
on public.point_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "active events are readable by authenticated users"
on public.platform_events
for select
to authenticated
using (is_active = true);

create policy "admins manage tracks"
on public.tracks
for all
to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy "admins manage modules"
on public.modules
for all
to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy "admins manage challenges"
on public.challenges
for all
to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy "admins manage hints"
on public.challenge_hints
for all
to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create policy "admins manage events"
on public.platform_events
for all
to authenticated
using ((select private.current_user_is_admin()))
with check ((select private.current_user_is_admin()));

create or replace function public.record_challenge_attempt(
  p_user_id uuid,
  p_challenge_id uuid,
  p_submitted_sql text,
  p_is_correct boolean,
  p_execution_time_ms int,
  p_error_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge challenges%rowtype;
  v_event platform_events%rowtype;
  v_inserted_progress int := 0;
  v_points int := 0;
  v_attempt_id uuid;
  v_already_completed boolean := false;
begin
  if not private.is_challenge_unlocked(p_user_id, p_challenge_id) then
    raise exception 'Desafio bloqueado para este usuario.';
  end if;

  select *
    into v_challenge
  from challenges
  where id = p_challenge_id
    and is_active = true;

  if not found then
    raise exception 'Desafio nao encontrado ou inativo.';
  end if;

  if p_is_correct then
    select *
      into v_event
    from platform_events
    where is_active = true
      and type = 'points_multiplier'
      and starts_at <= now()
      and ends_at >= now()
    order by ends_at asc
    limit 1;

    insert into user_challenge_progress (user_id, challenge_id, best_execution_time_ms, points_awarded)
    values (p_user_id, p_challenge_id, p_execution_time_ms, 0)
    on conflict (user_id, challenge_id) do nothing;

    get diagnostics v_inserted_progress = row_count;

    if v_inserted_progress = 1 then
      v_points := round(v_challenge.base_points * coalesce(v_event.multiplier, 1))::int;

      update user_challenge_progress
      set
        points_awarded = v_points,
        best_execution_time_ms = p_execution_time_ms,
        completed_at = now()
      where user_id = p_user_id
        and challenge_id = p_challenge_id;

      insert into point_events (user_id, challenge_id, source, points)
      values (p_user_id, p_challenge_id, 'challenge_completed', v_points);

      update profiles
      set
        total_points = total_points + v_points,
        updated_at = now()
      where id = p_user_id;
    else
      v_already_completed := true;
      v_points := 0;

      update user_challenge_progress
      set best_execution_time_ms = least(coalesce(best_execution_time_ms, p_execution_time_ms), p_execution_time_ms)
      where user_id = p_user_id
        and challenge_id = p_challenge_id;
    end if;
  end if;

  insert into attempts (
    user_id,
    challenge_id,
    submitted_sql,
    is_correct,
    execution_time_ms,
    error_message,
    points_awarded,
    active_event_id
  )
  values (
    p_user_id,
    p_challenge_id,
    p_submitted_sql,
    p_is_correct,
    p_execution_time_ms,
    p_error_message,
    v_points,
    case when p_is_correct then v_event.id else null end
  )
  returning id into v_attempt_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'points_awarded', v_points,
    'already_completed', v_already_completed,
    'active_event_id', case when p_is_correct then v_event.id else null end
  );
end;
$$;

revoke execute on function public.record_challenge_attempt(uuid, uuid, text, boolean, int, text) from public;
revoke execute on function public.record_challenge_attempt(uuid, uuid, text, boolean, int, text) from anon, authenticated;
grant execute on function public.record_challenge_attempt(uuid, uuid, text, boolean, int, text) to service_role;

revoke select on public.profiles, public.tracks, public.modules, public.challenges, public.challenge_hints, public.user_challenge_progress, public.point_events, public.platform_events, public.ranking_general from anon, authenticated;
revoke insert on public.profiles from anon, authenticated;
revoke update on public.profiles from authenticated;

grant select on public.profiles, public.tracks, public.modules, public.user_challenge_progress, public.point_events, public.platform_events to authenticated;
grant insert (id, username, display_name, avatar_url, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version) on public.profiles to authenticated;
grant update (username, display_name, avatar_url, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, updated_at) on public.profiles to authenticated;
grant select, insert on public.attempts to authenticated;
grant select, insert, update, delete on public.tracks, public.modules, public.challenges, public.challenge_hints, public.platform_events to authenticated;

grant select on public.attempts to service_role;
grant select, insert, update, delete on public.profiles, public.tracks, public.modules, public.challenges, public.challenge_hints, public.attempts, public.user_challenge_progress, public.point_events, public.platform_events to service_role;
