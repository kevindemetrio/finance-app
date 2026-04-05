"use client";

import { useEffect, useState } from "react";
import {
  Goal, GoalContribution,
  loadGoalContributions, addGoalContribution, deleteGoalContribution,
  updateGoal, todayStr, fmtEur,
} from "../lib/data";
import { confirm, toast } from "./Toast";
import { GhostButton, IconButton, SaveButton, TextInput } from "./ui";

const GOAL_COLORS = ["#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30"];

interface Props {
  goal: Goal;
  onDelete: (id: string) => void;
  onSavedAmountChange: () => void;
  readOnly?: boolean;
}

export function GoalCard({ goal, onDelete, onSavedAmountChange, readOnly }: Props) {
  const lsKey = `goal_open_${goal.id}`;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingContrib, setAddingContrib] = useState(false);

  // Contribution state
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [loadingContribs, setLoadingContribs] = useState(false);

  // Add contribution form
  const [addAmount, setAddAmount] = useState("");
  const [addDate, setAddDate] = useState(todayStr());
  const [addNotes, setAddNotes] = useState("");

  // Edit goal form
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(String(goal.targetAmount));
  const [editDate, setEditDate] = useState(goal.deadline ?? "");
  const [editColor, setEditColor] = useState(goal.color ?? GOAL_COLORS[0]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}
  }, [lsKey]);

  useEffect(() => {
    if (!open) return;
    setLoadingContribs(true);
    loadGoalContributions(goal.id).then(c => { setContributions(c); setLoadingContribs(false); });
  }, [open, goal.id]);

  // Close edit/add forms if readOnly becomes true
  useEffect(() => {
    if (readOnly) { setEditing(false); setAddingContrib(false); }
  }, [readOnly]);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  function openEdit() {
    if (readOnly) { toast("Tu prueba ha terminado. Activa un plan para continuar.", "info"); return; }
    setEditName(goal.name);
    setEditTarget(String(goal.targetAmount));
    setEditDate(goal.deadline ?? "");
    setEditColor(goal.color ?? GOAL_COLORS[0]);
    setEditing(true);
    if (!open) {
      setOpen(true);
      try { localStorage.setItem(lsKey, "true"); } catch {}
    }
  }

  async function handleSaveEdit() {
    const target = parseFloat(editTarget);
    if (!editName.trim() || isNaN(target) || target <= 0) return;
    setSavingEdit(true);
    await updateGoal(goal.id, {
      name: editName.trim(),
      targetAmount: target,
      deadline: editDate || undefined,
      color: editColor,
    });
    setSavingEdit(false);
    setEditing(false);
    toast("Meta actualizada");
    onSavedAmountChange();
  }

  async function handleAddContribution() {
    const a = parseFloat(addAmount);
    if (isNaN(a) || a === 0) return;
    await addGoalContribution(goal.id, a, addDate, addNotes.trim() || undefined);
    setAddAmount(""); setAddDate(todayStr()); setAddNotes(""); setAddingContrib(false);
    loadGoalContributions(goal.id).then(setContributions);
    onSavedAmountChange();
    toast("Aportación registrada");
  }

  async function handleDeleteContrib(c: GoalContribution) {
    const ok = await confirm({ title: "¿Eliminar aportación?", message: `+${fmtEur(c.amount)} · ${fmt(c.date)}`, danger: true });
    if (!ok) return;
    await deleteGoalContribution(c.id, c.amount, goal.id);
    loadGoalContributions(goal.id).then(setContributions);
    onSavedAmountChange();
  }

  function handleDelete() {
    if (readOnly) { toast("Tu prueba ha terminado. Activa un plan para continuar.", "info"); return; }
    onDelete(goal.id);
  }

  function handleAddContribClick() {
    if (readOnly) { toast("Tu prueba ha terminado. Activa un plan para continuar.", "info"); return; }
    setAddingContrib(true);
  }

  const color = goal.color ?? GOAL_COLORS[0];
  const pct = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
  const done = goal.savedAmount >= goal.targetAmount;

  return (
    <div className="card overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm font-semibold truncate flex-1">{goal.name}</span>
        <span className="text-sm font-bold shrink-0 tabular-nums" style={{ color }}>
          {fmtEur(goal.savedAmount)}
        </span>
        <IconButton
          onClick={openEdit}
          title={readOnly ? "No disponible" : "Editar meta"}
          className={readOnly ? "opacity-40 cursor-not-allowed" : undefined}
        >
          <PencilIcon />
        </IconButton>
        <IconButton
          danger
          onClick={handleDelete}
          title={readOnly ? "No disponible" : "Eliminar meta"}
          className={readOnly ? "opacity-40 cursor-not-allowed" : undefined}
        >
          <XIcon />
        </IconButton>
      </div>

      {/* ── Progress — siempre visible ──────────────────────────────────── */}
      <div className="px-4 pb-3">
        <div className="h-2 rounded-full overflow-hidden mb-1.5"
             style={{ backgroundColor: `${color}20` }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
            {done
              ? <span className="font-semibold" style={{ color }}>✓ Completada</span>
              : <>Faltan {fmtEur(goal.targetAmount - goal.savedAmount)}</>}
          </span>
          <div className="flex items-center gap-2">
            {goal.deadline && (
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                {new Date(goal.deadline).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
              </span>
            )}
            <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
            <button
              type="button"
              onClick={toggle}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-300 dark:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={open ? "Cerrar" : "Ver aportaciones"}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-100 dark:border-neutral-800">

          {/* ── Edit form ──────────────────────────────────────────────── */}
          {editing && !readOnly && (
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800 space-y-2">
              <p className="text-xs font-medium text-brand-blue mb-1">Editar meta</p>
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" autoFocus className="col-span-2" />
                <TextInput type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} placeholder="Objetivo €" />
                <TextInput type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div className="flex gap-1.5 pt-0.5">
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setEditColor(c)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, outline: editColor === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <GhostButton onClick={() => setEditing(false)}>Cancelar</GhostButton>
                <SaveButton onClick={handleSaveEdit} disabled={savingEdit} />
              </div>
            </div>
          )}

          {/* ── Add contribution ──────────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            {!addingContrib ? (
              <button
                onClick={handleAddContribClick}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors text-white
                  ${readOnly ? "opacity-40 cursor-not-allowed" : ""}`}
                style={{ background: color }}
              >
                + Añadir aportación
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Registrar aportación
                </p>
                <div className="flex flex-wrap gap-2">
                  <TextInput
                    type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                    placeholder="€" className="w-20" step="0.01" min="0" autoFocus
                    onKeyDown={e => e.key === "Enter" && handleAddContribution()}
                  />
                  <TextInput
                    type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                    className="w-34"
                  />
                  <TextInput
                    value={addNotes} onChange={e => setAddNotes(e.target.value)}
                    placeholder="Nota (opcional)" className="flex-1 min-w-[100px]"
                    onKeyDown={e => e.key === "Enter" && handleAddContribution()}
                  />
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => { setAddingContrib(false); setAddAmount(""); setAddDate(todayStr()); setAddNotes(""); }}>
                    Cancelar
                  </GhostButton>
                  <button
                    onClick={handleAddContribution}
                    disabled={!addAmount || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) === 0}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors text-white disabled:opacity-40"
                    style={{ background: color }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Contributions list ─────────────────────────────────────── */}
          <div className="px-4 py-2 pb-3">
            {loadingContribs ? (
              <p className="text-xs text-neutral-400 py-2">Cargando...</p>
            ) : contributions.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-600 italic py-2">Sin aportaciones aún</p>
            ) : (
              <div className="space-y-0.5">
                {[...contributions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(c => (
                    <div key={c.id} className="flex items-center gap-2 py-1.5 group">
                      <span className="text-xs text-neutral-400 tabular-nums shrink-0 w-10">{fmt(c.date)}</span>
                      <span className="flex-1 text-xs text-neutral-400 dark:text-neutral-500 italic truncate">
                        {c.notes ?? ""}
                      </span>
                      <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color }}>
                        +{fmtEur(c.amount)}
                      </span>
                      {!readOnly && (
                        <IconButton danger onClick={() => handleDeleteContrib(c)}>
                          <XSmIcon />
                        </IconButton>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function fmt(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function XSmIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
