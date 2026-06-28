create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  total_points int not null default 0,
  terms_accepted_at timestamptz,
  terms_version text,
  privacy_accepted_at timestamptz,
  privacy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  slug text unique not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references tracks(id) on delete cascade,
  title text not null,
  description text,
  slug text unique not null,
  sort_order int not null default 0,
  unlock_rule jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  slug text unique not null,
  type text not null default 'free_select' check (type in ('free_select', 'insert_rows', 'update_rows', 'delete_rows', 'create_table', 'alter_table', 'drop_table')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'special')),
  prompt text not null,
  starter_sql text,
  expected_sql text not null,
  allowed_tables text[] not null,
  setup_sql text,
  validation_sql text,
  base_points int not null default 10,
  explanation text,
  tags text[],
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists challenge_hints (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  hint_order int not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, hint_order)
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  submitted_sql text not null,
  is_correct boolean not null,
  execution_time_ms int,
  error_message text,
  points_awarded int not null default 0,
  active_event_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists user_challenge_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  completed_at timestamptz not null default now(),
  best_execution_time_ms int,
  points_awarded int not null default 0,
  primary key (user_id, challenge_id)
);

create table if not exists point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_id uuid references challenges(id) on delete set null,
  source text not null check (source in ('challenge_completed', 'event_bonus', 'admin_adjustment')),
  points int not null,
  created_at timestamptz not null default now()
);

create table if not exists platform_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('points_multiplier', 'special_challenge')),
  multiplier numeric(5,2),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table attempts
  add constraint attempts_active_event_id_fkey
  foreign key (active_event_id) references platform_events(id) on delete set null;

create schema if not exists challenge_data;

create table if not exists challenge_data.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  birth_date date,
  created_at timestamp not null default now()
);

create table if not exists challenge_data.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp not null default now()
);

create table if not exists challenge_data.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references challenge_data.categories(id),
  name text not null,
  sku text not null,
  price numeric(12,2) not null,
  cost numeric(12,2) not null,
  active boolean not null default true,
  stock_quantity int not null default 0,
  created_at timestamp not null default now()
);

create table if not exists challenge_data.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references challenge_data.customers(id),
  order_number text not null,
  status text not null check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  order_date timestamp not null,
  total_amount numeric(12,2) not null,
  shipping_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0
);

create table if not exists challenge_data.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  product_id uuid references challenge_data.products(id),
  quantity int not null,
  unit_price numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null
);

create table if not exists challenge_data.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  payment_method text not null check (payment_method in ('credit_card', 'pix', 'boleto', 'debit_card', 'wallet')),
  status text not null,
  amount numeric(12,2) not null,
  paid_at timestamp
);

create table if not exists challenge_data.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  carrier text,
  tracking_code text,
  status text not null,
  shipped_at timestamp,
  delivered_at timestamp,
  shipping_cost numeric(12,2)
);

create table if not exists challenge_data.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  type text not null check (type in ('revenue', 'shipping_cost', 'refund', 'fee')),
  amount numeric(12,2) not null,
  transaction_date date not null,
  description text
);

create or replace view ranking_general
with (security_invoker = true)
as
with point_totals as (
  select
    user_id,
    coalesce(sum(points), 0) as points
  from point_events
  group by user_id
),
progress_totals as (
  select
    user_id,
    count(challenge_id) as completed_challenges
  from user_challenge_progress
  group by user_id
)
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  coalesce(pt.points, 0) as points,
  coalesce(pr.completed_challenges, 0) as completed_challenges
from profiles p
left join point_totals pt on pt.user_id = p.id
left join progress_totals pr on pr.user_id = p.id
order by points desc, completed_challenges desc, p.created_at asc;

alter table profiles enable row level security;
alter table tracks enable row level security;
alter table modules enable row level security;
alter table challenges enable row level security;
alter table challenge_hints enable row level security;
alter table attempts enable row level security;
alter table user_challenge_progress enable row level security;
alter table point_events enable row level security;
alter table platform_events enable row level security;
alter table challenge_data.customers enable row level security;
alter table challenge_data.categories enable row level security;
alter table challenge_data.products enable row level security;
alter table challenge_data.orders enable row level security;
alter table challenge_data.order_items enable row level security;
alter table challenge_data.payments enable row level security;
alter table challenge_data.shipments enable row level security;
alter table challenge_data.financial_transactions enable row level security;

