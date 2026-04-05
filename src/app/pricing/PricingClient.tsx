"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { toast } from "../components/Toast";
import { usePlan } from "../hooks/usePlan";

interface Prices {
  basicMonthly: string;
  basicAnnual: string;
  proMonthly: string;
  proAnnual: string;
  familyMonthly: string;
  familyAnnual: string;
}

interface Props {
  prices: Prices;
}

export default function PricingClient({ prices }: Props) {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const planInfo = usePlan();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast("¡Bienvenido! Tu plan está activo.", "success");
      router.replace("/pricing");
    } else if (canceled === "true") {
      toast("Pago cancelado.", "info");
      router.replace("/pricing");
    }
  }, [searchParams, router]);

  async function handlePortal() {
    setLoadingPlan("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast("Error al abrir el portal. Inténtalo de nuevo.", "error");
    }
    setLoadingPlan(null);
  }

  async function handleCheckout(priceId: string) {
    setLoadingPlan(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      toast("Error al iniciar el pago. Inténtalo de nuevo.", "error");
    }
    setLoadingPlan(null);
  }

  const currentPlan = planInfo.plan;
  const planLoading = planInfo.loading;

  const basicPriceId = annual ? prices.basicAnnual : prices.basicMonthly;
  const proPriceId = annual ? prices.proAnnual : prices.proMonthly;

  const isCurrentBasic = !planLoading && currentPlan === "basic";
  const isCurrentPro = !planLoading && currentPlan === "pro";
  const isCurrentFamily = !planLoading && currentPlan === "family";

  return (
    <SeasonWrapper>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-16">

        {/* Header con DesktopTabs */}
        <div className="flex items-center justify-between mb-10">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Planes</h1>
        </div>

        {/* Título y subtítulo */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Elige tu plan
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            14 días gratis con acceso completo · Sin tarjeta de crédito
          </p>
        </div>

        {/* Toggle mensual / anual */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}`}>
            Mensual
          </span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none
              ${annual ? "bg-brand-green" : "bg-neutral-300 dark:bg-neutral-600"}`}
            aria-label="Cambiar a facturación anual"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${annual ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}`}>
            Anual
          </span>
          {annual && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green">
              Ahorra ~15%
            </span>
          )}
        </div>

        {/* Cards — siempre se muestran los 3 planes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Basic ── */}
          <div className={`relative rounded-2xl border p-6 flex flex-col bg-white dark:bg-neutral-900 transition-colors
            ${isCurrentBasic
              ? "border-brand-blue dark:border-brand-blue"
              : "border-neutral-200 dark:border-neutral-800"}`}>
            {isCurrentBasic && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-brand-blue text-white">
                Plan actual
              </span>
            )}

            <div className="mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Basic</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {annual ? "2,99" : "3,49"}€
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">/mes</span>
              </div>
              {annual && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  Facturado anualmente (35,88 €/año)
                </p>
              )}
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              <FeatureRow included label="Finanzas completo" />
              <FeatureRow included label="1 meta de ahorro" />
              <FeatureRow included label="Historial 3 meses" />
              <FeatureRow label="Inversiones" />
              <FeatureRow label="Exportar PDF" />
              <FeatureRow label="Dashboard anual" />
              <FeatureRow label="Búsqueda cross-mes" />
            </ul>

            {isCurrentBasic ? (
              <button
                onClick={handlePortal}
                disabled={loadingPlan !== null}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors bg-brand-blue text-white hover:opacity-90 disabled:opacity-60"
              >
                {loadingPlan === "portal" ? "Abriendo…" : "Gestionar suscripción →"}
              </button>
            ) : (
              <button
                disabled={planLoading || loadingPlan !== null}
                onClick={() => handleCheckout(basicPriceId)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-60"
              >
                {loadingPlan === basicPriceId ? "Redirigiendo…" : "Empezar con Basic"}
              </button>
            )}
          </div>

          {/* ── Pro ── */}
          <div className={`relative rounded-2xl border-2 p-6 flex flex-col bg-white dark:bg-neutral-900 transition-colors
            ${isCurrentPro
              ? "border-brand-blue"
              : "border-brand-green"}`}>
            {!isCurrentPro && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-brand-green text-white">
                Más popular
              </span>
            )}
            {isCurrentPro && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-brand-blue text-white">
                Plan actual
              </span>
            )}

            <div className="mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Pro</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {annual ? "3,99" : "4,99"}€
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">/mes</span>
              </div>
              {annual && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  Facturado anualmente (47,99 €/año)
                </p>
              )}
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              <FeatureRow included label="Todo de Basic" />
              <FeatureRow included label="Metas ilimitadas" />
              <FeatureRow included label="Inversiones" />
              <FeatureRow included label="Exportar PDF" />
              <FeatureRow included label="Dashboard anual" />
              <FeatureRow included label="Búsqueda cross-mes" />
              <FeatureRow included label="Historial completo" />
            </ul>

            {isCurrentPro ? (
              <button
                onClick={handlePortal}
                disabled={loadingPlan !== null}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors bg-brand-blue text-white hover:opacity-90 disabled:opacity-60"
              >
                {loadingPlan === "portal" ? "Abriendo…" : "Gestionar suscripción →"}
              </button>
            ) : (
              <button
                disabled={planLoading || loadingPlan !== null}
                onClick={() => handleCheckout(proPriceId)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors bg-brand-green text-white hover:opacity-90 disabled:opacity-60"
              >
                {loadingPlan === proPriceId ? "Redirigiendo…" : "Empezar con Pro"}
              </button>
            )}
          </div>

          {/* ── Family ── */}
          <div className={`relative rounded-2xl border p-6 flex flex-col bg-white dark:bg-neutral-900 transition-colors
            ${isCurrentFamily
              ? "border-brand-blue dark:border-brand-blue"
              : "border-neutral-200 dark:border-neutral-800"}`}>
            {isCurrentFamily && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-brand-blue text-white">
                Plan actual
              </span>
            )}

            <div className="mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Family</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {annual ? "8,49" : "9,99"}€
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">/mes</span>
              </div>
              {annual && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  Facturado anualmente (101,88 €/año)
                </p>
              )}
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              <FeatureRow included label="Todo de Pro" />
              <FeatureRow included label="3 cuentas incluidas" />
              <FeatureRow included label="Panel familiar compartido" />
            </ul>

            <button
              disabled
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
            >
              Próximamente
            </button>
          </div>
        </div>

        {/* Nota inferior */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-8">
          Cancela cuando quieras.
        </p>
      </div>
    </SeasonWrapper>
  );
}

function FeatureRow({ included = false, label }: { included?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {included ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-brand-green">
          <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.15" />
          <path d="M4.5 8l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-neutral-300 dark:text-neutral-600">
          <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.15" />
          <path d="M5.5 10.5l5-5M10.5 10.5l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <span className={included ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-400 dark:text-neutral-600"}>
        {label}
      </span>
    </li>
  );
}
