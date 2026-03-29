"use client";

import { useEffect, useState, useCallback } from "react";
import { Goal, createGoal, deleteGoal, loadGoals, fmtEur } from "../lib/data";
import { createClient } from "../lib/supabase/client";

import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { ThemeToggle } from "../components/ThemeProvider";
import { toast, confirm } from "../components/Toast";
import { GhostButton, PrimaryButton, SaveButton, TextInput } from "../components/ui";
import { SettingsPanel } from "../components/SettingsPanel";
import { GoalCard } from "../components/GoalCard";
import { useUserSettings } from "../lib/userSettings";

const GOAL_COLORS = ["#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30"];
const GOALS_ORDER_KEY = "finanzas_goals_order";

export default function MetasPage() {
  const [goals, setGoals]     = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [userEmail, setUserEmail]   = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { settings, update: updateSettings } = useUserSettings();

  // New goal form
  const [newName, setNewName]     = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDate, setNewDate]     = useState("");
  const [newColor, setNewColor]   = useState(GOAL_COLORS[0]);

  const [goalOrder, setGoalOrder] = useState<string[]>([]);

  const reload = useCallback(() => loadGoals().then(g => {
    setGoals(g);
    setGoalOrder(prev => {
      const existing = new Set(prev);
      const newIds = g.map(x => x.id).filter(id => !existing.has(id));
      return [...prev.filter(id => g.some(x => x.id === id)), ...newIds];
    });
  }), []);

  useEffect(() => {
    const saved = localStorage.getItem(GOALS_ORDER_KEY);
    if (saved) { try { setGoalOrder(JSON.parse(saved)); } catch {} }
    reload().then(() => setLoading(false));
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, [reload]);

  function saveGoalOrder(order: string[]) {
    setGoalOrder(order);
    try { localStorage.setItem(GOALS_ORDER_KEY, JSON.stringify(order)); } catch {}
  }

  function moveGoal(id: string, dir: -1 | 1) {
    setGoalOrder(prev => {
      const order = [...prev];
      const i = order.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      try { localStorage.setItem(GOALS_ORDER_KEY, JSON.stringify(order)); } catch {}
      return order;
    });
  }

  async function handleCreate() {
    if (!newName.trim() || !newTarget) return;
    await createGoal(newName.trim(), parseFloat(newTarget), newDate || undefined, newColor);
    setNewName(""); setNewTarget(""); setNewDate(""); setNewColor(GOAL_COLORS[0]); setAdding(false);
    toast("Meta creada");
    reload();
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: "¿Eliminar esta meta?", message: "No se puede deshacer.", danger: true });
    if (!ok) return;
    await deleteGoal(id);
    saveGoalOrder(goalOrder.filter(x => x !== id));
    toast("Meta eliminada", "info");
    reload();
  }

  const sortedGoals = [...goals].sort((a, b) => {
    const ai = goalOrder.indexOf(a.id);
    const bi = goalOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <SeasonWrapper>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Metas</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="relative" onMouseDown={e => e.stopPropagation()}>
              <button
                onClick={() => setShowSettings(v => !v)}
                title="Ajustes"
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors
                  ${showSettings
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                <GearIcon />
              </button>
              {showSettings && (
                <SettingsPanel
                  userEmail={userEmail}
                  settings={settings}
                  onUpdate={updateSettings}
                  hideFinanceSettings
                  pageOrder={{
                    title: "Orden de metas",
                    items: sortedGoals.map(g => ({ id: g.id, label: g.name, color: g.color ?? undefined })),
                    onMove: moveGoal,
                  }}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <div className="metric-card border-l-[3px] border-l-brand-blue">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5 font-bold">Activas</p>
              <p className="text-base font-bold">{goals.filter(g => g.savedAmount < g.targetAmount).length}</p>
            </div>
            <div className="metric-card border-l-[3px] border-l-brand-green">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5 font-bold">Completadas</p>
              <p className="text-base font-bold text-brand-green">{goals.filter(g => g.savedAmount >= g.targetAmount).length}</p>
            </div>
            <div className="metric-card border-l-[3px] border-l-brand-amber">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5 font-bold">Total objetivo</p>
              <p className="text-base font-bold">{fmtEur(goals.reduce((a,g)=>a+g.targetAmount,0))}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Metas de ahorro</h2>
          <PrimaryButton onClick={() => setAdding(a => !a)}>+ Nueva meta</PrimaryButton>
        </div>

        {adding && (
          <div className="card p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Nombre</label>
                <TextInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Vacaciones..." className="w-full" autoFocus />
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
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
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
          <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="card h-14 animate-pulse bg-neutral-100 dark:bg-neutral-800" />)}</div>
        ) : goals.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-neutral-400 text-sm">No tienes metas todavía</p>
            <p className="text-neutral-300 dark:text-neutral-600 text-xs mt-1">Crea tu primera meta de ahorro</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={handleDelete}
                onSavedAmountChange={reload}
              />
            ))}
          </div>
        )}
      </div>
    </SeasonWrapper>
  );
}

function GearIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
