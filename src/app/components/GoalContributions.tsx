"use client";

import { useEffect, useState } from "react";
import {
  GoalContribution,
  loadGoalContributions,
  addGoalContribution,
  deleteGoalContribution,
  todayStr,
  fmtEur,
} from "../lib/data";
import { confirm } from "./Toast";
import { GhostButton, IconButton, SaveButton, TextInput } from "./ui";

interface Props {
  goalId: string;
  goalColor: string;
  onSavedAmountChange: () => void;
}

export function GoalContributions({ goalId, goalColor, onSavedAmountChange }: Props) {
  const lsKey = `goal_contrib_open_${goalId}`;
  const [open, setOpen] = useState(false);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}
  }, [lsKey]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadGoalContributions(goalId).then(c => { setContributions(c); setLoading(false); });
  }, [open, goalId]);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  async function handleAdd() {
    const a = parseFloat(amount);
    if (isNaN(a) || a === 0) return;
    await addGoalContribution(goalId, a, date, notes.trim() || undefined);
    setAmount(""); setDate(todayStr()); setNotes(""); setAdding(false);
    loadGoalContributions(goalId).then(setContributions);
    onSavedAmountChange();
  }

  async function handleDelete(c: GoalContribution) {
    const ok = await confirm({ title: "¿Eliminar aportación?", message: `−${fmtEur(c.amount)} del ${c.date}`, danger: true });
    if (!ok) return;
    await deleteGoalContribution(c.id, c.amount, goalId);
    loadGoalContributions(goalId).then(setContributions);
    onSavedAmountChange();
  }

  const total = contributions.reduce((a, c) => a + c.amount, 0);

  return (
    <div className="border-t border-neutral-100 dark:border-neutral-800 mt-2">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-1 py-2 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <svg className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          Aportaciones {contributions.length > 0 && `· ${contributions.length}`}
        </span>
        {contributions.length > 0 && (
          <span className="font-medium tabular-nums" style={{ color: goalColor }}>{fmtEur(total)}</span>
        )}
      </button>

      {open && (
        <div className="pb-2 space-y-1">
          {loading ? (
            <p className="text-xs text-neutral-400 px-1 py-2">Cargando...</p>
          ) : contributions.length === 0 && !adding ? (
            <p className="text-xs text-neutral-400 px-1 py-1">Sin aportaciones registradas</p>
          ) : (
            contributions.sort((a, b) => b.date.localeCompare(a.date)).map(c => (
              <div key={c.id} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 group">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: goalColor }} />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{c.date.split("-").reverse().slice(0,2).join("/")}</span>
                <span className="text-xs font-medium flex-1 truncate" style={{ color: goalColor }}>+{fmtEur(c.amount)}</span>
                {c.notes && <span className="text-[11px] text-neutral-400 italic truncate max-w-[100px]">{c.notes}</span>}
                <IconButton danger onClick={() => handleDelete(c)}><XIcon /></IconButton>
              </div>
            ))
          )}

          {adding ? (
            <div className="flex flex-wrap gap-2 pt-1 px-1">
              <TextInput
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="€" className="w-20"
                autoFocus onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
              <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-32" />
              <TextInput value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota (opcional)" className="flex-1 min-w-[100px]" />
              <SaveButton onClick={handleAdd} />
              <GhostButton onClick={() => { setAdding(false); setAmount(""); setDate(todayStr()); setNotes(""); }}>✕</GhostButton>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="text-xs px-1 py-1 transition-colors"
              style={{ color: goalColor }}
            >
              + Registrar aportación
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function XIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
