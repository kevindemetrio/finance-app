import { createClient } from "./supabase/client";

export type Plan = "trial" | "basic" | "pro" | "family" | "expired";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired";

export interface Subscription {
  plan: Plan;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  familyOwnerId: string | null;
  provider: string;
  billingInterval: "monthly" | "annual" | "lifetime" | null;
}

function mapRow(row: Record<string, unknown>): Subscription {
  return {
    plan: row.plan as Plan,
    status: row.status as SubscriptionStatus,
    trialEndsAt: (row.trial_ends_at as string) ?? null,
    currentPeriodEnd: (row.current_period_end as string) ?? null,
    familyOwnerId: (row.family_owner_id as string) ?? null,
    provider: (row.provider as string) ?? "",
    billingInterval: (row.billing_interval as "monthly" | "annual" | "lifetime" | null) ?? null,
  };
}

export async function loadSubscription(): Promise<Subscription | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, trial_ends_at, current_period_end, family_owner_id, provider, billing_interval"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  const sub = mapRow(data as Record<string, unknown>);

  // Si es miembro de un plan family, heredar el plan del owner
  if (sub.familyOwnerId) {
    const { data: ownerData } = await supabase
      .from("subscriptions")
      .select(
        "plan, status, trial_ends_at, current_period_end, family_owner_id, provider, billing_interval"
      )
      .eq("user_id", sub.familyOwnerId)
      .maybeSingle();

    if (ownerData) {
      const ownerSub = mapRow(ownerData as Record<string, unknown>);
      return {
        ...ownerSub,
        familyOwnerId: sub.familyOwnerId,
      };
    }
  }

  return sub;
}
