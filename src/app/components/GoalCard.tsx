"use client";

import { useEffect, useRef, useState } from "react";
import {
  Goal, GoalContribution,
  loadGoalContributions, addGoalContribution, deleteGoalContribution,
  updateGoal, todayStr, fmtEur,
} from "../lib/data";
import { confirm, toast } from "./Toast";
import { GhostButton, SaveButton, TextInput } from "./ui";

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

  // Animated collapse
  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [measured, setMeasured] = useState(false);

  // Swipe-to-reveal on header
  const headerTouchStartX = useRef(0);
  const headerTouchStartY = useRef(0);
  const headerSwipeDx = useRef(0);
  const headerIsSwiping = useRef(false);
  const headerIsHoriz = useRef<boolean | null>(null);
  const headerContentRef = useRef<HTMLDivElement>(null);
  const headerDeleteRef = useRef<HTMLDivElement>(null);
  const headerEditRef = useRef<HTMLDivElement>(null);

  function applyHeaderSwipe(dx: number) {
    const clamped = Math.max(-100, Math.min(80, dx));
    headerSwipeDx.current = clamped;
    if (headerContentRef.current) {
      headerContentRef.current.style.transform = `translateX(${clamped}px)`;
      headerContentRef.current.style.transition = "none";
    }
    if (headerDeleteRef.current) {
      headerDeleteRef.current.style.width = `${Math.max(0, -clamped)}px`;
      headerDeleteRef.current.style.transition = "none";
    }
    if (headerEditRef.current) {
      headerEditRef.current.style.width = `${Math.max(0, clamped)}px`;
      headerEditRef.current.style.transition = "none";
    }
  }

  function snapHeaderBack() {
    const SPRING = "0.32s cubic-bezier(0.34,1.56,0.64,1)";
    const EASE = "0.32s cubic-bezier(0.4,0,0.2,1)";
    if (headerContentRef.current) {
      headerContentRef.current.style.transform = "translateX(0px)";
      headerContentRef.current.style.transition = `transform ${SPRING}`;
    }
    if (headerDeleteRef.current) {
      headerDeleteRef.current.style.width = "0px";
      headerDeleteRef.current.style.transition = `width ${EASE}`;
    }
    if (headerEditRef.current) {
      headerEditRef.current.style.width = "0px";
      headerEditRef.current.style.transition = `width ${EASE}`;
    }
  }

  function onHeaderTouchStart(e: React.TouchEvent) {
    if (readOnly) return;
    headerTouchStartX.current = e.touches[0].clientX;
    headerTouchStartY.current = e.touches[0].clientY;
    headerIsHoriz.current = null;
    headerIsSwiping.current = true;
    headerSwipeDx.current = 0;
  }

  function onHeaderTouchMove(e: React.TouchEvent) {
    if (!headerIsSwiping.current) return;
    const dx = e.touches[0].clientX - headerTouchStartX.current;
    const dy = e.touches[0].clientY - headerTouchStartY.current;
    if (headerIsHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      headerIsHoriz.current = Math.abs(dx) > Math.abs(dy);
    }
    if (headerIsHoriz.current === false) {
      headerIsSwiping.current = false;
      snapHeaderBack();
      return;
    }
    if (headerIsHoriz.current) {
      e.preventDefault();
      applyHeaderSwipe(dx);
    }
  }

  function onHeaderTouchEnd() {
    if (!headerIsSwiping.current) return;
    headerIsSwiping.current = false;
    const dx = headerSwipeDx.current;
    snapHeaderBack();
    if (dx < -60) {
      onDelete(goal.id);
    } else if (dx > 60) {
      openEdit();
    }
  }

  // Batch localStorage load + ResizeObserver in one effect
  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}

    const el = innerRef.current;
    if (!el) return;
    setNaturalHeight(el.scrollHeight);
    setMeasured(true);
    const ro = new ResizeObserver(() => setNaturalHeight(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey]);

  // Load contributions lazily when card is first opened
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

  const collapseHeight = measured
    ? open ? naturalHeight + "px" : "0px"
    : open ? "auto" : "0px";

  return (
    <div className="card overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Delete reveal */}
        <div ref={headerDeleteRef} className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
          <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
            <XSmIcon />
            <span className="text-[9px] font-semibold whitespace-nowrap">Eliminar</span>
          </div>
        </div>
        {/* Edit reveal */}
        <div ref={headerEditRef} className="absolute inset-y-0 left-0 bg-brand-blue flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
          <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
            <PencilIcon />
            <span className="text-[9px] font-semibold whitespace-nowrap">Editar</span>
          </div>
        </div>
        <div
          ref={headerContentRef}
          className="flex items-center gap-2 px-4 pt-3.5 pb-3 relative z-20 bg-white dark:bg-neutral-900"
          style={{ touchAction: "pan-y" }}
          onTouchStart={onHeaderTouchStart}
          onTouchMove={onHeaderTouchMove}
          onTouchEnd={onHeaderTouchEnd}
        >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm font-semibold truncate flex-1">{goal.name}</span>
        <span className="text-sm font-bold shrink-0 tabular-nums" style={{ color }}>
          {fmtEur(goal.savedAmount)}
        </span>
        <button
          onClick={openEdit}
          title={readOnly ? "No disponible" : "Editar meta"}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
            text-neutral-400 hover:text-brand-blue hover:border-blue-300 dark:hover:border-blue-700
            hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-90
            ${readOnly ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <PencilIcon />
        </button>
        <button
          onClick={handleDelete}
          title={readOnly ? "No disponible" : "Eliminar meta"}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
            text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
            hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90
            ${readOnly ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <XIcon />
        </button>
        </div>{/* end headerContentRef */}
      </div>{/* end swipe container */}

      {/* ── Progress — always visible ───────────────────────────────────── */}
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
          </div>
        </div>
      </div>

      {/* ── Full-width toggle button ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-center gap-2 py-2.5
          border-t border-neutral-100 dark:border-neutral-800
          text-xs font-semibold text-neutral-400 dark:text-neutral-500
          hover:text-neutral-700 dark:hover:text-neutral-200
          hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40
          transition-all active:scale-[0.99]"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {open ? "Ocultar aportaciones" : "Ver aportaciones"}
      </button>

      {/* Animated collapse wrapper */}
      <div
        style={{
          height: collapseHeight,
          overflow: "hidden",
          transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div ref={innerRef} className="border-t border-neutral-100 dark:border-neutral-800">

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
                        <button
                          onClick={() => handleDeleteContrib(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
                            text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
                            hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                        >
                          <XSmIcon />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
