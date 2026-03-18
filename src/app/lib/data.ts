import { createClient } from "./supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Alimentación","Ocio","Tecnología","Transporte",
  "Hogar","Salud","Ropa","Regalos","Educación","Viajes","Otro",
] as const;
export type Category = typeof CATEGORIES[number];

export interface Entry {
  id: string;
  name: string;
  amount: number;
  date: string;
  paid?: boolean;
  recurring?: boolean;
  category?: Category;
}

export interface MonthData {
  incomes: Entry[];
  fixedExpenses: Entry[];
  varExpenses: Entry[];
  savingsEntries: Entry[];
  varBudget: number;
  carryover: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  color: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
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
  const str = abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−" : "") + str + " €";
}

function emptyMonth(): MonthData {
  return { incomes:[], fixedExpenses:[], varExpenses:[], savingsEntries:[], varBudget:0, carryover:0 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): Entry {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    date: row.date,
    paid: row.paid ?? false,
    recurring: row.recurring ?? false,
    category: row.category ?? undefined,
  };
}

// ─── Month data ───────────────────────────────────────────────────────────────

export async function loadMonth(year: number, month: number): Promise<MonthData> {
  const supabase = createClient();
  const result = emptyMonth();

  const [entriesRes, configRes] = await Promise.all([
    supabase.from("entries").select("*").eq("year", year).eq("month", month),
    supabase.from("month_config").select("var_budget").eq("year", year).eq("month", month).maybeSingle(),
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
  if (configRes.data) result.varBudget = Number(configRes.data.var_budget) || 0;
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
    recurring: entry.recurring ?? false,
    category: entry.category ?? null,
    year,
    month,
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("entries").delete().eq("id", id);
}

export async function saveMonthConfig(year: number, month: number, varBudget: number): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("month_config").upsert({ user_id: user.id, year, month, var_budget: varBudget });
}

// ─── Recurring: copy fixed recurring from prev month ──────────────────────────

export async function applyRecurring(year: number, month: number): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let py = year, pm = month - 1;
  if (pm < 0) { py--; pm = 11; }

  const { data: existing } = await supabase.from("entries").select("id").eq("year", year).eq("month", month).eq("type", "fixed").limit(1);
  if (existing && existing.length > 0) return; // already has fixed entries

  const { data: prevFixed } = await supabase.from("entries").select("*").eq("year", py).eq("month", pm).eq("type", "fixed").eq("recurring", true);
  if (!prevFixed || prevFixed.length === 0) return;

  await supabase.from("entries").insert(
    prevFixed.map(r => ({
      user_id: user.id,
      type: "fixed",
      name: r.name,
      amount: r.amount,
      date: `${year}-${String(month+1).padStart(2,'0')}-01`,
      paid: false,
      recurring: true,
      category: r.category,
      year,
      month,
    }))
  );
}

// ─── All entries search ───────────────────────────────────────────────────────

export async function searchEntries(query: string): Promise<(Entry & { type: string; year: number; month: number })[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("entries")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("date", { ascending: false })
    .limit(30);
  if (!data) return [];
  return data.map(r => ({ ...rowToEntry(r), type: r.type, year: r.year, month: r.month }));
}

// ─── Savings & balance ────────────────────────────────────────────────────────

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

export function calcBalance(data: MonthData): number {
  const inc = data.incomes.reduce((a, i) => a + i.amount, 0);
  const fix = data.fixedExpenses.reduce((a, i) => a + i.amount, 0);
  const vr  = data.varExpenses.reduce((a, i) => a + i.amount, 0);
  const sav = data.savingsEntries.reduce((a, i) => a + i.amount, 0);
  return inc + (data.carryover ?? 0) - fix - vr - sav;
}

