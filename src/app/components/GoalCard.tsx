"use client";

import { useEffect, useRef, useState } from "react";
import {
  Goal, GoalContribution,
  loadGoalContributions, addGoalContribution, deleteGoalContribution,
  updateGoalContribution, updateGoal, todayStr, fmtEur,
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

// ── Goal edit modal ───────────────────────────────────────────────────────────
interface GoalEditModalProps {
  goal: Goal;
  onSave: (name: string, target: number, deadline: string, color: string) => void;
  onClose: () => void;
}

function GoalEditModal({ goal, onSave, onClose }: GoalEditModalProps) {
  const [editName,   setEditName]   = useState(goal.name);
  const [editTarget, setEditTarget] = useState(String(goal.targetAmount));
  const [editDate,   setEditDate]   = useState(goal.deadline ?? "");
  const [editColor,  setEditColor]  = useState(goal.color ?? GOAL_COLORS[0]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave() {
    const target = parseFloat(editTarget);
    if (!editName.trim() || isNaN(target) || target <= 0) return;
    onSave(editName.trim(), target, editDate, editColor);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Editar meta</p>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Nombre</label>
            <TextInput
              ref={nameRef} value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Nombre de la meta" className="w-full"
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Objetivo €</label>
              <TextInput
                type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)}
                placeholder="5000" className="w-full"
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Fecha límite</label>
              <TextInput type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Color</label>
            <div className="flex gap-2 pt-0.5">
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setEditColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: editColor === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: editColor }}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contribution modal (add & edit) ──────────────────────────────────────────
interface ContribModalProps {
  color: string;
  initial?: GoalContribution;
  onSave: (amount: number, date: string, notes: string) => void;
  onClose: () => void;
}

function ContribModal({ color, initial, onSave, onClose }: ContribModalProps) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate]     = useState(initial?.date ?? todayStr());
  const [notes, setNotes]   = useState(initial?.notes ?? "");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave() {
    const a = parseFloat(amount);
    if (isNaN(a) || a === 0) return;
    onSave(a, date, notes.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {initial ? "Editar aportación" : "Registrar aportación"}
          </p>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Importe €</label>
              <TextInput
                ref={amountRef} type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00" step="0.01"
                className="w-full"
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Fecha</label>
              <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              Nota <span className="text-neutral-300 dark:text-neutral-600">(opcional)</span>
            </label>
            <TextInput value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota..." className="w-full"
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSave()} />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: color }}
          >
            {initial ? "Guardar cambios" : "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contribution row with swipe ───────────────────────────────────────────────
interface ContribRowProps {
  c: GoalContribution;
  color: string;
  readOnly?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ContribRow({ c, color, readOnly, onEdit, onDelete }: ContribRowProps) {
  const touchStartX  = useRef(0);
  const touchStartY  = useRef(0);
  const swipeDx      = useRef(0);
  const isSwiping    = useRef(false);
  const isHoriz      = useRef<boolean | null>(null);
  const rowRef       = useRef<HTMLDivElement>(null);
  const delRef       = useRef<HTMLDivElement>(null);
  const editRevRef   = useRef<HTMLDivElement>(null);

  function apply(dx: number) {
    const cl = Math.max(-100, Math.min(80, dx));
    swipeDx.current = cl;
    if (rowRef.current)    { rowRef.current.style.transform = `translateX(${cl}px)`; rowRef.current.style.transition = "none"; }
    if (delRef.current)    { delRef.current.style.width = `${Math.max(0, -cl)}px`; delRef.current.style.transition = "none"; }
    if (editRevRef.current){ editRevRef.current.style.width = `${Math.max(0, cl)}px`; editRevRef.current.style.transition = "none"; }
  }

  function snap() {
    const S = "0.32s cubic-bezier(0.34,1.56,0.64,1)";
    const E = "0.32s cubic-bezier(0.4,0,0.2,1)";
    if (rowRef.current)    { rowRef.current.style.transform = "translateX(0px)"; rowRef.current.style.transition = `transform ${S}`; }
    if (delRef.current)    { delRef.current.style.width = "0px"; delRef.current.style.transition = `width ${E}`; }
    if (editRevRef.current){ editRevRef.current.style.width = "0px"; editRevRef.current.style.transition = `width ${E}`; }
  }

  function onTouchStart(e: React.TouchEvent) {
    if (readOnly) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHoriz.current = null; isSwiping.current = true; swipeDx.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!isSwiping.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5))
      isHoriz.current = Math.abs(dx) > Math.abs(dy);
    if (isHoriz.current === false) { isSwiping.current = false; snap(); return; }
    if (isHoriz.current) { e.stopPropagation(); apply(dx); }
  }
  function onTouchEnd() {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const dx = swipeDx.current;
    snap();
    if (dx < -80) onDelete();
    else if (dx > 60) onEdit();
  }

  return (
    <div className="relative overflow-hidden border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div ref={delRef} className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
        <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
          <XSmIcon /><span className="text-[9px] font-semibold whitespace-nowrap">Eliminar</span>
        </div>
      </div>
      <div ref={editRevRef} className="absolute inset-y-0 left-0 bg-brand-blue flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
        <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
          <PencilIcon /><span className="text-[9px] font-semibold whitespace-nowrap">Editar</span>
        </div>
      </div>
      <div
        ref={rowRef}
        className="flex items-center gap-2 px-4 py-2 relative z-20 bg-white dark:bg-neutral-900"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
        <span className="text-xs text-neutral-400 tabular-nums shrink-0 w-10">{fmt(c.date)}</span>
        <span className="flex-1 text-xs text-neutral-400 dark:text-neutral-500 italic truncate">{c.notes ?? ""}</span>
        <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color }}>+{fmtEur(c.amount)}</span>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
                text-neutral-400 hover:text-brand-blue hover:border-blue-300 dark:hover:border-blue-700
                hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-90">
              <PencilIcon />
            </button>
            <button onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
                text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
                hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90">
              <XSmIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── GoalCard ─────────────────────────────────────────────────────────────────
