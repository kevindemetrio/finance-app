"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Goal, createGoal, deleteGoal, loadGoals, updateGoal, fmtEur, getAvgMonthlySavings } from "../lib/data";
import { createClient } from "../lib/supabase/client";
import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { ThemeToggle } from "../components/ThemeProvider";
import { toast, confirm } from "../components/Toast";
import { GhostButton, IconButton, PrimaryButton, SaveButton, TextInput } from "../components/ui";

const GOAL_COLORS = ["#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30"];

type EditMode = "add_saved" | "edit_goal";

export default function MetasPage() {
  const router = useRouter();
  const [goals, setGoals]     = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgSavings, setAvgSavings] = useState(0);
  const [adding, setAdding]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editMode, setEditMode]       = useState<EditMode>("add_saved");
  const [addAmount, setAddAmount]     = useState<Record<string, string>>({});

  // New goal fields
  const [newName, setNewName]     = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDate, setNewDate]     = useState("");
  const [newColor, setNewColor]   = useState(GOAL_COLORS[0]);

  // Edit goal fields
  const [editName, setEditName]     = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDate, setEditDate]     = useState("");

  const reload = useCallback(() => loadGoals().then(setGoals), []);

  useEffect(() => {
    reload().then(() => setLoading(false));
    getAvgMonthlySavings().then(setAvgSavings);
  }, [reload]);

  async function handleCreate() {
    if (!newName.trim() || !newTarget) return;
    await createGoal(newName.trim(), parseFloat(newTarget), newDate || undefined, newColor);
    setNewName(""); setNewTarget(""); setNewDate(""); setNewColor(GOAL_COLORS[0]); setAdding(false);
    toast("Meta creada");
    reload();
  }

  async function handleAddSaved(goal: Goal) {
    const a = parseFloat(addAmount[goal.id] || "0");
    if (isNaN(a) || a === 0) return;
    await updateGoal(goal.id, { savedAmount: goal.savedAmount + a });
    setAddAmount(p => ({ ...p, [goal.id]: "" }));
    setEditingId(null);
    toast("Ahorro registrado");
    reload();
  }

  async function handleSaveGoalEdit(goal: Goal) {
    const target = parseFloat(editTarget);
    if (!editName.trim() || isNaN(target) || target <= 0) return;
    await updateGoal(goal.id, {
      name: editName.trim(),
      targetAmount: target,
      deadline: editDate || undefined,
    });
    setEditingId(null);
    toast("Meta actualizada");
    reload();
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: "¿Eliminar esta meta?", message: "No se puede deshacer.", danger: true });
    if (!ok) return;
    await deleteGoal(id);
    toast("Meta eliminada", "info");
    reload();
  }

  function openEdit(goal: Goal, mode: EditMode) {
    setEditingId(goal.id);
    setEditMode(mode);
    if (mode === "edit_goal") {
      setEditName(goal.name);
      setEditTarget(String(goal.targetAmount));
      setEditDate(goal.deadline ?? "");
    }
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

        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="metric-card"><p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Activas</p><p className="text-base font-medium">{goals.filter(g => g.savedAmount < g.targetAmount).length}</p></div>
            <div className="metric-card"><p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Completadas</p><p className="text-base font-medium text-brand-green">{goals.filter(g => g.savedAmount >= g.targetAmount).length}</p></div>
            <div className="metric-card"><p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Total objetivo</p><p className="text-base font-medium">{fmtEur(goals.reduce((a,g)=>a+g.targetAmount,0))}</p></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Metas de ahorro</h2>
          <PrimaryButton onClick={() => setAdding(a => !a)}>+ Nueva meta</PrimaryButton>
        </div>

        {adding && (
          <div className="card p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Nombre</label>
                <TextInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Vacaciones..." className="w-full" />
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
                <div className="flex gap-2 flex-wrap pt-1">
                  {GOAL_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className="w-6 h-6 rounded-full transition-transform"
                      style={{ background: c, outline: newColor === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setAdding(false)}>Cancelar</GhostButton>
              <SaveButton onClick={handleCreate}>Crear meta</SaveButton>
            </div>
          </div>
        )}

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
              const pct  = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
              const done = goal.savedAmount >= goal.targetAmount;
              return (
                <div key={goal.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: goal.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{goal.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {fmtEur(goal.savedAmount)} de {fmtEur(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-base font-bold mr-1" style={{ color: goal.color }}>{pct}%</span>
                      <IconButton onClick={() => openEdit(goal, "add_saved")} title="Añadir ahorro"><PlusIcon /></IconButton>
                      <IconButton onClick={() => openEdit(goal, "edit_goal")} title="Editar meta"><PencilIcon /></IconButton>
                      <IconButton danger onClick={() => handleDelete(goal.id)}><XIcon /></IconButton>
                    </div>
                  </div>

                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: goal.color }} />
                  </div>

                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    {done
                      ? <span style={{ color: goal.color }} className="font-medium">✓ Meta completada</span>
                      : <span>Faltan {fmtEur(goal.targetAmount - goal.savedAmount)}</span>}
                    {goal.deadline && <span>Límite: {new Date(goal.deadline).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</span>}
                  </div>
                  {!done && avgSavings > 0 && (() => {
                    const remaining = goal.targetAmount - goal.savedAmount;
                    const months = Math.ceil(remaining / avgSavings);
                    const arrival = new Date();
                    arrival.setMonth(arrival.getMonth() + months);
                    const label = arrival.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
                    return (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        A este ritmo, en <span className="font-medium" style={{ color: goal.color }}>{label}</span> ({months} mes{months !== 1 ? "es" : ""})
                      </p>
                    );
                  })()}

                  {editingId === goal.id && editMode === "add_saved" && (
                    <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                      <TextInput type="number" placeholder="Añadir € guardados" step="0.01"
                        value={addAmount[goal.id] || ""}
                        onChange={e => setAddAmount(p => ({ ...p, [goal.id]: e.target.value }))}
                        className="flex-1" autoFocus
                        onKeyDown={e => e.key === "Enter" && handleAddSaved(goal)}
                      />
                      <SaveButton onClick={() => handleAddSaved(goal)} />
                      <GhostButton onClick={() => setEditingId(null)}>✕</GhostButton>
                    </div>
                  )}

                  {editingId === goal.id && editMode === "edit_goal" && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" autoFocus />
                        <TextInput type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} placeholder="Objetivo €" />
                      </div>
                      <div className="flex gap-2">
                        <TextInput type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="flex-1" />
                        <SaveButton onClick={() => handleSaveGoalEdit(goal)} />
                        <GhostButton onClick={() => setEditingId(null)}>✕</GhostButton>
                      </div>
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

function LogoutIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function PencilIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function XIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
