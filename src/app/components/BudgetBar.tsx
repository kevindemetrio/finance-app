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

  // Compact button to sit inline next to "Añadir"
  if (editing) {
    return (
      <div className="flex gap-2 items-center">
        <TextInput
          type="number" value={value} onChange={e => setValue(e.target.value)}
          placeholder="Budget €" className="w-28" autoFocus
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        />
        <SaveButton onClick={handleSave} />
        <GhostButton onClick={() => setEditing(false)}>✕</GhostButton>
      </div>
    );
  }

  return (
    <>
      {/* Inline button — sits next to "Añadir" in the action bar */}
      <button
        type="button"
        onClick={() => { setValue(String(budget)); setEditing(true); }}
        className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border transition-colors
          ${budget > 0
            ? `${textColor} border-current hover:opacity-80`
            : "text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:text-neutral-600 dark:hover:text-neutral-300"
          }`}
      >
        <BudgetIcon />
        {budget > 0 ? `${pct}% · ${fmtEur(spent)} / ${fmtEur(budget)}` : "Presupuesto"}
      </button>

      {/* Progress bar below entries — only when budget is set */}
      {budget > 0 && (
        <div className="px-4 pt-1 pb-2">
          <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </>
  );
}

function BudgetIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}
