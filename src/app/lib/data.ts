import { createClient } from "./supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  "Alimentación","Ocio","Tecnología","Transporte",
  "Hogar","Salud","Ropa","Regalos","Educación","Viajes","Otro",
];
export type Category = string;

// Keep backward-compat alias for any leftover imports
export const CATEGORIES = DEFAULT_CATEGORIES;

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

export interface AnnualMonthData {
  month: number;
  income: number;
  fixed: number;
  variable: number;
  balance: number;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  category?: Category;
  sortOrder: number;
  dayOfMonth: number;
  notes?: string;
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

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Devuelve el user_id desde la sesión en caché (sin llamada de red).
 * Usar en operaciones de lectura donde RLS ya aplica y solo necesitamos
 * el id para filtrar explícitamente como defensa en profundidad.
 */
async function getSessionUserId(): Promise<string | null> {
  const { data: { session } } = await createClient().auth.getSession();
  return session?.user?.id ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEntry(row: any): Entry {
  return {
    id: row.id, name: row.name, amount: Number(row.amount),
    date: row.date, paid: row.paid ?? false,
    category: row.category ?? undefined, notes: row.notes ?? undefined,
  };
}

function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/** Escapa los caracteres especiales de ILIKE (%, _, \) para evitar abusos de patrón. */
function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

// ─── Month data ───────────────────────────────────────────────────────────────

export async function loadMonth(year: number, month: number): Promise<MonthData> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return { incomes:[], fixedExpenses:[], varExpenses:[], savingsEntries:[], varBudget:0, carryover:0 };

  const [entriesRes, configRes] = await Promise.all([
    supabase.from("entries").select("*")
      .eq("user_id", userId).eq("year", year).eq("month", month),
    supabase.from("month_config").select("var_budget")
      .eq("user_id", userId).eq("year", year).eq("month", month).maybeSingle(),
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
  if (!entry.name?.trim()) throw new Error("Nombre requerido");
  if (entry.amount <= 0 || entry.amount > 999_999_999) throw new Error("Importe inválido");
  if (year < 2000 || year > 2100) throw new Error("Año inválido");
  if (month < 0 || month > 11) throw new Error("Mes inválido");

  entry.name = sanitizeText(entry.name, 200);
  if (entry.notes) entry.notes = sanitizeText(entry.notes, 500);

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("entries").delete().eq("id", id).eq("user_id", user.id);
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
  const userId = await getSessionUserId();
  if (!userId) return [];

  // Sanitizar y escapar el input del usuario antes de interpolarlo en el filtro ILIKE
  const safeQuery = escapeIlike(sanitizeText(query, 100));
  if (!safeQuery) return [];

  const { data } = await supabase.from("entries").select("*")
    .eq("user_id", userId)
    .or(`name.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%`)
    .order("date", { ascending: false })
    .limit(40);
  if (!data) return [];
  return data.map(r => ({ ...rowToEntry(r), type: r.type, year: r.year, month: r.month }));
}

// ─── Balance & carryover ──────────────────────────────────────────────────────

export async function getAllTimeSavings(currentYear: number, currentMonth: number): Promise<number> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return 0;

  const { data } = await supabase.from("entries").select("amount")
    .eq("user_id", userId)
    .eq("type", "saving")
    .or(`year.lt.${currentYear},and(year.eq.${currentYear},month.lte.${currentMonth})`);
  return (data || []).reduce((a, r) => a + Number(r.amount), 0);
}

export function calcBalance(data: MonthData): number {
  const sum = (arr: Entry[]) => arr.reduce((a, i) => a + i.amount, 0);
  const paidFixed = data.fixedExpenses.filter(i => i.paid).reduce((a, i) => a + i.amount, 0);
  const paidVar   = data.varExpenses.filter(i => i.paid !== false).reduce((a, i) => a + i.amount, 0);
  return sum(data.incomes) + (data.carryover ?? 0) - paidFixed - paidVar - sum(data.savingsEntries);
}

export async function getCarryover(year: number, month: number): Promise<number> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return 0;

  const { data } = await supabase
    .from("entries")
    .select("type, amount, year, month")
    .eq("user_id", userId)
    .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(2000);

  if (!data || data.length === 0) return 0;

  const monthMap = new Map<string, { incomes: number; fixed: number; variable: number; savings: number }>();
  for (const row of data) {
    const key = `${row.year}-${row.month}`;
    if (!monthMap.has(key)) monthMap.set(key, { incomes: 0, fixed: 0, variable: 0, savings: 0 });
    const m = monthMap.get(key)!;
    const amount = Number(row.amount);
    if (row.type === "income")   m.incomes  += amount;
    if (row.type === "fixed")    m.fixed    += amount;
    if (row.type === "variable") m.variable += amount;
    if (row.type === "saving")   m.savings  += amount;
  }

  if (monthMap.size === 0) return 0;

  const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => {
    const [ay, am] = a[0].split("-").map(Number);
    const [by, bm] = b[0].split("-").map(Number);
    return ay !== by ? ay - by : am - bm;
  });

