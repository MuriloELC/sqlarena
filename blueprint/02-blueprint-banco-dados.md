# Blueprint de Banco de Dados — SQL Arena

## 1. Objetivo

Este documento define a estrutura de dados da aplicação SQL Arena e do banco educacional de e-commerce usado nos desafios.

Haverá duas áreas principais:

1. banco da aplicação;
2. banco ou schema dos desafios.

---

# 2. Banco da aplicação

## 2.1 Responsabilidade

Guardar informações da plataforma:

- usuários;
- perfis;
- trilhas;
- módulos;
- desafios;
- dicas;
- tentativas;
- progresso;
- pontuação;
- rankings;
- eventos temporários.

## 2.2 Supabase Auth

A autenticação deve ser feita pelo Supabase Auth.

Métodos:

- email/senha;
- Google;
- GitHub.

A tabela `auth.users` não deve ser manipulada diretamente pela aplicação além do fluxo padrão do Supabase.

---

# 3. Tabelas da aplicação

## 3.1 profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  role text not null default 'student',
  total_points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Roles:

```text
student
admin
```

---

## 3.2 tracks

```sql
create table tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  slug text unique not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 3.3 modules

```sql
create table modules (
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
```

---

## 3.4 challenges

```sql
create table challenges (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  slug text unique not null,
  type text not null default 'free_select',
  difficulty text not null,
  prompt text not null,
  expected_sql text not null,
  allowed_tables text[] not null,
  base_points int not null default 10,
  explanation text,
  tags text[],
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Tipos iniciais:

```text
free_select
```

Tipos futuros:

```text
quiz
fill_blank
fix_query
order_blocks
```

---

## 3.5 challenge_hints

```sql
create table challenge_hints (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  hint_order int not null,
  content text not null,
  created_at timestamptz not null default now()
);
```

---

## 3.6 attempts

```sql
create table attempts (
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
```

---

## 3.7 user_challenge_progress

```sql
create table user_challenge_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  completed_at timestamptz not null default now(),
  best_execution_time_ms int,
  points_awarded int not null default 0,
  primary key (user_id, challenge_id)
);
```

Essa tabela garante que o usuário não pontue duas vezes no mesmo desafio.

---

## 3.8 point_events

```sql
create table point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_id uuid references challenges(id) on delete set null,
  source text not null,
  points int not null,
  created_at timestamptz not null default now()
);
```

Sources:

```text
challenge_completed
event_bonus
admin_adjustment
```

---

## 3.9 platform_events

```sql
create table platform_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,
  multiplier numeric(5,2),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Tipos iniciais:

```text
points_multiplier
special_challenge
```

---

# 4. Views úteis

## 4.1 Ranking geral

```sql
create view ranking_general as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  coalesce(sum(pe.points), 0) as points,
  count(distinct ucp.challenge_id) as completed_challenges
from profiles p
left join point_events pe on pe.user_id = p.id
left join user_challenge_progress ucp on ucp.user_id = p.id
group by p.id, p.username, p.display_name, p.avatar_url
order by points desc;
```

## 4.2 Ranking semanal

A aplicação pode calcular por query usando início/fim da semana no timezone `America/Sao_Paulo`.

```sql
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  coalesce(sum(pe.points), 0) as weekly_points
from profiles p
left join point_events pe on pe.user_id = p.id
where pe.created_at >= :week_start
  and pe.created_at < :week_end
group by p.id, p.username, p.display_name, p.avatar_url
order by weekly_points desc;
```

---

# 5. Banco educacional de e-commerce

## 5.1 Objetivo

Criar um dataset realista para exercícios SQL.

O banco deve permitir treinar:

- filtros;
- agregações;
- JOINs;
- análise de vendas;
- análise financeira;
- ranking de produtos;
- comportamento de clientes;
- status de pedidos;
- pagamentos e entregas.

## 5.2 Schema recomendado

Criar um schema separado:

```sql
create schema challenge_data;
```

---

## 5.3 customers

```sql
create table challenge_data.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  birth_date date,
  created_at timestamp not null default now()
);
```

---

## 5.4 categories

```sql
create table challenge_data.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp not null default now()
);
```

---

## 5.5 products

```sql
create table challenge_data.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references challenge_data.categories(id),
  name text not null,
  sku text not null,
  price numeric(12,2) not null,
  cost numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamp not null default now()
);
```

---

## 5.6 orders

```sql
create table challenge_data.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references challenge_data.customers(id),
  order_number text not null,
  status text not null,
  order_date timestamp not null,
  total_amount numeric(12,2) not null,
  shipping_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0
);
```

Status:

```text
pending
paid
shipped
delivered
cancelled
refunded
```

---

## 5.7 order_items

```sql
create table challenge_data.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  product_id uuid references challenge_data.products(id),
  quantity int not null,
  unit_price numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null
);
```

---

## 5.8 payments

```sql
create table challenge_data.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  payment_method text not null,
  status text not null,
  amount numeric(12,2) not null,
  paid_at timestamp
);
```

Métodos:

```text
credit_card
pix
boleto
debit_card
wallet
```

---

## 5.9 shipments

```sql
create table challenge_data.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  carrier text,
  tracking_code text,
  status text not null,
  shipped_at timestamp,
  delivered_at timestamp,
  shipping_cost numeric(12,2)
);
```

---

## 5.10 financial_transactions

```sql
create table challenge_data.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references challenge_data.orders(id),
  type text not null,
  amount numeric(12,2) not null,
  transaction_date date not null,
  description text
);
```

Tipos:

```text
revenue
shipping_cost
refund
fee
```

---

# 6. Volume inicial de dados

Para o MVP:

```text
500 clientes
12 categorias
80 produtos
2.000 pedidos
4.000 a 7.000 itens de pedido
2.000 pagamentos
1.500 entregas
3.000 transações financeiras
```

Esse volume é suficiente para exercícios realistas sem deixar a plataforma pesada.

---

# 7. Role para execução dos desafios

Criar uma role separada:

```sql
create role challenge_runner login password 'senha_forte';

grant usage on schema challenge_data to challenge_runner;
grant select on all tables in schema challenge_data to challenge_runner;

alter default privileges in schema challenge_data
grant select on tables to challenge_runner;
```

Nunca conceder acesso às tabelas da aplicação para `challenge_runner`.

---

# 8. Observações importantes

1. O schema `challenge_data` deve conter apenas dados fictícios.
2. O usuário não deve conseguir acessar `profiles`, `attempts`, `point_events` ou tabelas internas.
3. A aplicação deve consultar metadados das tabelas para exibir estrutura no frontend.
4. Os desafios devem declarar explicitamente quais tabelas podem ser usadas.
5. Para MVP interno, schema separado é aceitável.
6. Para produto público, usar banco separado é mais seguro.
