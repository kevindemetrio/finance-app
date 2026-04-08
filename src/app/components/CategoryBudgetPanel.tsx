"use client";

import { useEffect, useRef, useState } from "react";
import { Category, CategoryBudget, Entry, fmtEur, saveCategoryBudget, saveMonthConfig } from "../lib/data";
import { GhostButton, SaveButton, TextInput } from "./ui";
import { useTheme, SEASON_CONFIG } from "./ThemeProvider";
import { useCategories } from "./CategoriesProvider";
import { toast } from "./Toast";

interface Props {
  year: number;
  month: number;
  varExpenses: Entry[];
  budgets: CategoryBudget[];
  varBudget: number;
  disabled?: boolean;
  onChange: (updated: CategoryBudget[]) => void;
  onVarBudgetChange: (v: number) => void;
}

const CAT_COLORS: Record<string, { dot: string; text: string }> = {
  "Alimentación": { dot: "#6CC8A8", text: "#1D9E75" },
  "Ocio":         { dot: "#E09190", text: "#C05B5A" },
  "Tecnología":   { dot: "#8FBA6A", text: "#5A8A35" },
  "Transporte":   { dot: "#7AAEE0", text: "#4A80C4" },
  "Hogar":        { dot: "#7AAEE0", text: "#4A80C4" },
  "Salud":        { dot: "#6CC8A8", text: "#1D9E75" },
  "Ropa":         { dot: "#D98FAA", text: "#B05878" },
  "Regalos":      { dot: "#D98FAA", text: "#B05878" },
  "Educación":    { dot: "#8FBA6A", text: "#5A8A35" },
  "Viajes":       { dot: "#E0B472", text: "#C4862A" },
  "Otro":         { dot: "#A8A49E", text: "#7A7770" },
};

