"use client";

import { useEffect, useState } from "react";
import { GhostButton, PrimaryButton } from "./ui";

const STEPS = [
  {
    targetSelector: "[data-tour='summary']",
    title: "Resumen mensual",
    description: "Aquí ves de un vistazo tus ingresos, gastos y balance del mes.",
  },
  {
    targetSelector: "[data-tour='month-nav']",
    title: "Navegación de meses",
    description: "Cambia de mes con las flechas o haz clic en el mes para ir directamente a cualquier fecha.",
  },
  {
    targetSelector: "[data-tour='income']",
    title: "Ingresos",
    description: "Añade todos tus ingresos del mes: nómina, freelance, alquileres...",
  },
  {
    targetSelector: "[data-tour='fixed']",
    title: "Gastos fijos",
    description: "Gastos recurrentes como el alquiler o suscripciones. Márcalos como pagados para que resten del balance.",
  },
  {
    targetSelector: "[data-tour='variable']",
    title: "Gastos variables",
    description: "El día a día: supermercado, restaurantes... Asigna categorías para ver dónde gastas más.",
  },
  {
    targetSelector: "[data-tour='savings']",
    title: "Ahorros",
    description: "Registra tus aportaciones a fondos, planes o cualquier producto de ahorro.",
  },
  {
    targetSelector: "[data-tour='budget-panel']",
    title: "Presupuestos",
    description: "Define límites de gasto por categoría. Las barras se ponen en rojo cuando te pasas.",
  },
  {
    targetSelector: "[data-tour='pdf-button']",
    title: "Informe PDF",
    description: "Genera un informe mensual completo en PDF con todos tus movimientos y gráficos.",
  },
  {
    targetSelector: "[data-tour='navbar-metas']",
    title: "Metas de ahorro",
    description: "Crea objetivos con fecha límite y sigue tu progreso. Registra cada aportación.",
  },
  {
    targetSelector: "[data-tour='navbar-inversiones']",
    title: "Inversiones",
    description: "Registra tu cartera de inversiones organizada por tipo de activo.",
  },
];

export const TOUR_KEY = "finanzas_tour_done";

interface TooltipPos { top: number; left: number; }

export function AppTour({
  forceOpen = false,
  loading = false,
  onClose,
}: {
  forceOpen?: boolean;
  loading?: boolean;
  onClose?: () => void;
}) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<TooltipPos>({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (forceOpen) { setActive(true); setStep(0); return; }
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setActive(true);
  }, [forceOpen]);

  // Wait for page data to load before activating
  useEffect(() => {
    if (loading) setActive(false);
    else {
      const done = localStorage.getItem(TOUR_KEY);
      if (!done && !forceOpen) setActive(true);
    }
  }, [loading, forceOpen]);

  useEffect(() => {
    if (!active) return;
    const el = document.querySelector(STEPS[step].targetSelector);
    if (!el) { setHighlightRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      const TOOLTIP_W = 300;
      const TOOLTIP_H = 175;
      const MARGIN = 16;
      // 60% rule: top 60% → tooltip below; bottom 40% → tooltip above
      const inTopPart = rect.top < window.innerHeight * 0.6;
      let top = inTopPart ? rect.bottom + MARGIN : rect.top - TOOLTIP_H - MARGIN;
      let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      left = Math.max(16, Math.min(left, window.innerWidth - TOOLTIP_W - 16));
      top  = Math.max(16, Math.min(top,  window.innerHeight - TOOLTIP_H - 16));
      setPos({ top, left });
    }, 300);
  }, [active, step]);

  function finish() {
    localStorage.setItem(TOUR_KEY, "1");
    setActive(false);
    onClose?.();
  }
  function next() { step < STEPS.length - 1 ? setStep(s => s + 1) : finish(); }
  function prev() { if (step > 0) setStep(s => s - 1); }

  if (!active || loading) return null;
  const current = STEPS[step];

  return (
    <>
      {/* Dark overlay — pointer-events: none so scroll still works */}
      <div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />

      {/* Highlight ring around the target element */}
      {highlightRect && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-300"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px #378ADD",
            borderRadius: 12,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="fixed z-[60] w-[300px] bg-white dark:bg-neutral-900
          border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-2xl"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-semibold">{current.title}</p>
          <span className="text-xs text-neutral-400 ml-2 shrink-0 tabular-nums">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? "w-4 bg-brand-blue" : "w-1.5 bg-neutral-200 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
          {current.description}
        </p>

        <div className="flex items-center justify-between">
          <GhostButton onClick={finish}>Saltar tour</GhostButton>
          <div className="flex gap-2">
            {step > 0 && <GhostButton onClick={prev}>← Anterior</GhostButton>}
            <PrimaryButton onClick={next}>
              {step === STEPS.length - 1 ? "Finalizar" : "Siguiente →"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </>
  );
}
