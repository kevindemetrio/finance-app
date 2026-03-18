"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Goal, createGoal, deleteGoal, loadGoals, updateGoalSaved, fmtEur, todayStr } from "../lib/data";
import { createClient } from "../lib/supabase/client";
import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { ThemeToggle } from "../components/ThemeProvider";
import { GhostButton, IconButton, PrimaryButton, SaveButton, TextInput } from "../components/ui";

const GOAL_COLORS = ["#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30"];

export default function MetasPage() {
  const router = useRouter();
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState<Record<string, string>>({});

  const [newName, setNewName]     = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDate, setNewDate]     = useState("");
  const [newColor, setNewColor]   = useState(GOAL_COLORS[0]);

  useEffect(() => { loadGoals().then(g => { setGoals(g); setLoading(false); }); }, []);

  async function handleCreate() {
    if (!newName.trim() || !newTarget) return;
    await createGoal(newName.trim(), parseFloat(newTarget), newDate || undefined, newColor);
    setNewName(""); setNewTarget(""); setNewDate(""); setNewColor(GOAL_COLORS[0]); setAdding(false);
    loadGoals().then(setGoals);
  }

  async function handleAddSaved(goal: Goal) {
    const a = parseFloat(addAmount[goal.id] || "0");
    if (isNaN(a) || a === 0) return;
    await updateGoalSaved(goal.id, goal.savedAmount + a);
    setAddAmount(p => ({ ...p, [goal.id]: "" }));
    setEditingId(null);
    loadGoals().then(setGoals);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta meta?")) return;
    await deleteGoal(id);
    loadGoals().then(setGoals);
  }

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/auth/login"); router.refresh();
  }

  return (
    <SeasonWrapper>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Metas</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Summary */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="metric-card"><p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Metas activas</p><p className="text-base font-medium">{goals.filter(g => g.savedAmount < g.targetAmount).length}</p></div>
            <div className="metric-card"><p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Completadas</p><p className="text-base font-medium text-brand-green">{goals.filter(g => g.savedAmount >= g.targetAmount).length}</p></div>
            <div className="metric-card"><p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Total objetivo</p><p className="text-base font-medium">{fmtEur(goals.reduce((a,g)=>a+g.targetAmount,0))}</p></div>
          </div>
        )}

        {/* Add new goal form */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Metas de ahorro</h2>
          <PrimaryButton onClick={() => setAdding(a => !a)}>+ Nueva meta</PrimaryButton>
        </div>

        {adding && (
          <div className="card p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Nombre</label>
                <TextInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Vacaciones, coche..." className="w-full" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Objetivo €</label>
                <TextInput type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="5000" className="w-full" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Fecha límite (opcional)</label>
                <TextInput type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Color</label>
                <div className="flex gap-2 mt-1">
                  {GOAL_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-offset-2 ring-neutral-400" : ""}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <SaveButton onClick={handleCreate}>Crear meta</SaveButton>
              <GhostButton onClick={() => setAdding(false)}>Cancelar</GhostButton>
            </div>
          </div>
        )}

        {/* Goals list */}
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="card h-24 animate-pulse bg-neutral-100 dark:bg-neutral-800" />)}</div>
        ) : goals.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-neutral-400 text-sm">No tienes metas todavía</p>
            <p className="text-neutral-300 dark:text-neutral-600 text-xs mt-1">Crea tu primera meta de ahorro</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const pct = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
              const done = goal.savedAmount >= goal.targetAmount;
              const remaining = goal.targetAmount - goal.savedAmount;
              return (
                <div key={goal.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: goal.color }} />
                      <div>
                        <p className="text-sm font-medium">{goal.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {fmtEur(goal.savedAmount)} de {fmtEur(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: goal.color }}>{pct}%</span>
                      <IconButton onClick={() => setEditingId(editingId === goal.id ? null : goal.id)}>
                        <PlusIcon />
                      </IconButton>
                      <IconButton danger onClick={() => handleDelete(goal.id)}>
                        <XIcon />
                      </IconButton>
                    </div>
                  </div>

                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: goal.color }} />
                  </div>

                  <div className="flex justify-between text-xs text-neutral-400 mb-2">
                    {done
                      ? <span style={{ color: goal.color }} className="font-medium">✓ Meta completada</span>
                      : <span>Faltan {fmtEur(remaining)}</span>}
                    {goal.deadline && <span>Objetivo: {new Date(goal.deadline).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</span>}
                  </div>

                  {editingId === goal.id && (
                    <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                      <TextInput
                        type="number" placeholder="Añadir € guardados" step="0.01"
                        value={addAmount[goal.id] || ""}
                        onChange={e => setAddAmount(p => ({ ...p, [goal.id]: e.target.value }))}
                        className="flex-1"
                      />
                      <SaveButton onClick={() => handleAddSaved(goal)}>Guardar</SaveButton>
                      <GhostButton onClick={() => setEditingId(null)}>✕</GhostButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SeasonWrapper>
  );
}

function LogoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
