-- Run this in your Supabase dashboard → SQL Editor

-- Entries table (incomes, fixed/variable expenses, savings)
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income', 'fixed', 'variable', 'saving')),
  name text not null,
  amount numeric(12,2) not null,
  date date not null,
  paid boolean default false,
  year int not null,
  month int not null,
  created_at timestamptz default now()
);

-- Month config (variable budget per month)
create table month_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  year int not null,
  month int not null,
  var_budget numeric(12,2) default 0,
  unique(user_id, year, month)
);

-- Row Level Security: users can only see their own data
alter table entries enable row level security;
alter table month_config enable row level security;

create policy "Users can manage their own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own month config"
  on month_config for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for fast month queries
create index entries_user_month on entries(user_id, year, month);
create index entries_user_type  on entries(user_id, type);

-- ─── Inversiones ─────────────────────────────────────────────────────────────
-- Run this block if you already ran the initial schema

create table investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null check (category in ('emergency', 'variable', 'fixed', 'stock')),
  name text not null,
  isin text,
  created_at timestamptz default now()
);

create table investment_contributions (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid references investments(id) on delete cascade not null,
  amount numeric(12,2) not null,
  date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table investments enable row level security;
alter table investment_contributions enable row level security;

create policy "Own investments" on investments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Own contributions" on investment_contributions for all
  using (
    auth.uid() = (select user_id from investments where id = investment_id)
  );

create index investments_user on investments(user_id);
create index contributions_investment on investment_contributions(investment_id);

-- ─── Nuevas columnas en entries (ejecutar si ya tienes la tabla) ──────────────
alter table entries add column if not exists recurring boolean default false;
alter table entries add column if not exists category text;

-- ─── Metas de ahorro ─────────────────────────────────────────────────────────
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null,
  saved_amount numeric(12,2) default 0,
  deadline date,
  color text default '#1D9E75',
  created_at timestamptz default now()
);

alter table goals enable row level security;

create policy "Own goals" on goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index goals_user on goals(user_id);

-- ─── Plantilla de gastos recurrentes ─────────────────────────────────────────
create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12,2) not null,
  category text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table recurring_templates enable row level security;

create policy "Own recurring templates" on recurring_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index recurring_templates_user on recurring_templates(user_id);

-- ─── Añadir columna notes a entries ──────────────────────────────────────────
alter table entries add column if not exists notes text;

-- ─── Presupuesto por categoría ────────────────────────────────────────────────
create table if not exists category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  year int not null,
  month int not null,
  category text not null,
  budget numeric(12,2) not null,
  created_at timestamptz default now(),
  unique(user_id, year, month, category)
);

alter table category_budgets enable row level security;

create policy "Own category budgets" on category_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists cat_budgets_user_month on category_budgets(user_id, year, month);