create policy "profiles are public for learning data" on profiles for select using (true);
create policy "users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "active tracks are readable" on tracks for select using (is_active = true);
create policy "active modules are readable" on modules for select using (is_active = true);
create policy "active challenges are readable" on challenges for select using (is_active = true);
create policy "hints are readable" on challenge_hints for select using (true);
create policy "users read own attempts" on attempts for select using (auth.uid() = user_id);
create policy "users insert own attempts" on attempts for insert with check (auth.uid() = user_id);
create policy "admins read attempts" on attempts for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "users read own progress" on user_challenge_progress for select using (auth.uid() = user_id);
create policy "progress is readable for rankings" on user_challenge_progress for select using (true);
create policy "point events are readable for rankings" on point_events for select using (true);
create policy "active events are readable" on platform_events for select using (is_active = true);

create policy "admins manage tracks" on tracks for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "admins manage modules" on modules for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "admins manage challenges" on challenges for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "admins manage hints" on challenge_hints for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "admins manage events" on platform_events for all using (
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index if not exists attempts_user_created_idx on attempts (user_id, created_at desc);
create index if not exists attempts_challenge_created_idx on attempts (challenge_id, created_at desc);
create index if not exists point_events_user_created_idx on point_events (user_id, created_at desc);
create index if not exists platform_events_active_window_idx on platform_events (is_active, starts_at, ends_at);

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

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

create policy "users delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

grant select on public.profiles, public.tracks, public.modules, public.challenges, public.challenge_hints, public.user_challenge_progress, public.point_events, public.platform_events, public.ranking_general to anon, authenticated;
grant insert on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, updated_at) on public.profiles to authenticated;
grant select, insert on public.attempts to authenticated;
grant select on public.attempts to service_role;
grant select, insert, update, delete on public.tracks, public.modules, public.challenges, public.challenge_hints, public.platform_events to authenticated;
grant select, insert, update, delete on public.profiles, public.tracks, public.modules, public.challenges, public.challenge_hints, public.attempts, public.user_challenge_progress, public.point_events, public.platform_events to service_role;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'challenge_runner') then
    create role challenge_runner noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'challenge_sandbox_runner') then
    create role challenge_sandbox_runner noinherit;
  end if;
end
$$;

-- In production, set LOGIN and a strong password outside source control:
-- alter role challenge_runner login password 'generated-strong-password';
-- alter role challenge_sandbox_runner login password 'generated-strong-password';
grant usage on schema challenge_data to challenge_runner;
grant select on all tables in schema challenge_data to challenge_runner;
alter default privileges in schema challenge_data grant select on tables to challenge_runner;
grant usage on schema challenge_data to challenge_sandbox_runner;
grant select on all tables in schema challenge_data to challenge_sandbox_runner;
alter default privileges in schema challenge_data grant select on tables to challenge_sandbox_runner;

do $$
begin
  execute format('grant create on database %I to challenge_sandbox_runner', current_database());
end
$$;

create policy challenge_runner_read_customers on challenge_data.customers for select to challenge_runner using (true);
create policy challenge_runner_read_categories on challenge_data.categories for select to challenge_runner using (true);
create policy challenge_runner_read_products on challenge_data.products for select to challenge_runner using (true);
create policy challenge_runner_read_orders on challenge_data.orders for select to challenge_runner using (true);
create policy challenge_runner_read_order_items on challenge_data.order_items for select to challenge_runner using (true);
create policy challenge_runner_read_payments on challenge_data.payments for select to challenge_runner using (true);
create policy challenge_runner_read_shipments on challenge_data.shipments for select to challenge_runner using (true);
create policy challenge_runner_read_financial_transactions on challenge_data.financial_transactions for select to challenge_runner using (true);
create policy challenge_sandbox_read_customers on challenge_data.customers for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_categories on challenge_data.categories for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_products on challenge_data.products for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_orders on challenge_data.orders for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_order_items on challenge_data.order_items for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_payments on challenge_data.payments for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_shipments on challenge_data.shipments for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_financial_transactions on challenge_data.financial_transactions for select to challenge_sandbox_runner using (true);
