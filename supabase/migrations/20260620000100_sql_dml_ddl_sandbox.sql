alter table public.challenges
  add column if not exists starter_sql text,
  add column if not exists setup_sql text,
  add column if not exists validation_sql text;

alter table public.challenges
  drop constraint if exists challenges_type_check;

alter table public.challenges
  add constraint challenges_type_check
  check (type in ('free_select', 'insert_rows', 'update_rows', 'delete_rows', 'create_table', 'alter_table', 'drop_table'));

update public.challenges
set starter_sql = expected_sql
where starter_sql is null
  and type = 'free_select';

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'challenge_sandbox_runner') then
    create role challenge_sandbox_runner noinherit;
  end if;
end
$$;

-- In production, set LOGIN and a strong password outside source control:
-- alter role challenge_sandbox_runner login password 'generated-strong-password';
grant usage on schema challenge_data to challenge_sandbox_runner;
grant select on all tables in schema challenge_data to challenge_sandbox_runner;
alter default privileges in schema challenge_data grant select on tables to challenge_sandbox_runner;

do $$
begin
  execute format('grant create on database %I to challenge_sandbox_runner', current_database());
end
$$;

drop policy if exists challenge_sandbox_read_customers on challenge_data.customers;
drop policy if exists challenge_sandbox_read_categories on challenge_data.categories;
drop policy if exists challenge_sandbox_read_products on challenge_data.products;
drop policy if exists challenge_sandbox_read_orders on challenge_data.orders;
drop policy if exists challenge_sandbox_read_order_items on challenge_data.order_items;
drop policy if exists challenge_sandbox_read_payments on challenge_data.payments;
drop policy if exists challenge_sandbox_read_shipments on challenge_data.shipments;
drop policy if exists challenge_sandbox_read_financial_transactions on challenge_data.financial_transactions;

create policy challenge_sandbox_read_customers on challenge_data.customers for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_categories on challenge_data.categories for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_products on challenge_data.products for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_orders on challenge_data.orders for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_order_items on challenge_data.order_items for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_payments on challenge_data.payments for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_shipments on challenge_data.shipments for select to challenge_sandbox_runner using (true);
create policy challenge_sandbox_read_financial_transactions on challenge_data.financial_transactions for select to challenge_sandbox_runner using (true);
