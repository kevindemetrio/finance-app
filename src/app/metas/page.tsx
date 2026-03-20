"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Goal, createGoal, deleteGoal, loadGoals, updateGoal, fmtEur } from "../lib/data";
import { createClient } from "../lib/supabase/client";
import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { ThemeToggle } from "../components/ThemeProvider";
import { toast, confirm } from "../components/Toast";
import { GhostButton, IconButton, PrimaryButton, SaveButton, TextInput } from "../components/ui";

const PRESET_COLORS = [
  "#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30",
  "#D4537E","#639922","#00838F","#8B5CF6","#EC4899","#F59E0B",
];

type EditMode = "add_saved" | "edit_goal";

// ── Colour picker component ──────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-900 hover:border-neutral-400 transition-colors text-sm"
        title="Elegir color"
      >
        <span className="w-5 h-5 rounded-full border border-white/30 shadow-sm shrink-0" style={{ background: value }} />
        <span className="text-neutral-500 dark:text-neutral-400 text-xs font-mono">{value}</span>
        <ChevronIcon />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-56 rounded-2xl border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-900 shadow-xl p-3 space-y-3">

          {/* Preset swatches */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Colores predefinidos</p>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); }}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95"
                  style={{
                    background: c,
                    outline: value === c ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Custom RGB/hex input */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Color personalizado</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                style={{ padding: 0 }}
              />
              <TextInput
                value={value}
                onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
                placeholder="#1D9E75"
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MetasPage() {
  const router = useRouter();
  const [goals, setGoals]     = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode]   = useState<EditMode>("add_saved");
  const [addAmount, setAddAmount] = useState<Record<string, string>>({});

  // New goal fields
  const [newName, setNewName]     = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDate, setNewDate]     = useState("");
  const [newColor, setNewColor]   = useState(PRESET_COLORS[0]);

  // Edit goal fields
  const [editName, setEditName]     = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDate, setEditDate]     = useState("");

  const reload = useCallback(() => loadGoals().then(setGoals), []);

  useEffect(() => { reload().then(() => setLoading(false)); }, [reload]);

  async function handleCreate() {
    if (!newName.trim() || !newTarget) return;
    await createGoal(newName.trim(), parseFloat(newTarget), newDate || undefined, newColor);
    setNewName(""); setNewTarget(""); setNewDate(""); setNewColor(PRESET_COLORS[0]); setAdding(false);
    toast("Meta creada");
    reload();
  }

  async function handleAddSaved(goal: Goal) {
    const raw = addAmount[goal.id] || "0";
    const a = parseFloat(raw);
    if (isNaN(a) || a === 0) return;
    const newAmount = Math.max(0, goal.savedAmount + a); // supports negative (withdrawals)
    await updateGoal(goal.id, { savedAmount: newAmount });
    setAddAmount(p => ({ ...p, [goal.id]: "" }));
    setEditingId(null);
    toast(a > 0 ? "Ahorro añadido" : "Cantidad retirada", a > 0 ? "success" : "info");
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
                <ColorPicker value={newColor} onChange={setNewColor} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setAdding(false)}>Cancelar</GhostButton>
              <SaveButton onClick={handleCreate}>Crear meta</SaveButton>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_,i) => <div key={i} className="card h-24 bg-neutral-100 dark:bg-neutral-800" />)}
          </div>
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
                      <IconButton onClick={() => openEdit(goal, "add_saved")} title="Añadir / retirar ahorro"><PlusMinusIcon /></IconButton>
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

                  {editingId === goal.id && editMode === "add_saved" && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-2 space-y-2">
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        Pon un número positivo para añadir, negativo para retirar
                      </p>
                      <div className="flex gap-2">
                        <TextInput type="number" placeholder="ej: 200 o -50" step="0.01"
                          value={addAmount[goal.id] || ""}
                          onChange={e => setAddAmount(p => ({ ...p, [goal.id]: e.target.value }))}
                          className="flex-1" autoFocus
                          onKeyDown={e => e.key === "Enter" && handleAddSaved(goal)}
                        />
                        <SaveButton onClick={() => handleAddSaved(goal)} />
                        <GhostButton onClick={() => setEditingId(null)}>✕</GhostButton>
                      </div>
                    </div>
                  )}

                  {editingId === goal.id && editMode === "edit_goal" && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" autoFocus />
                        <TextInput type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} placeholder="Objetivo €" />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <TextInput type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="flex-1 min-w-[140px]" />
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
function PlusMinusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="5" y1="19" x2="19" y2="19"/></svg>; }
function PencilIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function XIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ChevronIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
