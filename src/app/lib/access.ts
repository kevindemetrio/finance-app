import { createClient } from "@/app/lib/supabase/server";

export type AccessLevel = "lifetime" | "pro" | "basic" | "none";

export interface UserAccess {
  level: AccessLevel;
  plan: string | null;
  expiresAt: string | null;
}

/**
 * Determina el nivel de acceso del usuario autenticado.
 * Prioridad:
 *   1. is_lifetime = true  → "lifetime"
 *   2. Suscripción activa más reciente → "pro" | "basic"
 *   3. Cualquier otro caso → "none"
 *
 * Solo para uso server-side (Server Components, Route Handlers, Server Actions).
 */
export async function getUserAccess(): Promise<UserAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { level: "none", plan: null, expiresAt: null };
  }

  const { data: rows } = await supabase
    .from("subscriptions")
    .select("plan, status, is_lifetime, current_period_end")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) {
    return { level: "none", plan: null, expiresAt: null };
  }

  // Prioridad 1: is_lifetime
  const lifetimeRow = rows.find((r) => r.is_lifetime);
  if (lifetimeRow) {
    return { level: "lifetime", plan: lifetimeRow.plan, expiresAt: null };
  }

  // Prioridad 2: suscripción activa (o cancelada con acceso aún vigente)
  const activeRow = rows.find((r) => r.status === "active" || r.status === "canceling");
  if (activeRow) {
    const level: AccessLevel =
      activeRow.plan === "pro" || activeRow.plan === "family" ? "pro" : "basic";
    return { level, plan: activeRow.plan, expiresAt: activeRow.current_period_end ?? null };
  }

  return { level: "none", plan: rows[0].plan ?? null, expiresAt: null };
}
