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