export async function getCarryover(year: number, month: number, depth = 0): Promise<number> {
  if (depth > 24) return 0;
  let py = year, pm = month - 1;
  if (pm < 0) { py--; pm = 11; }
  const prev = await loadMonth(py, pm);
  const isEmpty = prev.incomes.length === 0 && prev.fixedExpenses.length === 0 && prev.varExpenses.length === 0 && prev.savingsEntries.length === 0;
  if (isEmpty) return 0;
  prev.carryover = await getCarryover(py, pm, depth + 1);
  const b = calcBalance(prev);
  return b > 0 ? b : 0;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function loadGoals(): Promise<Goal[]> {
  const supabase = createClient();
  const { data } = await supabase.from("goals").select("*").order("created_at");
  if (!data) return [];
  return data.map(r => ({
    id: r.id,
    name: r.name,
    targetAmount: Number(r.target_amount),
    savedAmount: Number(r.saved_amount),
    deadline: r.deadline ?? undefined,
    color: r.color ?? "#1D9E75",
    createdAt: r.created_at,
  }));
}

export async function createGoal(name: string, targetAmount: number, deadline?: string, color?: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goals").insert({ user_id: user.id, name, target_amount: targetAmount, saved_amount: 0, deadline: deadline || null, color: color || "#1D9E75" });
}

export async function updateGoalSaved(id: string, savedAmount: number): Promise<void> {
  const supabase = createClient();
  await supabase.from("goals").update({ saved_amount: savedAmount }).eq("id", id);
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("goals").delete().eq("id", id);
}

// ─── Dashboard: annual data ───────────────────────────────────────────────────

export async function loadAnnualData(year: number): Promise<{
  month: number;
  income: number;
  fixed: number;
  variable: number;
  savings: number;
  balance: number;
}[]> {
  const supabase = createClient();
  const { data } = await supabase.from("entries").select("type,amount,month").eq("year", year);
  if (!data) return [];

  const months = Array.from({length:12},(_,i)=>({month:i,income:0,fixed:0,variable:0,savings:0,balance:0}));
  for (const row of data) {
    const m = months[row.month];
    if (!m) continue;
    const a = Number(row.amount);
    if (row.type==="income")   m.income += a;
    if (row.type==="fixed")    m.fixed += a;
    if (row.type==="variable") m.variable += a;
    if (row.type==="saving")   m.savings += a;
  }
  months.forEach(m => { m.balance = m.income - m.fixed - m.variable - m.savings; });
  return months;
}

export async function loadCategoryData(year: number, month: number): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase.from("entries").select("category,amount").eq("year", year).eq("month", month).eq("type", "variable");
  if (!data) return {};
  const result: Record<string, number> = {};
  for (const row of data) {
    const cat = row.category || "Otro";
    result[cat] = (result[cat] || 0) + Number(row.amount);
  }
  return result;
}

// ─── Recurring templates ──────────────────────────────────────────────────────

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  category?: Category;
  sortOrder: number;
}

export async function loadTemplates(): Promise<RecurringTemplate[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recurring_templates")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (!data) return [];
  return data.map(r => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    category: r.category ?? undefined,
    sortOrder: r.sort_order ?? 0,
  }));
}

export async function createTemplate(name: string, amount: number, category?: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("recurring_templates").insert({
    user_id: user.id, name, amount, category: category || null,
  });
}

export async function updateTemplate(id: string, name: string, amount: number, category?: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("recurring_templates").update({ name, amount, category: category || null }).eq("id", id);
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("recurring_templates").delete().eq("id", id);
}

export async function importTemplates(year: number, month: number): Promise<Entry[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const templates = await loadTemplates();
  if (templates.length === 0) return [];

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const rows = templates.map(t => ({
    id: uid(),
    user_id: user.id,
    type: "fixed",
    name: t.name,
    amount: t.amount,
    date: dateStr,
    paid: false,
    recurring: true,
    category: t.category || null,
    year,
    month,
  }));

  const { data, error } = await supabase.from("entries").insert(rows).select();
  if (error || !data) return [];

  return data.map(r => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    date: r.date,
    paid: false,
    recurring: true,
    category: r.category ?? undefined,
  }));
}

export async function hasImportedTemplates(year: number, month: number): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("entries")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .eq("type", "fixed")
    .eq("recurring", true)
    .limit(1);
  return !!(data && data.length > 0);
}