  let carryover = 0;
  for (const [, m] of sortedMonths) {
    const balance = m.incomes + carryover - m.fixed - m.variable - m.savings;
    carryover = balance > 0 ? balance : 0;
  }
  return carryover;
}

// ─── Annual & category data ───────────────────────────────────────────────────

export async function loadAnnualData(year: number): Promise<AnnualMonthData[]> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return Array.from({ length: 12 }, (_, i) => ({ month: i, income: 0, fixed: 0, variable: 0, balance: 0 }));

  const { data } = await supabase
    .from("entries")
    .select("month, type, amount")
    .eq("user_id", userId)
    .eq("year", year);

  const months: AnnualMonthData[] = Array.from({ length: 12 }, (_, i) => ({
    month: i, income: 0, fixed: 0, variable: 0, balance: 0,
  }));

  for (const row of (data || [])) {
    const m = months[row.month as number];
    if (!m) continue;
    const amount = Number(row.amount);
    if (row.type === "income")   m.income   += amount;
    if (row.type === "fixed")    m.fixed    += amount;
    if (row.type === "variable") m.variable += amount;
  }

  for (const m of months) {
    m.balance = m.income - m.fixed - m.variable;
  }
  return months;
}

export async function loadCategoryData(year: number, month: number): Promise<Record<string, number>> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return {};

  const { data } = await supabase
    .from("entries")
    .select("category, amount")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .eq("type", "variable");

  const result: Record<string, number> = {};
  for (const row of (data || [])) {
    const cat = (row.category as string | null) ?? "Sin categoría";
    result[cat] = (result[cat] ?? 0) + Number(row.amount);
  }
  return result;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function loadGoals(): Promise<Goal[]> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return [];

  const { data } = await supabase.from("goals").select("*")
    .eq("user_id", userId).order("created_at");
  if (!data) return [];
  return data.map(r => ({
    id: r.id, name: r.name, targetAmount: Number(r.target_amount),
    savedAmount: Number(r.saved_amount), deadline: r.deadline ?? undefined,
    color: r.color ?? "#1D9E75", createdAt: r.created_at,
  }));
}

export async function createGoal(name: string, targetAmount: number, deadline?: string, color?: string): Promise<void> {
  if (!name?.trim()) throw new Error("Nombre requerido");
  if (targetAmount <= 0 || targetAmount > 999_999_999) throw new Error("Importe inválido");
  const cleanName = sanitizeText(name, 200);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goals").insert({ user_id: user.id, name: cleanName, target_amount: targetAmount, saved_amount: 0, deadline: deadline || null, color: color || "#1D9E75" });
}

export async function updateGoal(id: string, patch: Partial<{ name: string; targetAmount: number; savedAmount: number; deadline: string; color: string }>): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    if (!patch.name.trim()) throw new Error("Nombre requerido");
    dbPatch.name = sanitizeText(patch.name, 200);
  }
  if (patch.targetAmount !== undefined) {
    if (patch.targetAmount <= 0 || patch.targetAmount > 999_999_999) throw new Error("Importe inválido");
    dbPatch.target_amount = patch.targetAmount;
  }
  if (patch.savedAmount !== undefined)  dbPatch.saved_amount = patch.savedAmount;
  if (patch.deadline !== undefined)     dbPatch.deadline = patch.deadline || null;
  if (patch.color !== undefined)        dbPatch.color = patch.color;
  await supabase.from("goals").update(dbPatch).eq("id", id).eq("user_id", user.id);
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
}

// ─── Recurring templates ──────────────────────────────────────────────────────

export async function loadTemplates(): Promise<RecurringTemplate[]> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return [];

  const { data } = await supabase.from("recurring_templates").select("*")
    .eq("user_id", userId).order("sort_order").order("created_at");
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("recurring_templates").update({ name, amount, category: category || null, day_of_month: dayOfMonth, notes: notes || null })
    .eq("id", id).eq("user_id", user.id);
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("recurring_templates").delete().eq("id", id).eq("user_id", user.id);
}

