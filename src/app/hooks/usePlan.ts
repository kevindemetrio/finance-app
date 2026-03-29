"use client";

import { useEffect, useState } from "react";
import {
  loadSubscription,
  Plan,
  SubscriptionStatus,
} from "../lib/subscription";

export interface PlanInfo {
  plan: Plan;
  status: SubscriptionStatus;
  loading: boolean;

  isTrial: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;

  effectivePlan: "basic" | "pro";

  canWrite: boolean;
  canUseInvestments: boolean;
  canUsePdf: boolean;
  canUseDashboard: boolean;
  canSearchCrossMes: boolean;
  goalsLimit: number;
  historyMonthsLimit: number;
}

const FALLBACK: PlanInfo = {
  plan: "trial",
  status: "trialing",
  loading: false,
  isTrial: true,
  trialDaysLeft: 14,
  trialExpired: false,
  effectivePlan: "pro",
  canWrite: true,
  canUseInvestments: true,
  canUsePdf: true,
  canUseDashboard: true,
  canSearchCrossMes: true,
  goalsLimit: Infinity,
  historyMonthsLimit: Infinity,
};

function daysLeft(isoDate: string | null): number {
  if (!isoDate) return 0;
  const diff = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function buildPlanInfo(
  plan: Plan,
  status: SubscriptionStatus,
  trialEndsAt: string | null
): Omit<PlanInfo, "loading"> {
  const isTrial = plan === "trial";
  const days = isTrial ? daysLeft(trialEndsAt) : 0;
  const trialExpired = isTrial && days === 0;

  let effectivePlan: "basic" | "pro";
  let canWrite: boolean;

  if (isTrial && !trialExpired) {
    effectivePlan = "pro";
    canWrite = true;
  } else if (
    (plan === "pro" || plan === "family") &&
    status === "active"
  ) {
    effectivePlan = "pro";
    canWrite = true;
  } else if (plan === "basic" && status === "active") {
    effectivePlan = "basic";
    canWrite = true;
  } else {
    // trial expirado, past_due, canceled, expired, o sin fila
    effectivePlan = "basic";
    canWrite = false;
  }

  const isPro = effectivePlan === "pro";

  return {
    plan,
    status,
    isTrial,
    trialDaysLeft: days,
    trialExpired,
    effectivePlan,
    canWrite,
    canUseInvestments: isPro,
    canUsePdf: isPro,
    canUseDashboard: isPro,
    canSearchCrossMes: isPro,
    goalsLimit: isPro ? Infinity : 1,
    historyMonthsLimit: isPro ? Infinity : 3,
  };
}

export function usePlan(): PlanInfo {
  const [info, setInfo] = useState<PlanInfo>({ ...FALLBACK, loading: true });

  useEffect(() => {
    let cancelled = false;
    loadSubscription().then((sub) => {
      if (cancelled) return;
      if (!sub) {
        setInfo({ ...FALLBACK, loading: false });
        return;
      }
      setInfo({
        ...buildPlanInfo(sub.plan, sub.status, sub.trialEndsAt),
        loading: false,
      });
    });
    return () => { cancelled = true; };
  }, []);

  return info;
}
