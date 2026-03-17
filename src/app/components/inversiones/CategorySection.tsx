"use client";

import { useState } from "react";
import {
  Investment, InvestmentCategory, CATEGORY_LABELS, CATEGORY_COLORS,
  totalContributions, createInvestment,
} from "../../lib/investments";
import { fmtEur } from "../../lib/data";
import { InvestmentCard } from "./InvestmentCard";
import { GhostButton, SaveButton, TextInput } from "../ui";

interface Props {
  category: InvestmentCategory;
  investments: Investment[];
  onChange: () => void;
}

export function CategorySection({ category, investments, onChange }: Props) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsin, setNewIsin] = useState("");
  const [saving, setSaving] = useState(false);

  const colors = CATEGORY_COLORS[category];
  const total = investments.reduce((a, inv) => a + totalContributions(inv), 0);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    await createInvestment(category, newName.trim(), newIsin.trim() || undefined);
    setNewName("");
    setNewIsin("");
    setAdding(false);
    setSaving(false);
    onChange();
  }

  return (
    <div className="card overflow-visible">
      {/* Category header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4
          hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors
          border-b border-neutral-100 dark:border-neutral-800"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
          <span className="text-sm font-medium">{CATEGORY_LABELS[category]}</span>
          <span className="text-xs text-neutral-400 dark:text-neutral-600">
            {investments.length > 0 ? `${investments.length} posición${investments.length !== 1 ? "es" : ""}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${colors.text}`}>{fmtEur(total)}</span>
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="p-3 space-y-2">
          {/* Investment cards */}
          {investments.map((inv) => (
            <InvestmentCard key={inv.id} investment={inv} onChange={onChange} />
          ))}

          {/* Add new position */}
          {adding ? (
            <div className="flex flex-wrap gap-2 px-2 py-2">
              <TextInput
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nombre del fondo o posición"
                className="flex-1 min-w-[160px]"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                autoFocus
              />
              <TextInput
                value={newIsin}
                onChange={e => setNewIsin(e.target.value)}
                placeholder="ISIN (opcional)"
                className="w-40 font-mono"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
              <SaveButton onClick={handleAdd} disabled={saving}>
                {saving ? "..." : "Añadir"}
              </SaveButton>
              <GhostButton onClick={() => { setAdding(false); setNewName(""); setNewIsin(""); }}>✕</GhostButton>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-left px-2 py-2 text-sm text-neutral-400 dark:text-neutral-600
                hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
            >
              + Nueva posición
            </button>
          )}
        </div>
      )}
    </div>
  );
}
