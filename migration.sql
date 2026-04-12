-- ─── migration.sql ───────────────────────────────────────────────────────────
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Todos los ALTER son idempotentes (IF NOT EXISTS / DO NOTHING).

-- 1. Constraint UNIQUE en provider_subscription_id
--    Evita duplicados cuando el webhook hace UPSERT por este campo.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid = 'subscriptions'::regclass
    AND    conname  = 'subscriptions_provider_subscription_id_key'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_provider_subscription_id_key
      UNIQUE (provider_subscription_id);
  END IF;
END $$;

-- 2. Columna is_lifetime en subscriptions
--    Indica acceso de por vida (pago único). El webhook la activa en
--    checkout.session.completed con mode = 'payment' y price = STRIPE_PRICE_LIFETIME.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS is_lifetime boolean NOT NULL DEFAULT false;

-- 3. Índice para acelerar la consulta de getUserAccess()
CREATE INDEX IF NOT EXISTS subscriptions_user_active
  ON subscriptions (user_id, status)
  WHERE status = 'active';

-- 4. Tabla de plantillas de presupuestos por categoría
create table if not exists budget_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  budget numeric(12,2) not null,
  created_at timestamptz default now(),
  unique(user_id, category)
);

alter table budget_templates enable row level security;

create policy "Own budget templates" on budget_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists budget_templates_user on budget_templates(user_id);
