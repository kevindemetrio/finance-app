"use client";

import { useState } from "react";
import { fmtEur } from "../lib/data";
import { GhostButton, SaveButton, TextInput } from "./ui";

interface Props {
  budget: number;
  spent: number;
  onSave: (value: number) => void;
}

export function BudgetBar({ budget, spent, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(budget));

  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const over = budget > 0 && spent > budget;
  const barColor = over ? "bg-brand-red" : pct > 80 ? "bg-brand-amber" : "bg-brand-green";
  const textColor = over ? "text-brand-red" : pct > 80 ? "text-brand-amber" : "text-brand-green";

  function handleSave() {
    const v = parseFloat(value);
    if (isNaN(v) || v < 0) return;
    onSave(v);
    setEditing(false);
  }

  return (
    <>
      {budget > 0 && !editing && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex justify-between text-[12px] text-neutral-400 dark:text-neutral-500 mb-1">
            <span>{over ? "Pasado del presupuesto" : "Presupuesto mensual"}</span>
            <span className={`font-medium ${textColor}`}>
              {pct}% · {fmtEur(spent)} / {fmtEur(budget)}
            </span>
          </div>
          <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {editing ? (
        <div className="flex gap-2 items-center px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <span className="text-sm text-neutral-500 dark:text-neutral-400 flex-1">Budget mensual</span>
          <TextInput type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="€" className="w-32" autoFocus />
          <SaveButton onClick={handleSave} />
          <GhostButton onClick={() => setEditing(false)}>✕</GhostButton>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setValue(String(budget)); setEditing(true); }}
          className="text-[12px] text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400
            px-4 py-1.5 border-b border-neutral-100 dark:border-neutral-800 w-full text-left transition-colors"
        >
          {budget > 0 ? "Editar presupuesto" : "⊙ Definir presupuesto mensual"}
        </button>
      )}
    </>
  );
}