export async function importTemplates(year: number, month: number): Promise<Entry[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const templates = await loadTemplates();
  if (!templates.length) return [];
  const { data: existing } = await supabase.from("entries").select("name")
    .eq("user_id", user.id).eq("year", year).eq("month", month).eq("type", "fixed");
  const existingNames = new Set((existing || []).map((e: { name: string }) => e.name.toLowerCase().trim()));
  const missing = templates.filter(t => !existingNames.has(t.name.toLowerCase().trim()));
  if (!missing.length) return [];
  const rows = missing.map(t => {
    const day = Math.min(t.dayOfMonth || 1, 28);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { id: uid(), user_id: user.id, type: "fixed", name: t.name, amount: t.amount, date: dateStr, paid: false, category: t.category || null, notes: null, year, month };
  });
  const { data, error } = await supabase.from("entries").insert(rows).select("*");
  if (error) return [];
  return (data || []).map(rowToEntry);
}

// ─── Category budgets ─────────────────────────────────────────────────────────

export async function loadCategoryBudgets(year: number, month: number): Promise<CategoryBudget[]> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return [];

  const { data } = await supabase.from("category_budgets").select("category,budget")
    .eq("user_id", userId).eq("year", year).eq("month", month);
  if (!data) return [];
  return data.map(r => ({ category: r.category as Category, budget: Number(r.budget) }));
}

export async function saveCategoryBudget(year: number, month: number, category: Category, budget: number): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (budget <= 0) {
    await supabase.from("category_budgets").delete().eq("user_id", user.id).eq("year", year).eq("month", month).eq("category", category);
    return;
  }
  await supabase.from("category_budgets").upsert({ user_id: user.id, year, month, category, budget }, { onConflict: "user_id,year,month,category" });
}

// ─── Savings projection ───────────────────────────────────────────────────────

export async function getAvgMonthlySavings(limitMonths = 6): Promise<number> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return 0;

  const { data } = await supabase
    .from("entries")
    .select("amount, year, month")
    .eq("user_id", userId)
    .eq("type", "saving")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (!data || data.length === 0) return 0;
  const byMonth: Record<string, number> = {};
  for (const r of data) {
    const key = `${r.year}-${r.month}`;
    byMonth[key] = (byMonth[key] || 0) + Number(r.amount);
  }
  const months = Object.values(byMonth).slice(0, limitMonths);
  if (months.length === 0) return 0;
  return months.reduce((a, v) => a + v, 0) / months.length;
}

// ─── User categories ──────────────────────────────────────────────────────────

async function initDefaultCategories(userId: string): Promise<void> {
  const supabase = createClient();
  const rows = DEFAULT_CATEGORIES.map((name, i) => ({ user_id: userId, name, sort_order: i }));
  await supabase.from("user_categories").insert(rows);
}

export async function loadCategories(): Promise<string[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [...DEFAULT_CATEGORIES];

  const { data } = await supabase
    .from("user_categories")
    .select("name")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) {
    await initDefaultCategories(user.id);
    return [...DEFAULT_CATEGORIES];
  }
  return data.map(r => r.name as string);
}

export async function createCategory(name: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { count } = await supabase
    .from("user_categories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  await supabase.from("user_categories").insert({ user_id: user.id, name, sort_order: (count ?? 0) });
}

export async function deleteCategory(name: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_categories").delete().eq("user_id", user.id).eq("name", name);
}

// ─── Goal contributions ───────────────────────────────────────────────────────

export type GoalContribution = {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  notes?: string;
};

export async function loadGoalContributions(goalId: string): Promise<GoalContribution[]> {
  const supabase = createClient();
  const userId = await getSessionUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from("goal_contributions")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (!data) return [];
  return data.map(r => ({
    id: r.id, goal_id: r.goal_id, amount: Number(r.amount),
    date: r.date, notes: r.notes ?? undefined,
  }));
}

export async function addGoalContribution(goalId: string, amount: number, date: string, notes?: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goal_contributions").insert({
    goal_id: goalId, user_id: user.id, amount, date, notes: notes || null,
  });
  const { data: goal } = await supabase.from("goals").select("saved_amount")
    .eq("id", goalId).eq("user_id", user.id).single();
  if (goal) {
    const newSaved = Math.max(0, Number(goal.saved_amount) + amount);
    await supabase.from("goals").update({ saved_amount: newSaved }).eq("id", goalId).eq("user_id", user.id);
  }
}

