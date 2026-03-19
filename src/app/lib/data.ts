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
  category?: Category;
  notes?: string;
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

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  category?: Category;
  sortOrder: number;
  dayOfMonth: number;
}

export interface CategoryBudget {
  category: Category;
  budget: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const todayStr = () => new Date().toISOString().slice(0, 10);

export function fmtDate(d: string): string {
  if (!d) return "";
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export function fmtEur(n: number): string {
  const abs = Math.abs(n);
  return (n < 0 ? "−" : "") + abs.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): Entry {
  return {
    id: row.id, name: row.name, amount: Number(row.amount),
    date: row.date, paid: row.paid ?? false,
    category: row.category ?? undefined, notes: row.notes ?? undefined,
  };
}

// ─── Month data ───────────────────────────────────────────────────────────────

export async function loadMonth(year: number, month: number): Promise<MonthData> {
  const supabase = createClient();
  const [entriesRes, configRes] = await Promise.all([
    supabase.from("entries").select("*").eq("year", year).eq("month", month),
    supabase.from("month_config").select("var_budget").eq("year", year).eq("month", month).maybeSingle(),
  ]);
  const result: MonthData = { incomes:[], fixedExpenses:[], varExpenses:[], savingsEntries:[], varBudget:0, carryover:0 };
  if (entriesRes.data) {
    for (const row of entriesRes.data) {
      const e = rowToEntry(row);
      if (row.type === "income")   result.incomes.push(e);
      if (row.type === "fixed")    result.fixedExpenses.push(e);
      if (row.type === "variable") result.varExpenses.push(e);
      if (row.type === "saving")   result.savingsEntries.push(e);
    }
  }
  if (configRes.data) result.varBudget = Number(configRes.data.var_budget) || 0;
  return result;
}

export async function saveEntry(entry: Entry, type: "income"|"fixed"|"variable"|"saving", year: number, month: number): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("entries").upsert({
    id: entry.id, user_id: user.id, type, name: entry.name, amount: entry.amount,
    date: entry.date, paid: entry.paid ?? false, category: entry.category ?? null,
    notes: entry.notes ?? null, year, month,
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

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchEntries(query: string): Promise<(Entry & { type: string; year: number; month: number })[]> {
  const supabase = createClient();
  const { data } = await supabase.from("entries").select("*")
    .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
    .order("date", { ascending: false }).limit(40);
  if (!data) return [];
  return data.map(r => ({ ...rowToEntry(r), type: r.type, year: r.year, month: r.month }));
}

// ─── Balance & carryover ──────────────────────────────────────────────────────

export async function getAllTimeSavings(currentYear: number, currentMonth: number): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase.from("entries").select("amount").eq("type", "saving")
    .or(`year.lt.${currentYear},and(year.eq.${currentYear},month.lte.${currentMonth})`);
  return (data || []).reduce((a, r) => a + Number(r.amount), 0);
}

export function calcBalance(data: MonthData): number {
  const sum = (arr: Entry[]) => arr.reduce((a, i) => a + i.amount, 0);
  return sum(data.incomes) + (data.carryover ?? 0) - sum(data.fixedExpenses) - sum(data.varExpenses) - sum(data.savingsEntries);
}

export async function getCarryover(year: number, month: number, depth = 0): Promise<number> {
  if (depth > 24) return 0;
  let py = year, pm = month - 1;
  if (pm < 0) { py--; pm = 11; }
  const prev = await loadMonth(py, pm);
  const isEmpty = !prev.incomes.length && !prev.fixedExpenses.length && !prev.varExpenses.length && !prev.savingsEntries.length;
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
    id: r.id, name: r.name, targetAmount: Number(r.target_amount),
    savedAmount: Number(r.saved_amount), deadline: r.deadline ?? undefined,
    color: r.color ?? "#1D9E75", createdAt: r.created_at,
  }));
}

export async function createGoal(name: string, targetAmount: number, deadline?: string, color?: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goals").insert({ user_id: user.id, name, target_amount: targetAmount, saved_amount: 0, deadline: deadline || null, color: color || "#1D9E75" });
}

