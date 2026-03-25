"use client";

import { useEffect, useState } from "react";
import { GhostButton, PrimaryButton } from "./ui";

const STEPS = [
  { targetSelector: "[data-tour='summary']", title: "Resumen mensual",
    description: "Aquí ves de un vistazo tus ingresos, gastos y balance del mes.",
    position: "bottom" as const },
  { targetSelector: "[data-tour='income-section']", title: "Ingresos",
    description: "Añade todos tus ingresos del mes: nómina, freelance, alquileres...",
    position: "bottom" as const },
  { targetSelector: "[data-tour='fixed-section']", title: "Gastos fijos",
    description: "Gastos recurrentes como el alquiler o suscripciones. Márcalos como pagados.",
    position: "bottom" as const },
  { targetSelector: "[data-tour='var-section']", title: "Gastos variables",
    description: "El día a día: supermercado, restaurantes... Asigna categorías para ver dónde gastas más.",
    position: "bottom" as const },
  { targetSelector: "[data-tour='budget-panel']", title: "Presupuestos",
    description: "Define límites de gasto por categoría. Las barras se ponen en rojo cuando te pasas.",
    position: "top" as const },
  { targetSelector: "[data-tour='nav-metas']", title: "Metas de ahorro",
    description: "Crea objetivos con fecha límite y sigue tu progreso.",
    position: "top" as const },
  { targetSelector: "[data-tour='nav-inversiones']", title: "Inversiones",
    description: "Registra tu cartera de inversiones organizada por tipo de activo.",
    position: "top" as const },
];

interface TooltipPos { top: number; left: number; }

export function AppTour({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<TooltipPos>({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (forceOpen) { setActive(true); setStep(0); return; }
    const done = localStorage.getItem("tour_completed");
    if (!done) setActive(true);
  }, [forceOpen]);

  useEffect(() => {
    if (!active) return;
    const el = document.querySelector(STEPS[step].targetSelector);
    if (!el) { setHighlightRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
      const TOOLTIP_W = 300;
      const TOOLTIP_H = 160;
      const MARGIN = 12;
      let top = 0, left = 0;
      if (STEPS[step].position === "bottom") top = rect.bottom + MARGIN;
      else top = rect.top - TOOLTIP_H - MARGIN;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - TOOLTIP_W - 12));
      top  = Math.max(12, Math.min(top,  window.innerHeight - TOOLTIP_H - 12));
      setPos({ top, left });
    }, 300);
  }, [active, step]);

  function finish() {
    localStorage.setItem("tour_completed", "1");
    setActive(false);
    onClose?.();
  }
  function next() { step < STEPS.length - 1 ? setStep(s => s + 1) : finish(); }
  function prev() { if (step > 0) setStep(s => s - 1); }

  if (!active) return null;
  const current = STEPS[step];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none"
        style={{ background: "rgba(0,0,0,0.55)" }} />

      {/* Highlight ring */}
      {highlightRect && (
        <div className="fixed z-50 pointer-events-none transition-all duration-300"
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
          <span className="text-xs text-neutral-400 ml-2 shrink-0 tabular-nums">{step + 1} / {STEPS.length}</span>
        </div>

        {/* Step dots */}
        <div className="flex gap-1 mb-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-4 bg-brand-blue" : "w-1.5 bg-neutral-200 dark:bg-neutral-700"}`} />
          ))}
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
          {current.description}
        </p>
        <div className="flex items-center justify-between">
          <GhostButton onClick={finish}>Saltar</GhostButton>
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
