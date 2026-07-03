alter table public.challenges
  add column if not exists expected_columns text[] not null default '{}';