export async function updateGoal(id: string, patch: Partial<{ name: string; targetAmount: number; savedAmount: number; deadline: string; color: string }>): Promise<void> {
  const supabase = createClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined)         dbPatch.name = patch.name;
  if (patch.targetAmount !== undefined) dbPatch.target_amount = patch.targetAmount;
  if (patch.savedAmount !== undefined)  dbPatch.saved_amount = patch.savedAmount;
  if (patch.deadline !== undefined)     dbPatch.deadline = patch.deadline || null;
  if (patch.color !== undefined)        dbPatch.color = patch.color;
  await supabase.from("goals").update(dbPatch).eq("id", id);
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("goals").delete().eq("id", id);
}

// ─── Recurring templates ──────────────────────────────────────────────────────

export async function loadTemplates(): Promise<RecurringTemplate[]> {
  const supabase = createClient();
  const { data } = await supabase.from("recurring_templates").select("*").order("sort_order").order("created_at");
  if (!data) return [];
  return data.map(r => ({ id: r.id, name: r.name, amount: Number(r.amount), category: r.category ?? undefined, sortOrder: r.sort_order ?? 0, dayOfMonth: r.day_of_month ?? 1, notes: r.notes ?? undefined }));
}

export async function createTemplate(name: string, amount: number, category?: string, dayOfMonth = 1, notes?: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("recurring_templates").insert({ user_id: user.id, name, amount, category: category || null, day_of_month: dayOfMonth, notes: notes || null });
}

export async function updateTemplate(id: string, name: string, amount: number, category?: string, dayOfMonth = 1, notes?: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("recurring_templates").update({ name, amount, category: category || null, day_of_month: dayOfMonth, notes: notes || null }).eq("id", id);
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
  if (!templates.length) return [];
  const { data: existing } = await supabase.from("entries").select("name").eq("year", year).eq("month", month).eq("type", "fixed");
  const existingNames = new Set((existing || []).map((e: { name: string }) => e.name.toLowerCase().trim()));
  const missing = templates.filter(t => !existingNames.has(t.name.toLowerCase().trim()));
  if (!missing.length) return [];
  const rows = missing.map(t => {
    const day = Math.min(t.dayOfMonth || 1, 28);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { id: uid(), user_id: user.id, type: "fixed", name: t.name, amount: t.amount, date: dateStr, paid: false, category: t.category || null, notes: null, year, month };
  });
  const { data, error } = await supabase.from("entries").insert(rows).select("*");
  if (error) { console.error("importTemplates:", error); return []; }
  return (data || []).map(rowToEntry);
}

// ─── Category budgets ─────────────────────────────────────────────────────────

export async function loadCategoryBudgets(year: number, month: number): Promise<CategoryBudget[]> {
  const supabase = createClient();
  const { data } = await supabase.from("category_budgets").select("category,budget").eq("year", year).eq("month", month);
  if (!data) return [];
  return data.map(r => ({ category: r.category as Category, budget: Number(r.budget) }));
}

export async function saveCategoryBudget(year: number, month: number, category: Category, budget: number): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (budget <= 0) {
    await supabase.from("category_budgets").delete().eq("year", year).eq("month", month).eq("category", category);
    return;
  }
  await supabase.from("category_budgets").upsert({ user_id: user.id, year, month, category, budget }, { onConflict: "user_id,year,month,category" });
}

// ─── Savings projection ───────────────────────────────────────────────────────
// Returns average monthly savings amount over the last N months with data
export async function getAvgMonthlySavings(limitMonths = 6): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("entries")
    .select("amount, year, month")
    .eq("type", "saving")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (!data || data.length === 0) return 0;

  // Group by year+month
  const byMonth: Record<string, number> = {};
  for (const r of data) {
    const key = `${r.year}-${r.month}`;
    byMonth[key] = (byMonth[key] || 0) + Number(r.amount);
  }
  const months = Object.values(byMonth).slice(0, limitMonths);
  if (months.length === 0) return 0;
  return months.reduce((a, v) => a + v, 0) / months.length;
}
