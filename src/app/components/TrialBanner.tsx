"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { usePlan } from "../hooks/usePlan";

const DISMISSED_KEY = "trial_banner_dismissed";

export function TrialBanner() {
  const router = useRouter();
  const { loading, isTrial, trialDaysLeft, trialExpired, canWrite } = usePlan();
  const [hasUser, setHasUser] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setHasUser(!!data.user));
    try {
      setDismissed(sessionStorage.getItem(DISMISSED_KEY) === "1");
    } catch {}
  }, []);

  if (loading || !hasUser || !isTrial) return null;

  // Trial expirado — prominente, no se puede cerrar
  if (trialExpired || !canWrite) {
    return (
      <div className="w-full bg-red-50 dark:bg-red-950/60 border-b border-red-200 dark:border-red-900 px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
          Tu prueba ha terminado. Activa un plan para seguir añadiendo movimientos.
        </p>
        <button
          onClick={() => router.push("/pricing")}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Ver planes
        </button>
      </div>
    );
  }

  if (dismissed) return null;

  const urgent = trialDaysLeft <= 3;

  const bgClass = urgent
    ? "bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900"
    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900";
  const textClass = urgent
    ? "text-orange-700 dark:text-orange-300"
    : "text-amber-700 dark:text-amber-300";
  const btnClass = urgent
    ? "bg-orange-500 hover:bg-orange-600 text-white"
    : "bg-amber-500 hover:bg-amber-600 text-white";

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch {}
  }

  return (
    <div className={`w-full border-b px-4 py-2.5 flex items-center justify-between gap-3 ${bgClass}`}>
      <p className={`text-sm font-medium ${textClass}`}>
        {urgent
          ? `⚠️ Solo quedan ${trialDaysLeft} día${trialDaysLeft !== 1 ? "s" : ""} · Activa tu plan`
          : `${trialDaysLeft} días de prueba restantes · Elige tu plan`}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push("/pricing")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${btnClass}`}
        >
          Ver planes
        </button>
        <button
          onClick={dismiss}
          className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${textClass} hover:bg-black/10 dark:hover:bg-white/10`}
          title="Cerrar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
