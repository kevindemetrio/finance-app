"use client";

import { useEffect, useState } from "react";
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
  const lsKey = `section_open_inv_${category}`;
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}
  }, [lsKey]);
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
      {/* Category header — matching Section.tsx style */}
      <button
        type="button"
        onClick={() => setOpen(o => { const next = !o; try { localStorage.setItem(lsKey, String(next)); } catch {} return next; })}
        className="w-full flex items-center justify-between px-4 py-4
          hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors
          border-b border-neutral-100 dark:border-neutral-800"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            {CATEGORY_LABELS[category]}
          </span>
          {investments.length > 0 && (
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600
              bg-neutral-100 dark:bg-neutral-800 rounded-full px-1.5 py-0.5 leading-none">
              {investments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${colors.text}`}>{fmtEur(total)}</span>
          <svg
            className={`w-4 h-4 text-neutral-300 dark:text-neutral-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
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
            <div className="flex flex-wrap gap-2 px-2 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
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
              className="w-full flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm font-medium
                text-brand-blue bg-brand-blue-light dark:bg-blue-950/60
                hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva posición
            </button>
          )}
        </div>
      )}
    </div>
  );
}
