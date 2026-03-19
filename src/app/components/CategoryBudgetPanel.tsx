"use client";

import { useState } from "react";
import { Category, CATEGORIES, CategoryBudget, Entry, fmtEur, saveCategoryBudget } from "../lib/data";
import { GhostButton, SaveButton, TextInput } from "./ui";

interface Props {
  year: number;
  month: number;
  varExpenses: Entry[];
  budgets: CategoryBudget[];
  onChange: (updated: CategoryBudget[]) => void;
}

const CAT_COLORS: Record<string, string> = {
  "Alimentación": "#0F6E56", "Ocio": "#A32D2D", "Tecnología": "#3B6D11",
  "Transporte": "#185FA5", "Hogar": "#185FA5", "Salud": "#0F6E56",
  "Ropa": "#993556", "Regalos": "#993556", "Educación": "#3B6D11",
  "Viajes": "#854F0B", "Otro": "#5F5E5A",
};

export function CategoryBudgetPanel({ year, month, varExpenses, budgets, onChange }: Props) {
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editVal, setEditVal] = useState("");

  // Build spending per category from current month
  const spending: Record<string, number> = {};
  for (const e of varExpenses) {
    const cat = e.category || "Otro";
    spending[cat] = (spending[cat] || 0) + e.amount;
  }

  // Only show categories that have either spending or a budget set
  const activeCats = CATEGORIES.filter(
    c => spending[c] > 0 || budgets.find(b => b.category === c)
  );

  async function handleSave(cat: Category) {
    const val = parseFloat(editVal);
    const budget = isNaN(val) ? 0 : val;
    await saveCategoryBudget(year, month, cat, budget);
    const next = budgets.filter(b => b.category !== cat);
    if (budget > 0) next.push({ category: cat, budget });
    onChange(next);
    setEditingCat(null);
  }

  if (activeCats.length === 0) return null;

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-red" />
          <span className="text-sm font-medium">Presupuesto por categoría</span>
        </div>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          {budgets.length} definido{budgets.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {activeCats.map(cat => {
          const spent = spending[cat] || 0;
          const budgetEntry = budgets.find(b => b.category === cat);
          const budget = budgetEntry?.budget || 0;
          const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
          const over = budget > 0 && spent > budget;
          const warn = budget > 0 && pct >= 80 && !over;
          const barColor = over ? "bg-brand-red" : warn ? "bg-brand-amber" : "bg-brand-green";
          const accent = CAT_COLORS[cat] || "#5F5E5A";
          const isEditing = editingCat === cat;

          return (
            <div key={cat} className="px-4 py-2.5">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm flex-1" style={{ color: accent }}>{cat}</span>
                  <TextInput
                    type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                    placeholder="Budget €" className="w-28" autoFocus min="0" step="1"
                    onKeyDown={e => { if (e.key === "Enter") handleSave(cat); if (e.key === "Escape") setEditingCat(null); }}
                  />
                  <SaveButton onClick={() => handleSave(cat)} />
                  <GhostButton onClick={() => setEditingCat(null)}>✕</GhostButton>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium flex-1" style={{ color: accent }}>{cat}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {fmtEur(spent)}
                      {budget > 0 && <span className="text-neutral-400"> / {fmtEur(budget)}</span>}
                    </span>
                    {budget > 0 && (
                      <span className={`text-[10px] font-medium ${over ? "text-brand-red" : warn ? "text-brand-amber" : "text-brand-green"}`}>
                        {pct}%
                      </span>
                    )}
                    <button
                      onClick={() => { setEditingCat(cat); setEditVal(budget > 0 ? String(budget) : ""); }}
                      className="text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors"
                      title={budget > 0 ? "Editar presupuesto" : "Definir presupuesto"}
                    >
                      {budget > 0
                        ? <PencilIcon />
                        : <span className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5">+ límite</span>
                      }
                    </button>
                  </div>
                  {budget > 0 && (
                    <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
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

      {/* Quick add for all categories */}
      <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
        <select
          className="input-base text-xs w-full"
          value=""
          onChange={e => {
            if (e.target.value) {
              setEditingCat(e.target.value as Category);
              setEditVal("");
            }
          }}
        >
          <option value="">+ Añadir límite a otra categoría...</option>
          {CATEGORIES.filter(c => !budgets.find(b => b.category === c) && !activeCats.includes(c)).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PencilIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