export function GoalCard({ goal, onDelete, onSavedAmountChange, readOnly }: Props) {
  const lsKey = `goal_open_${goal.id}`;
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editingContrib, setEditingContrib]   = useState<GoalContribution | null>(null);
  const [contributions, setContributions]     = useState<GoalContribution[]>([]);
  const [loadingContribs, setLoadingContribs] = useState(false);
  const [savingEdit, setSavingEdit]           = useState(false);

  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [measured, setMeasured] = useState(false);

  const headerTouchStartX  = useRef(0);
  const headerTouchStartY  = useRef(0);
  const headerSwipeDx      = useRef(0);
  const headerIsSwiping    = useRef(false);
  const headerIsHoriz      = useRef<boolean | null>(null);
  const headerContentRef   = useRef<HTMLDivElement>(null);
  const headerDeleteRef    = useRef<HTMLDivElement>(null);
  const headerEditRef      = useRef<HTMLDivElement>(null);

  function applyHeaderSwipe(dx: number) {
    const cl = Math.max(-100, Math.min(80, dx));
    headerSwipeDx.current = cl;
    if (headerContentRef.current) { headerContentRef.current.style.transform = `translateX(${cl}px)`; headerContentRef.current.style.transition = "none"; }
    if (headerDeleteRef.current)  { headerDeleteRef.current.style.width = `${Math.max(0, -cl)}px`; headerDeleteRef.current.style.transition = "none"; }
    if (headerEditRef.current)    { headerEditRef.current.style.width = `${Math.max(0, cl)}px`; headerEditRef.current.style.transition = "none"; }
  }

  function snapHeaderBack() {
    const S = "0.32s cubic-bezier(0.34,1.56,0.64,1)"; const E = "0.32s cubic-bezier(0.4,0,0.2,1)";
    if (headerContentRef.current) { headerContentRef.current.style.transform = "translateX(0px)"; headerContentRef.current.style.transition = `transform ${S}`; }
    if (headerDeleteRef.current)  { headerDeleteRef.current.style.width = "0px"; headerDeleteRef.current.style.transition = `width ${E}`; }
    if (headerEditRef.current)    { headerEditRef.current.style.width = "0px"; headerEditRef.current.style.transition = `width ${E}`; }
  }

  function onHeaderTouchStart(e: React.TouchEvent) {
    if (readOnly) return;
    headerTouchStartX.current = e.touches[0].clientX; headerTouchStartY.current = e.touches[0].clientY;
    headerIsHoriz.current = null; headerIsSwiping.current = true; headerSwipeDx.current = 0;
  }
  function onHeaderTouchMove(e: React.TouchEvent) {
    if (!headerIsSwiping.current) return;
    const dx = e.touches[0].clientX - headerTouchStartX.current;
    const dy = e.touches[0].clientY - headerTouchStartY.current;
    if (headerIsHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5))
      headerIsHoriz.current = Math.abs(dx) > Math.abs(dy);
    if (headerIsHoriz.current === false) { headerIsSwiping.current = false; snapHeaderBack(); return; }
    if (headerIsHoriz.current) { e.preventDefault(); applyHeaderSwipe(dx); }
  }
  function onHeaderTouchEnd() {
    if (!headerIsSwiping.current) return;
    headerIsSwiping.current = false;
    const dx = headerSwipeDx.current;
    snapHeaderBack();
    if (dx < -60) handleDelete();
    else if (dx > 60) openEdit();
  }

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}
    const el = innerRef.current;
    if (!el) return;
    setNaturalHeight(el.scrollHeight); setMeasured(true);
    const ro = new ResizeObserver(() => setNaturalHeight(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey]);

  useEffect(() => {
    if (!open) return;
    setLoadingContribs(true);
    loadGoalContributions(goal.id).then(c => { setContributions(c); setLoadingContribs(false); });
  }, [open, goal.id]);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  function openEdit() {
    if (readOnly) { toast("Tu prueba ha terminado. Activa un plan para continuar.", "info"); return; }
    setShowEditModal(true);
  }

  async function handleSaveEdit(name: string, targetAmount: number, deadline: string, color: string) {
    setSavingEdit(true);
    await updateGoal(goal.id, { name, targetAmount, deadline: deadline || undefined, color });
    setSavingEdit(false);
    toast("Meta actualizada");
    onSavedAmountChange();
  }

  async function handleAddContrib(amount: number, date: string, notes: string) {
    await addGoalContribution(goal.id, amount, date, notes || undefined);
    loadGoalContributions(goal.id).then(setContributions);
    onSavedAmountChange();
    toast("Aportación registrada");
  }

  async function handleEditContrib(c: GoalContribution, amount: number, date: string, notes: string) {
    await updateGoalContribution(c.id, c.amount, amount, date, notes, goal.id);
    loadGoalContributions(goal.id).then(setContributions);
    onSavedAmountChange();
    toast("Aportación actualizada");
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
    setShowAddModal(true);
  }

  const color     = goal.color ?? GOAL_COLORS[0];
  const pct       = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
  const done      = goal.savedAmount >= goal.targetAmount;
  const remaining = goal.targetAmount - goal.savedAmount;

  const collapseHeight = measured
    ? open ? naturalHeight + "px" : "0px"
    : open ? "auto" : "0px";

  return (
    <div className="card overflow-hidden" style={{ borderLeftColor: color, borderLeftWidth: "4px" }}>

      {/* Modals */}
      {showEditModal && (
        <GoalEditModal
          goal={goal}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showAddModal && (
        <ContribModal
          color={color}
          onSave={(a, d, n) => handleAddContrib(a, d, n)}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingContrib && (
        <ContribModal
          color={color}
          initial={editingContrib}
          onSave={(a, d, n) => handleEditContrib(editingContrib, a, d, n)}
          onClose={() => setEditingContrib(null)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div ref={headerDeleteRef} className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
          <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none"><XSmIcon /><span className="text-[9px] font-semibold whitespace-nowrap">Eliminar</span></div>
        </div>
        <div ref={headerEditRef} className="absolute inset-y-0 left-0 bg-brand-blue flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
          <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none"><PencilIcon /><span className="text-[9px] font-semibold whitespace-nowrap">Editar</span></div>
        </div>
        <div
          ref={headerContentRef}
          className="flex items-center gap-2 px-4 pt-3.5 pb-3 relative z-20 bg-white dark:bg-neutral-900"
          style={{ touchAction: "pan-y" }}
          onTouchStart={onHeaderTouchStart} onTouchMove={onHeaderTouchMove} onTouchEnd={onHeaderTouchEnd}
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{goal.name}</p>
          </div>
          <div className="flex flex-col items-end shrink-0 mr-1">
            <span className="text-sm font-bold tabular-nums" style={{ color }}>
              {fmtEur(goal.savedAmount)}
              <span className="text-neutral-300 dark:text-neutral-600 font-normal text-xs"> / {fmtEur(goal.targetAmount)}</span>
            </span>
            {!done && <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums leading-tight">Quedan {fmtEur(remaining)}</span>}
            {done  && <span className="text-[11px] font-semibold leading-tight" style={{ color }}>✓ Completada</span>}
          </div>
          <button onClick={openEdit} title={readOnly ? "No disponible" : "Editar meta"}
            disabled={savingEdit}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
              text-neutral-400 hover:text-brand-blue hover:border-blue-300 dark:hover:border-blue-700
              hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-90
              ${readOnly ? "opacity-40 cursor-not-allowed" : ""}`}>
            <PencilIcon />
          </button>
          <button onClick={handleDelete} title={readOnly ? "No disponible" : "Eliminar meta"}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
              text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
              hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90
              ${readOnly ? "opacity-40 cursor-not-allowed" : ""}`}>
            <XIcon />
          </button>
        </div>
      </div>

      {/* ── Progress ────────────────────────────────────────────────────── */}
      <div className="px-4 pb-3">
        <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: `${color}20` }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
          {goal.deadline && (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {new Date(goal.deadline).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* ── Add contribution button — always visible ─────────────────────── */}
      <div className="border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={handleAddContribClick}
          disabled={!!readOnly}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all
            hover:opacity-80 active:scale-[0.98] ${readOnly ? "opacity-40 cursor-not-allowed" : ""}`}
          style={{ color }}
        >
          <PlusIcon />
          Añadir aportación
        </button>
      </div>

      {/* ── Toggle ──────────────────────────────────────────────────────── */}
      <button
        type="button" onClick={toggle}
        className="w-full flex items-center justify-center gap-2 py-2
          border-t border-neutral-100 dark:border-neutral-800
          text-xs font-semibold text-neutral-400 dark:text-neutral-500
          hover:text-neutral-700 dark:hover:text-neutral-200
          hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40
          transition-all active:scale-[0.99]"
      >
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {open ? "Ocultar aportaciones" : "Ver aportaciones"}
      </button>

      {/* Animated collapse — contributions list */}
      <div style={{ height: collapseHeight, overflow: "hidden", transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        <div ref={innerRef} className="border-t border-neutral-100 dark:border-neutral-800">
          <div className="py-1">
            {loadingContribs ? (
              <p className="text-xs text-neutral-400 px-4 py-2">Cargando...</p>
            ) : contributions.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-600 italic px-4 py-2">Sin aportaciones aún</p>
            ) : (
              [...contributions]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(c => (
                  <ContribRow
                    key={c.id}
                    c={c}
                    color={color}
                    readOnly={readOnly}
                    onEdit={() => setEditingContrib(c)}
                    onDelete={() => handleDeleteContrib(c)}
                  />
                ))
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

function PlusIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
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
