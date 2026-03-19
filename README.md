# Finanzas — Personal Finance Manager

A personal finance web application built with Next.js 14, Supabase, and Tailwind CSS. Designed for real daily use: fast, mobile-first, with a clean interface that stays out of the way.

---

## Table of Contents

1. [What it does](#what-it-does)
2. [Features](#features)
3. [Tech stack](#tech-stack)
4. [Database schema](#database-schema)
5. [Project structure](#project-structure)
6. [Component reference](#component-reference)
7. [Data layer reference](#data-layer-reference)
8. [How to run locally](#how-to-run-locally)
9. [Deploy to Vercel](#deploy-to-vercel)
10. [Supabase setup](#supabase-setup)
11. [Environment variables](#environment-variables)
12. [Common modifications](#common-modifications)

---

## What it does

Finanzas is a monthly personal finance tracker. Each month gets its own snapshot: income, fixed expenses, variable expenses, and savings. The balance from one month carries forward automatically to the next. Everything is stored per-user in Supabase with Row Level Security — no one can see anyone else's data.

The app has three main sections:

| Section | Purpose |
|---|---|
| **Finanzas** | Monthly income, expenses, savings — the core |
| **Metas** | Savings goals with progress tracking and projections |
| **Inversiones** | Investment portfolio organised by category |

---

## Features

### Monthly Finance View
- **Income** — log all income sources for the month
- **Fixed expenses** — recurring costs (rent, subscriptions, utilities)
- **Variable expenses** — day-to-day spending with category tagging
- **Savings** — track what you put aside each month
- **Carryover** — positive balance from previous month added automatically
- **Month navigation** — go back/forward with arrow keys, past months show a warning banner
- **Cross-month search** — find any entry across all months by name or category

### Budgets
- **Global monthly budget** — set a total limit for variable expenses
- **Per-category budgets** — individual limits per category (food, leisure, travel…)
- **Visual progress bars** — green → amber → red as you approach/exceed the limit
- **All budgets in one collapsible panel** at the bottom of the page

### Fixed Expense Templates
- Define a reusable template of recurring fixed costs
- Set the day of month each cost is due (up to day 28)
- Add a note per template entry (e.g. "includes VAT", "direct debit BBVA")
- Import the template into any month with smart merge — already-present entries are skipped

### Summary Metrics
Six key numbers at a glance: total income (+ carryover), fixed expenses, variable expenses, balance, monthly savings, all-time savings total.

### PDF Report
One-tap export of a structured monthly report:
- Cover page with month, year, and generation date
- Summary metrics with distribution bar across income
- Income breakdown with proportional bar chart
- Savings breakdown
- Fixed expenses with paid/pending status and progress bar
- Variable expenses: category bars with budget compliance, distribution chart, full transaction table
- Carryover included in balance calculation
- Section dividers for clear visual separation
- Footer with page numbers on every page

### Savings Goals (Metas)
- Create goals with name, target amount, optional deadline, and colour
- Add saved amounts over time
- Progress bar per goal
- **Projection**: based on your average monthly savings over the last 6 months, shows the estimated month you will reach the goal
- Edit goal name, target, and deadline at any time
- Delete with confirmation

### Investments (Inversiones)
- Four portfolio categories: Emergency Fund, Variable Income, Fixed Income, Stock
- Per-investment contribution history with dates and notes
- Edit investment name, ISIN, and category inline
- Delete investments and all contributions with confirmation

### Seasonal Themes
Three display modes cycled with the theme button: Light → Dark → Season.

Season mode automatically picks the visual theme based on the current date:

| Period | Theme |
|---|---|
| Mar 20 – Jun 20 | Spring — green meadow, cherry blossoms, falling petals |
| Jun 21 – Sep 21 | Summer — blue sky, sun, sea, swimming fish |
| Sep 22 – Sep 30 | Autumn — warm sky, orange trees, falling leaves |
| Oct 1 – Nov 7 | Halloween — night sky, bare trees, pumpkins, bats |
| Nov 8 – Nov 30 | Autumn (standard) |
| Dec 1 – Jan 7 | Christmas — starry night, decorated tree, string lights |
| Jan 8 – Mar 19 | Winter — daytime snow, pine trees, snowflakes |

Each theme has its own colour palette for cards, accents, and navigation. Halloween and Christmas activate dark mode automatically.

### PWA
Installable as a Progressive Web App on mobile. Works with a home screen shortcut. Supports iOS and Android via Web App Manifest.

### UX Details
- Toast notifications on every save and delete action
- Confirmation modal before any destructive action (delete entry, delete goal, delete investment)
- Skeleton loading state that mirrors the actual layout while data loads
- Empty state with action prompt when a section has no entries
- All sections are collapsible; open/closed state persists in `localStorage`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.x |
| Backend / Auth / DB | Supabase | 2.45.x |
| PDF generation | jsPDF | 2.5.x |
| Hosting | Vercel | — |
| Runtime | Node.js | 18+ |

---

## Database Schema

All tables use Row Level Security (RLS). Users can only read and write their own rows.

### Entity Relationship Diagram

```
auth.users
    │
    ├──< entries          (income, fixed, variable, savings per month)
    ├──< month_config     (variable budget setting per month)
    ├──< goals            (savings goals)
    ├──< recurring_templates  (fixed expense template)
    ├──< category_budgets (per-category budget limits)
    └──< investments ──< investment_contributions
```

### Table: `entries`

The core table. Stores every financial movement.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK → auth.users | Owner |
| `type` | text | `income` · `fixed` · `variable` · `saving` |
| `name` | text | Description of the entry |
| `amount` | numeric(12,2) | Amount in euros |
| `date` | date | Date of the entry |
| `paid` | boolean | For fixed expenses: whether it has been collected |
| `year` | int | Year (for fast month filtering) |
| `month` | int | Month 0–11 (for fast month filtering) |
| `category` | text | Optional category (e.g. "Alimentación", "Ocio") |
| `notes` | text | Optional free-text note |
| `recurring` | boolean | Reserved — currently unused |
| `created_at` | timestamptz | Auto |

**Indexes:** `(user_id, year, month)` · `(user_id, type)`

---

### Table: `month_config`

One row per user per month. Stores the variable expense budget.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK | Owner |
| `year` | int | Year |
| `month` | int | Month 0–11 |
| `var_budget` | numeric(12,2) | Monthly budget for variable expenses |

**Unique:** `(user_id, year, month)`

---

### Table: `goals`

Savings goals.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK | Owner |
| `name` | text | Goal name (e.g. "Vacaciones", "Coche") |
| `target_amount` | numeric(12,2) | Total amount to reach |
| `saved_amount` | numeric(12,2) | Amount saved so far |
| `deadline` | date | Optional target date |
| `color` | text | Hex colour for the progress bar |
| `created_at` | timestamptz | Auto |

---

### Table: `recurring_templates`

Reusable template for fixed monthly expenses.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK | Owner |
| `name` | text | Expense name |
| `amount` | numeric(12,2) | Monthly amount |
| `category` | text | Optional category |
| `day_of_month` | int | Day to assign on import (1–28) |
| `notes` | text | Optional note (e.g. "includes VAT") |
| `sort_order` | int | Display order |
| `created_at` | timestamptz | Auto |

---

### Table: `category_budgets`

Per-category spending limits, set per month.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK | Owner |
| `year` | int | Year |
| `month` | int | Month 0–11 |
| `category` | text | Category name |
| `budget` | numeric(12,2) | Budget limit for this category |

**Unique:** `(user_id, year, month, category)`  
**Index:** `(user_id, year, month)`

---

### Table: `investments`

Investment instruments in the portfolio.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `user_id` | uuid FK | Owner |
| `category` | text | `emergency` · `variable` · `fixed` · `stock` |
| `name` | text | Investment name (e.g. "MSCI World ETF") |
| `isin` | text | Optional ISIN identifier |
| `created_at` | timestamptz | Auto |

---

### Table: `investment_contributions`

Individual deposits into an investment.

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `investment_id` | uuid FK → investments | Parent investment |
| `amount` | numeric(12,2) | Amount contributed |
| `date` | date | Date of contribution |
| `notes` | text | Optional note |
| `created_at` | timestamptz | Auto |

**Index:** `(investment_id)`

---

## Project Structure

```
finance-app/
├── public/                         # Static assets
│   ├── favicon.ico / favicon.png   # Browser tab icon
│   ├── icon-192.png                # PWA icon (small)
│   ├── icon-512.png                # PWA icon (large)
│   └── manifest.json               # PWA manifest
│
├── src/
│   ├── middleware.ts               # Auth route protection (Supabase SSR)
│   └── app/
│       ├── layout.tsx              # Root layout — ThemeProvider + ToastProvider
│       ├── page.tsx                # / — Main finance page (Finanzas tab)
│       ├── globals.css             # Global styles + Tailwind base + card/metric-card classes
│       │
│       ├── auth/
│       │   ├── login/page.tsx      # Login page — with animated bill rain + theme toggle
│       │   └── signup/page.tsx     # Signup page — confirm password + animated coin rain
│       │
│       ├── metas/
│       │   └── page.tsx            # /metas — Savings goals page
│       │
│       ├── inversiones/
│       │   └── page.tsx            # /inversiones — Investment portfolio page
│       │
│       ├── lib/
│       │   ├── data.ts             # ★ All finance data functions (Supabase queries)
│       │   ├── investments.ts      # All investment data functions
│       │   └── supabase/
│       │       ├── client.ts       # Browser-side Supabase client
│       │       ├── server.ts       # Server-side Supabase client
│       │       └── middleware.ts   # Session refresh helper
│       │
│       └── components/
│           ├── AddEntryModal.tsx       # Modal for adding income/expense/saving
│           ├── CategoryBudgetPanel.tsx # Collapsible budget panel (global + per-category)
│           ├── EntryRow.tsx            # Single transaction row with inline edit
│           ├── MonthPicker.tsx         # Month/year picker dropdown
│           ├── Navbar.tsx              # Bottom nav (mobile) + desktop tabs
│           ├── PdfReportButton.tsx     # PDF report generator (jsPDF)
│           ├── SeasonBackground.tsx    # SVG season backgrounds + particle system
│           ├── SeasonWrapper.tsx       # Applies season bg + card theming to page
│           ├── Section.tsx             # Collapsible section card (income, expenses…)
│           ├── SummaryGrid.tsx         # 6-metric summary grid at top of page
│           ├── TemplateManager.tsx     # Modal for managing fixed expense templates
│           ├── ThemeProvider.tsx       # Light/dark/season theme + getSeason() logic
│           ├── Toast.tsx               # Toast notifications + confirm dialog (singleton)
│           ├── ui.tsx                  # Shared UI primitives (Button, Input, Badge…)
│           └── inversiones/
│               ├── CategorySection.tsx # Investment category grouping + add form
│               └── InvestmentCard.tsx  # Single investment with contribution history
│
├── supabase-schema.sql             # Full DB schema — run in Supabase SQL editor
├── package.json                    # Dependencies
├── tailwind.config.ts              # Tailwind config + custom colours + fonts
├── tsconfig.json                   # TypeScript config
└── next.config.mjs                 # Next.js config — build optimisations
```

---

## Component Reference

### `page.tsx` (main)
The heart of the app. Manages:
- Month state (`year`, `month`) with prev/next navigation
- Data loading via `loadMonth()`, `getCarryover()`, `getAllTimeSavings()`, `loadCategoryBudgets()`
- All CRUD callbacks passed down to `Section` components
- Skeleton loading state while data is in flight
- Cross-month search via `searchEntries()`
- Template import flow

**Key state:** `data: MonthData`, `loading`, `year`, `month`, `catBudgets`, `totalSavings`

---

### `lib/data.ts` ★
The single point of truth for all finance data. Every Supabase query goes through here.

| Function | Description |
|---|---|
| `loadMonth(year, month)` | Loads all entries + var budget for a month |
| `saveEntry(entry, type, year, month)` | Upserts an entry |
| `deleteEntry(id)` | Deletes an entry |
| `getCarryover(year, month)` | Recursively calculates positive balance from previous months |
| `getAllTimeSavings(year, month)` | Sum of all saving entries up to the given month |
| `calcBalance(data)` | Income + carryover − fixed − variable − savings |
| `searchEntries(query)` | Cross-month text + category search |
| `importTemplates(year, month)` | Imports template into month (skips duplicates) |
| `loadGoals()` | All goals for current user |
| `createGoal / updateGoal / deleteGoal` | Goal CRUD |
| `loadCategoryBudgets(year, month)` | Per-category budgets for a month |
| `saveCategoryBudget(...)` | Upsert or delete a category budget |
| `getAvgMonthlySavings(n)` | Average monthly savings over last n months (for projection) |

**To swap Supabase for another backend:** only this file needs to change.

---

### `ThemeProvider.tsx`
Manages the three-mode theme system.

- `getSeason(date)` — returns the current season key based on date ranges
- `SEASON_CONFIG` — colour palettes for all 6 seasons (bg, card, accent, nav colours)
- `useTheme()` — hook returning `{ theme, season, toggle }`
- `ThemeToggle` — the icon button used in page headers

**To add a new season or change date ranges:** edit `getSeason()` and add an entry to `SEASON_CONFIG`.

---

### `SeasonBackground.tsx`
SVG backgrounds + CSS particle animations.

- `SCENE_SVG` — one SVG string per season. All use `viewBox="0 0 400 320"` with `preserveAspectRatio="xMidYMid slice"` (behaves like `background-size: cover`).
- `makeParticle(season)` — returns an SVG element string for the falling particles (petals, leaves, snowflakes…)
- `PARTICLE_CONFIG` — max particles, spawn interval, and fall duration per season

**To redesign a background:** edit the corresponding SVG string in `SCENE_SVG`. No JSX — plain SVG markup as a template literal.

---

### `Toast.tsx`
Singleton notification system. No React context needed.

```ts
// From any component or function:
import { toast, confirm } from "../components/Toast";

toast("Saved successfully");
toast("Something failed", "error");

const ok = await confirm({ title: "Delete this?", danger: true });
if (ok) { /* proceed */ }
```

`ToastProvider` must be mounted once in `layout.tsx` (already done).

---

### `PdfReportButton.tsx`
Generates and downloads a PDF report using jsPDF. Fully client-side — no server involved.

- All color operations go through `setFill(doc, "#hex")`, `setTxt(doc, "#hex")`, `setDraw(doc, "#hex")` wrappers. **Never pass RGB triplets directly** — jsPDF on Vercel requires CSS hex strings.
- The `title()` helper draws a left accent bar, section title, and a full-width separator line above it.
- `pieBar()` renders proportional horizontal bars — safe alternative to `doc.circle()` which crashes in production.

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### Steps

```bash
# 1. Clone or unzip the project
cd finance-app

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key (see Environment Variables)

# 4. Set up the database
# → Go to your Supabase dashboard → SQL Editor
# → Paste and run the entire contents of supabase-schema.sql

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register an account and start adding entries.

---

## Deploy to Vercel

### First deploy

```bash
# Install Vercel CLI
npm i -g vercel

# From the project root
vercel

# Follow the prompts:
# - Link to your Vercel account
# - Set project name
# - Framework: Next.js (auto-detected)
```

### Environment variables on Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Continuous deployment (recommended)

1. Push the project to a GitHub repository
2. In Vercel: **New Project → Import from GitHub**
3. Set the environment variables
4. Every push to `main` (or `development`) triggers an automatic deploy

### Build configuration

The project uses these `next.config.mjs` settings for production:
- `optimizePackageImports: ["jspdf"]` — jsPDF is code-split and only loaded when the PDF button is clicked
- `removeConsole` — all `console.log` calls are stripped in production builds (errors are kept)
- `ignoreBuildErrors / ignoreDuringBuilds` — TypeScript and ESLint errors don't block the build

---

## Supabase Setup

### Authentication

The app uses Supabase Auth with email/password. To configure:

1. Supabase dashboard → **Authentication → Providers**
2. Make sure **Email** is enabled
3. Under **Email Templates**, optionally customise the confirmation email
4. Under **URL Configuration**, add your production URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```

### Row Level Security

All tables have RLS enabled. The policies ensure each user only accesses their own rows. **Do not disable RLS** on any table.

### Running the schema

Paste the full contents of `supabase-schema.sql` into **Supabase → SQL Editor → New query** and run it. The file uses `create table if not exists` and `alter table ... add column if not exists` so it is safe to run multiple times.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Both variables are prefixed with `NEXT_PUBLIC_` because they are used in browser-side code. They are safe to expose — Supabase RLS policies protect the data.

Find these values in your Supabase dashboard under **Settings → API**.

---

## Common Modifications

### Add a new expense category

In `src/app/lib/data.ts`, find:

```ts
export const CATEGORIES = [
  "Alimentación","Ocio","Tecnología","Transporte",
  "Hogar","Salud","Ropa","Regalos","Educación","Viajes","Otro",
] as const;
```

Add your category to the array. Also add a colour for it in `CAT_COLORS` inside `PdfReportButton.tsx` and `CategoryBudgetPanel.tsx`.

---

### Change season date ranges

In `src/app/components/ThemeProvider.tsx`, edit the `getSeason()` function:

```ts
export function getSeason(date = new Date()): Season {
  const m = date.getMonth(); // 0 = January
  const d = date.getDate();
  // Edit these conditions to change when each season starts/ends
  ...
}
```

---

### Change season colours

In the same file, edit `SEASON_CONFIG`. Each season has:

```ts
{
  bg: string;          // Page background colour
  cardBg: string;      // Card background (rgba)
  cardBorder: string;  // Card border (rgba)
  metricBg: string;    // Metric card background
  titleColor: string;  // Primary text colour
  accentColor: string; // Accent / highlight colour
  rowBorder: string;   // Row separator colour
  navBg: string;       // Navigation background
  navBorder: string;   // Navigation border
  label: string;       // Display name for the toggle button
}
```

---

### Change the carryover logic

In `src/app/lib/data.ts`, edit `getCarryover()`. Currently it recursively walks back through empty months until it finds a month with data, then returns the positive balance. If you want negative balances to carry forward too, change:

```ts
return b > 0 ? b : 0;
// to:
return b;
```

---

### Swap the database backend

`src/app/lib/data.ts` is the only file that imports from Supabase. All page components and UI components receive data through props or call functions from this file. To replace Supabase with another backend, re-implement the exported functions in `data.ts` and `investments.ts` — no other files need to change.

---

## Licence

Private project. All rights reserved.
