# Finanzas — Personal Finance Tracker

A minimal Next.js 14 web app for tracking personal finances by month.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- localStorage (swap `src/app/lib/data.ts` for Supabase later)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel and it auto-deploys on every push.

## Add to phone home screen

Once deployed, open the URL in Safari (iOS) or Chrome (Android) and use
"Add to Home Screen" — it behaves as a standalone PWA app.

## Migrating to Supabase

All data logic lives in `src/app/lib/data.ts`. The functions to replace are:

- `loadMonth(year, month)` → fetch from Supabase
- `saveMonth(year, month, data)` → upsert to Supabase
- `getAllTimeSavings(year, month)` → aggregate query

Suggested Supabase schema:

```sql
create table entries (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'income' | 'fixed' | 'variable' | 'saving'
  name text not null,
  amount numeric not null,
  date date not null,
  paid boolean default false,
  year int not null,
  month int not null,
  created_at timestamptz default now()
);

create table month_config (
  year int not null,
  month int not null,
  var_budget numeric default 0,
  primary key (year, month)
);
```