export async function deleteGoalContribution(id: string, amount: number, goalId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goal_contributions").delete().eq("id", id).eq("user_id", user.id);
  const { data: goal } = await supabase.from("goals").select("saved_amount")
    .eq("id", goalId).eq("user_id", user.id).single();
  if (goal) {
    const newSaved = Math.max(0, Number(goal.saved_amount) - amount);
    await supabase.from("goals").update({ saved_amount: newSaved }).eq("id", goalId).eq("user_id", user.id);
  }
}

export async function updateGoalContribution(
  id: string, oldAmount: number, newAmount: number, date: string, notes: string, goalId: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goal_contributions")
    .update({ amount: newAmount, date, notes: notes || null })
    .eq("id", id).eq("user_id", user.id);
  const { data: goal } = await supabase.from("goals").select("saved_amount")
    .eq("id", goalId).eq("user_id", user.id).single();
  if (goal) {
    const newSaved = Math.max(0, Number(goal.saved_amount) - oldAmount + newAmount);
    await supabase.from("goals").update({ saved_amount: newSaved }).eq("id", goalId).eq("user_id", user.id);
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export async function exportAllDataAsCSV(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [entriesRes, goalsRes, investmentsRes, contributionsRes] = await Promise.all([
    supabase.from("entries").select("*").eq("user_id", user.id).order("date", { ascending: false }),
    supabase.from("goals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("investments").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("investment_contributions").select("*").order("date", { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries       = (entriesRes.data       || []) as Record<string, any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goals         = (goalsRes.data         || []) as Record<string, any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const investments   = (investmentsRes.data   || []) as Record<string, any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allContribs   = (contributionsRes.data || []) as Record<string, any>[];
  // Filtrar contribuciones solo para las inversiones del usuario
  const ownInvIds = new Set(investments.map(i => i.id));
  const contributions = allContribs.filter(c => ownInvIds.has(c.investment_id));

  function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
    const header = columns.join(",");
    const body = rows.map(row =>
      columns.map(col => {
        const val = row[col] ?? "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
      }).join(",")
    ).join("\n");
    return header + "\n" + body;
  }

  const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const entriesCSV = toCSV(
    entries.map(e => ({
      fecha:     e.date,
      año:       e.year,
      mes:       MONTH_NAMES[e.month as number] ?? e.month,
      tipo:      e.type === "income" ? "Ingreso" : e.type === "fixed" ? "Gasto fijo" : e.type === "variable" ? "Gasto variable" : "Ahorro",
      descripcion: e.name,
      importe:   e.amount,
      categoria: e.category ?? "",
      notas:     e.notes ?? "",
      cobrado:   e.paid ? "Sí" : "No",
    })),
    ["fecha","año","mes","tipo","descripcion","importe","categoria","notas","cobrado"]
  );

  const goalsCSV = toCSV(
    goals.map(g => ({
      nombre:       g.name,
      objetivo:     g.target_amount,
      ahorrado:     g.saved_amount,
      progreso_pct: g.target_amount > 0 ? Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100) + "%" : "0%",
      fecha_limite: g.deadline ?? "",
      creada:       (g.created_at as string)?.slice(0, 10) ?? "",
    })),
    ["nombre","objetivo","ahorrado","progreso_pct","fecha_limite","creada"]
  );

  const investmentsCSV = toCSV(
    investments.map(inv => {
      const invContribs = contributions.filter(c => c.investment_id === inv.id);
      const total = invContribs.reduce((a, c) => a + Number(c.amount), 0);
      return {
        nombre:           inv.name,
        isin:             inv.isin ?? "",
        categoria:        inv.category === "emergency" ? "Fondo emergencia" : inv.category === "variable" ? "Renta variable" : inv.category === "fixed" ? "Renta fija" : "Acciones directas",
        total_aportado:   total,
        num_aportaciones: invContribs.length,
        creada:           (inv.created_at as string)?.slice(0, 10) ?? "",
      };
    }),
    ["nombre","isin","categoria","total_aportado","num_aportaciones","creada"]
  );

  const contributionsCSV = toCSV(
    contributions.map(c => {
      const inv = investments.find(i => i.id === c.investment_id);
      return { inversion: inv?.name ?? c.investment_id, fecha: c.date, importe: c.amount, notas: c.notes ?? "" };
    }),
    ["inversion","fecha","importe","notas"]
  );

  const fullCSV = [
    "=== MOVIMIENTOS FINANCIEROS ===", entriesCSV, "",
    "=== METAS DE AHORRO ===", goalsCSV, "",
    "=== INVERSIONES ===", investmentsCSV, "",
    "=== APORTACIONES A INVERSIONES ===", contributionsCSV,
  ].join("\n");

  const blob = new Blob(["\uFEFF" + fullCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spenfly-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
