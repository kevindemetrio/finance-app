import { createClient } from "./supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvestmentCategory =
  | "emergency"   // Fondo de emergencia
  | "variable"    // Renta variable (ETFs, fondos)
  | "fixed"       // Renta fija (bonos, depósitos)
  | "stock";      // Stocks individuales

export const INVESTMENT_CATEGORIES: InvestmentCategory[] = ["emergency","variable","fixed","stock"];

export const CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  emergency: "Fondo de emergencia",
  variable:  "Renta variable",
  fixed:     "Renta fija",
  stock:     "Stocks individuales",
};

export const CATEGORY_COLORS: Record<InvestmentCategory, { dot: string; text: string; bg: string }> = {
  emergency: { dot: "bg-brand-blue",  text: "text-brand-blue",  bg: "bg-brand-blue-light dark:bg-blue-950" },
  variable:  { dot: "bg-brand-green", text: "text-brand-green", bg: "bg-brand-green-light dark:bg-green-950" },
  fixed:     { dot: "bg-brand-amber", text: "text-brand-amber", bg: "bg-brand-amber-light dark:bg-amber-950" },
  stock:     { dot: "bg-brand-red",   text: "text-brand-red",   bg: "bg-brand-red-light dark:bg-red-950" },
};

export interface Investment {
  id: string;
  category: InvestmentCategory;
  name: string;
  isin?: string;
  contributions: Contribution[];
  createdAt: string;
}

export interface Contribution {
  id: string;
  investmentId: string;
  amount: number;
  date: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function totalContributions(inv: Investment): number {
  return inv.contributions.reduce((a, c) => a + c.amount, 0);
}

export function groupByCategory(investments: Investment[]): Record<InvestmentCategory, Investment[]> {
  const groups: Record<InvestmentCategory, Investment[]> = {
    emergency: [], variable: [], fixed: [], stock: [],
  };
  for (const inv of investments) {
    groups[inv.category].push(inv);
  }
  return groups;
}

// ─── Supabase calls ───────────────────────────────────────────────────────────

export async function loadInvestments(): Promise<Investment[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [invRes, contribRes] = await Promise.all([
    supabase.from("investments").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("investment_contributions").select("*").order("date", { ascending: false }),
  ]);

  if (!invRes.data) return [];

  const ownInvIds = new Set(invRes.data.map(r => r.id));
  // Filtrar contribuciones solo a las inversiones del usuario
  const contributions = (contribRes.data ?? []).filter(c => ownInvIds.has(c.investment_id));

  return invRes.data.map((row) => ({
    id: row.id,
    category: row.category as InvestmentCategory,
    name: row.name,
    isin: row.isin ?? undefined,
    createdAt: row.created_at,
    contributions: contributions
      .filter((c) => c.investment_id === row.id)
      .map((c) => ({
        id: c.id,
        investmentId: c.investment_id,
        amount: Number(c.amount),
        date: c.date,
        notes: c.notes ?? undefined,
      })),
  }));
}

export async function createInvestment(
  category: InvestmentCategory,
  name: string,
  isin?: string
): Promise<Investment | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("investments")
    .insert({ user_id: user.id, category, name, isin: isin || null })
    .select()
    .single();

  if (error || !data) return null;
  return { id: data.id, category: data.category, name: data.name, isin: data.isin, contributions: [], createdAt: data.created_at };
}

export async function updateInvestment(
  id: string,
  name: string,
  isin?: string,
  category?: InvestmentCategory
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const patch: Record<string, unknown> = { name, isin: isin || null };
  if (category) patch.category = category;
  await supabase.from("investments").update(patch).eq("id", id).eq("user_id", user.id);
}

export async function deleteInvestment(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("investments").delete().eq("id", id).eq("user_id", user.id);
}

export async function addContribution(
  investmentId: string,
  amount: number,
  date: string,
  notes?: string
): Promise<Contribution | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Verificar que la inversión pertenece al usuario antes de insertar
  const { data: inv } = await supabase.from("investments")
    .select("id").eq("id", investmentId).eq("user_id", user.id).single();
  if (!inv) return null;

  const { data, error } = await supabase
    .from("investment_contributions")
    .insert({ investment_id: investmentId, amount, date, notes: notes || null })
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    investmentId: data.investment_id,
    amount: Number(data.amount),
    date: data.date,
    notes: data.notes ?? undefined,
  };
}

export async function deleteContribution(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Verificar propiedad a través de la inversión padre
  const { data: contrib } = await supabase.from("investment_contributions")
    .select("investment_id").eq("id", id).single();
  if (!contrib) return;
  const { data: inv } = await supabase.from("investments")
    .select("id").eq("id", contrib.investment_id).eq("user_id", user.id).single();
  if (!inv) return;

  await supabase.from("investment_contributions").delete().eq("id", id);
}

export async function updateContribution(
  id: string,
  amount: number,
  date: string,
  notes?: string
): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Verificar propiedad a través de la inversión padre
  const { data: contrib } = await supabase.from("investment_contributions")
    .select("investment_id").eq("id", id).single();
  if (!contrib) return;
  const { data: inv } = await supabase.from("investments")
    .select("id").eq("id", contrib.investment_id).eq("user_id", user.id).single();
  if (!inv) return;

  await supabase.from("investment_contributions")
    .update({ amount, date, notes: notes || null })
    .eq("id", id);
}
