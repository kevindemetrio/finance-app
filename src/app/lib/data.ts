import { createClient } from "./supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Entry {
  id: string;
  name: string;
  amount: number;
  date: string;
  paid?: boolean;
}

export interface MonthData {
  incomes: Entry[];
  fixedExpenses: Entry[];
  varExpenses: Entry[];
  savingsEntries: Entry[];
  varBudget: number;
  carryover: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function uid(): string {
  return crypto.randomUUID();
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(d: string): string {
  if (!d) return "";
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export function fmtEur(n: number): string {
  const abs = Math.abs(n);
  const str = abs.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (n < 0 ? "−" : "") + str + " €";
}

function emptyMonth(): MonthData {
  return {
    incomes: [],
    fixedExpenses: [],
    varExpenses: [],
    savingsEntries: [],
    varBudget: 0,
    carryover: 0,
  };
}

// ─── DB row → Entry ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): Entry {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    date: row.date,
    paid: row.paid ?? false,
  };
}

// ─── Data access (Supabase) ───────────────────────────────────────────────────

export async function loadMonth(year: number, month: number): Promise<MonthData> {
  const supabase = createClient();
  const result = emptyMonth();

  const [entriesRes, configRes] = await Promise.all([
    supabase
      .from("entries")
      .select("*")
      .eq("year", year)
      .eq("month", month),
    supabase
      .from("month_config")
      .select("var_budget")
      .eq("year", year)
      .eq("month", month)
      .maybeSingle(),
  ]);

  if (entriesRes.data) {
    for (const row of entriesRes.data) {
      const entry = rowToEntry(row);
      if (row.type === "income")   result.incomes.push(entry);
      if (row.type === "fixed")    result.fixedExpenses.push(entry);
      if (row.type === "variable") result.varExpenses.push(entry);
      if (row.type === "saving")   result.savingsEntries.push(entry);
    }
  }

  if (configRes.data) {
    result.varBudget = Number(configRes.data.var_budget) || 0;
  }

  return result;
}

export async function saveEntry(
  entry: Entry,
  type: "income" | "fixed" | "variable" | "saving",
  year: number,
  month: number
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("entries").upsert({
    id: entry.id,
    user_id: user.id,
    type,
    name: entry.name,
    amount: entry.amount,
    date: entry.date,
    paid: entry.paid ?? false,
    year,
    month,
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("entries").delete().eq("id", id);
}

export async function saveMonthConfig(
  year: number,
  month: number,
  varBudget: number
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("month_config").upsert({
    user_id: user.id,
    year,
    month,
    var_budget: varBudget,
  });
}

export async function getAllTimeSavings(currentYear: number, currentMonth: number): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("entries")
    .select("amount")
    .eq("type", "saving")
    .or(`year.lt.${currentYear},and(year.eq.${currentYear},month.lte.${currentMonth})`);

  if (!data) return 0;
  return data.reduce((a, r) => a + Number(r.amount), 0);
}

// ─── Balance helpers ──────────────────────────────────────────────────────────

export function calcBalance(data: MonthData): number {
  const inc = data.incomes.reduce((a, i) => a + i.amount, 0);
  const fix = data.fixedExpenses.reduce((a, i) => a + i.amount, 0);
  const vr  = data.varExpenses.reduce((a, i) => a + i.amount, 0);
  const sav = data.savingsEntries.reduce((a, i) => a + i.amount, 0);
  return inc + (data.carryover ?? 0) - fix - vr - sav;
}

export async function getCarryover(year: number, month: number): Promise<number> {
  let py = year, pm = month - 1;
  if (pm < 0) { py--; pm = 11; }
  const prev = await loadMonth(py, pm);
  const b = calcBalance(prev);
  return b > 0 ? b : 0;
}
