"use client";

import { useEffect, useState } from "react";
import { Category, CATEGORIES, CategoryBudget, Entry, fmtEur, saveCategoryBudget, saveMonthConfig } from "../lib/data";
import { GhostButton, SaveButton, TextInput } from "./ui";

interface Props {
  year: number;
  month: number;
  varExpenses: Entry[];
  budgets: CategoryBudget[];
  varBudget: number;
  onChange: (updated: CategoryBudget[]) => void;
  onVarBudgetChange: (v: number) => void;
}

const CAT_COLORS: Record<string, string> = {
  "Alimentación": "#0F6E56", "Ocio": "#A32D2D", "Tecnología": "#3B6D11",
  "Transporte": "#185FA5", "Hogar": "#185FA5",  "Salud": "#0F6E56",
  "Ropa": "#993556",        "Regalos": "#993556", "Educación": "#3B6D11",
  "Viajes": "#854F0B",      "Otro": "#5F5E5A",
};

function Bar({ pct, over, warn }: { pct: number; over: boolean; warn: boolean }) {
  const color = over ? "bg-brand-red" : warn ? "bg-brand-amber" : "bg-brand-green";
  return (
    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export function CategoryBudgetPanel({
  year, month, varExpenses, budgets, varBudget, onChange, onVarBudgetChange,
}: Props) {
  const lsKey = "budget_panel_open";
  const [open, setOpen]             = useState(true);
  const [editingCat, setEditingCat] = useState<Category | "global" | null>(null);
  const [editVal, setEditVal]       = useState("");

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}
  }, []);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  // Spending per category
  const spending: Record<string, number> = {};
  for (const e of varExpenses) {
    const cat = e.category || "Otro";
    spending[cat] = (spending[cat] || 0) + e.amount;
  }
  const varTotal = varExpenses.reduce((a, e) => a + e.amount, 0);

  const globalPct  = varBudget > 0 ? Math.round((varTotal / varBudget) * 100) : 0;
  const globalOver = varBudget > 0 && varTotal > varBudget;
  const globalWarn = varBudget > 0 && globalPct >= 80 && !globalOver;

  // Categories with spending or a set budget
  const activeCats = CATEGORIES.filter(
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
    setEditingCat(null);
  }

  function startEdit(key: Category | "global", currentVal: number) {
    setEditingCat(key);
    setEditVal(currentVal > 0 ? String(currentVal) : "");
  }

  // Summary for collapsed header
  const definedCount = budgets.length + (varBudget > 0 ? 1 : 0);

  return (
    <div className="card mb-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <button
        type="button" onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3.5
          hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors
          border-b border-neutral-100 dark:border-neutral-800"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-red" />
          <span className="text-sm font-medium">Presupuestos</span>
          {definedCount > 0 && (
            <span className="text-xs text-neutral-400 dark:text-neutral-600">
              {definedCount} definido{definedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <>
          {/* ── Global monthly budget ──────────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Presupuesto mensual de gastos variables
              </span>
              <button
                onClick={() => startEdit("global", varBudget)}
                className="text-xs text-brand-blue hover:underline transition-colors"
              >
                {varBudget > 0 ? "Editar" : "Definir"}
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
          {activeCats.length > 0 && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {activeCats.map(cat => {
                const spent  = spending[cat] || 0;
                const budgetEntry = budgets.find(b => b.category === cat);
                const budget = budgetEntry?.budget || 0;
                const pct    = budget > 0 ? Math.round((spent / budget) * 100) : 0;
                const over   = budget > 0 && spent > budget;
                const warn   = budget > 0 && pct >= 80 && !over;
                const accent = CAT_COLORS[cat] || "#5F5E5A";
                const isEd   = editingCat === cat;

                return (
                  <div key={cat} className="px-4 py-2.5">
                    {isEd ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium flex-1" style={{ color: accent }}>{cat}</span>
                        <TextInput
                          type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                          placeholder="Límite €" className="w-28" autoFocus min="0" step="1"
                          onKeyDown={e => { if (e.key === "Enter") handleSaveCat(cat); if (e.key === "Escape") setEditingCat(null); }}
                        />
                        <SaveButton onClick={() => handleSaveCat(cat)} />
                        <GhostButton onClick={() => setEditingCat(null)}>✕</GhostButton>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium flex-1" style={{ color: accent }}>{cat}</span>
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
                            className="text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors ml-1 shrink-0"
                            title={budget > 0 ? "Editar límite" : "Añadir límite"}
                          >
                            {budget > 0
                              ? <PencilIcon />
                              : <span className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5 whitespace-nowrap">+ límite</span>
                            }
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
          {CATEGORIES.filter(c => !activeCats.includes(c)).length > 0 && (
            <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
              <select
                className="input-base text-xs w-full"
                value=""
                onChange={e => { if (e.target.value) startEdit(e.target.value as Category, 0); }}
              >
                <option value="">+ Añadir límite a otra categoría...</option>
                {CATEGORIES.filter(c => !activeCats.includes(c)).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PencilIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