function Bar({ pct, over, warn }: { pct: number; over: boolean; warn: boolean }) {
  const lightColor = over ? "#E24B4A" : warn ? "#F0B95A" : "#6CC8A8";
  return (
    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all dark:hidden"
           style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: lightColor }} />
      <div className={`h-full rounded-full transition-all hidden dark:block ${over ? "bg-brand-red" : warn ? "bg-brand-amber" : "bg-brand-green"}`}
           style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export function CategoryBudgetPanel({
  year, month, varExpenses, budgets, varBudget, disabled, onChange, onVarBudgetChange,
}: Props) {
  const lsKey = "budget_panel_open";
  const [open, setOpen]             = useState(true);
  const [editingCat, setEditingCat] = useState<Category | "global" | null>(null);
  const [editVal, setEditVal]       = useState("");
  const [pendingCat, setPendingCat] = useState<Category | null>(null);

  // Animated collapse
  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [measured, setMeasured]  = useState(false);

  const { categories } = useCategories();
  const { theme, season } = useTheme();
  const cfg = theme === "season" ? SEASON_CONFIG[season] : null;

  // Single effect: load localStorage + ResizeObserver together to avoid spurious animation on mount
  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}

    const el = innerRef.current;
    if (!el) return;
    setNaturalHeight(el.scrollHeight);
    setMeasured(true);
    const ro = new ResizeObserver(() => setNaturalHeight(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close any open edit forms if disabled becomes true
  useEffect(() => {
    if (disabled) setEditingCat(null);
  }, [disabled]);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  // Spending per category — exclude unpaid (pending) variable expenses
  const paidVarExpenses = varExpenses.filter(e => e.paid !== false);
  const spending: Record<string, number> = {};
  for (const e of paidVarExpenses) {
    const cat = e.category || "Otro";
    spending[cat] = (spending[cat] || 0) + e.amount;
  }
  const varTotal = paidVarExpenses.reduce((a, e) => a + e.amount, 0);

  const globalPct  = varBudget > 0 ? Math.round((varTotal / varBudget) * 100) : 0;
  const globalOver = varBudget > 0 && varTotal > varBudget;
  const globalWarn = varBudget > 0 && globalPct >= 80 && !globalOver;

  const activeCats = categories.filter(
    c => spending[c] > 0 || budgets.find(b => b.category === c)
  );

  async function handleSaveGlobal() {
    const val = parseFloat(editVal);
    const v = isNaN(val) ? 0 : Math.max(0, val);
    await saveMonthConfig(year, month, v);
    onVarBudgetChange(v);
    setEditingCat(null);
  }

  async function handleSaveCat(cat: Category) {
    const val = parseFloat(editVal);
    const budget = isNaN(val) ? 0 : Math.max(0, val);
    await saveCategoryBudget(year, month, cat, budget);
    const next = budgets.filter(b => b.category !== cat);
    if (budget > 0) next.push({ category: cat, budget });
    onChange(next);
    setPendingCat(null);
    setEditingCat(null);
  }

  function startEdit(key: Category | "global", currentVal: number) {
    if (disabled) {
      toast("Tu prueba ha terminado. Activa un plan para continuar.", "info");
      return;
    }
    setEditingCat(key);
    setEditVal(currentVal > 0 ? String(currentVal) : "");
  }

  const definedCount = budgets.length + (varBudget > 0 ? 1 : 0);

  const collapseHeight = measured
    ? open ? naturalHeight + "px" : "0px"
    : open ? "auto" : "0px";

  return (
    <div className="card mb-4 mt-4" data-tour="budget-panel" style={cfg ? { background: cfg.cardBg, borderColor: cfg.cardBorder } : undefined}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <button
        type="button" onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-4
          hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors
          border-b border-neutral-100 dark:border-neutral-800"
        style={cfg ? { borderColor: cfg.rowBorder } : undefined}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-red" />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200" style={cfg ? { color: cfg.titleColor } : undefined}>Presupuestos</span>
          {definedCount > 0 && (
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600
              bg-neutral-100 dark:bg-neutral-800 rounded-full px-1.5 py-0.5 leading-none">
              {definedCount}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-neutral-300 dark:text-neutral-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Animated collapse wrapper */}
      <div
        style={{
          height: collapseHeight,
          overflow: "hidden",
          transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div ref={innerRef}>
          {/* ── Global monthly budget ──────────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Presupuesto mensual de gastos variables
              </span>
              <button
                onClick={() => startEdit("global", varBudget)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg
                  text-brand-blue bg-brand-blue-light dark:bg-blue-950/60
                  hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors
                  ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {varBudget > 0 ? <><EditIcon />{" "}Editar</> : <><PlusSmIcon />{" "}Definir</>}
              </button>
            </div>

            {editingCat === "global" ? (
              <div className="flex items-center gap-2 mt-1">
                <TextInput
                  type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                  placeholder="Presupuesto total €" className="flex-1" autoFocus min="0" step="10"
                  onKeyDown={e => { if (e.key === "Enter") handleSaveGlobal(); if (e.key === "Escape") setEditingCat(null); }}
                />
                <SaveButton onClick={handleSaveGlobal} />
                <GhostButton onClick={() => setEditingCat(null)}>✕</GhostButton>
              </div>
            ) : varBudget > 0 ? (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs ${globalOver ? "text-brand-red" : globalWarn ? "text-brand-amber" : "text-brand-green"} font-medium`}>
                    {fmtEur(varTotal)} gastado de {fmtEur(varBudget)}
                  </span>
                  <span className={`text-xs font-medium ${globalOver ? "text-brand-red" : globalWarn ? "text-brand-amber" : "text-brand-green"}`}>
                    {globalPct}%
                  </span>
                </div>
                <Bar pct={globalPct} over={globalOver} warn={globalWarn} />
                {globalOver && (
                  <p className="text-[11px] text-brand-red mt-1">
                    +{fmtEur(varTotal - varBudget)} sobre el presupuesto
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                Sin presupuesto definido — pulsa Definir para añadir uno
              </p>
            )}
          </div>

          {/* ── Per-category budgets ───────────────────────────────────────── */}
          {(activeCats.length > 0 || pendingCat !== null) && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {(pendingCat && !activeCats.includes(pendingCat)
                ? [...activeCats, pendingCat]
                : activeCats
              ).map(cat => {
                const spent       = spending[cat] || 0;
                const budgetEntry = budgets.find(b => b.category === cat);
                const budget      = budgetEntry?.budget || 0;
                const pct         = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                const over        = budget > 0 && spent > budget;
                const warn        = budget > 0 && pct >= 80 && !over;
                const catColor    = CAT_COLORS[cat] || { dot: "#A8A49E", text: "#7A7770" };
                const isEd        = editingCat === cat;

                return (
                  <div key={cat} className="px-4 py-2.5">
                    {isEd ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor.dot }} />
                        <span className="text-xs font-medium flex-1" style={{ color: catColor.text }}>{cat}</span>
                        <TextInput
                          type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                          placeholder="Límite €" className="w-28" autoFocus min="0" step="1"
                          onKeyDown={e => { if (e.key === "Enter") handleSaveCat(cat); if (e.key === "Escape") setEditingCat(null); }}
                        />
                        <SaveButton onClick={() => handleSaveCat(cat)} />
                        <GhostButton onClick={() => { setEditingCat(null); setPendingCat(null); }}>✕</GhostButton>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor.dot }} />
                          <span className="text-xs font-medium flex-1" style={{ color: catColor.text }}>{cat}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {fmtEur(spent)}
                            {budget > 0 && <span className="text-neutral-400 dark:text-neutral-600"> / {fmtEur(budget)}</span>}
                          </span>
                          {budget > 0 && (
                            <span className={`text-[10px] font-medium w-8 text-right ${over ? "text-brand-red" : warn ? "text-brand-amber" : "text-brand-green"}`}>
                              {pct}%
                            </span>
                          )}
                          <button
                            onClick={() => startEdit(cat, budget)}
                            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ml-1 shrink-0
                              ${disabled ? "opacity-40 cursor-not-allowed" : ""}
                              ${budget > 0
                                ? "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                : "text-brand-blue bg-brand-blue-light dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                              }`}
                            title={disabled ? "No disponible" : budget > 0 ? "Editar límite" : "Añadir límite"}
                          >
                            {budget > 0 ? <><PencilIcon />{" "}Editar</> : <>+ límite</>}
                          </button>
                        </div>
                        {budget > 0 && <Bar pct={pct} over={over} warn={warn} />}
                        {over && (
                          <p className="text-[10px] text-brand-red mt-0.5">
                            +{fmtEur(spent - budget)} sobre el límite
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add category not yet visible ──────────────────────────────── */}
          {categories.filter(c => !activeCats.includes(c) && c !== pendingCat).length > 0 && (
            <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
              <select
                className={`input-base text-xs w-full ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                value=""
                disabled={disabled}
                onChange={e => {
                  if (disabled) {
                    toast("Tu prueba ha terminado. Activa un plan para continuar.", "info");
                    return;
                  }
                  if (e.target.value) {
                    setPendingCat(e.target.value as Category);
                    startEdit(e.target.value as Category, 0);
                  }
                }}
              >
                <option value="">+ Añadir límite a otra categoría...</option>
                {categories.filter(c => !activeCats.includes(c) && c !== pendingCat).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PencilIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function EditIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function PlusSmIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
